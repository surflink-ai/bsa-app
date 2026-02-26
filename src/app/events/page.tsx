import { getOrg, getUpcomingEvents, getPastEvents } from '@/lib/liveheats'
import { EventsClient } from './EventsClient'

export const revalidate = 300

export default async function EventsPage() {
  const org = await getOrg()
  const upcoming = getUpcomingEvents(org.events)
  const past = getPastEvents(org.events)

  return <EventsClient upcoming={upcoming} past={past} />
}
