import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/judge/interference
 * Head judge calls interference on an athlete
 * 
 * Body: { judge_id, heat_id, athlete_id (heat_athlete_id), wave_number, penalty_type, priority_violation?, notes? }
 */
export async function POST(request: NextRequest) {
  try {
    const { judge_id, heat_id, athlete_id, wave_number, penalty_type, priority_violation = true, notes } = await request.json()

    if (!judge_id || !heat_id || !athlete_id || !wave_number || !penalty_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['interference_half', 'interference_zero', 'double_interference'].includes(penalty_type)) {
      return NextResponse.json({ error: 'Invalid penalty type' }, { status: 400 })
    }

    // Verify caller is head judge for this heat
    const { data: assignment } = await supabase
      .from('comp_heat_judges')
      .select('id, is_head_judge')
      .eq('heat_id', heat_id)
      .eq('judge_id', judge_id)
      .single()

    if (!assignment?.is_head_judge) {
      return NextResponse.json({ error: 'Only the head judge can call interference' }, { status: 403 })
    }

    // Verify heat is live
    const { data: heat } = await supabase
      .from('comp_heats')
      .select('status')
      .eq('id', heat_id)
      .single()

    if (!heat || heat.status !== 'live') {
      return NextResponse.json({ error: 'Heat is not live' }, { status: 400 })
    }

    // Log interference
    const { error: insertErr } = await supabase
      .from('comp_interference')
      .insert({
        heat_id,
        athlete_id,
        wave_number,
        penalty_type,
        called_by: judge_id,
        priority_violation,
        notes,
      })

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

    // Update athlete's penalty field
    await supabase
      .from('comp_heat_athletes')
      .update({ penalty: penalty_type, penalty_wave: wave_number })
      .eq('id', athlete_id)

    // If the wave already has an averaged score in comp_wave_scores, re-apply penalty
    const { data: waveScore } = await supabase
      .from('comp_wave_scores')
      .select('id, score')
      .eq('heat_athlete_id', athlete_id)
      .eq('wave_number', wave_number)
      .single()

    if (waveScore) {
      // Get original averaged score from judge_scores
      const { data: judgeScores } = await supabase
        .from('comp_judge_scores')
        .select('score')
        .eq('heat_athlete_id', athlete_id)
        .eq('wave_number', wave_number)

      if (judgeScores && judgeScores.length > 0) {
        const scores = judgeScores.map(s => Number(s.score))
        const sorted = [...scores].sort((a, b) => a - b)
        let avg: number
        if (sorted.length >= 5) {
          const middle = sorted.slice(1, -1)
          avg = middle.reduce((s, v) => s + v, 0) / middle.length
        } else {
          avg = sorted.reduce((s, v) => s + v, 0) / sorted.length
        }
        avg = Math.round(avg * 100) / 100

        let penalized = avg
        if (penalty_type === 'interference_half') penalized = Math.round(avg / 2 * 100) / 100
        else if (penalty_type === 'interference_zero' || penalty_type === 'double_interference') penalized = 0

        await supabase
          .from('comp_wave_scores')
          .update({ score: penalized, notes: `Penalty: ${penalty_type}. Original avg: ${avg}` })
          .eq('id', waveScore.id)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Interference called: ${penalty_type} on wave ${wave_number}`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
