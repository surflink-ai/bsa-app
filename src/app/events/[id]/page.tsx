import { getEvent } from '@/lib/liveheats'
import { getEventPhotos } from '@/lib/photos'
import { createClient } from '@/lib/supabase/server'
import { EventDetailClient } from './EventDetailClient'
export const revalidate = 300
export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const event = await getEvent(id)
    const photos = await getEventPhotos(id)
    // Check if we have BSA Compete results for this event
    let resultsEventId: string | null = null
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('comp_events')
        .select('id')
        .eq('liveheats_id', id)
        .eq('status', 'complete')
        .single()
      if (data) resultsEventId = data.id
    } catch {}
    return <EventDetailClient event={event} photos={photos} resultsEventId={resultsEventId} />
  }
  catch { return <div style={{ paddingTop: '8rem', textAlign: 'center', color: 'rgba(26,26,26,0.4)' }}>Event not found.</div> }
}
