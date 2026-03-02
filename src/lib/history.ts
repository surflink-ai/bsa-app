// Historical champions data
// Add past champions by year and division

export interface Champion {
  year: number
  division: string
  name: string
  image?: string
}

// Populate with historical data as available
const champions: Champion[] = [
  // Example:
  // { year: 2025, division: "Open Mens", name: "Che Allan" },
  // { year: 2025, division: "Open Womens", name: "Chelsea Tuach" },
  // { year: 2024, division: "Open Mens", name: "Josh Burke" },
]

export function getChampionsByYear(): Record<number, Champion[]> {
  const grouped: Record<number, Champion[]> = {}
  for (const c of champions) {
    if (!grouped[c.year]) grouped[c.year] = []
    grouped[c.year].push(c)
  }
  return grouped
}

export function getYears(): number[] {
  return [...new Set(champions.map(c => c.year))].sort((a, b) => b - a)
}

export function getAllChampions(): Champion[] {
  return [...champions].sort((a, b) => b.year - a.year || a.division.localeCompare(b.division))
}
