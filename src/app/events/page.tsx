import type { Metadata } from 'next'
import { getOrg, getUpcomingEvents, getPastEvents } from '@/lib/liveheats'
import { EventsClient } from './EventsClient'
export const revalidate = 300

export const metadata: Metadata = {
  title: 'Events',
  description: 'Upcoming and past Barbados Surfing Association events — schedules, locations, divisions, and full results.',
  alternates: { canonical: '/events' },
}
export default async function EventsPage() {
  try { const org = await getOrg(); return <EventsClient upcoming={getUpcomingEvents(org.events)} past={getPastEvents(org.events)} /> }
  catch { return <EventsClient upcoming={[]} past={[]} /> }
}
