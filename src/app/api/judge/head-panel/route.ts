import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/judge/head-panel?heat_id=xxx&judge_id=xxx
 * Head judge view — sees ALL individual judge scores
 * Only accessible to head judges
 */
export async function GET(request: NextRequest) {
  const heatId = request.nextUrl.searchParams.get('heat_id')
  const judgeId = request.nextUrl.searchParams.get('judge_id')

  if (!heatId || !judgeId) {
    return NextResponse.json({ error: 'heat_id and judge_id required' }, { status: 400 })
  }

  // Verify caller is head judge
  const { data: assignment } = await supabase
    .from('comp_heat_judges')
    .select('is_head_judge')
    .eq('heat_id', heatId)
    .eq('judge_id', judgeId)
    .single()

  if (!assignment?.is_head_judge) {
    return NextResponse.json({ error: 'Access denied. Head judge only.' }, { status: 403 })
  }

  // Get heat info
  const { data: heat } = await supabase
    .from('comp_heats')
    .select('id, status, priority_order, duration_minutes, actual_start, is_paused, certified')
    .eq('id', heatId)
    .single()

  if (!heat) return NextResponse.json({ error: 'Heat not found' }, { status: 404 })

  // Get all assigned judges
  const { data: judges } = await supabase
    .from('comp_heat_judges')
    .select('judge_id, position, is_head_judge, judge:comp_judges(name)')
    .eq('heat_id', heatId)
    .order('position')

  // Get all athletes
  const { data: athletes } = await supabase
    .from('comp_heat_athletes')
    .select('id, athlete_name, jersey_color, wave_count, total_score, needs_score, penalty, penalty_wave, has_priority, result_position')
    .eq('heat_id', heatId)
    .order('result_position')

  if (!athletes) return NextResponse.json({ error: 'No athletes found' }, { status: 404 })

  // Get ALL judge scores (head judge sees everything)
  const athleteIds = athletes.map(a => a.id)
  const { data: allScores } = await supabase
    .from('comp_judge_scores')
    .select('heat_athlete_id, wave_number, judge_id, score, is_override, override_reason')
    .in('heat_athlete_id', athleteIds)
    .order('wave_number')

  // Get averaged wave scores
  const { data: waveScores } = await supabase
    .from('comp_wave_scores')
    .select('heat_athlete_id, wave_number, score, notes')
    .in('heat_athlete_id', athleteIds)
    .order('wave_number')

  // Get interference calls
  const { data: interferences } = await supabase
    .from('comp_interference')
    .select('athlete_id, wave_number, penalty_type, notes, created_at')
    .eq('heat_id', heatId)

  // Structure data per athlete
  const scoringJudges = (judges || []).filter(j => !j.is_head_judge)
  
  const athleteData = athletes.map(a => {
    const myScores = (allScores || []).filter(s => s.heat_athlete_id === a.id)
    const myWaves = (waveScores || []).filter(s => s.heat_athlete_id === a.id)
    const myInterferences = (interferences || []).filter(i => i.athlete_id === a.id)

    // Group scores by wave
    const waveMap = new Map<number, any>()
    for (const ws of myWaves) {
      waveMap.set(ws.wave_number, {
        wave_number: ws.wave_number,
        averaged_score: Number(ws.score),
        notes: ws.notes,
        judge_scores: [] as any[],
        all_submitted: false,
        interference: myInterferences.find(i => i.wave_number === ws.wave_number) || null,
      })
    }

    // Also include waves where some judges have scored but not all
    for (const js of myScores) {
      if (!waveMap.has(js.wave_number)) {
        waveMap.set(js.wave_number, {
          wave_number: js.wave_number,
          averaged_score: null,
          notes: null,
          judge_scores: [],
          all_submitted: false,
          interference: myInterferences.find(i => i.wave_number === js.wave_number) || null,
        })
      }
      waveMap.get(js.wave_number)!.judge_scores.push({
        judge_id: js.judge_id,
        judge_name: (() => { const j = (judges || []).find(j => j.judge_id === js.judge_id); const jd = j?.judge as any; return jd?.name || (Array.isArray(jd) ? jd[0]?.name : null) || 'Unknown' })(),
        judge_position: (judges || []).find(j => j.judge_id === js.judge_id)?.position || 0,
        score: Number(js.score),
        is_override: js.is_override,
        override_reason: js.override_reason,
      })
    }

    // Check if all judges submitted for each wave
    for (const [, wave] of waveMap) {
      const submitted = new Set(wave.judge_scores.map((s: any) => s.judge_id))
      wave.all_submitted = scoringJudges.every(j => submitted.has(j.judge_id))
    }

    return {
      ...a,
      total_score: Number(a.total_score),
      needs_score: a.needs_score ? Number(a.needs_score) : null,
      waves: [...waveMap.values()].sort((a, b) => a.wave_number - b.wave_number),
      interferences: myInterferences,
    }
  })

  // Judge performance: average score per judge across all waves
  const judgePerformance = scoringJudges.map(j => {
    const judgeAllScores = (allScores || []).filter(s => s.judge_id === j.judge_id)
    const avg = judgeAllScores.length > 0
      ? Math.round(judgeAllScores.reduce((s, v) => s + Number(v.score), 0) / judgeAllScores.length * 100) / 100
      : 0
    return {
      judge_id: j.judge_id,
      judge_name: (j.judge as any)?.name || 'Unknown',
      position: j.position,
      scores_submitted: judgeAllScores.length,
      average_score: avg,
    }
  })

  // Overall heat average for comparison
  const allScoreValues = (allScores || []).map(s => Number(s.score))
  const heatAverage = allScoreValues.length > 0
    ? Math.round(allScoreValues.reduce((s, v) => s + v, 0) / allScoreValues.length * 100) / 100
    : 0

  return NextResponse.json({
    heat: {
      id: heat.id,
      status: heat.status,
      duration_minutes: heat.duration_minutes,
      actual_start: heat.actual_start,
      is_paused: heat.is_paused,
      certified: heat.certified,
      priority_order: heat.priority_order,
    },
    judges: (judges || []).map(j => ({
      judge_id: j.judge_id,
      name: (j.judge as any)?.name || 'Unknown',
      position: j.position,
      is_head_judge: j.is_head_judge,
    })),
    athletes: athleteData,
    judge_performance: judgePerformance,
    heat_average: heatAverage,
  })
}

