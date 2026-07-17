/**
 * Sync ONE LiveHeats event → BSA Compete Supabase, then recompute cumulative
 * season standings from every event already stored for that season.
 *
 * This single parameterised script replaces the old per-event copies
 * (sync_event2.js / sync_event3.js). Nothing is hardcoded — pass config via env:
 *
 *   LH_EVENT_ID=506069 \
 *   EVENT_NAME="SOTY Championship Event #3 2026" \
 *   EVENT_LOCATION="Branden's, Barbados" \
 *   EVENT_DATE_START=2026-05-16 \
 *   EVENT_DATE_END=2026-05-17 \
 *   SEASON_YEAR=2026 \
 *   npm run sync:event
 *
 * Idempotent: re-running deletes the existing event row for this LiveHeats ID
 * (cascade removes its divisions/rounds/heats/scores) and rebuilds it, then
 * recomputes season points across ALL complete events in the season.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (bypasses RLS) in the environment.
 */

import { requireServiceRole } from './_supabase'

const { url: SUPABASE_URL, key: SUPABASE_KEY } = requireServiceRole()
const GRAPHQL_URL = 'https://liveheats.com/api/graphql'

// ── Required config from env ──
const LH_EVENT_ID = process.env.LH_EVENT_ID || ''
const EVENT_NAME = process.env.EVENT_NAME || ''
const EVENT_LOCATION = process.env.EVENT_LOCATION || 'Barbados'
const EVENT_DATE_START = process.env.EVENT_DATE_START || ''
const EVENT_DATE_END = process.env.EVENT_DATE_END || EVENT_DATE_START
const SEASON_YEAR = Number(process.env.SEASON_YEAR || '2026')

if (!LH_EVENT_ID || !EVENT_NAME || !EVENT_DATE_START) {
  console.error(
    'Missing required env. Provide LH_EVENT_ID, EVENT_NAME, EVENT_DATE_START ' +
      '(and optionally EVENT_LOCATION, EVENT_DATE_END, SEASON_YEAR).'
  )
  process.exit(1)
}

const POINTS_FALLBACK: Record<number, number> = {
  1: 1000, 2: 800, 3: 650, 4: 500, 5: 400, 6: 300, 7: 200, 8: 100,
}

// ── Supabase REST helpers ──
async function sb(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: opts.method === 'POST' ? 'return=representation' : 'return=minimal',
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
const sbGet = (table: string, query = '') => sb(`${table}?${query}`)
const sbInsert = (table: string, data: unknown) =>
  sb(table, {
    method: 'POST',
    headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
    body: JSON.stringify(data),
  })

// ── LiveHeats ──
async function fetchLiveHeatsEvent() {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://liveheats.com',
      Referer: 'https://liveheats.com/',
    },
    body: JSON.stringify({
      // LiveHeats event id is a GraphQL variable — never string-interpolated.
      query: `query Event($id: ID!) {
        event(id: $id) {
          id name status
          eventDivisions {
            id division { id name } status
            heats {
              id round position startTime endTime heatDurationMinutes
              config { totalCountingRides maxRideScore jerseyOrder }
              competitors { position athlete { id name } }
              result { place total needs winBy rides competitor { athlete { id name } } }
            }
          }
        }
      }`,
      variables: { id: LH_EVENT_ID },
    }),
  })
  const json = await res.json()
  if (json.errors) throw new Error(JSON.stringify(json.errors))
  return json.data.event
}

// LiveHeats division names are inconsistent; map to BSA canonical names.
const LH_TO_BSA_DIV: Record<string, string> = {
  'Open Mens': 'Open Men',
  'Open Womens': 'Open Women',
  'Under 18 Boys': 'Under 18 Boys',
  'Under 18 Girls': 'Under 18 Girls',
  'Under 16 Boys': 'Under 16 Boys',
  'Under 16 Girls': 'Under 16 Girls',
  'Under 14 Boys': 'Under 14 Boys',
  'Long Board Open': 'Longboard Open',
  'Longboard Open': 'Longboard Open',
  'Grand Masters (over 40 years old)': 'Grand Masters',
  Novis: 'Novis',
}

const ROUND_MAP: Record<string, number> = {
  'Round 1': 1, 'Round 2': 2, 'Round 3': 3, Quarterfinal: 4, Semifinal: 5, Final: 6,
}
function roundNumber(name: string): number {
  const lower = name.toLowerCase()
  if (lower.includes('final') && !lower.includes('semi') && !lower.includes('quarter')) return 6
  if (lower.includes('semi')) return 5
  if (lower.includes('quarter')) return 4
  if (lower.includes('round 3') || lower.includes('r3')) return 3
  if (lower.includes('round 2') || lower.includes('r2')) return 2
  return ROUND_MAP[name] || 1
}

