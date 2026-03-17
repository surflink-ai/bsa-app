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
  score_source?: string
  source_type?: string // 'youtube' | 'obs' | 'cloudflare' | 'custom'
  youtube_video_id?: string | null
  vod_enabled?: boolean
  vod_playlist?: { id: string; title: string; youtube_id: string; date: string; thumbnail?: string }[]
  overlay_enabled?: boolean
  overlay_url?: string | null
  scheduled_time?: string | null
  scheduled_title?: string | null
}

export async function getStreamConfig(): Promise<StreamConfig | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('stream_config')
      .select('*')
      .limit(1)
      .single()
    if (error || !data) return null
    return data as StreamConfig
  } catch {
    return null
  }
}
