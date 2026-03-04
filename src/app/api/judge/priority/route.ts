import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * ISA-Compliant Priority System
 * 
 * Rules (ISA Rulebook April 2025):
 * 
 * ESTABLISHMENT PHASE (4-surfer heat example):
 * - Heat starts with NO priority (all equal, non-priority rules apply)
 * - 1st surfer to ride → gets 4th (lowest) priority
 * - 2nd surfer to ride → gets 4th (1st rider moves to 3rd)
 * - 3rd surfer to ride → initial order LOCKED:
 *   - Surfer who hasn't ridden = P1
 *   - Others ordered by return to Primary Take-off Zone
 * - After establishment: simple rotation (rider → bottom)
 * 
 * SUSPENSION:
 * - Surfer leaves Primary Take-off Zone → priority SUSPENDED
 * - Returns → original position REINSTATED
 * - Equipment damage → suspended while getting replacement
 * 
 * LOSS:
 * - Interference → lose priority (drop to lowest)
 * - Blocking → priority surfer drops to lowest
 * - Deliberate blocking by priority surfer → loses priority
 * 
 * Actions: start, wave_ridden, suspend, reinstate, block, set, get_status
 */

interface PriorityHistoryEntry {
  action: string
  order: string[]
  athlete_id?: string
  timestamp: string
  reason: string
  phase?: 'establishing' | 'established'
}

async function getHeatAthletes(heatId: string) {
  const { data } = await supabase
    .from('comp_heat_athletes')
    .select('id, athlete_name, seed_position, jersey_color, priority_status, priority_position')
    .eq('heat_id', heatId)
    .order('seed_position')
  return data || []
}