/**
 * POST /api/judge/head-panel
 * Head judge actions: override score, certify heat
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, judge_id, heat_id } = body

    // Verify head judge
    const { data: assignment } = await supabase
      .from('comp_heat_judges')
      .select('is_head_judge')
      .eq('heat_id', heat_id)
      .eq('judge_id', judge_id)
      .single()

    if (!assignment?.is_head_judge) {
      return NextResponse.json({ error: 'Head judge only' }, { status: 403 })
    }

    if (action === 'override_score') {
      const { score_id, new_score, reason } = body
      if (!score_id || new_score === undefined || !reason) {
        return NextResponse.json({ error: 'score_id, new_score, and reason required' }, { status: 400 })
      }

      // Get original score
      const { data: original } = await supabase
        .from('comp_judge_scores')
        .select('score')
        .eq('id', score_id)
        .single()

      if (!original) return NextResponse.json({ error: 'Score not found' }, { status: 404 })

      // Log override
      await supabase.from('comp_score_overrides').insert({
        judge_score_id: score_id,
        original_score: original.score,
        new_score,
        reason,
        overridden_by: judge_id,
      })

      // Update the score
      await supabase
        .from('comp_judge_scores')
        .update({ score: new_score, is_override: true, override_reason: reason, override_by: judge_id, updated_at: new Date().toISOString() })
        .eq('id', score_id)

      // Trigger full recalculation cascade
      // 1. Get the score's context
      const { data: scoreContext } = await supabase
        .from('comp_judge_scores')
        .select('heat_athlete_id, wave_number')
        .eq('id', score_id)
        .single()

      if (scoreContext) {
        // 2. Recalculate wave average
        const { data: waveJudgeScores } = await supabase
          .from('comp_judge_scores')
          .select('score')
          .eq('heat_athlete_id', scoreContext.heat_athlete_id)
          .eq('wave_number', scoreContext.wave_number)

        if (waveJudgeScores && waveJudgeScores.length > 0) {
          const scores = waveJudgeScores.map(s => Number(s.score))
          const sorted = [...scores].sort((a, b) => a - b)
          let avg: number
          if (sorted.length >= 5) {
            const middle = sorted.slice(1, -1)
            avg = middle.reduce((s, v) => s + v, 0) / middle.length
          } else {
            avg = sorted.reduce((s, v) => s + v, 0) / sorted.length
          }
          avg = Math.round(avg * 100) / 100

          // Check for interference
          const { data: interference } = await supabase
            .from('comp_interference')
            .select('penalty_type')
            .eq('athlete_id', scoreContext.heat_athlete_id)
            .eq('wave_number', scoreContext.wave_number)
            .single()

          let finalScore = avg
          if (interference) {
            if (interference.penalty_type === 'interference_half') finalScore = Math.round(avg / 2 * 100) / 100
            else if (interference.penalty_type === 'interference_zero' || interference.penalty_type === 'double_interference') finalScore = 0
          }

          await supabase
            .from('comp_wave_scores')
            .upsert({
              heat_athlete_id: scoreContext.heat_athlete_id,
              wave_number: scoreContext.wave_number,
              score: finalScore,
              is_override: true,
              notes: `Override recalc. Original avg: ${avg}${interference ? `. Penalty: ${interference.penalty_type}` : ''}`,
            }, { onConflict: 'heat_athlete_id,wave_number' })
        }

        // 3. Recalculate heat totals for all athletes
        const { data: ha } = await supabase
          .from('comp_heat_athletes')
          .select('heat_id')
          .eq('id', scoreContext.heat_athlete_id)
          .single()

        if (ha) {
          // Get scoring config
          const { data: heatData } = await supabase
            .from('comp_heats')
            .select('round_id')
            .eq('id', ha.heat_id)
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

          // Recalc all athletes in heat
          const { data: allAthletes } = await supabase
            .from('comp_heat_athletes')
            .select('id')
            .eq('heat_id', ha.heat_id)

          for (const athlete of allAthletes || []) {
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

          // Recalculate positions + needs
          const { data: updated } = await supabase
            .from('comp_heat_athletes')
            .select('id, total_score')
            .eq('heat_id', ha.heat_id)
            .order('total_score', { ascending: false })

          if (updated) {
            for (let i = 0; i < updated.length; i++) {
              const needs = i > 0
                ? Math.round((updated[i - 1].total_score - updated[i].total_score + 0.01) * 100) / 100
                : null
              await supabase
                .from('comp_heat_athletes')
                .update({ result_position: i + 1, needs_score: needs !== null && needs <= 10 ? needs : null })
                .eq('id', updated[i].id)
            }
          }
        }
      }

      return NextResponse.json({ success: true, message: 'Score overridden and heat recalculated' })
    }

    if (action === 'certify') {
      // Head judge signs off on heat results
      await supabase
        .from('comp_heats')
        .update({
          certified: true,
          certified_by: judge_id,
          certified_at: new Date().toISOString(),
          protest_deadline: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min protest window
        })
        .eq('id', heat_id)

      return NextResponse.json({ success: true, message: 'Heat results certified. 15-minute protest window started.' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
