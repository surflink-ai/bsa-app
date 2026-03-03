import { createClient } from '@/lib/supabase/server'

export interface Sponsor {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
  tier: 'platinum' | 'gold' | 'silver' | 'bronze' | 'supporter'
  sort_order: number
  active: boolean
  created_at: string
}

const tierOrder: Record<string, number> = { platinum: 0, gold: 1, silver: 2, bronze: 3, supporter: 4 }
const tierLabels: Record<string, string> = { platinum: 'Platinum Partners', gold: 'Gold Sponsors', silver: 'Silver Sponsors', bronze: 'Bronze Sponsors', supporter: 'Supporters' }
const tierColors: Record<string, string> = { platinum: '#8B5CF6', gold: '#eab308', silver: '#94a3b8', bronze: '#b45309', supporter: '#2BA5A0' }

export async function getActiveSponsors(): Promise<Sponsor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sponsors')
    .select('*')
    .eq('active', true)
    .order('sort_order')
  if (error) throw error
  return data || []
}

export async function getSponsorsByTier(): Promise<{ tier: string; label: string; color: string; sponsors: Sponsor[] }[]> {
  const sponsors = await getActiveSponsors()
  const grouped: Record<string, Sponsor[]> = {}
  for (const s of sponsors) {
    if (!grouped[s.tier]) grouped[s.tier] = []
    grouped[s.tier].push(s)
  }
  return Object.entries(grouped)
    .sort(([a], [b]) => (tierOrder[a] ?? 99) - (tierOrder[b] ?? 99))
    .map(([tier, list]) => ({ tier, label: tierLabels[tier] || tier, color: tierColors[tier] || '#999', sponsors: list }))
}

export async function hasSponsors(): Promise<boolean> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('sponsors')
    .select('id', { count: 'exact', head: true })
    .eq('active', true)
  if (error) return false
  return (count || 0) > 0
}

export async function getAllSponsorsAdmin(): Promise<Sponsor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sponsors')
    .select('*')
    .order('tier')
    .order('sort_order')
  if (error) throw error
  return data || []
}

export async function createSponsor(sponsor: Omit<Sponsor, 'id' | 'created_at'>): Promise<Sponsor> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sponsors')
    .insert(sponsor)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSponsor(id: string, updates: Partial<Sponsor>): Promise<Sponsor> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sponsors')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteSponsor(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('sponsors').delete().eq('id', id)
  if (error) throw error
}