async function updatePriorityOrder(heatId: string, order: string[], history: PriorityHistoryEntry[]) {
  await supabase
    .from('comp_heats')
    .update({ priority_order: order, priority_history: history })
    .eq('id', heatId)

  // Update each athlete's priority_position and has_priority
  for (let i = 0; i < order.length; i++) {
    await supabase
      .from('comp_heat_athletes')
      .update({
        priority_position: i + 1,
        has_priority: i === 0,
        priority_status: 'active',
      })
      .eq('id', order[i])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, heat_id, judge_id, athlete_id, priority_order, return_order } = body

    if (!action || !heat_id) {
      return NextResponse.json({ error: 'action and heat_id required' }, { status: 400 })
    }

    const { data: heat } = await supabase
      .from('comp_heats')
      .select('id, status, priority_order, priority_history, priority_established, priority_riders')
      .eq('id', heat_id)
      .single()

    if (!heat) return NextResponse.json({ error: 'Heat not found' }, { status: 404 })

    const history = (heat.priority_history as PriorityHistoryEntry[] || [])
    const riders = (heat.priority_riders as string[] || [])
    const currentOrder = (heat.priority_order as string[] || [])

    // ─── START: Begin heat with no priority ───
    if (action === 'start') {
      const athletes = await getHeatAthletes(heat_id)
      if (!athletes.length) return NextResponse.json({ error: 'No athletes in heat' }, { status: 400 })

      // Set all athletes to 'none' priority
      for (const a of athletes) {
        await supabase
          .from('comp_heat_athletes')
          .update({ priority_status: 'none', priority_position: null, has_priority: false })
          .eq('id', a.id)
      }

      // Clear priority state
      await supabase
        .from('comp_heats')
        .update({
          priority_order: [],
          priority_established: false,
          priority_riders: [],
          priority_history: [{
            action: 'start',
            order: [],
            timestamp: new Date().toISOString(),
            reason: 'Heat started — no priority (establishing phase)',
            phase: 'establishing',
          }],
        })
        .eq('id', heat_id)

      return NextResponse.json({
        success: true,
        phase: 'establishing',
        message: 'Heat started. Priority will establish as surfers ride waves.',
        riders_needed: athletes.length - 1,
      })
    }

    // ─── WAVE_RIDDEN: Surfer caught a wave ───
    if (action === 'wave_ridden') {
      if (!athlete_id) return NextResponse.json({ error: 'athlete_id required' }, { status: 400 })

      const athletes = await getHeatAthletes(heat_id)
      const athleteCount = athletes.length

      if (!heat.priority_established) {
        // === ESTABLISHMENT PHASE ===
        // Add rider to list if not already there
        const updatedRiders = riders.includes(athlete_id) ? riders : [...riders, athlete_id]
        const ridersNeeded = athleteCount - 1 // Need N-1 riders to establish

        if (updatedRiders.length >= ridersNeeded) {
          // PRIORITY ESTABLISHED!
          // The surfer who HASN'T ridden gets P1
          // Others ordered by return_order (if provided) or reverse ride order
          const allIds = athletes.map(a => a.id)
          const unridden = allIds.filter(id => !updatedRiders.includes(id))

          // Build priority order: unridden surfer(s) first, then by return order
          let newOrder: string[]
          if (return_order && Array.isArray(return_order)) {
            // Head judge specified return order
            newOrder = [...unridden, ...return_order.filter((id: string) => !unridden.includes(id))]
          } else {
            // Default: unridden first, then riders in reverse order (last rider = lowest)
            newOrder = [...unridden, ...updatedRiders.slice().reverse()]
            // Actually ISA says "ordered by return to Primary Takeoff Zone"
            // Without explicit return_order, reverse ride order is the best approximation
            // (last to ride = just left = last to return)
            newOrder = [...unridden, ...updatedRiders]
          }

          // Ensure all athletes are in the order
          const missing = allIds.filter(id => !newOrder.includes(id))
          newOrder = [...newOrder, ...missing]

          history.push({
            action: 'established',
            order: newOrder,
            athlete_id,
            timestamp: new Date().toISOString(),
            reason: `Priority established. ${athletes.find(a => a.id === unridden[0])?.athlete_name || 'Unknown'} gets P1 (hasn't ridden). Rider ${updatedRiders.length}/${ridersNeeded}.`,
            phase: 'established',
          })

          await supabase
            .from('comp_heats')
            .update({
              priority_established: true,
              priority_riders: updatedRiders,
              priority_order: newOrder,
              priority_history: history,
            })
            .eq('id', heat_id)

          await updatePriorityOrder(heat_id, newOrder, history)

          const p1Name = athletes.find(a => a.id === newOrder[0])?.athlete_name || 'Unknown'
          return NextResponse.json({
            success: true,
            phase: 'established',
            priority_order: newOrder,
            priority_athlete: p1Name,
            message: `Priority established! ${p1Name} has P1.`,
          })

        } else {
          // Still establishing — update riders list, assign temporary positions
          // Rider goes to bottom of known order
          history.push({
            action: 'wave_ridden_establishing',
            order: updatedRiders,
            athlete_id,
            timestamp: new Date().toISOString(),
            reason: `${athletes.find(a => a.id === athlete_id)?.athlete_name || 'Unknown'} rode wave (rider ${updatedRiders.length}/${ridersNeeded}). Priority still establishing.`,
            phase: 'establishing',
          })

          await supabase
            .from('comp_heats')
            .update({ priority_riders: updatedRiders, priority_history: history })
            .eq('id', heat_id)

          // Riders who have ridden have lower priority than those who haven't
          // Update the ridden surfer's priority_status
          await supabase
            .from('comp_heat_athletes')
            .update({ priority_status: 'active' })
            .eq('id', athlete_id)

          return NextResponse.json({
            success: true,
            phase: 'establishing',
            riders: updatedRiders.length,
            riders_needed: ridersNeeded,
            message: `Wave ridden. ${ridersNeeded - updatedRiders.length} more riders needed to establish priority.`,
          })
        }

      } else {
        // === ESTABLISHED PHASE — Simple rotation ===
        // Rider goes to bottom of priority
        const newOrder = currentOrder.filter(id => id !== athlete_id)
        newOrder.push(athlete_id)

        history.push({
          action: 'wave_ridden',
          order: newOrder,
          athlete_id,
          timestamp: new Date().toISOString(),
          reason: `${athletes.find(a => a.id === athlete_id)?.athlete_name || 'Unknown'} rode wave — rotated to P${newOrder.length}.`,
          phase: 'established',
        })

        await updatePriorityOrder(heat_id, newOrder, history)
        await supabase.from('comp_heats').update({ priority_history: history }).eq('id', heat_id)

        const p1Name = athletes.find(a => a.id === newOrder[0])?.athlete_name || 'Unknown'
        return NextResponse.json({
          success: true,
          phase: 'established',
          priority_order: newOrder,
          priority_athlete: p1Name,
          message: `Priority rotated. ${p1Name} now has P1.`,
        })
      }
    }

    // ─── SUSPEND: Surfer leaves Primary Take-off Zone ───
    if (action === 'suspend') {
      if (!athlete_id) return NextResponse.json({ error: 'athlete_id required' }, { status: 400 })

      // Store their current position for reinstatement
      const currentPos = currentOrder.indexOf(athlete_id)

      await supabase
        .from('comp_heat_athletes')
        .update({ priority_status: 'suspended', has_priority: false })
        .eq('id', athlete_id)

      history.push({
        action: 'suspend',
        order: currentOrder,
        athlete_id,
        timestamp: new Date().toISOString(),
        reason: `Priority suspended — surfer left Primary Take-off Zone (was P${currentPos + 1}).`,
      })

      await supabase
        .from('comp_heats')
        .update({ priority_history: history })
        .eq('id', heat_id)

      return NextResponse.json({
        success: true,
        message: 'Priority suspended. Will reinstate when surfer returns to zone.',
        suspended_position: currentPos + 1,
      })
    }

    // ─── REINSTATE: Surfer returns to zone ───
    if (action === 'reinstate') {
      if (!athlete_id) return NextResponse.json({ error: 'athlete_id required' }, { status: 400 })

      // Find their last known position from history
      let reinstatePosition = currentOrder.length // default: last
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].action === 'suspend' && history[i].athlete_id === athlete_id) {
          const suspendOrder = history[i].order
          reinstatePosition = suspendOrder.indexOf(athlete_id)
          break
        }
      }

      // Reinstate at original position
      const newOrder = currentOrder.filter(id => id !== athlete_id)
      newOrder.splice(Math.min(reinstatePosition, newOrder.length), 0, athlete_id)

      await supabase
        .from('comp_heat_athletes')
        .update({ priority_status: 'active' })
        .eq('id', athlete_id)

      history.push({
        action: 'reinstate',
        order: newOrder,
        athlete_id,
        timestamp: new Date().toISOString(),
        reason: `Priority reinstated at P${reinstatePosition + 1} — surfer returned to zone.`,
      })

      await updatePriorityOrder(heat_id, newOrder, history)
      await supabase.from('comp_heats').update({ priority_history: history }).eq('id', heat_id)

      return NextResponse.json({
        success: true,
        priority_order: newOrder,
        message: `Priority reinstated at P${reinstatePosition + 1}.`,
      })
    }

    // ─── BLOCK: Priority surfer caught blocking ───
    if (action === 'block') {
      if (!athlete_id) return NextResponse.json({ error: 'athlete_id required' }, { status: 400 })

      // Move blocker to last position
      const newOrder = currentOrder.filter(id => id !== athlete_id)
      newOrder.push(athlete_id)

      history.push({
        action: 'block',
        order: newOrder,
        athlete_id,
        timestamp: new Date().toISOString(),
        reason: `Blocking called — dropped to P${newOrder.length} (lowest priority).`,
      })

      await updatePriorityOrder(heat_id, newOrder, history)
      await supabase.from('comp_heats').update({ priority_history: history }).eq('id', heat_id)

      const p1Name = (await getHeatAthletes(heat_id)).find(a => a.id === newOrder[0])?.athlete_name || 'Unknown'
      return NextResponse.json({
        success: true,
        priority_order: newOrder,
        priority_athlete: p1Name,
        message: `Blocking called. Surfer dropped to P${newOrder.length}. ${p1Name} now has P1.`,
      })
    }

    // ─── INTERFERENCE_PRIORITY: Called after interference ───
    if (action === 'interference_priority') {
      if (!athlete_id) return NextResponse.json({ error: 'athlete_id required' }, { status: 400 })

      // ISA: surfer who commits interference loses priority → lowest position
      const newOrder = currentOrder.filter(id => id !== athlete_id)
      newOrder.push(athlete_id)

      history.push({
        action: 'interference_priority',
        order: newOrder,
        athlete_id,
        timestamp: new Date().toISOString(),
        reason: `Interference penalty — dropped to P${newOrder.length} (lowest priority).`,
      })

      await updatePriorityOrder(heat_id, newOrder, history)
      await supabase.from('comp_heats').update({ priority_history: history }).eq('id', heat_id)

      return NextResponse.json({
        success: true,
        priority_order: newOrder,
        message: `Interference called. Surfer dropped to lowest priority.`,
      })
    }

    // ─── SET: Manual override by head judge ───
    if (action === 'set') {
      if (!priority_order || !Array.isArray(priority_order)) {
        return NextResponse.json({ error: 'priority_order array required' }, { status: 400 })
      }

      history.push({
        action: 'manual_set',
        order: priority_order,
        timestamp: new Date().toISOString(),
        reason: 'Manual priority override by head judge',
      })

      await supabase
        .from('comp_heats')
        .update({ priority_established: true })
        .eq('id', heat_id)

      await updatePriorityOrder(heat_id, priority_order, history)
      await supabase.from('comp_heats').update({ priority_history: history }).eq('id', heat_id)

      return NextResponse.json({ success: true, priority_order })
    }

    // ─── INIT (legacy compat): Set from seed order + mark established ───
    if (action === 'init') {
      const athletes = await getHeatAthletes(heat_id)
      if (!athletes.length) return NextResponse.json({ error: 'No athletes in heat' }, { status: 400 })

      const order = athletes.map(a => a.id)
      history.push({
        action: 'init_legacy',
        order,
        timestamp: new Date().toISOString(),
        reason: 'Legacy init — priority set from seed order (not ISA-compliant establishment)',
      })

      await supabase
        .from('comp_heats')
        .update({ priority_established: true, priority_riders: order })
        .eq('id', heat_id)

      await updatePriorityOrder(heat_id, order, history)
      await supabase.from('comp_heats').update({ priority_history: history }).eq('id', heat_id)

      return NextResponse.json({
        success: true,
        priority_order: order,
        priority_athlete: athletes[0].athlete_name,
        message: 'Legacy init (seed order). Use "start" + "wave_ridden" for ISA-compliant flow.',
      })
    }

    return NextResponse.json({
      error: 'Invalid action. Use: start, wave_ridden, suspend, reinstate, block, interference_priority, set, init',
    }, { status: 400 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET /api/judge/priority?heat_id=xxx
 * Get current priority state including establishment phase
 */
export async function GET(request: NextRequest) {
  const heatId = request.nextUrl.searchParams.get('heat_id')
  if (!heatId) return NextResponse.json({ error: 'heat_id required' }, { status: 400 })

  const { data: heat } = await supabase
    .from('comp_heats')
    .select('priority_order, priority_established, priority_riders')
    .eq('id', heatId)
    .single()

  if (!heat) return NextResponse.json({ error: 'Heat not found' }, { status: 404 })

  const order = heat.priority_order as string[] || []
  const riders = heat.priority_riders as string[] || []

  const { data: athletes } = await supabase
    .from('comp_heat_athletes')
    .select('id, athlete_name, jersey_color, has_priority, priority_status, priority_position')
    .eq('heat_id', heatId)

  const enriched = order.map((id, i) => {
    const a = athletes?.find(a => a.id === id)
    return {
      position: i + 1,
      heat_athlete_id: id,
      athlete_name: a?.athlete_name || 'unknown',
      jersey_color: a?.jersey_color || null,
      has_priority: i === 0,
      priority_status: a?.priority_status || 'none',
    }
  })

  // If not established yet, show all athletes with their status
  const allAthletes = (athletes || []).map(a => ({
    heat_athlete_id: a.id,
    athlete_name: a.athlete_name,
    jersey_color: a.jersey_color,
    has_ridden: riders.includes(a.id),
    priority_status: a.priority_status,
    priority_position: a.priority_position,
  }))

  return NextResponse.json({
    phase: heat.priority_established ? 'established' : 'establishing',
    priority_order: enriched,
    athletes: allAthletes,
    riders_count: riders.length,
    riders_needed: (athletes?.length || 4) - 1,
  })
}
