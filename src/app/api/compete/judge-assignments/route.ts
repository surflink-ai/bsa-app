import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/compete/judge-assignments?heat_id=xxx
 * Returns judges assigned to a heat
 */
export async function GET(request: NextRequest) {
  const heatId = request.nextUrl.searchParams.get('heat_id')
  if (!heatId) return NextResponse.json({ error: 'heat_id required' }, { status: 400 })

  const { data } = await supabase
    .from('comp_heat_judges')
    .select('id, judge_id, position, is_head_judge, judge:comp_judges(name, pin, role)')
    .eq('heat_id', heatId)
    .order('position')

  return NextResponse.json(data || [])
}

/**
 * POST /api/compete/judge-assignments
 * Assign judges to heats
 * 
 * Body options:
 * 1. Single heat: { heat_id, judge_id, position, is_head_judge }
 * 2. Bulk by division: { event_division_id, judges: [{ judge_id, position, is_head_judge }] }
 *    → assigns same panel to ALL heats in ALL rounds of that division
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Bulk assign to entire division
    if (body.event_division_id && body.judges) {
      const { event_division_id, judges } = body

      // Get all heats in this division
      const { data: rounds } = await supabase
        .from('comp_rounds')
        .select('id')
        .eq('event_division_id', event_division_id)

      if (!rounds || rounds.length === 0) {
        return NextResponse.json({ error: 'No rounds found for this division' }, { status: 404 })
      }

      const roundIds = rounds.map(r => r.id)
      const { data: heats } = await supabase
        .from('comp_heats')
        .select('id')
        .in('round_id', roundIds)

      if (!heats || heats.length === 0) {
        return NextResponse.json({ error: 'No heats found' }, { status: 404 })
      }

      // Remove existing assignments for all heats
      for (const heat of heats) {
        await supabase.from('comp_heat_judges').delete().eq('heat_id', heat.id)
      }

      // Insert new assignments for all heats
      const inserts = heats.flatMap(heat =>
        judges.map((j: any) => ({
          heat_id: heat.id,
          judge_id: j.judge_id,
          position: j.position,
          is_head_judge: j.is_head_judge || false,
        }))
      )

      const { error } = await supabase.from('comp_heat_judges').insert(inserts)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      return NextResponse.json({
        success: true,
        message: `${judges.length} judges assigned to ${heats.length} heats`,
        heats_updated: heats.length,
      })
    }

    // Single heat assignment
    const { heat_id, judge_id, position, is_head_judge } = body
    if (!heat_id || !judge_id) {
      return NextResponse.json({ error: 'heat_id and judge_id required' }, { status: 400 })
    }

    // Check if already assigned
    const { data: existing } = await supabase
      .from('comp_heat_judges')
      .select('id')
      .eq('heat_id', heat_id)
      .eq('judge_id', judge_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Judge already assigned to this heat' }, { status: 409 })
    }

    // Get next position if not provided
    let pos = position
    if (!pos) {
      const { data: current } = await supabase
        .from('comp_heat_judges')
        .select('position')
        .eq('heat_id', heat_id)
        .order('position', { ascending: false })
        .limit(1)
      pos = current && current.length > 0 ? current[0].position + 1 : 1
    }

    const { error } = await supabase.from('comp_heat_judges').insert({
      heat_id,
      judge_id,
      position: pos,
      is_head_judge: is_head_judge || false,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/compete/judge-assignments?id=xxx
 * Remove a judge assignment
 */
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  const heatId = request.nextUrl.searchParams.get('heat_id')

  if (id) {
    await supabase.from('comp_heat_judges').delete().eq('id', id)
    return NextResponse.json({ success: true })
  }

  if (heatId) {
    const judgeId = request.nextUrl.searchParams.get('judge_id')
    if (judgeId) {
      await supabase.from('comp_heat_judges').delete().eq('heat_id', heatId).eq('judge_id', judgeId)
    } else {
      await supabase.from('comp_heat_judges').delete().eq('heat_id', heatId)
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'id or heat_id required' }, { status: 400 })
}
