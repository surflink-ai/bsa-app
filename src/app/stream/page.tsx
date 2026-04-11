import { Metadata } from 'next'
import { getStreamConfig } from '@/lib/db/stream'
import { StreamClient } from './StreamClient'

export const revalidate = 30 // Refresh every 30 seconds for live state

export const metadata: Metadata = {
  title: 'BSA Live — Barbados Surfing Association',
  description: 'Watch live surf competitions with real-time scoring from the Barbados Surfing Association.',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'mobile-web-app-capable': 'yes',
  },
}

export default async function StreamPage() {
  const config = await getStreamConfig()
  return <StreamClient config={config ? {
    active: config.active,
    title: config.title,
    streamUrl: config.stream_url,
    embedCode: config.embed_code,
    sourceType: config.source_type || 'youtube',
    youtubeVideoId: config.youtube_video_id || null,
    overlayEnabled: config.overlay_enabled || false,
    vodEnabled: config.vod_enabled || false,
    vodPlaylist: config.vod_playlist || [],
    scheduledTime: config.scheduled_time || null,
    scheduledTitle: config.scheduled_title || null,
  } : null} />
}
