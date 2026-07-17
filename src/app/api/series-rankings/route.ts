import { NextResponse } from 'next/server'
import { rateLimit, tooMany } from '@/lib/rate-limit'

const GRAPHQL_URL = 'https://liveheats.com/api/graphql'
const HEADERS = {
  'Content-Type': 'application/json',
  'Origin': 'https://liveheats.com',
  'Referer': 'https://liveheats.com/',
}
const DEFAULT_SERIES_ID = process.env.NEXT_PUBLIC_LIVEHEATS_SERIES_ID || '27909'

interface SeriesRank {
  athlete: { id: string; name: string; nationality: string | null; image: string | null }
  division: { id: string; name: string }
  place: number
  points: number
  results: { place: number | null; points: number; dropped: boolean | null }[]
}

// IDs are passed as GraphQL variables (never interpolated) and validated as
// numeric strings, closing the previous GraphQL-injection surface.
const SERIES_QUERY = `query Series($id: ID!, $divisionId: ID!) {
  series(id: $id) {
    rankings(divisionId: $divisionId) {
      athlete { id name nationality image }
      division { id name }
      place points results { place points dropped }
    }
  }
}`

async function getSeriesRankings(seriesId: string, divisionId: string): Promise<SeriesRank[]> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ query: SERIES_QUERY, variables: { id: seriesId, divisionId } }),
    next: { revalidate: 300 },
  })
  const json = await res.json()
  if (json.errors) return []
  return json.data?.series?.rankings || []
}

const isId = (v: string | null): v is string => !!v && /^\d+$/.test(v)

export async function GET(req: Request) {
  const limited = await rateLimit(req, 'series-rankings', 60, 60_000)
  if (!limited.success) return tooMany()

  const { searchParams } = new URL(req.url)
  const seriesId = searchParams.get('seriesId') || DEFAULT_SERIES_ID
  const divisionId = searchParams.get('divisionId')

  if (!isId(divisionId)) {
    return NextResponse.json({ error: 'Valid divisionId required' }, { status: 400 })
  }
  if (!isId(seriesId)) {
    return NextResponse.json({ error: 'Invalid seriesId' }, { status: 400 })
  }

  const rankings = await getSeriesRankings(seriesId, divisionId)
  return NextResponse.json(
    { rankings },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
  )
}
