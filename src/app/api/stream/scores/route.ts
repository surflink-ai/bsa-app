import { NextResponse } from 'next/server'

const GRAPHQL_URL = 'https://liveheats.com/api/graphql'
const LIVEHEATS_EVENT_ID = '493370'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://liveheats.com',
        'Referer': 'https://liveheats.com/',
      },
      body: JSON.stringify({
        query: `{
          event(id: "${LIVEHEATS_EVENT_ID}") {
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
      }),
      cache: 'no-store',
    })

    const json = await res.json()

    return NextResponse.json(json.data?.event || null, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    console.error('LiveHeats proxy error:', err)
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 })
  }
}
