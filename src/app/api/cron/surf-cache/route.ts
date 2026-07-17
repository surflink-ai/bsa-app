import { NextResponse } from 'next/server'
import { refreshSurfCache } from '@/lib/surf-cache'
import { isAuthorizedCron } from '@/lib/cron'

// Refreshes the Surfline/WindGuru cache in Supabase. Wired to Vercel Cron
// (see vercel.json) so it no longer depends on a developer's laptop.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await refreshSurfCache((m) => console.log('[surf-cache]', m))
    return NextResponse.json(result, { status: result.ok ? 200 : 502 })
  } catch (e) {
    console.error('[surf-cache] failed', e)
    return NextResponse.json({ ok: false, error: 'Surf cache refresh failed' }, { status: 500 })
  }
}
