import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const GRAPHQL_URL = 'https://liveheats.com/api/graphql'
const HEADERS = { 'Content-Type': 'application/json', 'Origin': 'https://liveheats.com', 'Referer': 'https://liveheats.com/' }
const SERIES_ID = '27909'

const DIVISION_MAP: Record<string, string> = {
  '7747': 'Open Men', '7746': 'Open Women', '7741': 'U18 Boys', '7743': 'U18 Girls',
  '7740': 'U16 Boys', '16171': 'U16 Girls', '7739': 'U14 Boys', '16305': 'Longboard',
  '7744': 'Grand Masters', '16304': 'Novis',
}

async function gql<T>(query: string): Promise<T> {
  const res = await fetch(GRAPHQL_URL, { method: 'POST', headers: HEADERS, body: JSON.stringify({ query }) })
  return (await res.json()).data
}

async function getAthleteCard(athleteId: string) {
  const divIds = Object.keys(DIVISION_MAP)
  const rankPromises = divIds.map(divId =>
    gql<any>(`{ series(id: "${SERIES_ID}") { rankings(divisionId: "${divId}") { athlete { id name image } place points results { place points dropped } } } }`)
      .then(d => ({ divId, rankings: d.series?.rankings || [] }))
      .catch(() => ({ divId, rankings: [] }))
  )
  const allRanks = await Promise.all(rankPromises)

  let name = '', image: string | null = null
  let seasonRank: number | null = null, seasonPoints: number | null = null, seasonDiv = ''
  let wins = 0, podiums = 0, eventsScored = 0
  const eventPlaces: number[] = []

  for (const { divId, rankings } of allRanks) {
    const myRank = rankings.find((r: any) => r.athlete.id === athleteId)
    if (myRank) {
      if (!name) name = myRank.athlete.name
      if (!image && myRank.athlete.image) image = myRank.athlete.image
      if (!seasonRank) {
        seasonRank = myRank.place
        seasonPoints = myRank.points
        seasonDiv = DIVISION_MAP[divId]
      }
      for (const r of myRank.results || []) {
        if (r.place !== null) {
          eventsScored++
          eventPlaces.push(r.place)
          if (r.place === 1) wins++
          if (r.place <= 3) podiums++
        }
      }
    }
  }

  // Find total field size for percentile
  let fieldSize = 0
  if (seasonRank) {
    for (const { rankings } of allRanks) {
      const myRank = rankings.find((r: any) => r.athlete.id === athleteId)
      if (myRank) { fieldSize = rankings.length; break }
    }
  }

  return { name, image, seasonRank, seasonPoints, seasonDiv, wins, podiums, eventsScored, eventPlaces, fieldSize }
}

