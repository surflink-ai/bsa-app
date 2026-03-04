import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/judge/priority
 * Update priority order for a heat
 * 
 * Actions:
 * - "init" — set initial priority from jersey order or seeding
 * - "rotate" — athlete rode a wave, rotate priority to next
 * - "set" — manually set priority order (head judge override)
 */
export async function POST(request: NextRequest) {
  try {
    const { action, heat_id, judge_id, athlete_id, priority_order } = await request.json()

    if (!action || !heat_id) {
      return NextResponse.json({ error: 'action and heat_id required' }, { status: 400 })
    }

    // Verify heat exists
    const { data: heat } = await supabase
      .from('comp_heats')
      .select('id, status, priority_order, priority_history')
      .eq('id', heat_id)
      .single()

    if (!heat) return NextResponse.json({ error: 'Heat not found' }, { status: 404 })

    const history = (heat.priority_history as any[] || [])

    if (action === 'init') {
      // Set initial priority from athlete order in heat
      const { data: athletes } = await supabase
        .from('comp_heat_athletes')
        .select('id, athlete_name, seed_position, jersey_color')
        .eq('heat_id', heat_id)
        .order('seed_position')

      if (!athletes || athletes.length === 0) {
        return NextResponse.json({ error: 'No athletes in heat' }, { status: 400 })
      }

      const order = athletes.map(a => a.id)
      history.push({
        action: 'init',
        order,
        timestamp: new Date().toISOString(),
        reason: 'Initial priority set by seed order',
      })

      await supabase
        .from('comp_heats')
        .update({ priority_order: order, priority_history: history })
        .eq('id', heat_id)

      // Update has_priority on athletes
      for (let i = 0; i < athletes.length; i++) {
        await supabase
          .from('comp_heat_athletes')
          .update({ has_priority: i === 0 })
          .eq('id', athletes[i].id)
      }

      return NextResponse.json({
        success: true,
        priority_order: order,
        priority_athlete: athletes[0].athlete_name,
      })
    }

    if (action === 'rotate') {
      // Athlete rode a wave — move them to bottom of priority
      if (!athlete_id) return NextResponse.json({ error: 'athlete_id required for rotate' }, { status: 400 })

      const currentOrder = (heat.priority_order as string[] || [])
      if (currentOrder.length === 0) {
        return NextResponse.json({ error: 'Priority not initialized. Call init first.' }, { status: 400 })
      }

      // Remove athlete from current position and add to end
      const newOrder = currentOrder.filter(id => id !== athlete_id)
      newOrder.push(athlete_id)

      history.push({
        action: 'rotate',
        athlete_id,
        order: newOrder,
        timestamp: new Date().toISOString(),
        reason: 'Wave ridden — priority rotated',
      })

      await supabase
        .from('comp_heats')
        .update({ priority_order: newOrder, priority_history: history })
        .eq('id', heat_id)

      // Update has_priority
      for (let i = 0; i < newOrder.length; i++) {
        await supabase
          .from('comp_heat_athletes')
          .update({ has_priority: i === 0 })
          .eq('id', newOrder[i])
      }

      // Get new priority athlete name
      const { data: nextUp } = await supabase
        .from('comp_heat_athletes')
        .select('athlete_name')
        .eq('id', newOrder[0])
        .single()

      return NextResponse.json({
        success: true,
        priority_order: newOrder,
        priority_athlete: nextUp?.athlete_name || 'unknown',
      })
    }

    if (action === 'set') {
      // Manual override by head judge
      if (!priority_order || !Array.isArray(priority_order)) {
        return NextResponse.json({ error: 'priority_order array required for set' }, { status: 400 })
      }

      history.push({
        action: 'manual_set',
        order: priority_order,
        set_by: judge_id,
        timestamp: new Date().toISOString(),
        reason: 'Manual priority override by head judge',
      })

      await supabase
        .from('comp_heats')
        .update({ priority_order, priority_history: history })
        .eq('id', heat_id)

      for (let i = 0; i < priority_order.length; i++) {
        await supabase
          .from('comp_heat_athletes')
          .update({ has_priority: i === 0 })
          .eq('id', priority_order[i])
      }

      return NextResponse.json({ success: true, priority_order })
    }

    return NextResponse.json({ error: 'Invalid action. Use init, rotate, or set.' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET /api/judge/priority?heat_id=xxx
 * Get current priority order
 */
export async function GET(request: NextRequest) {
  const heatId = request.nextUrl.searchParams.get('heat_id')
  if (!heatId) return NextResponse.json({ error: 'heat_id required' }, { status: 400 })

  const { data: heat } = await supabase
    .from('comp_heats')
    .select('priority_order')
    .eq('id', heatId)
    .single()

  if (!heat) return NextResponse.json({ error: 'Heat not found' }, { status: 404 })

  const order = heat.priority_order as string[] || []

  // Enrich with athlete names
  const { data: athletes } = await supabase
    .from('comp_heat_athletes')
    .select('id, athlete_name, jersey_color, has_priority')
    .eq('heat_id', heatId)

  const enriched = order.map((id, i) => {
    const a = athletes?.find(a => a.id === id)
    return {
      position: i + 1,
      heat_athlete_id: id,
      athlete_name: a?.athlete_name || 'unknown',
      jersey_color: a?.jersey_color || null,
      has_priority: i === 0,
    }
  })

  return NextResponse.json(enriched)
}
