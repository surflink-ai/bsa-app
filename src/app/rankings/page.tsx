import { getOrg, getEvent } from '@/lib/liveheats'
import { RankingsClient } from './RankingsClient'

export const revalidate = 300

export default async function RankingsPage() {
  const org = await getOrg()

  // Get all series with their events
  const seriesData: {
    id: string; name: string
    divisions: {
      name: string
      rankings: { place: number; total: number; athleteId: string; athleteName: string; athleteImage: string | null }[]
    }[]
  }[] = []

  for (const series of org.series) {
    const divisionMap = new Map<string, Map<string, { athleteId: string; athleteName: string; athleteImage: string | null; totalPoints: number }>>()

    for (const event of series.events) {
      if (event.status !== 'results_published') continue
      try {
        const full = await getEvent(event.id)
        for (const div of full.eventDivisions) {
          if (!divisionMap.has(div.division.name)) divisionMap.set(div.division.name, new Map())
          const athletes = divisionMap.get(div.division.name)!
          for (const r of div.ranking || []) {
            const existing = athletes.get(r.competitor.athlete.id)
            if (existing) {
              existing.totalPoints += r.total || 0
            } else {
              athletes.set(r.competitor.athlete.id, {
                athleteId: r.competitor.athlete.id,
                athleteName: r.competitor.athlete.name,
                athleteImage: r.competitor.athlete.image,
                totalPoints: r.total || 0,
              })
            }
          }
        }
      } catch { /* skip */ }
    }

    const divisions = Array.from(divisionMap.entries()).map(([name, athletes]) => ({
      name,
      rankings: Array.from(athletes.values())
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .map((a, i) => ({ place: i + 1, total: a.totalPoints, athleteId: a.athleteId, athleteName: a.athleteName, athleteImage: a.athleteImage })),
    }))

    seriesData.push({ id: series.id, name: series.name, divisions })
  }

  return <RankingsClient series={seriesData} />
}
