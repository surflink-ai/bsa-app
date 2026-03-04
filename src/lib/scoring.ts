/**
 * ISA-Compliant Scoring Engine
 * 
 * Rules:
 * - Each judge scores every wave independently (0.0-10.0)
 * - 5 judges: drop highest + lowest, average remaining 3
 * - 3 judges: straight average (no drop)
 * - Best 2 waves count (configurable via scoring_best_of)
 * - Interference: half or zero the wave score
 * - Needs: what score would change position
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
  is_counting: boolean // is this wave in the best N
  interference_penalty: 'none' | 'interference_half' | 'interference_zero' | null
  penalized_score: number // score after penalty applied
}

export interface AthleteHeatResult {
  heat_athlete_id: string
  athlete_name: string
  jersey_color: string | null
  waves: WaveResult[]
  wave_count: number
  best_waves: number[] // the counting wave scores
  total_score: number // sum of best N waves
  position: number
  needs_score: number | null // score needed to improve position
  interference: { wave_number: number; penalty_type: string }[]
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

  // Drop high + low only if panel >= 5 and dropHighLow is enabled
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
 * Apply interference penalty to a wave score
 */
export function applyPenalty(
  score: number,
  penalty: 'none' | 'interference_half' | 'interference_zero' | 'double_interference'
): number {
  switch (penalty) {
    case 'interference_half':
      return Math.round((score / 2) * 100) / 100
    case 'interference_zero':
    case 'double_interference':
      return 0
    default:
      return score
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
      interference_penalty?: 'none' | 'interference_half' | 'interference_zero' | null
    }[]
  }[],
  panelSize: number,
  dropHighLow: boolean,
  scoringBestOf: number
): AthleteHeatResult[] {
  const results: AthleteHeatResult[] = athletes.map(athlete => {
    // Calculate each wave's averaged score
    const waveResults: WaveResult[] = athlete.waves.map(wave => {
      const scores = wave.judge_scores.map(js => js.score)
      const { averaged, droppedHigh, droppedLow } = calculateWaveScore(scores, dropHighLow)
      const penalty = wave.interference_penalty || 'none'
      const penalized = applyPenalty(averaged, penalty as any)

      return {
        wave_number: wave.wave_number,
        judge_scores: wave.judge_scores,
        averaged_score: averaged,
        dropped_high: droppedHigh,
        dropped_low: droppedLow,
        is_counting: false, // set below
        interference_penalty: penalty,
        penalized_score: penalized,
      }
    })

    // Sort waves by penalized score descending to find best N
    const sortedWaves = [...waveResults].sort((a, b) => b.penalized_score - a.penalized_score)
    const bestWaves = sortedWaves.slice(0, scoringBestOf)
    
    // Mark counting waves
    const countingWaveNumbers = new Set(bestWaves.map(w => w.wave_number))
    for (const wr of waveResults) {
      wr.is_counting = countingWaveNumbers.has(wr.wave_number)
    }

    const total = Math.round(bestWaves.reduce((s, w) => s + w.penalized_score, 0) * 100) / 100
    const interferences = waveResults
      .filter(w => w.interference_penalty && w.interference_penalty !== 'none')
      .map(w => ({ wave_number: w.wave_number, penalty_type: w.interference_penalty! }))

    return {
      heat_athlete_id: athlete.heat_athlete_id,
      athlete_name: athlete.athlete_name,
      jersey_color: athlete.jersey_color,
      waves: waveResults,
      wave_count: waveResults.length,
      best_waves: bestWaves.map(w => w.penalized_score),
      total_score: total,
      position: 0, // set below
      needs_score: null, // set below
      interference: interferences,
    }
  })

  // Sort by total score descending → assign positions
  results.sort((a, b) => b.total_score - a.total_score)
  results.forEach((r, i) => { r.position = i + 1 })

  // Calculate needs scores
  // For each athlete: what score on their next wave (replacing their lowest counting wave)
  // would move them up one position?
  for (let i = 1; i < results.length; i++) {
    const athlete = results[i]
    const above = results[i - 1]
    const targetTotal = above.total_score + 0.01 // need to beat by 0.01

    if (athlete.best_waves.length >= scoringBestOf) {
      // Would replace lowest counting wave
      const lowestCounting = Math.min(...athlete.best_waves)
      const otherWavesTotal = athlete.total_score - lowestCounting
      const needed = Math.round((targetTotal - otherWavesTotal) * 100) / 100
      athlete.needs_score = needed > 10 ? null : Math.max(0, needed)
    } else {
      // Still have counting wave slots available
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
