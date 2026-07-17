import { NextResponse } from 'next/server'
import { getLiveEventId } from '@/lib/live-event'
import { rateLimit, tooMany } from '@/lib/rate-limit'

const GRAPHQL_URL = 'https://liveheats.com/api/graphql'

export const revalidate = 0
export const dynamic = 'force-dynamic'

const SCORES_QUERY = `query Event($id: ID!) {
  event(id: $id) {
    id name status
    eventDivisions {
      id
      division { id name }
      status
      heats {
        id position round startTime endTime
        heatDurationMinutes
        config { totalCountingRides maxRideScore jerseyOrder hasPriority }
        competitors { position priority athlete { id name } }
        result {
          place total needs winBy rides
          competitor { athlete { id name } bib }
        }
      }
    }
  }
}`

export async function GET(req: Request) {
  // Polled every few seconds by the stream page — cap abusive callers.
  const limited = await rateLimit(req, 'stream-scores', 120, 60_000)
  if (!limited.success) return tooMany()

  const eventId = await getLiveEventId()
  if (!eventId) {
    return NextResponse.json(null, { headers: { 'Cache-Control': 'no-store' } })
  }

  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://liveheats.com',
        Referer: 'https://liveheats.com/',
      },
      body: JSON.stringify({ query: SCORES_QUERY, variables: { id: eventId } }),
      cache: 'no-store',
    })

    const json = await res.json()
    return NextResponse.json(json.data?.event || null, {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 502 })
  }
}
