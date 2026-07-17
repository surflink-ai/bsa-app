import { describe, it, expect } from 'vitest'
import {
  bestNTotal,
  placementPoints,
  panelWaveScore,
  roundTo,
  DEFAULT_POINTS_BY_PLACE,
} from './scoring'

describe('bestNTotal', () => {
  it('sums the best two waves by default', () => {
    expect(bestNTotal([8.5, 7.0, 6.2, 9.1])).toBe(17.6)
  })

  it('handles fewer waves than n', () => {
    expect(bestNTotal([5.5])).toBe(5.5)
    expect(bestNTotal([])).toBe(0)
  })

  it('ignores null/undefined/NaN scores', () => {
    expect(bestNTotal([9, null, undefined, NaN, 8])).toBe(17)
  })

  it('respects a custom counting-wave count', () => {
    expect(bestNTotal([9, 8, 7, 6], 3)).toBe(24)
  })

  it('rounds to two decimals without float drift', () => {
    expect(bestNTotal([0.1, 0.2])).toBe(0.3)
  })
})

describe('placementPoints', () => {
  it('maps standard places to the default table', () => {
    expect(placementPoints(1)).toBe(1000)
    expect(placementPoints(3)).toBe(650)
    expect(placementPoints(8)).toBe(100)
  })

  it('returns 0 for places outside the table or invalid input', () => {
    expect(placementPoints(9)).toBe(0)
    expect(placementPoints(0)).toBe(0)
    expect(placementPoints(-1)).toBe(0)
    expect(placementPoints(1.5)).toBe(0)
  })

  it('accepts a custom points table', () => {
    expect(placementPoints(1, { 1: 100, 2: 60 })).toBe(100)
    expect(placementPoints(2, { 1: 100, 2: 60 })).toBe(60)
  })

  it('default table is descending by place', () => {
    const places = Object.keys(DEFAULT_POINTS_BY_PLACE).map(Number).sort((a, b) => a - b)
    for (let i = 1; i < places.length; i++) {
      expect(DEFAULT_POINTS_BY_PLACE[places[i]]).toBeLessThan(DEFAULT_POINTS_BY_PLACE[places[i - 1]])
    }
  })
})

describe('panelWaveScore', () => {
  it('drops the single high and low for a 5-judge panel', () => {
    // sorted: [6,7,8,9,10] -> keep [7,8,9] -> avg 8
    expect(panelWaveScore([9, 6, 8, 10, 7])).toBe(8)
  })

  it('averages all judges when fewer than 5', () => {
    expect(panelWaveScore([8, 9])).toBe(8.5)
  })

  it('can keep all judges when dropHighLow is disabled', () => {
    expect(panelWaveScore([6, 7, 8, 9, 10], false)).toBe(8)
  })

  it('returns 0 for an empty panel', () => {
    expect(panelWaveScore([])).toBe(0)
  })
})

describe('roundTo', () => {
  it('rounds to the requested decimals', () => {
    expect(roundTo(1.005, 2)).toBe(1.01)
    expect(roundTo(2.5, 0)).toBe(3)
  })
})
