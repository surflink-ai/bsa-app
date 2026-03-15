/**
 * Sync LiveHeats Event #429674 → BSA Compete Supabase
 *
 * Creates: event, divisions, rounds, heats, heat_athletes, wave_scores, season_points
 * Updates: athlete stats on athlete profiles
 *
 * Run: npx tsx scripts/sync-liveheats-event.ts
 */

const SUPABASE_URL = 'https://veggfcumdveuoumrblcn.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const LIVEHEATS_EVENT_ID = '429674'
const GRAPHQL_URL = 'https://liveheats.com/api/graphql'

// ── Supabase REST helpers ──
async function sb(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': opts.method === 'POST' ? 'return=representation' : 'return=minimal',
      ...opts.headers,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Supabase ${opts.method || 'GET'} ${path}: ${res.status} ${body}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

async function sbGet(table: string, query: string = '') {
  return sb(`${table}?${query}`)
}

async function sbInsert(table: string, data: Record<string, unknown> | Record<string, unknown>[]) {
  return sb(table, {
    method: 'POST',
    headers: { 'Prefer': 'return=representation,resolution=merge-duplicates' },
    body: JSON.stringify(data),
  })
}

async function sbUpsert(table: string, data: Record<string, unknown> | Record<string, unknown>[], onConflict?: string) {
  const prefer = onConflict
    ? 'return=representation,resolution=merge-duplicates'
    : 'return=representation,resolution=merge-duplicates'
  return sb(table, {
    method: 'POST',
    headers: { 'Prefer': prefer },
    body: JSON.stringify(data),
  })
}

async function sbPatch(table: string, query: string, data: Record<string, unknown>) {
  return sb(`${table}?${query}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

// ── LiveHeats fetch ──
async function fetchLiveHeatsEvent() {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://liveheats.com',
      'Referer': 'https://liveheats.com/',
    },
    body: JSON.stringify({
      query: `{
        event(id: "${LIVEHEATS_EVENT_ID}") {
          id name status
          eventDivisions {
            id
            division { id name }
            status
            heats {
              id round position startTime endTime heatDurationMinutes
              config { totalCountingRides maxRideScore jerseyOrder }
              competitors { position athlete { id name } }
              result {
                place total needs winBy rides
                competitor { athlete { id name } }
              }
            }
          }
        }
      }`,
    }),
  })
  const json = await res.json()
  return json.data.event
}

// ── Division name mapping (LiveHeats → BSA) ──
const LH_TO_BSA_DIV: Record<string, string> = {
  'Open Mens': 'Open Men',
  'Open Mens ': 'Open Men',
  'Open Womens': 'Open Women',
  'Under 18 Boys': 'Under 18 Boys',
  'Under 18 Girls': 'Under 18 Girls',
  'Under 16 Boys': 'Under 16 Boys',
  'Under 16 Girls': 'Under 16 Girls',
  'Under 14 Boys': 'Under 14 Boys',
  'Long Board Open': 'Longboard Open',
  'Grand Masters (over 40 years old)': 'Grand Masters',
  'Novis': 'Novis',
}

// Round name → number mapping
function roundNumber(roundName: string): number {
  const lower = roundName.toLowerCase()
  if (lower.includes('round 1') || lower.includes('r1')) return 1
  if (lower.includes('round 2') || lower.includes('r2')) return 2
  if (lower.includes('round 3') || lower.includes('r3')) return 3
  if (lower.includes('quarterfinal')) return 4
  if (lower.includes('semifinal')) return 5
  if (lower.includes('final')) return 6
  return 1
}

// ── Main sync ──
async function main() {
  console.log('🔄 Fetching LiveHeats event...')
  const event = await fetchLiveHeatsEvent()
  console.log(`📋 Event: ${event.name} (${event.status})`)

  // 1. Get existing BSA divisions
  console.log('\n📂 Loading BSA divisions...')
  const bsaDivisions: { id: string; name: string; short_name: string }[] = await sbGet('comp_divisions', 'select=id,name,short_name')
  const divMap = new Map(bsaDivisions.map((d: { id: string; name: string }) => [d.name, d.id]))

  // Add Novis if missing
  if (!divMap.has('Novis')) {
    console.log('  ➕ Adding "Novis" division...')
    const [novis] = await sbInsert('comp_divisions', { name: 'Novis', short_name: 'NOV', sort_order: 14 })
    divMap.set('Novis', novis.id)
  }

  // 2. Get existing season
  const [season] = await sbGet('comp_seasons', 'select=id,name,points_system&year=eq.2026&limit=1')
  console.log(`🏆 Season: ${season.name} (${season.id})`)
  const pointsSystem = season.points_system as Record<string, number>

  // 3. Get existing athletes (for liveheats_id mapping)
  console.log('\n👥 Loading athletes...')
  const athletes: { id: string; name: string; liveheats_id: string | null }[] =
    await sbGet('athletes', 'select=id,name,liveheats_id')
  const athleteByLhId = new Map(athletes.filter(a => a.liveheats_id).map(a => [a.liveheats_id!, a]))
  const athleteByName = new Map(athletes.map(a => [a.name.toLowerCase(), a]))
  console.log(`  ${athletes.length} athletes loaded, ${athleteByLhId.size} with LiveHeats IDs`)

  // Helper: find or create athlete
  async function findOrCreateAthlete(lhId: string, name: string): Promise<{ id: string; name: string }> {
    let athlete = athleteByLhId.get(lhId) || athleteByName.get(name.toLowerCase())
    if (athlete) return athlete

    // Create new athlete
    console.log(`    ➕ Creating athlete: ${name} (lh:${lhId})`)
    const [created] = await sbInsert('athletes', {
      name,
      liveheats_id: lhId,
      nationality: 'Barbados',
      active: true,
    })
    athleteByLhId.set(lhId, created)
    athleteByName.set(name.toLowerCase(), created)
    return created
  }

  // 4. Delete existing event data for this LiveHeats ID (idempotent re-sync)
  console.log('\n🗑️  Cleaning existing sync data for this event...')
  const existingEvents = await sbGet('comp_events', `select=id&liveheats_id=eq.${LIVEHEATS_EVENT_ID}`)
  for (const e of existingEvents) {
    // Cascade will handle event_divisions → rounds → heats → heat_athletes → wave_scores
    await sb(`comp_events?id=eq.${e.id}`, { method: 'DELETE' })
    console.log(`  Deleted existing event ${e.id}`)
  }
  // Also clean season points for this event
  // (we'll recalculate below)

  // 5. Create event
  console.log('\n📌 Creating event...')
  const [compEvent] = await sbInsert('comp_events', {
    season_id: season.id,
    name: event.name,
    location: 'Drill Hall, Barbados',
    event_date: '2026-03-14',
    end_date: '2026-03-15',
    status: 'complete',
    liveheats_id: LIVEHEATS_EVENT_ID,
    notes: `Synced from LiveHeats event ${LIVEHEATS_EVENT_ID}`,
  })
  console.log(`  ✅ Event: ${compEvent.id}`)

  // 6. Process each division
  const seasonPoints: Record<string, Record<string, { place: number; athleteId: string; athleteName: string }>> = {}

  for (const lhDiv of event.eventDivisions) {
    const bsaDivName = LH_TO_BSA_DIV[lhDiv.division.name] || LH_TO_BSA_DIV[lhDiv.division.name.trim()]
    if (!bsaDivName) {
      console.log(`\n⚠️  Skipping unmapped division: ${lhDiv.division.name}`)
      continue
    }
    const bsaDivId = divMap.get(bsaDivName)
    if (!bsaDivId) {
      console.log(`\n⚠️  Division not found in BSA: ${bsaDivName}`)
      continue
    }
    if (lhDiv.heats.length === 0) {
      console.log(`\n⏭️  Skipping ${bsaDivName} (no heats)`)
      continue
    }

    console.log(`\n🏄 ${bsaDivName} (${lhDiv.heats.length} heats)`)

    // Create event_division
    const [eventDiv] = await sbInsert('comp_event_divisions', {
      event_id: compEvent.id,
      division_id: bsaDivId,
      scoring_best_of: lhDiv.heats[0]?.config?.totalCountingRides || 2,
      ride_time_minutes: lhDiv.heats[0]?.heatDurationMinutes || 20,
      max_athletes: 32,
    })

    // Group heats by round
    const roundGroups = new Map<string, typeof lhDiv.heats>()
    for (const heat of lhDiv.heats) {
      const existing = roundGroups.get(heat.round) || []
      existing.push(heat)
      roundGroups.set(heat.round, existing)
    }

    // Sort rounds by round number
    const sortedRounds = [...roundGroups.entries()].sort((a, b) => roundNumber(a[0]) - roundNumber(b[0]))

    for (const [roundName, roundHeats] of sortedRounds) {
      const rn = roundNumber(roundName)

      // Create round
      const [round] = await sbInsert('comp_rounds', {
        event_division_id: eventDiv.id,
        round_number: rn,
        name: roundName,
        status: 'complete',
      })

      for (const lhHeat of roundHeats) {
        const heatNum = lhHeat.position + 1 // LiveHeats is 0-indexed

        // Create heat
        const [heat] = await sbInsert('comp_heats', {
          round_id: round.id,
          heat_number: heatNum,
          status: 'complete',
          actual_start: lhHeat.startTime,
          actual_end: lhHeat.endTime,
          duration_minutes: lhHeat.heatDurationMinutes || 20,
        })

        // Create heat athletes + wave scores
        const results = lhHeat.result || []
        for (const r of results) {
          const lhAthleteId = r.competitor.athlete.id
          const athleteName = r.competitor.athlete.name
          const athlete = await findOrCreateAthlete(lhAthleteId, athleteName)

          // Determine jersey color
          const compEntry = (lhHeat.competitors || []).find((c: { athlete: { id: string } }) => c.athlete.id === lhAthleteId)
          const jerseyOrder = lhHeat.config?.jerseyOrder || ['red', 'white', 'green', 'blue', 'black']
          const jersey = compEntry != null ? jerseyOrder[compEntry.position] || null : null

          // Was this athlete in the final? Track for season points
          if (roundName === 'Final' && r.place > 0) {
            if (!seasonPoints[bsaDivId]) seasonPoints[bsaDivId] = {}
            seasonPoints[bsaDivId][athlete.id] = {
              place: r.place,
              athleteId: athlete.id,
              athleteName: athleteName,
            }
          }

          // Create heat_athlete
          const [heatAthlete] = await sbInsert('comp_heat_athletes', {
            heat_id: heat.id,
            athlete_id: athlete.id,
            athlete_name: athleteName,
            jersey_color: jersey,
            seed_position: compEntry?.position != null ? compEntry.position + 1 : null,
            result_position: r.place,
            advanced: roundName !== 'Final' && r.place <= 2,
          })

          // Create wave scores
          const rides = r.rides || {}
          let waveNum = 1
          for (const rideList of Object.values(rides) as Array<{ total: number | null; scoring_ride?: boolean }[]>) {
            for (const ride of rideList) {
              if (ride.total != null) {
                await sbInsert('comp_wave_scores', {
                  heat_athlete_id: heatAthlete.id,
                  wave_number: waveNum,
                  score: ride.total,
                  is_override: false,
                })
                waveNum++
              }
            }
          }
        }
        process.stdout.write('.')
      }
    }
    console.log(' ✅')
  }

  // 7. Calculate and insert season points
  console.log('\n🏅 Calculating season points...')
  // Clear existing season points for this season (fresh calc)
  await sb(`comp_season_points?season_id=eq.${season.id}`, { method: 'DELETE' })

  const pointsInserts: Record<string, unknown>[] = []
  for (const [divId, athletes] of Object.entries(seasonPoints)) {
    for (const [athleteId, data] of Object.entries(athletes)) {
      const points = pointsSystem[String(data.place)] || 0
      pointsInserts.push({
        season_id: season.id,
        division_id: divId,
        athlete_name: data.athleteName,
        athlete_id: athleteId,
        total_points: points,
        events_counted: 1,
        best_result: data.place,
      })
    }
  }

  if (pointsInserts.length > 0) {
    await sbInsert('comp_season_points', pointsInserts)
    console.log(`  ✅ ${pointsInserts.length} season point entries`)
  }

  // 8. Update athlete profile stats
  console.log('\n📊 Updating athlete profile stats...')

  // Collect all athlete results across divisions
  const athleteStats: Record<string, {
    id: string; name: string
    events: number; wins: number; finals: number
    bestPlace: number | null; totalPoints: number
    divisions: string[]
    bestWave: number
  }> = {}

  for (const lhDiv of event.eventDivisions) {
    const bsaDivName = LH_TO_BSA_DIV[lhDiv.division.name] || LH_TO_BSA_DIV[lhDiv.division.name.trim()]
    if (!bsaDivName) continue

    for (const heat of lhDiv.heats) {
      for (const r of heat.result || []) {
        const lhId = r.competitor.athlete.id
        const athlete = athleteByLhId.get(lhId) || athleteByName.get(r.competitor.athlete.name.toLowerCase())
        if (!athlete) continue

        if (!athleteStats[athlete.id]) {
          athleteStats[athlete.id] = {
            id: athlete.id, name: athlete.name,
            events: 0, wins: 0, finals: 0,
            bestPlace: null, totalPoints: 0,
            divisions: [], bestWave: 0,
          }
        }
        const s = athleteStats[athlete.id]

        // Track divisions entered
        if (!s.divisions.includes(bsaDivName)) s.divisions.push(bsaDivName)

        // Best wave
        const rides = r.rides || {}
        for (const rideList of Object.values(rides) as Array<{ total: number | null }[]>) {
          for (const ride of rideList) {
            if (ride.total != null && ride.total > s.bestWave) s.bestWave = ride.total
          }
        }

        // Final results
        if (heat.round === 'Final') {
          s.finals++
          if (r.place === 1) s.wins++
          if (s.bestPlace === null || r.place < s.bestPlace) s.bestPlace = r.place

          // Points
          const divId = divMap.get(bsaDivName)
          if (divId && seasonPoints[divId]?.[athlete.id]) {
            const pts = pointsSystem[String(r.place)] || 0
            s.totalPoints += pts
          }
        }
      }
    }
  }

  // Count unique events per athlete (they entered at least 1 div)
  for (const s of Object.values(athleteStats)) {
    s.events = 1 // This is 1 event (Event #1)
  }

  // Build social_links-style stats into athletes table
  // We'll store competition stats as a jsonb field
  let updatedCount = 0
  for (const s of Object.values(athleteStats)) {
    const stats = {
      events_entered: s.events,
      wins: s.wins,
      finals_made: s.finals,
      best_finish: s.bestPlace,
      total_points: s.totalPoints,
      best_wave: s.bestWave > 0 ? s.bestWave : null,
      divisions: s.divisions,
      last_event: 'SOTY Championship Event #1 2026',
      last_updated: new Date().toISOString(),
    }

    await sbPatch('athletes', `id=eq.${s.id}`, {
      social_links: { competition_stats: stats },
    })
    updatedCount++
  }
  console.log(`  ✅ ${updatedCount} athlete profiles updated`)

  // Summary
  console.log('\n═══════════════════════════════════')
  console.log('✅ SYNC COMPLETE')
  console.log(`Event: ${event.name}`)
  console.log(`Divisions: ${Object.keys(seasonPoints).length}`)
  console.log(`Season points: ${pointsInserts.length} entries`)
  console.log(`Athletes updated: ${updatedCount}`)
  console.log('═══════════════════════════════════')

  // Print final results summary
  console.log('\n🏆 FINAL RESULTS:')
  for (const lhDiv of event.eventDivisions) {
    const final = lhDiv.heats.find((h: { round: string }) => h.round === 'Final')
    if (!final) continue
    console.log(`\n  ${lhDiv.division.name}:`)
    const sorted = [...final.result].sort((a: { place: number }, b: { place: number }) => a.place - b.place)
    for (const r of sorted) {
      const medal = r.place === 1 ? '🥇' : r.place === 2 ? '🥈' : r.place === 3 ? '🥉' : '  '
      const pts = pointsSystem[String(r.place)] || 0
      console.log(`    ${medal} ${r.place}. ${r.competitor.athlete.name} — ${r.total.toFixed(2)} (${pts}pts)`)
    }
  }
}

main().catch(console.error)
