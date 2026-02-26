import { getOrg, getEvent, getUpcomingEvents, getPastEvents } from '@/lib/liveheats'
import { HomeClient } from './HomeClient'
export const revalidate = 300
export default async function Home() {
  try {
    const org = await getOrg()
    const upcoming = getUpcomingEvents(org.events)
    const past = getPastEvents(org.events)
    let latestResults = null
    if (past.length > 0) {
      try {
        const ev = await getEvent(past[0].id)
        latestResults = { event: ev, eventName: past[0].name, eventDate: past[0].date }
      } catch {}
    }
    return <HomeClient org={org} upcomingEvents={upcoming} pastEvents={past} latestResults={latestResults} />
  } catch {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(26,26,26,0.4)' }}>Unable to load data. Please try again later.</div>
  }
}
