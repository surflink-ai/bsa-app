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
 * ISA Rules:
 * - Penalty halves the SECOND-HIGHEST scoring wave (not the interference wave)
 * - If only 1 wave: that wave is halved
 * - If no waves yet: first wave scored will be halved (deferred)
 * - Double interference in same heat = disqualification (last place)
 * - Surfer loses priority → dropped to lowest position
 * 
 * Body: { judge_id, heat_id, athlete_id (heat_athlete_id), wave_number, penalty_type, notes? }
 */
export async function POST(request: NextRequest) {
  try {
    const { judge_id, heat_id, athlete_id, wave_number, penalty_type, notes } = await request.json()

    if (!judge_id || !heat_id || !athlete_id || !wave_number || !penalty_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['interference_half', 'interference_zero', 'double_interference'].includes(penalty_type)) {
      return NextResponse.json({ error: 'Invalid penalty type' }, { status: 400 })
    }

    // Verify caller is head judge
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
      .select('status, priority_order')
      .eq('id', heat_id)
      .single()

    if (!heat || heat.status !== 'live') {
      return NextResponse.json({ error: 'Heat is not live' }, { status: 400 })
    }

    // Check for existing interferences (double interference check)
    const { data: existingInterferences } = await supabase
      .from('comp_interference')
      .select('id')
      .eq('heat_id', heat_id)
      .eq('athlete_id', athlete_id)

    const totalInterferences = (existingInterferences?.length || 0) + 1
    const isDoubleInterference = totalInterferences >= 2 || penalty_type === 'double_interference'

    // Log interference
    await supabase
      .from('comp_interference')
      .insert({
        heat_id,
        athlete_id,
        wave_number,
        penalty_type: isDoubleInterference ? 'double_interference' : penalty_type,
        called_by: judge_id,
        priority_violation: true,
        notes,
      })

    if (isDoubleInterference) {
      // === DOUBLE INTERFERENCE: DISQUALIFICATION ===
      await supabase
        .from('comp_heat_athletes')
        .update({
          is_disqualified: true,
          penalty: 'double_interference',
          total_score: 0,
        })
        .eq('id', athlete_id)

      // Recalculate positions: DQ'd surfer gets last place
      await recalcHeatPositions(heat_id)

    } else {
      // === SINGLE INTERFERENCE: Halve second-best wave ===
      // Get all wave scores for this athlete
      const { data: waveScores } = await supabase
        .from('comp_wave_scores')
        .select('id, wave_number, score')
        .eq('heat_athlete_id', athlete_id)
        .order('score', { ascending: false })

      if (waveScores && waveScores.length > 0) {
        // Penalty on SECOND-highest wave (or only wave if just 1)
        const penaltyWave = waveScores.length >= 2 ? waveScores[1] : waveScores[0]
        const penalizedScore = Math.round((Number(penaltyWave.score) / 2) * 100) / 100

        // Update the wave score
        await supabase
          .from('comp_wave_scores')
          .update({
            score: penalizedScore,
            notes: `Interference penalty (halved). Original: ${penaltyWave.score}. Applied to 2nd-best wave per ISA rules.`,
          })
          .eq('id', penaltyWave.id)

        // Track which wave has the penalty
        await supabase
          .from('comp_heat_athletes')
          .update({
            penalty: penalty_type,
            penalty_applied_to_wave: penaltyWave.wave_number,
          })
          .eq('id', athlete_id)

        // Update interference record with which wave got the penalty
        await supabase
          .from('comp_interference')
          .update({ penalty_applied_to_wave: penaltyWave.wave_number })
          .eq('heat_id', heat_id)
          .eq('athlete_id', athlete_id)
          .eq('wave_number', wave_number)

        // Recalculate heat totals
        await recalcHeatPositions(heat_id)
      } else {
        // No waves scored yet — penalty is deferred
        await supabase
          .from('comp_heat_athletes')
          .update({
            penalty: penalty_type,
            penalty_applied_to_wave: null, // will be applied when waves are scored
          })
          .eq('id', athlete_id)
      }
    }

    // === PRIORITY: Surfer loses priority, drops to lowest ===
    const currentOrder = (heat.priority_order as string[]) || []
    if (currentOrder.length > 0) {
      const newOrder = currentOrder.filter(id => id !== athlete_id)
      newOrder.push(athlete_id)

      await supabase
        .from('comp_heats')
        .update({ priority_order: newOrder })
        .eq('id', heat_id)

      for (let i = 0; i < newOrder.length; i++) {
        await supabase
          .from('comp_heat_athletes')
          .update({ priority_position: i + 1, has_priority: i === 0 })
          .eq('id', newOrder[i])
      }
    }

    return NextResponse.json({
      success: true,
      is_disqualified: isDoubleInterference,
      total_interferences: totalInterferences,
      message: isDoubleInterference
        ? `Double interference — DISQUALIFIED (last place)`
        : `Interference called. Penalty applied to 2nd-best wave. Priority dropped to lowest.`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Recalculate heat positions and totals for all athletes
 */
async function recalcHeatPositions(heatId: string) {
  // Get scoring config
  const { data: heatData } = await supabase
    .from('comp_heats')
    .select('round_id')
    .eq('id', heatId)
    .single()

  let bestOf = 2
  if (heatData) {
    const { data: roundData } = await supabase
      .from('comp_rounds')
      .select('event_division:comp_event_divisions(scoring_best_of)')
      .eq('id', heatData.round_id)
      .single()
    bestOf = (roundData?.event_division as any)?.scoring_best_of || 2
  }

  // Get all athletes
  const { data: allAthletes } = await supabase
    .from('comp_heat_athletes')
    .select('id, is_disqualified')
    .eq('heat_id', heatId)

  // Recalc totals
  for (const athlete of allAthletes || []) {
    if (athlete.is_disqualified) {
      await supabase
        .from('comp_heat_athletes')
        .update({ total_score: 0 })
        .eq('id', athlete.id)
      continue
    }

    const { data: waves } = await supabase
      .from('comp_wave_scores')
      .select('score')
      .eq('heat_athlete_id', athlete.id)
      .order('score', { ascending: false })

    const waveScores = (waves || []).map(w => Number(w.score))
    const bestWaves = waveScores.slice(0, bestOf)
    const total = Math.round(bestWaves.reduce((s, v) => s + v, 0) * 100) / 100

    await supabase
      .from('comp_heat_athletes')
      .update({ total_score: total })
      .eq('id', athlete.id)
  }

  // Recalculate positions: DQ'd last, then by total
  const { data: updated } = await supabase
    .from('comp_heat_athletes')
    .select('id, total_score, is_disqualified')
    .eq('heat_id', heatId)
    .order('total_score', { ascending: false })

  if (updated) {
    const active = updated.filter(a => !a.is_disqualified)
    const dqd = updated.filter(a => a.is_disqualified)
    const sorted = [...active, ...dqd]

    for (let i = 0; i < sorted.length; i++) {
      const needs = !sorted[i].is_disqualified && i > 0 && !sorted[i - 1].is_disqualified
        ? Math.round((sorted[i - 1].total_score - sorted[i].total_score + 0.01) * 100) / 100
        : null
      await supabase
        .from('comp_heat_athletes')
        .update({
          result_position: i + 1,
          needs_score: needs !== null && needs <= 10 ? needs : null,
        })
        .eq('id', sorted[i].id)
    }
  }
}
