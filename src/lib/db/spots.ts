import { createClient } from '@/lib/supabase/server'

export interface SurfSpot {
  id: string
  surfline_spot_id: string | null
  name: string
  coast: 'East' | 'South' | 'West'
  lat: number | null
  lon: number | null
  best_swell: string | null
  best_size: string | null
  offshore_wind: string | null
  break_type: string | null
  description: string | null
  admin_note: string | null
  priority: number
  active: boolean
  created_at: string
}

export async function getActiveSpots(): Promise<SurfSpot[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('surf_spots')
    .select('*')
    .eq('active', true)
    .order('priority')
    .order('name')
  if (error) throw error
  return data || []
}

export async function getSpotsBySurflineId(): Promise<Record<string, SurfSpot>> {
  const spots = await getActiveSpots()
  const map: Record<string, SurfSpot> = {}
  for (const s of spots) {
    if (s.surfline_spot_id) map[s.surfline_spot_id] = s
  }
  return map
}

export async function getAllSpotsAdmin(): Promise<SurfSpot[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('surf_spots')
    .select('*')
    .order('coast')
    .order('priority')
    .order('name')
  if (error) throw error
  return data || []
}

export async function createSpot(spot: Omit<SurfSpot, 'id' | 'created_at'>): Promise<SurfSpot> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('surf_spots')
    .insert(spot)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSpot(id: string, updates: Partial<SurfSpot>): Promise<SurfSpot> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('surf_spots')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteSpot(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('surf_spots').delete().eq('id', id)
  if (error) throw error
}
