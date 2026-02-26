import { getOrg, getEvent, getUpcomingEvents, getPastEvents } from '@/lib/liveheats'
import { HomeClient } from './HomeClient'

export const revalidate = 300

export default async function HomePage() {
  const org = await getOrg()
  const upcoming = getUpcomingEvents(org.events)
  const past = getPastEvents(org.events)

  // Get latest completed event details for results section
  let latestEvent = null
  if (past.length > 0) {
    try {
      latestEvent = await getEvent(past[0].id)
    } catch { /* skip */ }
  }

  // Get latest series standings
  const latestSeries = org.series.length > 0 ? org.series[org.series.length - 1] : null

  // Collect all athletes from past events for featured section
  const featuredNames = ['Chelsea Tuach', 'Joshua Burke', 'Tommaso Layson', 'Rafe Gooding']
  const featuredAthletes: { id: string; name: string; image: string | null }[] = []

  if (latestEvent) {
    for (const div of latestEvent.eventDivisions) {
      for (const r of div.ranking || []) {
        if (featuredNames.some(n => r.competitor.athlete.name.toLowerCase().includes(n.toLowerCase())) && !featuredAthletes.find(a => a.id === r.competitor.athlete.id)) {
          featuredAthletes.push({ id: r.competitor.athlete.id, name: r.competitor.athlete.name, image: r.competitor.athlete.image })
        }
      }
    }
  }

  return (
    <HomeClient
      org={org}
      upcoming={upcoming}
      past={past}
      latestEvent={latestEvent}
      latestSeries={latestSeries}
      featuredAthletes={featuredAthletes}
    />
  )
}
