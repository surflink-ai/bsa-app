import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const GRAPHQL_URL = 'https://liveheats.com/api/graphql'
const HEADERS = { 'Content-Type': 'application/json', 'Origin': 'https://liveheats.com', 'Referer': 'https://liveheats.com/' }
const SERIES_ID = '27909'

const DIVISIONS: Record<string, string> = {
  '7747': 'Open Men', '7746': 'Open Women', '7741': 'U18 Boys', '7743': 'U18 Girls',
  '7740': 'U16 Boys', '16171': 'U16 Girls', '7739': 'U14 Boys', '16305': 'Longboard',
  '7744': 'Grand Masters', '16304': 'Novis',
}

const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const divName = DIVISIONS[id] || `Division ${id}`

  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST', headers: HEADERS,
      body: JSON.stringify({
        query: `{ series(id: "${SERIES_ID}") { rankings(divisionId: "${id}") { athlete { id name image } place points } } }`,
      }),
    })
    const json = await res.json()
    const rankings = (json.data?.series?.rankings || []).slice(0, 5)
    if (rankings.length === 0) return new Response('No rankings', { status: 404 })

    const leader = rankings[0]

    return new ImageResponse(
      (
        <div style={{
          width: 1080, height: 1350, display: 'flex', flexDirection: 'column',
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(180deg, #050D1A 0%, #0A1628 30%, #0D1F35 60%, #0A1628 100%)',
          fontFamily: 'sans-serif',
        }}>
          {/* Orbs */}
          <div style={{
            position: 'absolute', top: -80, right: -60, width: 350, height: 350, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)',
            display: 'flex',
          }} />
          <div style={{
            position: 'absolute', bottom: 200, left: -100, width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(43,165,160,0.15) 0%, transparent 70%)',
            display: 'flex',
          }} />

          {/* Edge lines */}
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 2,
            background: 'linear-gradient(180deg, transparent 0%, #2BA5A040 20%, #2BA5A080 50%, #2BA5A040 80%, transparent 100%)',
            display: 'flex',
          }} />
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 2,
            background: 'linear-gradient(180deg, transparent 0%, #2BA5A040 20%, #2BA5A080 50%, #2BA5A040 80%, transparent 100%)',
            display: 'flex',
          }} />

          {/* Header */}
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
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex' }}>Rankings</span>
              </div>
            </div>
            <div style={{
              padding: '6px 16px', borderRadius: 20,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex',
            }}>
              TOP 5
            </div>
          </div>

          {/* Division title */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 48px 0', position: 'relative', zIndex: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#2BA5A0', letterSpacing: '0.3em', textTransform: 'uppercase', display: 'flex', marginBottom: 8 }}>LEADERBOARD</span>
            <span style={{ fontSize: 48, fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex' }}>{divName}</span>
          </div>

          {/* Rankings list */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '36px 40px 0', flex: 1, gap: 10, position: 'relative', zIndex: 2 }}>
            {rankings.map((r: any, i: number) => {
              const isTop3 = i < 3
              const color = isTop3 ? medalColors[i] : 'rgba(255,255,255,0.3)'
              const bgAlpha = isTop3 ? '0.06' : '0.02'

              return (
                <div key={r.athlete.id} style={{
                  display: 'flex', alignItems: 'center', padding: '18px 24px', borderRadius: 20,
                  background: `linear-gradient(135deg, rgba(255,255,255,${bgAlpha}) 0%, rgba(255,255,255,${Number(bgAlpha) / 2}) 100%)`,
                  border: `1px solid ${isTop3 ? color + '25' : 'rgba(255,255,255,0.04)'}`,
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* Subtle left accent */}
                  {isTop3 && (
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                      background: color, borderRadius: '20px 0 0 20px', display: 'flex',
                    }} />
                  )}

                  {/* Rank number */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isTop3 ? `${color}18` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isTop3 ? color + '30' : 'rgba(255,255,255,0.06)'}`,
                    marginRight: 18, flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color, display: 'flex' }}>{r.place}</span>
                  </div>

                  {/* Photo */}
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', marginRight: 18, flexShrink: 0,
                    background: 'rgba(255,255,255,0.04)', border: `2px solid ${isTop3 ? color + '30' : 'rgba(255,255,255,0.06)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {r.athlete.image ? (
                      <img src={r.athlete.image} alt="" width={52} height={52} style={{ objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.08)', fontWeight: 700, display: 'flex' }}>{r.athlete.name.split(' ').map((n: string) => n[0]).join('')}</span>
                    )}
                  </div>

                  {/* Name */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF', display: 'flex' }}>{r.athlete.name}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex' }}>BARBADOS</span>
                  </div>

                  {/* Points */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 26, fontWeight: 800, color: isTop3 ? color : '#2BA5A0', display: 'flex' }}>{r.points.toLocaleString()}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', display: 'flex' }}>PTS</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0 48px', paddingBottom: 40, marginTop: 'auto', position: 'relative', zIndex: 2,
          }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', display: 'flex' }}>BARBADOS SURFING ASSOCIATION</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', display: 'flex' }}>bsa.surf/rankings</span>
          </div>
        </div>
      ),
      { width: 1080, height: 1350 },
    )
  } catch (e: any) {
    return new Response(`Error: ${e.message}`, { status: 500 })
  }
}
