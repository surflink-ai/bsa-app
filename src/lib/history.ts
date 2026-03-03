// Historical champions data — now fetched from Supabase

import { createClient } from '@/lib/supabase/server'

export interface Champion {
  year: number
  division: string
  name: string
  image?: string
}

const tierOrder: Record<string, number> = {
  "Open Mens": 0, "Open Womens": 1, "Pro Mens": 2, "Pro Womens": 3, "Pro Juniors": 4,
  "Under 18 Boys": 5, "Under 18 Girls": 6, "Under 16 Boys": 7, "Under 16 Girls": 8,
  "Under 14 Boys": 9, "Under 12": 10, "Grand Masters": 11, "Masters 40+": 11, "Masters 35+": 11,
  "Longboard Open": 12,
}

export async function getChampionsByYear(): Promise<Record<number, Champion[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('champions')
    .select('*')
    .order('year', { ascending: false })
  if (error || !data) return {}
  const champions: Champion[] = data.map(c => ({
    year: c.year,
    division: c.division,
    name: c.name,
    image: c.image_url || undefined,
  }))
  const grouped: Record<number, Champion[]> = {}
  for (const c of champions) {
    if (!grouped[c.year]) grouped[c.year] = []
    grouped[c.year].push(c)
  }
  for (const year of Object.keys(grouped)) {
    grouped[Number(year)].sort((a, b) => (tierOrder[a.division] ?? 99) - (tierOrder[b.division] ?? 99))
  }
  return grouped
}

export async function getYears(): Promise<number[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('champions')
    .select('year')
  if (error || !data) return []
  return [...new Set(data.map(d => d.year))].sort((a, b) => b - a)
}

export async function getAllChampions(): Promise<Champion[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('champions')
    .select('*')
    .order('year', { ascending: false })
  if (error || !data) return []
  return data.map(c => ({
    year: c.year,
    division: c.division,
    name: c.name,
    image: c.image_url || undefined,
  })).sort((a, b) => b.year - a.year || (tierOrder[a.division] ?? 99) - (tierOrder[b.division] ?? 99))
}
