/**
 * Shared heat recalculation logic — used by score-v2 and head-panel
 * Recalculates total_score, result_position, needs_score for all athletes in a heat
 * ISA: interference penalty halves 2nd-best wave at heat level, NOT per-wave
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function recalculateHeatTotals(heatId: string) {
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

  // Get all athletes with DQ/penalty status
  const { data: athletes } = await supabase
    .from('comp_heat_athletes')
    .select('id, athlete_name, jersey_color, is_disqualified, penalty, penalty_applied_to_wave')
    .eq('heat_id', heatId)

  if (!athletes) return

  for (const athlete of athletes) {
    // DQ'd athletes get 0
    if (athlete.is_disqualified) {
      await supabase.from('comp_heat_athletes').update({ total_score: 0 }).eq('id', athlete.id)
      continue
    }

    const { data: waves } = await supabase
      .from('comp_wave_scores')
      .select('wave_number, score')
      .eq('heat_athlete_id', athlete.id)
      .order('score', { ascending: false })

    const waveScores = (waves || []).map(w => ({ wave_number: w.wave_number, score: Number(w.score) }))

    // ISA: interference penalty halves the 2nd-best wave
    if (athlete.penalty && athlete.penalty !== 'none' && athlete.penalty !== 'double_interference' && waveScores.length > 0) {
      const penaltyIdx = waveScores.length >= 2 ? 1 : 0
      waveScores[penaltyIdx].score = Math.round((waveScores[penaltyIdx].score / 2) * 100) / 100
    }

    const bestWaves = waveScores.slice(0, scoringBestOf)
    const total = Math.round(bestWaves.reduce((s, w) => s + w.score, 0) * 100) / 100

    await supabase
      .from('comp_heat_athletes')
      .update({ total_score: total })
      .eq('id', athlete.id)
  }

  // Calculate positions — DQ'd athletes last
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

/**
 * Recalculate a single wave's averaged score in comp_wave_scores
 * Used after score override
 */
export async function recalculateWaveAverage(heatAthleteId: string, waveNumber: number, heatId: string) {
  // Get panel config
  const { data: ha } = await supabase
    .from('comp_heat_athletes')
    .select('heat_id')
    .eq('id', heatAthleteId)
    .single()

  const targetHeatId = heatId || ha?.heat_id
  if (!targetHeatId) return

  const { data: heat } = await supabase
    .from('comp_heats')
    .select('round_id')
    .eq('id', targetHeatId)
    .single()

  let dropHighLow = true
  if (heat) {
    const { data: round } = await supabase
      .from('comp_rounds')
      .select('event_division_id')
      .eq('id', heat.round_id)
      .single()
    if (round) {
      const { data: ed } = await supabase
        .from('comp_event_divisions')
        .select('panel_size, drop_high_low')
        .eq('id', round.event_division_id)
        .single()
      if (ed) dropHighLow = ed.drop_high_low && (ed.panel_size || 5) >= 5
    }
  }

  // Get all judge scores for this wave
  const { data: waveJudgeScores } = await supabase
    .from('comp_judge_scores')
    .select('score')
    .eq('heat_athlete_id', heatAthleteId)
    .eq('wave_number', waveNumber)

  if (!waveJudgeScores || waveJudgeScores.length === 0) return

  const scores = waveJudgeScores.map(s => Number(s.score))
  const sorted = [...scores].sort((a, b) => a - b)
  let avg: number
  if (dropHighLow && sorted.length >= 5) {
    const middle = sorted.slice(1, -1)
    avg = middle.reduce((s, v) => s + v, 0) / middle.length
  } else {
    avg = sorted.reduce((s, v) => s + v, 0) / sorted.length
  }
  avg = Math.round(avg * 100) / 100

  await supabase
    .from('comp_wave_scores')
    .upsert({
      heat_athlete_id: heatAthleteId,
      wave_number: waveNumber,
      score: avg,
      is_override: true,
      notes: `Recalculated after override`,
    }, { onConflict: 'heat_athlete_id,wave_number' })
}
