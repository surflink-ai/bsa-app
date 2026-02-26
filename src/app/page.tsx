import { getOrg, getUpcomingEvents, getPastEvents, getEvent } from '@/lib/liveheats'
import HomeClient from './HomeClient'

export default async function HomePage() {
  const org = await getOrg()
  const upcoming = getUpcomingEvents(org.events)
  const past = getPastEvents(org.events)

  let latestResults: { eventName: string; podium: { place: number; name: string; total: number }[] } | null = null
  if (past.length > 0) {
    try {
      const ev = await getEvent(past[0].id)
      const firstDiv = ev.eventDivisions.find(d => d.ranking && d.ranking.length > 0)
      if (firstDiv) {
        latestResults = { eventName: ev.name, podium: firstDiv.ranking.slice(0, 3).map(r => ({ place: r.place, name: r.competitor.athlete.name, total: r.total })) }
      }
    } catch { /* skip */ }
  }

  const athleteMap = new Map<string, { id: string; name: string; image: string | null }>()
  for (const ev of past.slice(0, 3)) {
    try {
      const full = await getEvent(ev.id)
      for (const div of full.eventDivisions) {
        for (const r of div.ranking || []) {
          const a = r.competitor.athlete
          if (!athleteMap.has(a.id)) athleteMap.set(a.id, { id: a.id, name: a.name, image: a.image })
        }
      }
    } catch { /* skip */ }
  }

  return (
    <HomeClient
      nextEvent={upcoming[0] ? { name: upcoming[0].name, date: upcoming[0].date, location: upcoming[0].location?.formattedAddress || 'Barbados' } : null}
      latestResults={latestResults}
      featuredAthletes={Array.from(athleteMap.values()).slice(0, 4)}
      totalEvents={org.events.length}
      totalAthletes={athleteMap.size}
      totalSeries={org.series.length}
    />
  )
}