function titleCase(name: string): string {
  return name
    .split(' ')
    .map((p) => {
      if (!p) return p
      if (p.length <= 2 && p.toLowerCase() !== p) return p
      return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
    })
    .join(' ')
}

async function main() {
  console.log(`🔄 Syncing LiveHeats event ${LH_EVENT_ID}...`)
  const event = await fetchLiveHeatsEvent()
  console.log(`📋 ${event.name} (${event.status})`)

  // Divisions
  const bsaDivisions: { id: string; name: string }[] = await sbGet(
    'comp_divisions',
    'select=id,name'
  )
  const divMap = new Map(bsaDivisions.map((d) => [d.name, d.id]))

  // Season
  const [season] = await sbGet(
    'comp_seasons',
    `select=id,name,points_system&year=eq.${SEASON_YEAR}&limit=1`
  )
  if (!season) throw new Error(`No season found for year ${SEASON_YEAR}`)
  const pointsSystem: Record<string, number> = season.points_system || {}
  console.log(`🏆 Season: ${season.name} (${season.id})`)

  // Athletes
  const athletes: { id: string; name: string; liveheats_id: string | null }[] =
    await sbGet('athletes', 'select=id,name,liveheats_id')
  const athleteByLhId = new Map(
    athletes.filter((a) => a.liveheats_id).map((a) => [a.liveheats_id!, a])
  )
  const athleteByName = new Map(athletes.map((a) => [a.name.toLowerCase(), a]))

  async function findOrCreateAthlete(lhId: string, rawName: string) {
    const name = titleCase(rawName)
    const found = athleteByLhId.get(String(lhId)) || athleteByName.get(name.toLowerCase())
    if (found) return found
    const [created] = await sbInsert('athletes', {
      name,
      liveheats_id: String(lhId),
      nationality: 'Barbados',
      active: true,
    })
    athleteByLhId.set(String(lhId), created)
    athleteByName.set(name.toLowerCase(), created)
    console.log(`  ➕ ${name}`)
    return created
  }

  // Idempotent: remove existing event for this LiveHeats id (cascade cleans children)
  const existing = await sbGet('comp_events', `select=id&liveheats_id=eq.${LH_EVENT_ID}`)
  for (const e of existing) {
    await sb(`comp_events?id=eq.${e.id}`, { method: 'DELETE' })
    console.log(`  🗑️  removed prior sync ${e.id}`)
  }

  const [compEvent] = await sbInsert('comp_events', {
    season_id: season.id,
    name: EVENT_NAME,
    location: EVENT_LOCATION,
    event_date: EVENT_DATE_START,
    end_date: EVENT_DATE_END,
    status: 'complete',
    liveheats_id: LH_EVENT_ID,
    notes: `Synced from LiveHeats event ${LH_EVENT_ID}`,
  })
  console.log(`📌 event ${compEvent.id}`)

  for (const lhDiv of event.eventDivisions) {
    const rawName: string = lhDiv.division.name
    const bsaName = LH_TO_BSA_DIV[rawName] || LH_TO_BSA_DIV[rawName.trim()]
    const divId = bsaName ? divMap.get(bsaName) : undefined
    if (!divId) {
      console.log(`  ⚠️ skip unmapped division "${rawName}"`)
      continue
    }
    if (!lhDiv.heats.length) continue

    const [eventDiv] = await sbInsert('comp_event_divisions', {
      event_id: compEvent.id,
      division_id: divId,
      scoring_best_of: lhDiv.heats[0]?.config?.totalCountingRides || 2,
      ride_time_minutes: lhDiv.heats[0]?.heatDurationMinutes || 20,
      max_athletes: 32,
    })

    const roundGroups = new Map<string, typeof lhDiv.heats>()
    for (const h of lhDiv.heats) {
      const arr = roundGroups.get(h.round) || []
      arr.push(h)
      roundGroups.set(h.round, arr)
    }

    for (const [roundName, roundHeats] of roundGroups) {
      const [round] = await sbInsert('comp_rounds', {
        event_division_id: eventDiv.id,
        round_number: roundNumber(roundName),
        name: roundName,
        status: 'complete',
      })
      for (const lhHeat of roundHeats) {
        const [heat] = await sbInsert('comp_heats', {
          round_id: round.id,
          heat_number: lhHeat.position + 1,
          status: 'complete',
          actual_start: lhHeat.startTime,
          actual_end: lhHeat.endTime,
          duration_minutes: lhHeat.heatDurationMinutes || 20,
        })
        const jerseyOrder = lhHeat.config?.jerseyOrder || ['red', 'white', 'green', 'blue', 'black']
        for (const r of lhHeat.result || []) {
          const athlete = await findOrCreateAthlete(r.competitor.athlete.id, r.competitor.athlete.name)
          const entry = (lhHeat.competitors || []).find(
            (c: { athlete: { id: string } }) => c.athlete.id === r.competitor.athlete.id
          )
          const [heatAthlete] = await sbInsert('comp_heat_athletes', {
            heat_id: heat.id,
            athlete_id: athlete.id,
            athlete_name: athlete.name,
            jersey_color: entry != null ? jerseyOrder[entry.position] || null : null,
            seed_position: entry?.position != null ? entry.position + 1 : null,
            result_position: r.place,
            total_score: r.total,
            advanced: roundNumber(roundName) < 6 && r.place <= 2,
          })
          let waveNum = 1
          for (const rideList of Object.values(r.rides || {}) as Array<
            { total: number | null }[]
          >) {
            for (const ride of rideList) {
              if (ride.total != null) {
                await sbInsert('comp_wave_scores', {
                  heat_athlete_id: heatAthlete.id,
                  wave_number: waveNum++,
                  score: ride.total,
                  is_override: false,
                })
              }
            }
          }
        }
      }
    }
    console.log(`  ✅ ${bsaName}`)
  }

  // ── Cumulative season points from every event stored for this season ──
  console.log('\n🏅 Recomputing cumulative season points...')
  const seasonEvents = await sbGet(
    'comp_events',
    `select=id&season_id=eq.${season.id}`
  )
  const eventIds: string[] = seasonEvents.map((e: { id: string }) => e.id)
  const eventDivs = await sbGet(
    'comp_event_divisions',
    `select=id,division_id&event_id=in.(${eventIds.join(',')})`
  )
  const edToDiv = new Map<string, string>(
    eventDivs.map((ed: { id: string; division_id: string }) => [ed.id, ed.division_id])
  )
  const finals = await sbGet(
    'comp_rounds',
    `select=id,event_division_id&name=eq.Final&event_division_id=in.(${eventDivs
      .map((ed: { id: string }) => ed.id)
      .join(',')})`
  )
  const roundToEd = new Map<string, string>(
    finals.map((r: { id: string; event_division_id: string }) => [r.id, r.event_division_id])
  )
  const finalHeats = finals.length
    ? await sbGet('comp_heats', `select=id,round_id&round_id=in.(${finals.map((r: { id: string }) => r.id).join(',')})`)
    : []
  const heatToRound = new Map<string, string>(
    finalHeats.map((h: { id: string; round_id: string }) => [h.id, h.round_id])
  )
  const finalAthletes = finalHeats.length
    ? await sbGet(
        'comp_heat_athletes',
        `select=athlete_id,athlete_name,result_position,heat_id&heat_id=in.(${finalHeats
          .map((h: { id: string }) => h.id)
          .join(',')})`
      )
    : []

  const standings: Record<
    string,
    Record<string, { name: string; points: number; best: number; events: number }>
  > = {}
  for (const ha of finalAthletes) {
    if (!ha.result_position || !ha.athlete_id) continue
    const edId = heatToRound.get(ha.heat_id)
    const roundEd = edId ? roundToEd.get(edId) : undefined
    const divId = roundEd ? edToDiv.get(roundEd) : undefined
    if (!divId) continue
    const pts = pointsSystem[String(ha.result_position)] ?? POINTS_FALLBACK[ha.result_position] ?? 0
    standings[divId] ||= {}
    const s = (standings[divId][ha.athlete_id] ||= {
      name: ha.athlete_name,
      points: 0,
      best: ha.result_position,
      events: 0,
    })
    s.points += pts
    s.best = Math.min(s.best, ha.result_position)
    s.events += 1
  }

  await sb(`comp_season_points?season_id=eq.${season.id}`, { method: 'DELETE' })
  const inserts: Record<string, unknown>[] = []
  for (const [divId, byAthlete] of Object.entries(standings)) {
    for (const [athleteId, s] of Object.entries(byAthlete)) {
      inserts.push({
        season_id: season.id,
        division_id: divId,
        athlete_id: athleteId,
        athlete_name: s.name,
        total_points: s.points,
        events_counted: s.events,
        best_result: s.best,
      })
    }
  }
  for (let i = 0; i < inserts.length; i += 50) {
    await sbInsert('comp_season_points', inserts.slice(i, i + 50))
  }
  console.log(`  ✅ ${inserts.length} season point rows across ${eventIds.length} events`)
  console.log('\n✅ SYNC COMPLETE')
}

main().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
