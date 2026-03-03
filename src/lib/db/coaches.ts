import { createClient } from '@/lib/supabase/server'

export interface Coach {
  id: string
  name: string
  bio: string | null
  photo_url: string | null
  specialties: string[]
  contact_email: string | null
  contact_phone: string | null
  website_url: string | null
  surflink_url: string | null
  bsa_certified: boolean
  active: boolean
  sort_order: number
  created_at: string
}

export async function getActiveCoaches(): Promise<Coach[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('coaches')
    .select('*')
    .eq('active', true)
    .order('sort_order')
    .order('name')
  if (error) throw error
  return data || []
}

export async function getAllCoachesAdmin(): Promise<Coach[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('coaches')
    .select('*')
    .order('sort_order')
    .order('name')
  if (error) throw error
  return data || []
}

export async function createCoach(coach: Omit<Coach, 'id' | 'created_at'>): Promise<Coach> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('coaches')
    .insert(coach)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCoach(id: string, updates: Partial<Coach>): Promise<Coach> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('coaches')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCoach(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('coaches').delete().eq('id', id)
  if (error) throw error
}
