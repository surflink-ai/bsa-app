import { createClient } from '@/lib/supabase/server'

export interface Champion {
  id: string
  year: number
  division: string
  name: string
  image_url: string | null
  created_at: string
}

const divisionOrder: Record<string, number> = {
  'Open Mens': 0, 'Open Womens': 1, 'Pro Mens': 2, 'Pro Womens': 3, 'Pro Juniors': 4,
  'Under 18 Boys': 5, 'Under 18 Girls': 6, 'Under 16 Boys': 7, 'Under 16 Girls': 8,
  'Under 14 Boys': 9, 'Under 12': 10, 'Grand Masters': 11, 'Masters 40+': 11, 'Masters 35+': 11,
  'Longboard Open': 12,
}

export async function getChampionsByYear(): Promise<Record<number, Champion[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('champions')
    .select('*')
    .order('year', { ascending: false })
  if (error) throw error
  const grouped: Record<number, Champion[]> = {}
  for (const c of data || []) {
    if (!grouped[c.year]) grouped[c.year] = []
    grouped[c.year].push(c)
  }
  for (const year of Object.keys(grouped)) {
    grouped[Number(year)].sort((a, b) => (divisionOrder[a.division] ?? 99) - (divisionOrder[b.division] ?? 99))
  }
  return grouped
}

export async function getYears(): Promise<number[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('champions')
    .select('year')
  if (error) throw error
  return [...new Set((data || []).map(d => d.year))].sort((a, b) => b - a)
}

export async function getAllChampions(): Promise<Champion[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('champions')
    .select('*')
    .order('year', { ascending: false })
  if (error) throw error
  return (data || []).sort((a, b) => b.year - a.year || (divisionOrder[a.division] ?? 99) - (divisionOrder[b.division] ?? 99))
}

export async function createChampion(champion: Omit<Champion, 'id' | 'created_at'>): Promise<Champion> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('champions')
    .insert(champion)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateChampion(id: string, updates: Partial<Champion>): Promise<Champion> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('champions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteChampion(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('champions').delete().eq('id', id)
  if (error) throw error
}
