'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ScrollReveal } from '../components/ScrollReveal'
import { WaveDivider } from '../components/WaveDivider'

const TEAL = '#2BA5A0'
const NAVY = '#0A2540'
const medalEmoji = ['🥇', '🥈', '🥉']
const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']
const medalBg = ['rgba(255,215,0,0.08)', 'rgba(192,192,192,0.08)', 'rgba(205,127,50,0.08)']

interface DivResult { athleteId: string; name: string; place: number; total: number; waves: number[] }
interface Division { name: string; shortName: string; sortOrder: number; results: DivResult[] }
interface EventData {
  id: string; name: string; date: string; endDate: string | null; location: string
  season: { name: string; year: number } | null
  divisions: Division[]
}

function formatDate(d: string, end?: string | null) {
  const start = new Date(d + 'T12:00:00')
  const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
  if (end) {
    const e = new Date(end + 'T12:00:00')
    if (start.getMonth() === e.getMonth()) return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()}–${e.getDate()}, ${start.getFullYear()}`
    return `${start.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', opts)}`
  }
  return start.toLocaleDateString('en-US', opts)
}

export function ResultsIndexClient({ events }: { events: EventData[] }) {
  const [activeEventIdx, setActiveEventIdx] = useState(0)
  const [activeDivIdx, setActiveDivIdx] = useState(0)
  const event = events[activeEventIdx]
  const divisions = event?.divisions || []
  const activeDiv = divisions[activeDivIdx]

  return (
    <div className="pb-20 md:pb-0">
      {/* ── Hero — Navy ── */}
      <section style={{ backgroundColor: NAVY, padding: '120px 24px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: TEAL, marginBottom: 12 }}>COMPETITION RESULTS</div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#fff', marginBottom: 8 }}>
              Results & Standings
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>
              Full results from all BSA competitions · Heat-by-heat breakdowns · Season points
            </p>

            {/* Event selector */}
            {events.length > 1 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 24 }}>
                {events.map((e, i) => (
                  <button
                    key={e.id}
                    onClick={() => { setActiveEventIdx(i); setActiveDivIdx(0) }}
                    style={{
                      padding: '10px 18px', borderRadius: 10,
                      border: i === activeEventIdx ? `1px solid ${TEAL}` : '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                      background: i === activeEventIdx ? 'rgba(43,165,160,0.12)' : 'rgba(255,255,255,0.03)',
                      color: i === activeEventIdx ? '#fff' : 'rgba(255,255,255,0.5)',
                      fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600,
                    }}
                  >
                    <div>{e.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{formatDate(e.date)} · {e.location}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Event info (when single event) */}
            {events.length === 1 && event && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 16, color: 'rgba(255,255,255,0.8)' }}>{event.name}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{formatDate(event.date, event.endDate)} · {event.location}</div>
                {event.season && <div style={{ fontSize: 12, color: TEAL, fontWeight: 600, marginTop: 4 }}>{event.season.name}</div>}
              </div>
            )}

            {/* Division Tabs */}
            {divisions.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 28 }}>
                {divisions.map((d, i) => (
                  <button
                    key={d.name}
                    onClick={() => setActiveDivIdx(i)}
                    style={{
                      padding: '8px 16px', borderRadius: 20,
                      border: i === activeDivIdx ? `1px solid ${TEAL}` : '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      fontFamily: "'Space Grotesk', sans-serif",
                      background: i === activeDivIdx ? 'rgba(43,165,160,0.15)' : 'transparent',
                      color: i === activeDivIdx ? TEAL : 'rgba(255,255,255,0.5)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {d.shortName}
                  </button>
                ))}
              </div>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* ── Results — White ── */}
      <WaveDivider color="#FFFFFF" bg={NAVY} />
      <section style={{ backgroundColor: '#FFFFFF', padding: '64px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {activeDiv && activeDiv.results.length > 0 ? (
            <ScrollReveal key={`${activeEventIdx}-${activeDivIdx}`}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(10,37,64,0.3)', marginBottom: 8 }}>FINAL STANDINGS</div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, color: NAVY, marginBottom: 24 }}>
                🏆 {activeDiv.name}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activeDiv.results.map((r) => (
                  <Link key={r.athleteId} href={`/athletes/${r.athleteId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 18px', borderRadius: 12,
                      background: r.place <= 3 ? medalBg[r.place - 1] : 'rgba(10,37,64,0.02)',
                      border: r.place === 1 ? '2px solid rgba(255,215,0,0.3)' : '1px solid rgba(10,37,64,0.06)',
                    }}>
                      <span style={{ fontSize: r.place <= 3 ? 28 : 16, minWidth: 40, textAlign: 'center', fontWeight: 700, color: r.place <= 3 ? medalColors[r.place - 1] : 'rgba(10,37,64,0.4)' }}>
                        {r.place <= 3 ? medalEmoji[r.place - 1] : r.place}
                      </span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: NAVY }}>{r.name}</span>
                        {r.waves.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                            {r.waves.slice(0, 15).map((s, i) => {
                              const isTop = i < 2 // waves already sorted desc
                              return (
                                <span key={i} style={{
                                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                                  padding: '2px 7px', borderRadius: 8, fontWeight: 600,
                                  background: isTop ? 'rgba(43,165,160,0.12)' : 'rgba(10,37,64,0.05)',
                                  color: isTop ? TEAL : 'rgba(10,37,64,0.45)',
                                }}>
                                  {s.toFixed(1)}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: 20, color: r.place === 1 ? TEAL : NAVY }}>
                          {r.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Link to full heat-by-heat */}
              {event && (
                <div style={{ textAlign: 'center', marginTop: 32 }}>
                  <Link href={`/results/${event.id}`} style={{
                    display: 'inline-block', padding: '12px 28px', borderRadius: 10,
                    background: NAVY, color: '#fff',
                    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14,
                    textDecoration: 'none', transition: 'opacity 0.2s',
                  }}>
                    View Full Heat-by-Heat Breakdown →
                  </Link>
                </div>
              )}
            </ScrollReveal>
          ) : (
            <p style={{ textAlign: 'center', color: 'rgba(10,37,64,0.4)', padding: '2rem 0', fontSize: 14 }}>
              {events.length === 0 ? 'No completed events yet.' : 'No results for this division.'}
            </p>
          )}
        </div>
      </section>

      {/* ── All Division Winners — Navy ── */}
      {event && divisions.length > 1 && (
        <>
          <WaveDivider color={NAVY} bg="#FFFFFF" />
          <section style={{ backgroundColor: NAVY, padding: '64px 24px' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
              <ScrollReveal>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>ALL DIVISIONS</div>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 24 }}>
                  🏅 Division Champions
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {divisions.map((div) => {
                    const winner = div.results.find(r => r.place === 1)
                    const podium = div.results.filter(r => r.place <= 3)
                    return (
                      <div key={div.name} style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 12, padding: '16px 20px',
                      }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{div.name}</div>
                        {podium.map((r) => (
                          <Link key={r.athleteId} href={`/athletes/${r.athleteId}`} style={{ textDecoration: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                              <span style={{ fontSize: r.place <= 3 ? 18 : 12 }}>{r.place <= 3 ? medalEmoji[r.place - 1] : r.place}</span>
                              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: r.place === 1 ? 700 : 500, color: r.place === 1 ? '#fff' : 'rgba(255,255,255,0.6)', flex: 1 }}>{r.name}</span>
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: r.place === 1 ? TEAL : 'rgba(255,255,255,0.4)' }}>{r.total.toFixed(2)}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </ScrollReveal>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
