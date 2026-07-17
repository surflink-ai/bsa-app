import { getEvent } from '@/lib/liveheats'
import { NextResponse } from 'next/server'
import { rateLimit, tooMany } from '@/lib/rate-limit'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid event id' }, { status: 400 })
  }

  const limited = await rateLimit(req, 'event', 60, 60_000)
  if (!limited.success) return tooMany()

  try {
    const event = await getEvent(id)
    return NextResponse.json(event, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
