import { getEvent } from '@/lib/liveheats'
import { getEventPhotos } from '@/lib/photos'
import { EventDetailClient } from './EventDetailClient'
export const revalidate = 300
export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try { return <EventDetailClient event={await getEvent(id)} photos={await getEventPhotos(id)} /> }
  catch { return <div style={{ paddingTop: '8rem', textAlign: 'center', color: 'rgba(26,26,26,0.4)' }}>Event not found.</div> }
}
