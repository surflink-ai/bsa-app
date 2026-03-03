import { NextResponse } from 'next/server'
import { getVideos } from '@/lib/cloudflare-stream'

export const runtime = 'edge'

export async function GET() {
  try {
    const videos = await getVideos()
    return NextResponse.json({ videos }, {
      headers: { 'Cache-Control': 'public, max-age=30' }
    })
  } catch (e) {
    return NextResponse.json({ videos: [], error: (e as Error).message }, { status: 500 })
  }
}
