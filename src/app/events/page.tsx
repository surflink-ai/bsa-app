import { getOrg, getUpcomingEvents, getPastEvents } from '@/lib/liveheats'
import { EventsClient } from './EventsClient'

export const revalidate = 300

export default async function EventsPage() {
  try {
  const org = await getOrg()
  const upcoming = getUpcomingEvents(org.events)
  const past = getPastEvents(org.events)

  return <EventsClient upcoming={upcoming} past={past} />
} catch (error) {
    console.error('Data fetch failed:', error)
    return <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Loading...</h1>
      <p>Unable to load data. Please refresh the page.</p>
    </div>
  }
}