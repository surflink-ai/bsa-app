/**
 * Calculate and update athlete competition stats from comp_ tables
 * Run: npx tsx scripts/update-athlete-stats.ts
 */

const SUPABASE_URL = 'https://veggfcumdveuoumrblcn.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function sb(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
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

async function main() {
  // Get all heat athletes with their heat/round/division info
  console.log('📊 Loading competition data...')
  
  const athletes: { id: string; name: string; liveheats_id: string | null }[] =
    await sb('athletes?select=id,name,liveheats_id')
  console.log(`  ${athletes.length} athletes`)

  const heatAthletes = await sb('comp_heat_athletes?select=id,athlete_id,athlete_name,result_position,heat_id')
  console.log(`  ${heatAthletes.length} heat athlete entries`)

  const heats = await sb('comp_heats?select=id,round_id,status')
  const heatMap = new Map(heats.map((h: any) => [h.id, h]))

  const rounds = await sb('comp_rounds?select=id,name,round_number,event_division_id')
  const roundMap = new Map(rounds.map((r: any) => [r.id, r]))

  const eventDivs = await sb('comp_event_divisions?select=id,division_id,event_id')
  const eventDivMap = new Map(eventDivs.map((ed: any) => [ed.id, ed]))

  const divisions = await sb('comp_divisions?select=id,name')
  const divNameMap = new Map(divisions.map((d: any) => [d.id, d.name]))

  const events = await sb('comp_events?select=id,name')
  const eventNameMap = new Map(events.map((e: any) => [e.id, e.name]))

  // Get all wave scores
  const waveScores = await sb('comp_wave_scores?select=id,heat_athlete_id,score')
  const scoresByHeatAthlete = new Map<string, number[]>()
  for (const ws of waveScores) {
    const existing = scoresByHeatAthlete.get(ws.heat_athlete_id) || []
    existing.push(ws.score)
    scoresByHeatAthlete.set(ws.heat_athlete_id, existing)
  }

  // Get season points
  const seasonPoints = await sb('comp_season_points?select=athlete_name,total_points,division_id')

  // Build stats per athlete
  const stats: Record<string, {
    events_entered: number
    divisions_entered: string[]
    heats_surfed: number
    total_waves: number
    best_wave: number
    wins: number
    finals_made: number
    best_finish: number | null
    total_points: number
    last_event: string
  }> = {}

  for (const ha of heatAthletes) {
    if (!ha.athlete_id) continue
    
    if (!stats[ha.athlete_id]) {
      stats[ha.athlete_id] = {
        events_entered: 1,
        divisions_entered: [],
        heats_surfed: 0,
        total_waves: 0,
        best_wave: 0,
        wins: 0,
        finals_made: 0,
        best_finish: null,
        total_points: 0,
        last_event: '',
      }
    }
    const s = stats[ha.athlete_id]

    // Count heats
    s.heats_surfed++

    // Wave stats
    const waves = scoresByHeatAthlete.get(ha.id) || []
    s.total_waves += waves.length
    for (const w of waves) {
      if (w > s.best_wave) s.best_wave = w
    }

    // Round/division info
    const heat = heatMap.get(ha.heat_id)
    if (heat) {
      const round = roundMap.get(heat.round_id)
      if (round) {
        const eventDiv = eventDivMap.get(round.event_division_id)
        if (eventDiv) {
          const divName = divNameMap.get(eventDiv.division_id) || ''
          if (divName && !s.divisions_entered.includes(divName)) {
            s.divisions_entered.push(divName)
          }
          const eventName = eventNameMap.get(eventDiv.event_id) || ''
          if (eventName) s.last_event = eventName

          // Final results
          if (round.name === 'Final') {
            s.finals_made++
            if (ha.result_position === 1) s.wins++
            if (s.best_finish === null || (ha.result_position && ha.result_position < s.best_finish)) {
              s.best_finish = ha.result_position
            }
          }
        }
      }
    }
  }

  // Add season points
  const athleteNameToId = new Map(athletes.map(a => [a.name.toLowerCase(), a.id]))
  for (const sp of seasonPoints) {
    const id = athleteNameToId.get(sp.athlete_name.toLowerCase())
    if (id && stats[id]) {
      stats[id].total_points += sp.total_points
    }
  }

  // Update athlete profiles
  console.log('\n📝 Updating athlete profiles...')
  let updated = 0
  for (const [athleteId, s] of Object.entries(stats)) {
    const payload = {
      social_links: {
        competition_stats: {
          events_entered: s.events_entered,
          divisions: s.divisions_entered,
          heats_surfed: s.heats_surfed,
          total_waves: s.total_waves,
          best_wave: s.best_wave > 0 ? Number(s.best_wave.toFixed(2)) : null,
          wins: s.wins,
          finals_made: s.finals_made,
          best_finish: s.best_finish,
          total_points: s.total_points,
          last_event: s.last_event,
          last_updated: new Date().toISOString(),
        }
      }
    }
    
    await sb(`athletes?id=eq.${athleteId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    updated++
    
    const athlete = athletes.find(a => a.id === athleteId)
    if (s.wins > 0 || s.total_points >= 800) {
      console.log(`  🏆 ${athlete?.name}: ${s.wins}W ${s.finals_made}F best:${s.best_finish} ${s.total_points}pts ${s.best_wave.toFixed(1)}bw ${s.heats_surfed}H ${s.total_waves}w`)
    }
  }
  console.log(`\n✅ ${updated} athletes updated`)
}

main().catch(console.error)
