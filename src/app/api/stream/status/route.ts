import { NextResponse } from 'next/server'
import { getStreamConfig } from '@/lib/db/stream'

export const revalidate = 0
export const dynamic = 'force-dynamic'

// Lightweight stream status endpoint.
// Returns whether the admin has flipped the stream to active.
// This is the single source of truth for "LIVE NOW" badges on the public site.
export async function GET() {
  try {
    const config = await getStreamConfig()
    return NextResponse.json({ active: !!config?.active }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ active: false })
  }
}
