/**
 * Canonical surf-scoring math for BSA results and rankings.
 *
 * A surfer's heat total is the sum of their best N counting waves (ISA default
 * is 2). Season standings award points by finishing place. Centralised here so
 * the sync script, results display, and any future tooling agree — and so the
 * rules are unit-tested.
 */

export const DEFAULT_COUNTING_WAVES = 2

/** Default SOTY points-by-place table (LiveHeats-aligned). */
export const DEFAULT_POINTS_BY_PLACE: Record<number, number> = {
  1: 1000, 2: 800, 3: 650, 4: 500, 5: 400, 6: 300, 7: 200, 8: 100,
}

/** Round to a fixed number of decimals without floating-point drift. */
export function roundTo(value: number, decimals = 2): number {
  const f = 10 ** decimals
  return Math.round((value + Number.EPSILON) * f) / f
}

/**
 * Sum of the best `n` wave scores. Non-finite values are ignored. Result is
 * rounded to 2 decimals (surf scores are reported to 2dp).
 */
export function bestNTotal(scores: Array<number | null | undefined>, n = DEFAULT_COUNTING_WAVES): number {
  const valid = scores.filter((s): s is number => typeof s === 'number' && Number.isFinite(s))
  const bestN = valid.sort((a, b) => b - a).slice(0, Math.max(0, n))
  return roundTo(bestN.reduce((sum, s) => sum + s, 0), 2)
}

/** Points awarded for a finishing place (0 if outside the table). */
export function placementPoints(
  place: number,
  pointsByPlace: Record<number, number> = DEFAULT_POINTS_BY_PLACE
): number {
  if (!Number.isInteger(place) || place < 1) return 0
  return pointsByPlace[place] ?? 0
}

/**
 * ISA panel score for a single wave: average of the judges' scores, dropping
 * the single highest and single lowest when the panel has 5+ judges. Rounded
 * to 2 decimals. Returns 0 for an empty panel.
 */
export function panelWaveScore(judgeScores: number[], dropHighLow = true): number {
  const valid = judgeScores.filter((s) => Number.isFinite(s))
  if (valid.length === 0) return 0
  let counted = valid
  if (dropHighLow && valid.length >= 5) {
    const sorted = [...valid].sort((a, b) => a - b)
    counted = sorted.slice(1, -1)
  }
  const avg = counted.reduce((sum, s) => sum + s, 0) / counted.length
  return roundTo(avg, 2)
}
