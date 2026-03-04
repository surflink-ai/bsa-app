import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Auto-seed registrations by SOTY ranking points
// POST { event_division_id: string }
export async function POST(request: NextRequest) {
  try {
    const { event_division_id } = await request.json()
    if (!event_division_id) return NextResponse.json({ error: 'event_division_id required' }, { status: 400 })

    // Get the event division with its season and division
    const { data: ed } = await supabase
      .from('comp_event_divisions')
      .select(`
        id, division_id,
        event:comp_events(season_id)
      `)
      .eq('id', event_division_id)
      .single()

    if (!ed) return NextResponse.json({ error: 'Division not found' }, { status: 404 })

    const seasonId = (ed.event as any)?.season_id

    // Get all registrations for this division
    const { data: regs } = await supabase
      .from('comp_registrations')
      .select('id, athlete_name, athlete_id, seed_rank')
      .eq('event_division_id', event_division_id)
      .in('status', ['confirmed', 'registered', 'pending'])
      .order('created_at')

    if (!regs || regs.length === 0) {
      return NextResponse.json({ message: 'No registrations to seed', seeded: 0 })
    }

    // Get season points for ranking (if season exists)
    let pointsMap = new Map<string, number>()
    if (seasonId) {
      const { data: points } = await supabase
        .from('comp_season_points')
        .select('athlete_name, athlete_id, total_points')
        .eq('season_id', seasonId)
        .eq('division_id', ed.division_id)
        .order('total_points', { ascending: false })

      if (points) {
        for (const p of points) {
          // Match by athlete_id first, then by name
          if (p.athlete_id) pointsMap.set(p.athlete_id, p.total_points)
          pointsMap.set(p.athlete_name.toLowerCase(), p.total_points)
        }
      }
    }

    // Also check LiveHeats rankings via the existing rankings API
    // (For now, use local season points; LiveHeats fallback can be added later)

    // Sort registrations: ranked athletes first (by points desc), then unranked (shuffled)
    const ranked: typeof regs = []
    const unranked: typeof regs = []

    for (const reg of regs) {
      let pts = 0
      if (reg.athlete_id && pointsMap.has(reg.athlete_id)) {
        pts = pointsMap.get(reg.athlete_id)!
      } else if (pointsMap.has(reg.athlete_name.toLowerCase())) {
        pts = pointsMap.get(reg.athlete_name.toLowerCase())!
      }

      if (pts > 0) {
        ranked.push({ ...reg, _points: pts } as any)
      } else {
        unranked.push(reg)
      }
    }

    // Sort ranked by points descending
    ranked.sort((a, b) => ((b as any)._points || 0) - ((a as any)._points || 0))

    // Shuffle unranked
    for (let i = unranked.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unranked[i], unranked[j]] = [unranked[j], unranked[i]]
    }

    // Combine: ranked first, then unranked
    const seeded = [...ranked, ...unranked]

    // Update seed_rank for each registration
    const updates = seeded.map((reg, i) =>
      supabase
        .from('comp_registrations')
        .update({ seed_rank: i + 1, updated_at: new Date().toISOString() })
        .eq('id', reg.id)
    )
    await Promise.all(updates)

    return NextResponse.json({
      message: `Seeded ${seeded.length} athletes (${ranked.length} ranked, ${unranked.length} unseeded)`,
      seeded: seeded.length,
      ranked: ranked.length,
      order: seeded.map((r, i) => ({
        seed: i + 1,
        name: r.athlete_name,
        points: ranked.includes(r) ? (r as any)._points : 0,
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
