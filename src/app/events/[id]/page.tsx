import { getEvent } from '@/lib/liveheats'
import { EventDetailClient } from './EventDetailClient'

export const revalidate = 300

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try {
  const { id } = await params
  const event = await getEvent(id)
  return <EventDetailClient event={event} />
} catch (error) {
    console.error('Data fetch failed:', error)
    return <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Loading...</h1>
      <p>Unable to load data. Please refresh the page.</p>
    </div>
  }
}