const CF_API = 'https://api.cloudflare.com/client/v4'
const ACCOUNT_ID = process.env.CF_ACCOUNT_ID!
const API_TOKEN = process.env.CF_STREAM_API_TOKEN!
const LIVE_INPUT_ID = process.env.CF_STREAM_LIVE_INPUT_ID!
const CUSTOMER_SUBDOMAIN = 'customer-bu7i05hdb1yap6n8'

function headers() {
  return { 'Authorization': `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' }
}

// Get live input status (is someone streaming?)
export async function getLiveStatus(): Promise<{
  live: boolean
  uid: string
  rtmpsUrl: string
  streamKey: string
  playbackUrl: string
  hlsUrl: string
  webRtcUrl: string
  currentVideo: string | null
}> {
  const res = await fetch(`${CF_API}/accounts/${ACCOUNT_ID}/stream/live_inputs/${LIVE_INPUT_ID}`, { headers: headers(), next: { revalidate: 5 } })
  const data = await res.json()
  const input = data.result

  // Check if there's an active live video
  const videosRes = await fetch(`${CF_API}/accounts/${ACCOUNT_ID}/stream/live_inputs/${LIVE_INPUT_ID}/videos`, { headers: headers(), next: { revalidate: 5 } })
  const videosData = await videosRes.json()
  const liveVideo = videosData.result?.find((v: Record<string, unknown>) => v.status === 'live' || (v.status as Record<string, string>)?.state === 'live-inprogress')

  return {
    live: !!liveVideo,
    uid: LIVE_INPUT_ID,
    rtmpsUrl: input?.rtmps?.url || '',
    streamKey: input?.rtmps?.streamKey || '',
    playbackUrl: `https://${CUSTOMER_SUBDOMAIN}.cloudflarestream.com/${LIVE_INPUT_ID}/manifest/video.m3u8`,
    hlsUrl: liveVideo ? `https://${CUSTOMER_SUBDOMAIN}.cloudflarestream.com/${liveVideo.uid}/manifest/video.m3u8` : `https://${CUSTOMER_SUBDOMAIN}.cloudflarestream.com/${LIVE_INPUT_ID}/manifest/video.m3u8`,
    webRtcUrl: `https://${CUSTOMER_SUBDOMAIN}.cloudflarestream.com/${LIVE_INPUT_ID}/webRTC/play`,
    currentVideo: liveVideo?.uid || null,
  }
}

// List recorded videos (VOD)
export async function getVideos(): Promise<{
  uid: string
  thumbnail: string
  title: string
  duration: number
  created: string
  hlsUrl: string
  status: string
}[]> {
  const res = await fetch(`${CF_API}/accounts/${ACCOUNT_ID}/stream?include_counts=true`, { headers: headers(), next: { revalidate: 30 } })
  const data = await res.json()
  if (!data.success) return []

  return (data.result || [])
    .filter((v: Record<string, unknown>) => typeof v.status === 'object' && (v.status as Record<string, string>)?.state === 'ready')
    .map((v: Record<string, unknown>) => ({
      uid: v.uid as string,
      thumbnail: `https://${CUSTOMER_SUBDOMAIN}.cloudflarestream.com/${v.uid}/thumbnails/thumbnail.jpg`,
      title: ((v.meta as Record<string, string>)?.name) || (v.uid as string),
      duration: (v.duration as number) || 0,
      created: (v.created as string) || '',
      hlsUrl: `https://${CUSTOMER_SUBDOMAIN}.cloudflarestream.com/${v.uid}/manifest/video.m3u8`,
      status: ((v.status as Record<string, string>)?.state) || 'unknown',
    }))
}

// Get RTMP info for admin panel
export async function getStreamConfig() {
  const res = await fetch(`${CF_API}/accounts/${ACCOUNT_ID}/stream/live_inputs/${LIVE_INPUT_ID}`, { headers: headers() })
  const data = await res.json()
  const input = data.result
  return {
    rtmpsUrl: input?.rtmps?.url,
    streamKey: input?.rtmps?.streamKey,
    srtUrl: input?.srt?.url,
    srtStreamId: input?.srt?.streamId,
    webRtcPublish: input?.webRTC?.url,
  }
}
