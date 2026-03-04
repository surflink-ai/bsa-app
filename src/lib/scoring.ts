/**
 * ISA-Compliant Scoring Engine
 * 
 * Rules (ISA Rulebook April 2025 + ISA Judging Manual):
 * - Each judge scores every wave independently (0.0-10.0, one-tenth increments)
 * - 5 judges: drop highest + lowest, average remaining 3
 * - 3-4 judges: straight average (no drop)
 * - Best 2 waves count (configurable via scoring_best_of)
 * - Interference penalty: applied to SECOND-HIGHEST scoring wave (not the interference wave)
 *   - If only 1 wave: that wave is halved
 *   - If no waves yet: first wave scored gets halved
 * - Double interference = disqualification (last place in heat)
 */

export interface JudgeScore {
  judge_id: string
  score: number
}

export interface WaveResult {
  wave_number: number
  judge_scores: JudgeScore[]
  averaged_score: number
  dropped_high: number | null
  dropped_low: number | null
  is_counting: boolean
  is_penalty_wave: boolean // true if this is the wave where interference penalty is applied
  original_score: number // score before any penalty
  penalized_score: number // score after penalty (same as original if no penalty on this wave)
}

export interface InterferenceRecord {
  wave_number: number
  penalty_type: 'interference_half' | 'interference_zero' | 'double_interference'
}

export interface AthleteHeatResult {
  heat_athlete_id: string
  athlete_name: string
  jersey_color: string | null
  waves: WaveResult[]
  wave_count: number
  best_waves: number[] // the counting wave scores (after penalties)
  total_score: number
  position: number
  needs_score: number | null
  interference: InterferenceRecord[]
  is_disqualified: boolean
  penalty_applied_to_wave: number | null // which wave number has the penalty
}

/**
 * Calculate averaged wave score from judge panel
 * ISA rules: drop high+low if 5+ judges, straight average if 3-4
 */
export function calculateWaveScore(
  judgeScores: number[],
  dropHighLow: boolean = true
): { averaged: number; droppedHigh: number | null; droppedLow: number | null } {
  if (judgeScores.length === 0) return { averaged: 0, droppedHigh: null, droppedLow: null }

  const sorted = [...judgeScores].sort((a, b) => a - b)

  let droppedHigh: number | null = null
  let droppedLow: number | null = null
  let scoresToAverage = sorted

  if (dropHighLow && sorted.length >= 5) {
    droppedLow = sorted[0]
    droppedHigh = sorted[sorted.length - 1]
    scoresToAverage = sorted.slice(1, -1)
  }

  const sum = scoresToAverage.reduce((s, v) => s + v, 0)
  const averaged = Math.round((sum / scoresToAverage.length) * 100) / 100

  return { averaged, droppedHigh, droppedLow }
}

/**
 * Apply interference penalty at the HEAT level (ISA-compliant)
 * 
 * ISA Rule: The interference penalty halves the surfer's SECOND-HIGHEST scoring wave.
 * - If only 1 wave scored: that wave is halved
 * - If no waves scored: deferred (first wave scored will be halved)
 * - Double interference in same heat = disqualification (last place)
 * 
 * Returns: which wave number gets the penalty, and updated wave scores
 */
export function applyInterferencePenalty(
  waves: { wave_number: number; averaged_score: number }[],
  interferences: InterferenceRecord[],
  scoringBestOf: number
): {
  penaltyWaveNumber: number | null
  isDisqualified: boolean
  waveAdjustments: Map<number, number> // wave_number → penalized score
} {
  const adjustments = new Map<number, number>()

  // Double interference = DQ
  if (interferences.length >= 2) {
    return { penaltyWaveNumber: null, isDisqualified: true, waveAdjustments: adjustments }
  }

  if (interferences.length === 0 || waves.length === 0) {
    return { penaltyWaveNumber: null, isDisqualified: false, waveAdjustments: adjustments }
  }

  // Sort waves by score descending
  const sorted = [...waves].sort((a, b) => b.averaged_score - a.averaged_score)

  // Penalty goes on SECOND-highest wave
  // If only 1 wave, penalty goes on that wave
  const penaltyWave = sorted.length >= 2 ? sorted[1] : sorted[0]
  const penaltyScore = Math.round((penaltyWave.averaged_score / 2) * 100) / 100

  adjustments.set(penaltyWave.wave_number, penaltyScore)

  return {
    penaltyWaveNumber: penaltyWave.wave_number,
    isDisqualified: false,
    waveAdjustments: adjustments,
  }
}

/**
 * Calculate full heat results for all athletes
 * Returns sorted by position (1st place first)
 */
