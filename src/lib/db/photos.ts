import { createClient } from '@/lib/supabase/server'

export interface EventPhoto {
  id: string
  event_id: string
  event_name: string | null
  src: string
  alt: string | null
  credit: string | null
  sort_order: number
  created_at: string
}

export async function getEventPhotos(eventId: string): Promise<EventPhoto[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('event_photos')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order')
  if (error) throw error
  return data || []
}

export async function getAllPhotosAdmin(): Promise<EventPhoto[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('event_photos')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createPhoto(photo: Omit<EventPhoto, 'id' | 'created_at'>): Promise<EventPhoto> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('event_photos')
    .insert(photo)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePhoto(id: string, updates: Partial<EventPhoto>): Promise<EventPhoto> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('event_photos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePhoto(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('event_photos').delete().eq('id', id)
  if (error) throw error
}

export async function bulkCreatePhotos(photos: Omit<EventPhoto, 'id' | 'created_at'>[]): Promise<EventPhoto[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('event_photos')
    .insert(photos)
    .select()
  if (error) throw error
  return data || []
}
