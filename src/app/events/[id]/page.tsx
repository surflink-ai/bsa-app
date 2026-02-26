import { getEvent } from '@/lib/liveheats'
import { EventDetailClient } from './EventDetailClient'

export const revalidate = 300

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await getEvent(id)
  return <EventDetailClient event={event} />
}
