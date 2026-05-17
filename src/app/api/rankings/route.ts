import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Calculate and return season rankings.
// Uses the stored result_position (judged outcome) as truth, not a re-derived
// total-of-top-2-waves sum. This matters when there are judge overrides,
// interference penalties, or per-heat seeding adjustments that change the
// official place without changing the raw wave total.
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
          id, round_number, name,
          heats:comp_heats(
            id, status,
            athletes:comp_heat_athletes(
              athlete_id, athlete_name, result_position
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

  // Aggregate rankings from each event's final round, keyed by athlete_id when
  // available (falls back to athlete_name for legacy rows).
  type Entry = {
    athlete_id: string | null
    athlete_name: string
    division: string
    division_id: string
    points: number
    events: number
    results: { event: string; position: number; points: number }[]
  }
  const rankings: Record<string, Record<string, Entry>> = {}

  for (const event of events) {
    for (const ed of (event.event_divisions || []) as unknown[]) {
      const edTyped = ed as Record<string, unknown>
      const div = edTyped.division as unknown as { id: string; name: string }
      if (divisionId && div.id !== divisionId) continue

      // Find final round — prefer named "Final", else highest round_number
      const rounds = (edTyped.rounds || []) as {
        round_number: number; name: string;
        heats: { status: string; athletes: { athlete_id: string | null; athlete_name: string; result_position: number | null }[] }[]
      }[]
      const named = rounds.find(r => r.name === 'Final')
      const finalRound = named || rounds.sort((a, b) => b.round_number - a.round_number)[0]
      if (!finalRound) continue

      for (const heat of finalRound.heats) {
        // Use stored result_position (judged truth) — not re-derived wave sums
        const placed = heat.athletes
          .filter(a => typeof a.result_position === 'number' && a.result_position > 0)
          .sort((a, b) => (a.result_position! - b.result_position!))

        for (const a of placed) {
          const pos = a.result_position!
          const pts = pointsTable[pos.toString()] || 0
          const divKey = div.id
          // Key by athlete_id when available; fall back to name only for legacy rows
          const key = `${divKey}:${a.athlete_id || ('name:' + a.athlete_name.toLowerCase())}`

          if (!rankings[divKey]) rankings[divKey] = {}
          if (!rankings[divKey][key]) {
            rankings[divKey][key] = {
              athlete_id: a.athlete_id,
              athlete_name: a.athlete_name,
              division: div.name,
              division_id: div.id,
              points: 0,
              events: 0,
              results: [],
            }
          }
          rankings[divKey][key].points += pts
          rankings[divKey][key].events++
          rankings[divKey][key].results.push({ event: event.name as string, position: pos, points: pts })
        }
      }
    }
  }

  // Flatten and sort
  const flat = Object.values(rankings).flatMap(div => Object.values(div)).sort((a, b) => b.points - a.points)

  return NextResponse.json({ rankings: flat, season })
}
