import { StreamClient } from './StreamClient'
import { getLiveStatus } from '@/lib/cloudflare-stream'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 0

export const metadata = {
  title: 'BSA Stream — Barbados Surfing Association',
  description: 'Live surf competitions and replays from the Barbados Surfing Association',
}

export default async function StreamPage() {
  let initialStatus = { live: false, hlsUrl: '', currentVideo: null as string | null }
  let streamConfig = { active: false, title: null as string | null, event_id: null as string | null }
  let vodVideos: { id: string; title: string; url: string; source: string; thumbnail_url: string | null }[] = []

  try {
    initialStatus = await getLiveStatus()
  } catch {}

  try {
    const supabase = await createClient()
    const { data } = await supabase.from('stream_config').select('*').limit(1).single()
    if (data) streamConfig = { active: data.active, title: data.title, event_id: data.event_id }
  } catch {}

  try {
    const supabase = await createClient()
    const { data } = await supabase.from('stream_videos').select('id, title, url, source, thumbnail_url').eq('active', true).order('sort_order').order('created_at', { ascending: false })
    if (data) vodVideos = data
  } catch {}

  return <StreamClient initialStatus={initialStatus} streamConfig={streamConfig} vodVideos={vodVideos} />
}
