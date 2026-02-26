import { getEvent } from '@/lib/liveheats'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const event = await getEvent(id)
    return NextResponse.json(event)
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