// Rank-based accent colors
function getAccent(rank: number | null) {
  if (rank === 1) return { primary: '#FFD700', glow: 'rgba(255,215,0,0.4)', gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF6B35 100%)' }
  if (rank === 2) return { primary: '#C0C0C0', glow: 'rgba(192,192,192,0.3)', gradient: 'linear-gradient(135deg, #E8E8E8 0%, #C0C0C0 50%, #A0A0A0 100%)' }
  if (rank === 3) return { primary: '#CD7F32', glow: 'rgba(205,127,50,0.3)', gradient: 'linear-gradient(135deg, #CD7F32 0%, #B8860B 50%, #8B6914 100%)' }
  return { primary: '#2BA5A0', glow: 'rgba(43,165,160,0.3)', gradient: 'linear-gradient(135deg, #2BA5A0 0%, #1478B5 50%, #0A2540 100%)' }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const data = await getAthleteCard(id)
    if (!data.name) return new Response('Athlete not found', { status: 404 })

    const accent = getAccent(data.seasonRank)
    const firstName = data.name.split(' ')[0]
    const lastName = data.name.split(' ').slice(1).join(' ')
    const percentile = data.fieldSize > 0 && data.seasonRank ? Math.round(((data.fieldSize - data.seasonRank) / data.fieldSize) * 100) : null

    return new ImageResponse(
      (
        <div style={{
          width: 1080, height: 1350, display: 'flex', flexDirection: 'column',
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(180deg, #050D1A 0%, #0A1628 30%, #0D1F35 60%, #0A1628 100%)',
          fontFamily: 'sans-serif',
        }}>

          {/* === HOLOGRAPHIC BACKGROUND EFFECTS === */}
          {/* Top-right orb */}
          <div style={{
            position: 'absolute', top: -120, right: -80, width: 400, height: 400, borderRadius: '50%',
            background: `radial-gradient(circle, ${accent.glow} 0%, transparent 70%)`,
            display: 'flex', opacity: 0.6,
          }} />
          {/* Bottom-left orb */}
          <div style={{
            position: 'absolute', bottom: 100, left: -100, width: 350, height: 350, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(20,120,181,0.25) 0%, transparent 70%)',
            display: 'flex', opacity: 0.5,
          }} />
          {/* Diagonal holographic stripe */}
          <div style={{
            position: 'absolute', top: 200, left: -200, width: 1500, height: 2,
            background: `linear-gradient(90deg, transparent 0%, ${accent.primary}40 30%, ${accent.primary}80 50%, ${accent.primary}40 70%, transparent 100%)`,
            transform: 'rotate(-20deg)', display: 'flex',
          }} />
          <div style={{
            position: 'absolute', top: 210, left: -200, width: 1500, height: 1,
            background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 70%, transparent 100%)`,
            transform: 'rotate(-20deg)', display: 'flex',
          }} />

          {/* === TOP SECTION: BSA BADGE === */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '48px 48px 0', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', display: 'flex' }}>BSA</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'flex' }}>2025 SEASON</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex' }}>Surfer of the Year</span>
              </div>
            </div>
            {data.seasonDiv && (
              <div style={{
                padding: '6px 16px', borderRadius: 20,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex',
              }}>
                {data.seasonDiv}
              </div>
            )}
          </div>

          {/* === PHOTO SECTION === */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '36px 0 0', position: 'relative', zIndex: 2 }}>
            {/* Glow ring behind photo */}
            <div style={{
              position: 'absolute', top: 16, width: 300, height: 300, borderRadius: '50%',
              background: `radial-gradient(circle, ${accent.glow} 0%, transparent 70%)`,
              display: 'flex',
            }} />
            {/* Photo container with holographic border */}
            <div style={{
              width: 260, height: 260, borderRadius: '50%', position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {/* Outer ring */}
              <div style={{
                position: 'absolute', inset: -4, borderRadius: '50%',
                background: accent.gradient,
                display: 'flex',
              }} />
              {/* Inner ring (gap) */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: '#0A1628',
                display: 'flex',
              }} />
              {/* Inner glow ring */}
              <div style={{
                position: 'absolute', inset: 3, borderRadius: '50%',
                border: `1px solid ${accent.primary}30`,
                display: 'flex',
              }} />
              {/* Photo */}
              <div style={{
                width: 244, height: 244, borderRadius: '50%', overflow: 'hidden',
                position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
              }}>
                {data.image ? (
                  <img src={data.image} alt="" width={244} height={244} style={{ objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 72, fontWeight: 800, color: 'rgba(255,255,255,0.06)', display: 'flex' }}>
                    {data.name.split(' ').map(n => n[0]).join('')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* === NAME + RANK === */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 48px 0', position: 'relative', zIndex: 2 }}>
            {/* Rank badge */}
            {data.seasonRank && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                padding: '6px 20px', borderRadius: 20,
                background: `${accent.primary}15`,
                border: `1px solid ${accent.primary}30`,
              }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: accent.primary, display: 'flex' }}>#{data.seasonRank}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500, display: 'flex' }}>RANKED</span>
              </div>
            )}
            {/* Name */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
              <span style={{ fontSize: 28, fontWeight: 400, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'flex' }}>{firstName}</span>
              <span style={{ fontSize: 56, fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', marginTop: 2 }}>{lastName}</span>
            </div>
            {/* Points */}
            {data.seasonPoints !== null && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 14 }}>
                <span style={{ fontSize: 40, fontWeight: 800, color: accent.primary, display: 'flex' }}>{data.seasonPoints!.toLocaleString()}</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'flex' }}>PTS</span>
              </div>
            )}
          </div>

          {/* === GLASS STATS PANEL === */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 40px 0', position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'flex', width: '100%', maxWidth: 960,
              borderRadius: 24, overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              {[
                { value: data.eventsScored.toString(), label: 'EVENTS', color: '#fff' },
                { value: data.wins.toString(), label: 'WINS', color: data.wins > 0 ? '#FFD700' : '#fff' },
                { value: data.podiums.toString(), label: 'PODIUMS', color: data.podiums > 0 ? '#2BA5A0' : '#fff' },
                { value: percentile ? `${percentile}%` : '—', label: 'TOP %', color: '#1478B5' },
              ].map((stat, i) => (
                <div key={stat.label} style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '24px 12px',
                  borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: stat.color, lineHeight: 1, display: 'flex' }}>{stat.value}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em', marginTop: 8, display: 'flex' }}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* === EVENT FORM DOTS === */}
          {data.eventPlaces.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 48px 0', position: 'relative', zIndex: 2 }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em', marginBottom: 10, display: 'flex' }}>SEASON FORM</span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                {data.eventPlaces.map((place, i) => {
                  const height = Math.max(60 - (place - 1) * 12, 12)
                  const color = place === 1 ? '#FFD700' : place <= 3 ? '#2BA5A0' : 'rgba(255,255,255,0.15)'
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color, display: 'flex' }}>
                        {place <= 3 ? `${place}` : ''}
                      </span>
                      <div style={{
                        width: 40, height, borderRadius: 8,
                        background: place === 1
                          ? 'linear-gradient(180deg, #FFD700 0%, #FFA500 100%)'
                          : place <= 3
                            ? 'linear-gradient(180deg, #2BA5A0 0%, #1478B5 100%)'
                            : 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)',
                        border: `1px solid ${place <= 3 ? color + '40' : 'rgba(255,255,255,0.06)'}`,
                        display: 'flex',
                      }} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* === BOTTOM BAR === */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0 48px', marginTop: 'auto', paddingBottom: 40, position: 'relative', zIndex: 2,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', display: 'flex' }}>BARBADOS SURFING ASSOCIATION</span>
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', display: 'flex' }}>bsa.surf</span>
          </div>

          {/* === EDGE HOLOGRAPHIC LINE === */}
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 2,
            background: `linear-gradient(180deg, transparent 0%, ${accent.primary}40 20%, ${accent.primary}80 50%, ${accent.primary}40 80%, transparent 100%)`,
            display: 'flex',
          }} />
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 2,
            background: `linear-gradient(180deg, transparent 0%, ${accent.primary}40 20%, ${accent.primary}80 50%, ${accent.primary}40 80%, transparent 100%)`,
            display: 'flex',
          }} />
        </div>
      ),
      { width: 1080, height: 1350 },
    )
  } catch (e: any) {
    return new Response(`Error: ${e.message}`, { status: 500 })
  }
}
