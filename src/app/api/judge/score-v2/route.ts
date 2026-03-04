import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateWaveScore, applyPenalty } from '@/lib/scoring'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/judge/score-v2
 * Submit a wave score (blind — judge cannot see other scores)
 * 
 * Body: { judge_id, heat_athlete_id, wave_number, score }
 * 
 * After submission, if all judges have scored this wave,
 * auto-calculates the averaged score and updates comp_wave_scores
 */
export async function POST(request: NextRequest) {
  try {
    const { judge_id, heat_athlete_id, wave_number, score } = await request.json()

    // Validate inputs
    if (!judge_id || !heat_athlete_id || !wave_number || score === undefined) {
      return NextResponse.json({ error: 'Missing required fields: judge_id, heat_athlete_id, wave_number, score' }, { status: 400 })
    }
    if (score < 0 || score > 10) {
      return NextResponse.json({ error: 'Score must be between 0.0 and 10.0' }, { status: 400 })
    }
    if (wave_number < 1) {
      return NextResponse.json({ error: 'Wave number must be >= 1' }, { status: 400 })
    }

    // Verify judge exists and is active
    const { data: judge } = await supabase
      .from('comp_judges')
      .select('id, name, role')
      .eq('id', judge_id)
      .eq('active', true)
      .single()

    if (!judge) return NextResponse.json({ error: 'Invalid judge' }, { status: 403 })

    // Verify heat is live
    const { data: heatAthlete } = await supabase
      .from('comp_heat_athletes')
      .select('id, heat_id, athlete_name')
      .eq('id', heat_athlete_id)
      .single()

    if (!heatAthlete) return NextResponse.json({ error: 'Athlete not found in heat' }, { status: 404 })

    const { data: heat } = await supabase
      .from('comp_heats')
      .select('id, status, round_id')
      .eq('id', heatAthlete.heat_id)
      .single()

    if (!heat || heat.status !== 'live') {
      return NextResponse.json({ error: 'Heat is not live. Cannot submit scores.' }, { status: 400 })
    }

    // Verify judge is assigned to this heat
    const { data: assignment } = await supabase
      .from('comp_heat_judges')
      .select('id, is_head_judge')
      .eq('heat_id', heatAthlete.heat_id)
      .eq('judge_id', judge_id)
      .single()

    if (!assignment) {
      return NextResponse.json({ error: 'You are not assigned to judge this heat' }, { status: 403 })
    }

    // Check for duplicate (judge already scored this wave for this athlete)
    const { data: existing } = await supabase
      .from('comp_judge_scores')
      .select('id')
      .eq('heat_athlete_id', heat_athlete_id)
      .eq('wave_number', wave_number)
      .eq('judge_id', judge_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'You have already scored this wave for this athlete' }, { status: 409 })
    }

    // Insert the judge's score
    const { data: inserted, error: insertErr } = await supabase
      .from('comp_judge_scores')
      .insert({
        heat_athlete_id,
        wave_number,
        judge_id,
        score: Math.round(score * 10) / 10, // ensure one decimal
      })
      .select('id')
      .single()

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

    // Check if all assigned judges have scored this wave for this athlete
    const { data: allAssigned } = await supabase
      .from('comp_heat_judges')
      .select('judge_id')
      .eq('heat_id', heatAthlete.heat_id)
      .eq('is_head_judge', false) // head judge doesn't score (ISA rules)

    const assignedJudgeIds = (allAssigned || []).map(a => a.judge_id)

    const { data: waveScores } = await supabase
      .from('comp_judge_scores')
      .select('judge_id, score')
      .eq('heat_athlete_id', heat_athlete_id)
      .eq('wave_number', wave_number)

    const submittedJudgeIds = new Set((waveScores || []).map(s => s.judge_id))
    const allJudgesScored = assignedJudgeIds.every(jid => submittedJudgeIds.has(jid))

    let waveComplete = false
    let averagedScore: number | null = null

    if (allJudgesScored && waveScores && waveScores.length > 0) {
      waveComplete = true

      // Get panel config
      const { data: round } = await supabase
        .from('comp_rounds')
        .select('event_division_id')
        .eq('id', heat.round_id)
        .single()

      let dropHighLow = true
      if (round) {
        const { data: ed } = await supabase
          .from('comp_event_divisions')
          .select('panel_size, drop_high_low')
          .eq('id', round.event_division_id)
          .single()
        if (ed) dropHighLow = ed.drop_high_low && (ed.panel_size || 5) >= 5
      }

      // Calculate averaged score
      const scores = waveScores.map(s => Number(s.score))
      const { averaged } = calculateWaveScore(scores, dropHighLow)
      averagedScore = averaged

      // Check for interference on this wave
      const { data: interference } = await supabase
        .from('comp_interference')
        .select('penalty_type')
        .eq('athlete_id', heat_athlete_id)
        .eq('wave_number', wave_number)
        .single()

      const penalizedScore = interference
        ? applyPenalty(averaged, interference.penalty_type as any)
        : averaged

      // Upsert into comp_wave_scores (cached averaged score)
      await supabase
        .from('comp_wave_scores')
        .upsert({
          heat_athlete_id,
          wave_number,
          score: penalizedScore,
          is_override: false,
          notes: interference ? `Penalty: ${interference.penalty_type}. Original avg: ${averaged}` : null,
        }, { onConflict: 'heat_athlete_id,wave_number' })

      // Update wave count for athlete
      const { count } = await supabase
        .from('comp_wave_scores')
        .select('id', { count: 'exact', head: true })
        .eq('heat_athlete_id', heat_athlete_id)

      await supabase
        .from('comp_heat_athletes')
        .update({ wave_count: count || 0 })
        .eq('id', heat_athlete_id)

      // Recalculate heat totals
      await recalculateHeatTotals(heatAthlete.heat_id)
    }

    return NextResponse.json({
      success: true,
      score_id: inserted.id,
      wave_complete: waveComplete,
      averaged_score: averagedScore,
      judges_submitted: submittedJudgeIds.size,
      judges_required: assignedJudgeIds.length,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET /api/judge/score-v2?judge_id=xxx&heat_id=xxx
 * Returns ONLY this judge's scores for the heat (blind judging)
 */
export async function GET(request: NextRequest) {
  const judgeId = request.nextUrl.searchParams.get('judge_id')
  const heatId = request.nextUrl.searchParams.get('heat_id')

  if (!judgeId || !heatId) {
    return NextResponse.json({ error: 'judge_id and heat_id required' }, { status: 400 })
  }

  // Get athletes in this heat
  const { data: athletes } = await supabase
    .from('comp_heat_athletes')
    .select('id, athlete_name, jersey_color, wave_count')
    .eq('heat_id', heatId)

  if (!athletes) return NextResponse.json({ error: 'Heat not found' }, { status: 404 })

  // Get ONLY this judge's scores (blind)
  const athleteIds = athletes.map(a => a.id)
  const { data: scores } = await supabase
    .from('comp_judge_scores')
    .select('heat_athlete_id, wave_number, score')
    .eq('judge_id', judgeId)
    .in('heat_athlete_id', athleteIds)
    .order('wave_number')

  // Structure by athlete
  const result = athletes.map(a => ({
    heat_athlete_id: a.id,
    athlete_name: a.athlete_name,
    jersey_color: a.jersey_color,
    wave_count: a.wave_count,
    my_scores: (scores || [])
      .filter(s => s.heat_athlete_id === a.id)
      .map(s => ({ wave_number: s.wave_number, score: Number(s.score) })),
  }))

  return NextResponse.json(result)
}

/**
 * Recalculate heat totals and positions for all athletes in a heat
 */
async function recalculateHeatTotals(heatId: string) {
  // Get heat config
  const { data: heat } = await supabase
    .from('comp_heats')
    .select('id, round_id')
    .eq('id', heatId)
    .single()

  if (!heat) return

  const { data: round } = await supabase
    .from('comp_rounds')
    .select('event_division_id')
    .eq('id', heat.round_id)
    .single()

  let scoringBestOf = 2
  if (round) {
    const { data: ed } = await supabase
      .from('comp_event_divisions')
      .select('scoring_best_of')
      .eq('id', round.event_division_id)
      .single()
    if (ed) scoringBestOf = ed.scoring_best_of
  }

  // Get all athletes + their cached wave scores
  const { data: athletes } = await supabase
    .from('comp_heat_athletes')
    .select('id, athlete_name, jersey_color')
    .eq('heat_id', heatId)

  if (!athletes) return

  for (const athlete of athletes) {
    const { data: waves } = await supabase
      .from('comp_wave_scores')
      .select('score')
      .eq('heat_athlete_id', athlete.id)
      .order('score', { ascending: false })

    const waveScores = (waves || []).map(w => Number(w.score))
    const bestWaves = waveScores.slice(0, scoringBestOf)
    const total = Math.round(bestWaves.reduce((s, v) => s + v, 0) * 100) / 100

    await supabase
      .from('comp_heat_athletes')
      .update({ total_score: total })
      .eq('id', athlete.id)
  }

  // Calculate positions and needs
  const { data: updated } = await supabase
    .from('comp_heat_athletes')
    .select('id, total_score')
    .eq('heat_id', heatId)
    .order('total_score', { ascending: false })

  if (updated) {
    for (let i = 0; i < updated.length; i++) {
      const needs = i > 0
        ? Math.round((updated[i - 1].total_score - updated[i].total_score + 0.01) * 100) / 100
        : null

      await supabase
        .from('comp_heat_athletes')
        .update({
          result_position: i + 1,
          needs_score: needs !== null && needs <= 10 ? needs : null,
        })
        .eq('id', updated[i].id)
    }
  }
}
