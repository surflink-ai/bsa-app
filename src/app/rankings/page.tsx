import { getOrg, getEvent } from '@/lib/liveheats'
import { RankingsClient } from './rankings-client'

export const revalidate = 300

interface RankingEntry {
  place: number
  total: number
  athlete: { id: string; name: string; image: string | null }
}

interface DivisionRanking {
  divisionName: string
  rankings: RankingEntry[]
}

interface SeriesRankingData {
  seriesId: string
  seriesName: string
  divisions: DivisionRanking[]
}

export default async function RankingsPage() {
  const org = await getOrg()

  const allSeriesData: SeriesRankingData[] = []

  for (const series of org.series) {
    // Get the latest completed event in this series
    const seriesEventIds = new Set(series.events.map((e) => e.id))
    const completedEvents = org.events
      .filter((e) => seriesEventIds.has(e.id) && e.status === 'results_published')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    if (completedEvents.length === 0) continue

    try {
      const latestEvent = await getEvent(completedEvents[0].id)
      const divisions: DivisionRanking[] = []

      for (const div of latestEvent.eventDivisions) {
        if (div.ranking && div.ranking.length > 0) {
          divisions.push({
            divisionName: div.division.name,
            rankings: div.ranking.map((r) => ({
              place: r.place,
              total: r.total,
              athlete: r.competitor.athlete,
            })),
          })
        }
      }

      if (divisions.length > 0) {
        allSeriesData.push({
          seriesId: series.id,
          seriesName: series.name,
          divisions,
        })
      }
    } catch {
      // skip
    }
  }

  return (
    <div className="pb-20 px-4 md:px-8 pt-8">
      <h1 className="text-3xl font-bold mb-6">Rankings</h1>
      {allSeriesData.length === 0 ? (
        <p className="text-white/40 text-center py-12">No rankings available</p>
      ) : (
        <RankingsClient seriesData={allSeriesData} />
      )}
    </div>
  )
}
