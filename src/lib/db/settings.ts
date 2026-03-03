import { createClient } from '@/lib/supabase/server'

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .single()
  if (error) return null
  return data.value as T
}

export async function getAllSettings(): Promise<Record<string, unknown>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
  if (error) throw error
  const settings: Record<string, unknown> = {}
  for (const row of data || []) {
    settings[row.key] = row.value
  }
  return settings
}

export async function upsertSetting(key: string, value: unknown): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) throw error
}

export async function deleteSetting(key: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('site_settings').delete().eq('key', key)
  if (error) throw error
}
