import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Calculate and return season rankings
export async function GET(req: NextRequest) {
  const seasonId = req.nextUrl.searchParams.get('season')
  const divisionId = req.nextUrl.searchParams.get('division')

  // Get active season if not specified
  let targetSeason = seasonId
  if (!targetSeason) {
    const { data } = await supabase.from('comp_seasons').select('id').eq('active', true).order('year', { ascending: false }).limit(1).single()
    if (data) targetSeason = data.id
    else return NextResponse.json({ rankings: [], season: null })
  }

  // Get season + points config
  const { data: season } = await supabase.from('comp_seasons').select('*').eq('id', targetSeason).single()
  if (!season) return NextResponse.json({ rankings: [], season: null })

  const pointsTable = season.points_system as Record<string, number>

  // Get all complete events in this season
  const { data: events } = await supabase
    .from('comp_events')
    .select(`
      id, name, event_date,
      event_divisions:comp_event_divisions(
        id, division_id,
        division:comp_divisions(id, name),
        rounds:comp_rounds(
          id, round_number,
          heats:comp_heats(
            id, status,
            athletes:comp_heat_athletes(
              athlete_name, result_position,
              waves:comp_wave_scores(score)
            )
          )
        )
      )
    `)
    .eq('season_id', targetSeason)
    .eq('status', 'complete')
    .order('event_date')

  if (!events || events.length === 0) {
    // Fall back to season_points table
    let query = supabase.from('comp_season_points').select('*').eq('season_id', targetSeason).order('total_points', { ascending: false })
    if (divisionId) query = query.eq('division_id', divisionId)
    const { data: points } = await query
    return NextResponse.json({ rankings: points || [], season })
  }

  // Calculate rankings from event results
  const rankings: Record<string, Record<string, { athlete_name: string; division: string; division_id: string; points: number; events: number; results: { event: string; position: number; points: number }[] }>> = {}

  for (const event of events) {
    for (const ed of (event.event_divisions || []) as unknown[]) {
      const edTyped = ed as Record<string, unknown>
      const div = edTyped.division as unknown as { id: string; name: string }
      if (divisionId && div.id !== divisionId) continue

      // Find final round (highest round_number)
      const rounds = (edTyped.rounds || []) as { round_number: number; heats: { status: string; athletes: { athlete_name: string; result_position: number | null; waves: { score: number }[] }[] }[] }[]
      const finalRound = rounds.sort((a, b) => b.round_number - a.round_number)[0]
      if (!finalRound) continue

      // Get results from final
      for (const heat of finalRound.heats) {
        if (heat.status !== 'complete') continue
        const athletes = heat.athletes
          .map(a => {
            const total = (a.waves || []).map(w => w.score).sort((x, y) => y - x).slice(0, 2).reduce((s, v) => s + v, 0)
            return { ...a, total }
          })
          .sort((a, b) => b.total - a.total)

        athletes.forEach((a, i) => {
          const pos = i + 1
          const pts = pointsTable[pos.toString()] || 0
          const divKey = div.id
          const key = `${divKey}:${a.athlete_name}`

          if (!rankings[divKey]) rankings[divKey] = {}
          if (!rankings[divKey][key]) {
            rankings[divKey][key] = { athlete_name: a.athlete_name, division: div.name, division_id: div.id, points: 0, events: 0, results: [] }
          }
          rankings[divKey][key].points += pts
          rankings[divKey][key].events++
          rankings[divKey][key].results.push({ event: event.name as string, position: pos, points: pts })
        })
      }
    }
  }

  // Flatten and sort
  const flat = Object.values(rankings).flatMap(div => Object.values(div)).sort((a, b) => b.points - a.points)

  return NextResponse.json({ rankings: flat, season })
}
