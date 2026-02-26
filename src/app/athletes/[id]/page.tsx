import { getOrg, getEvent } from '@/lib/liveheats'
import { AthleteDetailClient } from './AthleteDetailClient'

export const revalidate = 300

export default async function AthleteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const org = await getOrg()

  // Find athlete across all events
  let athlete: { id: string; name: string; nationality: string | null; image: string | null } | null = null
  const competitions: {
    eventId: string; eventName: string; eventDate: string
    divisionName: string; place: number; total: number
    heatTotals: number[]
  }[] = []

  // Process events (limit to avoid too many requests)
  for (const event of org.events.slice(0, 15)) {
    try {
      const full = await getEvent(event.id)
      for (const div of full.eventDivisions) {
        // Check rankings
        const ranking = div.ranking?.find(r => r.competitor.athlete.id === id)
        if (ranking) {
          if (!athlete) athlete = ranking.competitor.athlete

          // Collect heat totals for this athlete in this division
          const heatTotals: number[] = []
          for (const heat of div.heats || []) {
            const result = heat.result?.find(r => r.competitor?.athlete?.id === id)
            if (result && result.total > 0) heatTotals.push(result.total)
          }

          competitions.push({
            eventId: event.id,
            eventName: event.name || full.name,
            eventDate: event.date || full.date,
            divisionName: div.division.name,
            place: ranking.place,
            total: ranking.total,
            heatTotals,
          })
        }
      }
    } catch { /* skip */ }
  }

  if (!athlete) {
    return (
      <div className="min-h-screen pt-32 text-center">
        <h1 className="font-heading text-2xl text-navy">Athlete not found</h1>
      </div>
    )
  }

  // Sort competitions by date (newest first)
  competitions.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())

  // Calculate stats
  const allHeatTotals = competitions.flatMap(c => c.heatTotals)
  const stats = {
    events: competitions.length,
    heats: allHeatTotals.length,
    bestScore: allHeatTotals.length > 0 ? Math.max(...allHeatTotals) : 0,
    avgHeatTotal: allHeatTotals.length > 0 ? allHeatTotals.reduce((a, b) => a + b, 0) / allHeatTotals.length : 0,
  }

  return (
    <AthleteDetailClient
      athlete={athlete}
      competitions={competitions}
      stats={stats}
      heatTotals={allHeatTotals}
    />
  )
}