export function calculateHeatResults(
  athletes: {
    heat_athlete_id: string
    athlete_name: string
    jersey_color: string | null
    waves: {
      wave_number: number
      judge_scores: { judge_id: string; score: number }[]
    }[]
    interferences: InterferenceRecord[]
  }[],
  panelSize: number,
  dropHighLow: boolean,
  scoringBestOf: number
): AthleteHeatResult[] {
  const results: AthleteHeatResult[] = athletes.map(athlete => {
    // Step 1: Calculate each wave's averaged score (no penalties yet)
    const waveResults: WaveResult[] = athlete.waves.map(wave => {
      const scores = wave.judge_scores.map(js => js.score)
      const { averaged, droppedHigh, droppedLow } = calculateWaveScore(scores, dropHighLow)

      return {
        wave_number: wave.wave_number,
        judge_scores: wave.judge_scores,
        averaged_score: averaged,
        dropped_high: droppedHigh,
        dropped_low: droppedLow,
        is_counting: false,
        is_penalty_wave: false,
        original_score: averaged,
        penalized_score: averaged,
      }
    })

    // Step 2: Apply interference penalty at heat level (on second-best wave)
    const { penaltyWaveNumber, isDisqualified, waveAdjustments } = applyInterferencePenalty(
      waveResults.map(w => ({ wave_number: w.wave_number, averaged_score: w.averaged_score })),
      athlete.interferences,
      scoringBestOf
    )

    // Apply adjustments
    for (const wr of waveResults) {
      if (waveAdjustments.has(wr.wave_number)) {
        wr.penalized_score = waveAdjustments.get(wr.wave_number)!
        wr.is_penalty_wave = true
      }
    }

    // Step 3: Select best N waves (using penalized scores)
    const sortedWaves = [...waveResults].sort((a, b) => b.penalized_score - a.penalized_score)
    const bestWaves = sortedWaves.slice(0, scoringBestOf)

    const countingWaveNumbers = new Set(bestWaves.map(w => w.wave_number))
    for (const wr of waveResults) {
      wr.is_counting = countingWaveNumbers.has(wr.wave_number)
    }

    // DQ = last place with 0 total
    const total = isDisqualified
      ? 0
      : Math.round(bestWaves.reduce((s, w) => s + w.penalized_score, 0) * 100) / 100

    return {
      heat_athlete_id: athlete.heat_athlete_id,
      athlete_name: athlete.athlete_name,
      jersey_color: athlete.jersey_color,
      waves: waveResults,
      wave_count: waveResults.length,
      best_waves: bestWaves.map(w => w.penalized_score),
      total_score: total,
      position: 0,
      needs_score: null,
      interference: athlete.interferences,
      is_disqualified: isDisqualified,
      penalty_applied_to_wave: penaltyWaveNumber,
    }
  })

  // Sort: DQ'd athletes always last, then by total_score descending
  results.sort((a, b) => {
    if (a.is_disqualified && !b.is_disqualified) return 1
    if (!a.is_disqualified && b.is_disqualified) return -1
    return b.total_score - a.total_score
  })
  results.forEach((r, i) => { r.position = i + 1 })

  // Calculate needs scores
  for (let i = 1; i < results.length; i++) {
    const athlete = results[i]
    if (athlete.is_disqualified) { athlete.needs_score = null; continue }

    const above = results[i - 1]
    const targetTotal = above.total_score + 0.01

    if (athlete.best_waves.length >= scoringBestOf) {
      const lowestCounting = Math.min(...athlete.best_waves)
      const otherWavesTotal = athlete.total_score - lowestCounting
      const needed = Math.round((targetTotal - otherWavesTotal) * 100) / 100
      athlete.needs_score = needed > 10 ? null : Math.max(0, needed)
    } else {
      const needed = Math.round((targetTotal - athlete.total_score) * 100) / 100
      athlete.needs_score = needed > 10 ? null : Math.max(0, needed)
    }
  }

  return results
}

/**
 * Check if all judges have submitted scores for a given wave
 */
export function isWaveComplete(
  judgeScores: { judge_id: string }[],
  assignedJudgeIds: string[]
): boolean {
  const submittedJudges = new Set(judgeScores.map(s => s.judge_id))
  return assignedJudgeIds.every(jid => submittedJudges.has(jid))
}

/**
 * Check judge score deviation from average
 * Returns judges whose scores deviate more than threshold
 */
export function detectOutliers(
  judgeScores: { judge_id: string; score: number }[],
  threshold: number = 1.5
): { judge_id: string; score: number; deviation: number }[] {
  if (judgeScores.length < 3) return []

  const scores = judgeScores.map(s => s.score)
  const avg = scores.reduce((s, v) => s + v, 0) / scores.length

  return judgeScores
    .map(s => ({ ...s, deviation: Math.abs(s.score - avg) }))
    .filter(s => s.deviation > threshold)
}
