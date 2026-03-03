import { createClient } from '@/lib/supabase/server'

export interface StreamConfig {
  id: string
  active: boolean
  stream_url: string | null
  embed_code: string | null
  title: string | null
  event_id: string | null
  updated_at: string
  updated_by: string | null
}

export async function getStreamConfig(): Promise<StreamConfig | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stream_config')
    .select('*')
    .limit(1)
    .single()
  if (error) return null
  return data
}

export async function updateStreamConfig(updates: Partial<StreamConfig>): Promise<StreamConfig> {
  const supabase = await createClient()
  // Get the single row first
  const config = await getStreamConfig()
  if (!config) throw new Error('No stream config found')
  const { data, error } = await supabase
    .from('stream_config')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', config.id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function toggleStream(active: boolean, userId?: string): Promise<StreamConfig> {
  return updateStreamConfig({ active, updated_by: userId || null })
}
