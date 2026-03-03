import { NextResponse } from 'next/server'
import { getLiveStatus } from '@/lib/cloudflare-stream'

export const runtime = 'edge'
export const revalidate = 0

export async function GET() {
  try {
    const status = await getLiveStatus()
    return NextResponse.json(status, {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    })
  } catch (e) {
    return NextResponse.json({ live: false, error: (e as Error).message }, { status: 500 })
  }
}
