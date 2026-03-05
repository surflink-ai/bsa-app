import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/compete/season-points
 * Calculate and store season points for a completed event
 * Body: { event_id }
 * 
 * Called when admin marks event as complete.
 * Uses season.points_system to map finish positions → points.
 */
export async function POST(req: NextRequest) {
  const { event_id } = await req.json()
  if (!event_id) return NextResponse.json({ error: 'event_id required' }, { status: 400 })

  // Get event + its season
  const { data: event } = await supabase
    .from('comp_events')
    .select('id, name, season_id')
    .eq('id', event_id)
    .single()

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  if (!event.season_id) return NextResponse.json({ error: 'Event not linked to a season' }, { status: 400 })

  // Get season + points system
  const { data: season } = await supabase
    .from('comp_seasons')
    .select('id, points_system')
    .eq('id', event.season_id)
    .single()

  if (!season?.points_system) return NextResponse.json({ error: 'Season has no points system' }, { status: 400 })

  const pointsMap = season.points_system as Record<string, number>

  // Get all event divisions
  const { data: divisions } = await supabase
    .from('comp_event_divisions')
    .select('id, division_id')
    .eq('event_id', event_id)

  if (!divisions?.length) return NextResponse.json({ error: 'No divisions' }, { status: 404 })

  let totalUpdated = 0

  for (const div of divisions) {
    // Get all rounds, find final round (highest round_number)
    const { data: rounds } = await supabase
      .from('comp_rounds')
      .select('id, round_number')
      .eq('event_division_id', div.id)
      .order('round_number', { ascending: false })
      .limit(1)

    if (!rounds?.length) continue

    const finalRound = rounds[0]

    // Get all heats in final round
    const { data: heats } = await supabase
      .from('comp_heats')
      .select('id')
      .eq('round_id', finalRound.id)

    if (!heats?.length) continue

    // Get all athletes with final positions
    const { data: athletes } = await supabase
      .from('comp_heat_athletes')
      .select('athlete_id, athlete_name, result_position, total_score, is_disqualified')
      .in('heat_id', heats.map(h => h.id))
      .order('result_position')

    if (!athletes?.length) continue

    // Assign overall event positions (across heats in final round)
    // Sort by total_score descending, DQ last
    const sorted = [...athletes].sort((a, b) => {
      if (a.is_disqualified && !b.is_disqualified) return 1
      if (!a.is_disqualified && b.is_disqualified) return -1
      return (b.total_score || 0) - (a.total_score || 0)
    })

    for (let i = 0; i < sorted.length; i++) {
      const athlete = sorted[i]
      if (!athlete.athlete_id) continue

      const position = i + 1
      const points = athlete.is_disqualified ? 0 : (pointsMap[String(position)] || 0)

      if (points === 0 && !athlete.is_disqualified) continue // No points for this position

      // Upsert season points for this athlete + event + division
      const { data: existing } = await supabase
        .from('comp_season_points')
        .select('id, total_points')
        .eq('season_id', season.id)
        .eq('athlete_id', athlete.athlete_id)
        .eq('division_id', div.division_id)
        .single()

      if (existing) {
        // Update — recalculate from all events
        const { data: allPoints } = await supabase
          .from('comp_season_points')
          .select('total_points')
          .eq('season_id', season.id)
          .eq('athlete_id', athlete.athlete_id)
          .eq('division_id', div.division_id)

        // For now, just add this event's points (simple approach)
        // TODO: store per-event breakdown for proper recalculation
        await supabase
          .from('comp_season_points')
          .update({
            total_points: (existing.total_points || 0) + points,
          })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('comp_season_points')
          .insert({
            season_id: season.id,
            athlete_id: athlete.athlete_id,
            division_id: div.division_id,
            total_points: points,
            events_counted: 1,
          })
      }

      totalUpdated++
    }
  }

  return NextResponse.json({
    success: true,
    message: `Season points updated for ${totalUpdated} athletes`,
    event_name: event.name,
  })
}
