import { getOrg, getUpcomingEvents, getPastEvents } from '@/lib/liveheats'
import { EventsClient } from './EventsClient'
export const revalidate = 300
export default async function EventsPage() {
  try { const org = await getOrg(); return <EventsClient upcoming={getUpcomingEvents(org.events)} past={getPastEvents(org.events)} /> }
  catch { return <EventsClient upcoming={[]} past={[]} /> }
}
