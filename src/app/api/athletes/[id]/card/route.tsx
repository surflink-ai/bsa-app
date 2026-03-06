import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const GRAPHQL_URL = 'https://liveheats.com/api/graphql'
const HEADERS = { 'Content-Type': 'application/json', 'Origin': 'https://liveheats.com', 'Referer': 'https://liveheats.com/' }
const BSA_SHORT_NAME = 'BarbadosSurfingAssociation'

const DIVISIONS: Record<string, string> = {
  '7747': 'Open Men', '7746': 'Open Women', '7741': 'U18 Boys', '7743': 'U18 Girls',
  '7740': 'U16 Boys', '16171': 'U16 Girls', '7739': 'U14 Boys', '16305': 'Longboard',
  '7744': 'Grand Masters', '16304': 'Novis',
}
const DIVISION_IDS = Object.keys(DIVISIONS)
const SERIES_ID = '27909' // 2025 SOTY

interface SeriesRank {
  athlete: { id: string; name: string; image: string | null }
  place: number
  points: number
  results: { place: number | null; points: number; dropped: boolean | null }[]
}

async function gql<T>(query: string): Promise<T> {
  const res = await fetch(GRAPHQL_URL, { method: 'POST', headers: HEADERS, body: JSON.stringify({ query }) })
  const json = await res.json()
  return json.data
}

async function getAthleteData(athleteId: string) {
  // Get org events
  const orgData = await gql<any>(`{
    organisationByShortName(shortName: "${BSA_SHORT_NAME}") {
      events { id name date status eventDivisions { id division { id name } status } }
    }
  }`)
  const events = orgData.organisationByShortName.events
  const pastEvents = events.filter((e: any) => e.status === 'results_published')

  let name = '', image: string | null = null
  let wins = 0, podiums = 0, totalEvents = 0
  const divSet = new Set<string>()
  let bestScore = 0

  // Fetch each event for this athlete's results
  const eventPromises = pastEvents.slice(0, 20).map((e: any) =>
    gql<any>(`{
      event(id: "${e.id}") {
        id name date
        eventDivisions {
          division { id name }
          ranking { place total competitor { athlete { id name image } } }
        }
      }
    }`).catch(() => null)
  )

  const eventResults = await Promise.all(eventPromises)

  for (const res of eventResults) {
    if (!res) continue
    const ev = res.event
    for (const d of ev.eventDivisions) {
      const rk = (d.ranking || []).find((r: any) => r.competitor.athlete.id === athleteId)
      if (!rk) continue
      if (!name) name = rk.competitor.athlete.name
      if (!image && rk.competitor.athlete.image) image = rk.competitor.athlete.image
      totalEvents++
      divSet.add(d.division.name)
      if (rk.place === 1) wins++
      if (rk.place <= 3) podiums++
      if (rk.total > bestScore) bestScore = rk.total
    }
  }

  // Get season ranking
  let seasonRank: number | null = null
  let seasonPoints: number | null = null
  let seasonDiv = ''

  for (const divId of DIVISION_IDS) {
    try {
      const rankData = await gql<any>(`{ series(id: "${SERIES_ID}") { rankings(divisionId: "${divId}") { athlete { id } place points } } }`)
      const rankings: SeriesRank[] = rankData.series?.rankings || []
      const myRank = rankings.find(r => r.athlete.id === athleteId)
      if (myRank) {
        seasonRank = myRank.place
        seasonPoints = myRank.points
        seasonDiv = DIVISIONS[divId]
        break
      }
    } catch { /* skip */ }
  }

  return { name, image, wins, podiums, totalEvents, divisions: [...divSet], bestScore, seasonRank, seasonPoints, seasonDiv }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const variant = searchParams.get('variant') || 'season' // season | result | minimal

  try {
    const data = await getAthleteData(id)
    if (!data.name) {
      return new Response('Athlete not found', { status: 404 })
    }

    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0A2540',
            fontFamily: 'sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background subtle pattern */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(135deg, #0A2540 0%, #0D2D4A 50%, #0A2540 100%)',
            display: 'flex',
          }} />

          {/* Teal accent line at top */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#2BA5A0', display: 'flex' }} />

          {/* Main content */}
          <div style={{ display: 'flex', flex: 1, padding: '48px 56px', position: 'relative', zIndex: 1 }}>
            {/* Left: Photo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 48 }}>
              <div style={{
                width: 200, height: 200, borderRadius: '50%', overflow: 'hidden',
                border: data.wins > 0 ? '4px solid #FFD700' : '4px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.04)',
              }}>
                {data.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.image} alt="" width={200} height={200} style={{ objectFit: 'cover' }} />
                ) : (
                  <div style={{ fontSize: 64, color: 'rgba(255,255,255,0.1)', fontWeight: 700, display: 'flex' }}>
                    {data.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
              </div>

              {/* Flag + division */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>BARBADOS</span>
              </div>
              {data.seasonDiv && (
                <div style={{
                  marginTop: 8, padding: '4px 14px', borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: 12, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em',
                  display: 'flex',
                }}>
                  {data.seasonDiv}
                </div>
              )}
            </div>

            {/* Right: Info */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
              {/* Name */}
              <div style={{ fontSize: 52, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1, marginBottom: 8, display: 'flex' }}>
                {data.name}
              </div>

              {/* Season rank badge */}
              {data.seasonRank && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{
                    padding: '6px 18px', borderRadius: 8,
                    backgroundColor: data.seasonRank === 1 ? 'rgba(255,215,0,0.15)' : 'rgba(43,165,160,0.15)',
                    border: `1px solid ${data.seasonRank === 1 ? 'rgba(255,215,0,0.3)' : 'rgba(43,165,160,0.3)'}`,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ fontSize: 28, fontWeight: 700, color: data.seasonRank === 1 ? '#FFD700' : '#2BA5A0' }}>#{data.seasonRank}</span>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>2025 Season</span>
                  </div>
                  {data.seasonPoints && (
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#2BA5A0', display: 'flex' }}>{data.seasonPoints.toLocaleString()} pts</span>
                  )}
                </div>
              )}

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 24 }}>
                {[
                  { value: data.totalEvents.toString(), label: 'Events', accent: '' },
                  { value: data.wins.toString(), label: 'Wins', accent: data.wins > 0 ? '#FFD700' : '' },
                  { value: data.podiums.toString(), label: 'Podiums', accent: data.podiums > 0 ? '#2BA5A0' : '' },
                  { value: data.bestScore > 0 ? data.bestScore.toFixed(2) : '—', label: 'Best Total', accent: '#1478B5' },
                ].map(stat => (
                  <div key={stat.label} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '16px 20px', borderRadius: 12,
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    minWidth: 90,
                  }}>
                    <span style={{ fontSize: 32, fontWeight: 700, color: stat.accent || '#FFFFFF', lineHeight: 1, display: 'flex' }}>{stat.value}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4, display: 'flex' }}>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 56px', borderTop: '1px solid rgba(255,255,255,0.06)',
            backgroundColor: 'rgba(0,0,0,0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', display: 'flex' }}>BSA</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', display: 'flex' }}>Barbados Surfing Association</span>
            </div>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', display: 'flex' }}>bsa.surf/athletes/{id}</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    )

    return imageResponse
  } catch (e: any) {
    return new Response(`Error generating card: ${e.message}`, { status: 500 })
  }
}
