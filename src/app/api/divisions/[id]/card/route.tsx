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

    return new ImageResponse(
      (
        <div style={{
          width: 1200, height: 630, display: 'flex', flexDirection: 'column',
          backgroundColor: '#0A2540', fontFamily: 'sans-serif', position: 'relative', overflow: 'hidden',
        }}>
          {/* Teal accent */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#2BA5A0', display: 'flex' }} />

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '40px 56px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, color: '#2BA5A0', textTransform: 'uppercase', letterSpacing: '0.2em', display: 'flex' }}>2025 Season Rankings</span>
              <span style={{ fontSize: 44, fontWeight: 700, color: '#FFFFFF', display: 'flex' }}>{divName}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', display: 'flex' }}>BSA</span>
            </div>
          </div>

          {/* Rankings list */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '0 56px', flex: 1, gap: 8 }}>
            {rankings.map((r: any, i: number) => (
              <div key={r.athlete.id} style={{
                display: 'flex', alignItems: 'center', padding: '14px 20px', borderRadius: 12,
                backgroundColor: i < 3 ? `${medalColors[i]}10` : 'rgba(255,255,255,0.03)',
                border: i < 3 ? `1px solid ${medalColors[i]}30` : '1px solid rgba(255,255,255,0.04)',
              }}>
                {/* Rank */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: i < 3 ? medalColors[i] : 'rgba(255,255,255,0.06)',
                  marginRight: 16, flexShrink: 0,
                }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: i < 3 ? '#0A2540' : 'rgba(255,255,255,0.3)', display: 'flex' }}>{r.place}</span>
                </div>

                {/* Photo */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', marginRight: 16, flexShrink: 0,
                  backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {r.athlete.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.athlete.image} alt="" width={44} height={44} style={{ objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.1)', fontWeight: 700, display: 'flex' }}>{r.athlete.name.split(' ').map((n: string) => n[0]).join('')}</span>
                  )}
                </div>

                {/* Name */}
                <span style={{ flex: 1, fontSize: 22, fontWeight: 600, color: '#FFFFFF', display: 'flex' }}>{r.athlete.name}</span>

                {/* Points */}
                <span style={{ fontSize: 22, fontWeight: 700, color: '#2BA5A0', display: 'flex' }}>{r.points.toLocaleString()} pts</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 56px', borderTop: '1px solid rgba(255,255,255,0.06)',
            backgroundColor: 'rgba(0,0,0,0.15)',
          }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', display: 'flex' }}>Barbados Surfing Association</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', display: 'flex' }}>bsa.surf/rankings</span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 },
    )
  } catch (e: any) {
    return new Response(`Error: ${e.message}`, { status: 500 })
  }
}
