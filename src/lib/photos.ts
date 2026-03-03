// Event photo gallery data — now fetched from Supabase

import { createClient } from '@/lib/supabase/server'

interface Photo {
  src: string
  alt?: string
  credit?: string
}

export async function getEventPhotos(eventId: string): Promise<Photo[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('event_photos')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order')
  if (error || !data) return []
  return data.map(p => ({
    src: p.src,
    alt: p.alt || undefined,
    credit: p.credit || undefined,
  }))
}
