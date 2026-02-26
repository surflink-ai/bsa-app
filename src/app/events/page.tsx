import { getOrg, getUpcomingEvents, getPastEvents } from '@/lib/liveheats'
import type { BSAEvent } from '@/lib/liveheats'
import Link from 'next/link'
import { EventTabs } from './event-tabs'

export const revalidate = 300

export default async function EventsPage() {
  const org = await getOrg()
  const upcoming = getUpcomingEvents(org.events)
  const past = getPastEvents(org.events)

  return (
    <div className="pb-20 px-4 md:px-8 pt-8">
      <h1 className="text-3xl font-bold mb-6">Events</h1>
      <EventTabs upcoming={upcoming} past={past} />
    </div>
  )
}
