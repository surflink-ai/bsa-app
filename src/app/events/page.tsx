import { getOrg, getUpcomingEvents, getPastEvents } from '@/lib/liveheats'
import { EventsClient } from './EventsClient'

export default async function EventsPage() {
  const org = await getOrg()
  return <EventsClient upcomingEvents={getUpcomingEvents(org.events)} pastEvents={getPastEvents(org.events)} />
}
