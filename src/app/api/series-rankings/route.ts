import { NextResponse } from 'next/server'

const GRAPHQL_URL = 'https://liveheats.com/api/graphql'
const HEADERS = {
  'Content-Type': 'application/json',
  'Origin': 'https://liveheats.com',
  'Referer': 'https://liveheats.com/',
}

interface SeriesRank {
  athlete: { id: string; name: string; nationality: string | null; image: string | null }
  division: { id: string; name: string }
  place: number
  points: number
  results: { place: number | null; points: number; dropped: boolean | null }[]
}

async function getSeriesRankings(seriesId: string, divisionId: string): Promise<SeriesRank[]> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      query: `{ series(id: "${seriesId}") { rankings(divisionId: "${divisionId}") { athlete { id name nationality image } division { id name } place points results { place points dropped } } } }`,
    }),
    next: { revalidate: 300 },
  })
  const json = await res.json()
  if (json.errors) return []
  return json.data?.series?.rankings || []
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const seriesId = searchParams.get('seriesId') || '27909' // default to 2025
  const divisionId = searchParams.get('divisionId')

  if (!divisionId) {
    return NextResponse.json({ error: 'divisionId required' }, { status: 400 })
  }

  const rankings = await getSeriesRankings(seriesId, divisionId)
  return NextResponse.json({ rankings })
}
