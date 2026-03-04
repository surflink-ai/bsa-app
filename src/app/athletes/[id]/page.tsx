import { getOrg, getEvent } from '@/lib/liveheats'
import { createClient } from '@/lib/supabase/server'
import { AthleteDetailClient } from './AthleteDetailClient'
export const revalidate = 300

interface HeatEntry {
  eid: string
  ename: string
  date: string
  div: string
  round: string
  heatPos: number
  place: number
  total: number
  waves: number[]
  opponents: { name: string; total: number; place: number }[]
}

interface ResultEntry {
  eid: string
  ename: string
  date: string
  div: string
  place: number
  total: number
  fieldSize: number
}

export default async function AthleteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let name = '', img: string | null = null
  const results: ResultEntry[] = []
  const heats: HeatEntry[] = []
  const rivals: Record<string, { name: string; wins: number; losses: number; heats: number }> = {}

  try {
    const org = await getOrg()
    const past = org.events.filter(e => e.status === 'results_published').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const res = await Promise.allSettled(past.slice(0, 20).map(e => getEvent(e.id)))

    for (const r of res) {
      if (r.status !== 'fulfilled') continue
      const ev = r.value

      for (const d of ev.eventDivisions) {
        // Check ranking for this athlete
        const rk = (d.ranking || []).find(r => r.competitor.athlete.id === id)
        if (!rk) continue

        if (!name) name = rk.competitor.athlete.name
        if (!img && rk.competitor.athlete.image) img = rk.competitor.athlete.image

        results.push({
          eid: ev.id, ename: ev.name, date: ev.date, div: d.division.name,
          place: rk.place, total: rk.total,
          fieldSize: d.ranking?.length || 0
        })

        // Extract heat-level data
        for (const heat of d.heats || []) {
          const myResult = heat.result?.find(hr => hr.competitor.athlete.id === id)
          if (!myResult) continue

          // Extract wave scores
          const waves: number[] = []
          if (myResult.rides) {
            for (const rideSet of Object.values(myResult.rides)) {
              for (const ride of rideSet) {
                waves.push(ride.total)
              }
            }
          }
          waves.sort((a, b) => b - a)

          // Opponents in this heat
          const opponents = heat.result
            .filter(hr => hr.competitor.athlete.id !== id)
            .map(hr => ({ name: hr.competitor.athlete.name, total: hr.total, place: hr.place }))

          // Track rivals
          for (const opp of opponents) {
            if (!rivals[opp.name]) rivals[opp.name] = { name: opp.name, wins: 0, losses: 0, heats: 0 }
            rivals[opp.name].heats++
            if (myResult.place < opp.place) rivals[opp.name].wins++
            else if (myResult.place > opp.place) rivals[opp.name].losses++
          }

          heats.push({
            eid: ev.id, ename: ev.name, date: ev.date, div: d.division.name,
            round: heat.round, heatPos: heat.position,
            place: myResult.place, total: myResult.total,
            waves, opponents
          })
        }
      }
    }
  } catch {}

  // Also fetch BSA Compete results if this athlete has a local record
  let compResults: { event_name: string; event_date: string; division: string; round: string; heat_number: number; result_position: number | null; waves: { wave_number: number; score: number }[] }[] = []
  let seasonPoints: { season_name: string; division: string; total_points: number; events_counted: number; best_result: number | null }[] = []

  try {
    const supabase = await createClient()

    // Find local athlete by liveheats_id or by name
    const { data: localAthlete } = await supabase
      .from('athletes')
      .select('id, name, image_url')
      .eq('liveheats_id', id)
      .single()

    if (localAthlete) {
      if (!img && localAthlete.image_url) img = localAthlete.image_url

      // Get comp heat results
      const { data: heatAthletes } = await supabase
        .from('comp_heat_athletes')
        .select(`
          athlete_name, jersey_color, result_position, seed_position,
          heat:comp_heats(
            heat_number, status,
            round:comp_rounds(
              name,
              event_division:comp_event_divisions(
                division:comp_divisions(name),
                event:comp_events(name, event_date)
              )
            )
          ),
          waves:comp_wave_scores(wave_number, score)
        `)
        .eq('athlete_id', localAthlete.id)

      if (heatAthletes) {
        for (const ha of heatAthletes) {
          const heat = ha.heat as any
          if (!heat?.round?.event_division?.event) continue
          compResults.push({
            event_name: heat.round.event_division.event.name,
            event_date: heat.round.event_division.event.event_date || '',
            division: heat.round.event_division.division?.name || '',
            round: heat.round.name,
            heat_number: heat.heat_number,
            result_position: ha.result_position,
            waves: ((ha.waves as any[]) || []).map(w => ({ wave_number: w.wave_number, score: Number(w.score) })).sort((a, b) => b.score - a.score),
          })
        }
      }

      // Get season points
      const { data: points } = await supabase
        .from('comp_season_points')
        .select(`
          total_points, events_counted, best_result,
          season:comp_seasons(name),
          division:comp_divisions(name)
        `)
        .eq('athlete_id', localAthlete.id)
        .order('total_points', { ascending: false })

      if (points) {
        seasonPoints = points.map(p => ({
          season_name: (p.season as any)?.name || '',
          division: (p.division as any)?.name || '',
          total_points: p.total_points,
          events_counted: p.events_counted,
          best_result: p.best_result,
        }))
      }
    }
  } catch {}

  if (!name) return <div style={{ paddingTop: '8rem', textAlign: 'center', color: 'rgba(26,26,26,0.4)' }}>Athlete not found.</div>

  // Top rivals (min 2 heats together)
  const topRivals = Object.values(rivals)
    .filter(r => r.heats >= 2)
    .sort((a, b) => b.heats - a.heats)
    .slice(0, 6)

  return (
    <AthleteDetailClient
      athlete={{ id, name, image: img }}
      results={results}
      heats={heats}
      rivals={topRivals}
      compResults={compResults}
      seasonPoints={seasonPoints}
    />
  )
}
