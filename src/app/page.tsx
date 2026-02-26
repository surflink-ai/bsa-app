import { getOrg, getEvent, getUpcomingEvents, getPastEvents } from '@/lib/liveheats'
import { HomeClient } from './HomeClient'

export default async function Home() {
  const org = await getOrg()
  const upcoming = getUpcomingEvents(org.events)
  const past = getPastEvents(org.events)

  let latestResults = null
  if (past.length > 0) {
    try {
      const ev = await getEvent(past[0].id)
      latestResults = { event: ev, eventName: past[0].name, eventDate: past[0].date }
    } catch { /* ignore */ }
  }

  return (
    <HomeClient
      org={org}
      upcomingEvents={upcoming}
      pastEvents={past}
      latestResults={latestResults}
    />
  )
}
