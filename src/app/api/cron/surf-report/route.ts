import { NextResponse } from 'next/server'
import { sendSurfReport, type ReportKind } from '@/lib/surf-report'
import { isAuthorizedCron } from '@/lib/cron'

// Sends the deterministic Telegram surf report. Wired to Vercel Cron.
// The report window (morning/afternoon/dawn) is passed as ?kind=.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const KINDS: ReportKind[] = ['morning', 'afternoon', 'dawn']

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const kindParam = new URL(req.url).searchParams.get('kind')
  const kind: ReportKind = KINDS.includes(kindParam as ReportKind) ? (kindParam as ReportKind) : 'morning'
  try {
    const result = await sendSurfReport({ kind })
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('[surf-report] failed', e)
    return NextResponse.json({ ok: false, error: 'Surf report failed' }, { status: 500 })
  }
}
