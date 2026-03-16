'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ScrollReveal } from '../../components/ScrollReveal'
import { WaveDivider } from '../../components/WaveDivider'

interface Finalist { place: number; athleteId: string; name: string; total: number; waveScores: number[] }
interface HeatAthlete { athleteId: string; name: string; jerseyColor: string | null; resultPosition: number | null; totalScore: number | null; advanced: boolean; waveScores: number[] }
interface Heat { id: string; heatNumber: number; athletes: HeatAthlete[] }
interface Round { id: string; name: string; roundNumber: number; heats: Heat[] }
interface Division { id: string; name: string; shortName: string; sortOrder: number; finals: Finalist[]; rounds: Round[] }
interface SeasonPoint { athleteId: string; name: string; divisionId: string; totalPoints: number; bestResult: number | null }

const medalEmoji = ['🥇', '🥈', '🥉']
const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']
const medalBg = ['rgba(255,215,0,0.08)', 'rgba(192,192,192,0.08)', 'rgba(205,127,50,0.08)']
const medalBgDark = ['rgba(255,215,0,0.12)', 'rgba(192,192,192,0.08)', 'rgba(205,127,50,0.1)']
const TEAL = '#2BA5A0'
const NAVY = '#0A2540'
const jerseyColors: Record<string, string> = {
  red: '#ef4444', white: '#e5e7eb', green: '#22c55e', blue: '#3b82f6', black: '#374151',
}

export function ResultsClient({ event, season, divisions, seasonPoints }: {
  event: { name: string; date: string; endDate: string | null; location: string; status: string }
  season: { name: string; year: number; points: Record<string, number> } | null
  divisions: Division[]
  seasonPoints: SeasonPoint[]
}) {
  const [activeDivIdx, setActiveDivIdx] = useState(0)
  const [expandedRounds, setExpandedRounds] = useState<Record<string, boolean>>({})
  const activeDiv = divisions[activeDivIdx]

  const toggleRound = (roundId: string) => {
    setExpandedRounds(prev => ({ ...prev, [roundId]: !prev[roundId] }))
  }

  const formatDate = (d: string, end?: string | null) => {
    const start = new Date(d + 'T12:00:00')
    const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
    if (end) {
      const e = new Date(end + 'T12:00:00')
      if (start.getMonth() === e.getMonth()) {
        return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()}–${e.getDate()}, ${start.getFullYear()}`
      }
      return `${start.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', opts)}`
    }
    return start.toLocaleDateString('en-US', opts)
  }

  return (
    <div className="pb-20 md:pb-0">
      {/* ── Hero — Navy ── */}
      <section style={{ backgroundColor: NAVY, padding: '120px 24px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <ScrollReveal>
            <Link href="/events" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', letterSpacing: '0.08em' }}>← EVENTS</Link>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: TEAL, marginTop: 20, marginBottom: 12 }}>COMPETITION RESULTS</div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#fff', marginBottom: 8 }}>
              {event.name}
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>
              {formatDate(event.date, event.endDate)} · {event.location}
            </p>
            {season && (
              <p style={{ fontSize: 13, color: TEAL, fontWeight: 600, marginTop: 4 }}>{season.name}</p>
            )}

            {/* Division Tabs */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 28 }}>
              {divisions.map((d, i) => (
                <button
                  key={d.id}
                  onClick={() => { setActiveDivIdx(i); setExpandedRounds({}) }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    border: i === activeDivIdx ? `1px solid ${TEAL}` : '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
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
          </ScrollReveal>
        </div>
      </section>

      {activeDiv && (
        <>
          {/* ── Final Standings — White ── */}
          <WaveDivider color="#FFFFFF" bg={NAVY} />
          <section style={{ backgroundColor: '#FFFFFF', padding: '64px 24px' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
              <ScrollReveal>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(10,37,64,0.3)', marginBottom: 8 }}>FINAL RESULTS</div>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, color: NAVY, marginBottom: 20 }}>
                  🏆 {activeDiv.name}
                </h2>

                {activeDiv.finals.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {activeDiv.finals.map((f) => (
                      <Link key={f.athleteId} href={`/athletes/${f.athleteId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 14,
                          padding: '14px 18px', borderRadius: 12,
                          background: f.place <= 3 ? medalBg[f.place - 1] : 'rgba(10,37,64,0.02)',
                          border: f.place === 1 ? '2px solid rgba(255,215,0,0.3)' : '1px solid rgba(10,37,64,0.06)',
                        }}>
                          <span style={{ fontSize: f.place <= 3 ? 28 : 16, minWidth: 40, textAlign: 'center', fontWeight: 700, color: f.place <= 3 ? medalColors[f.place - 1] : 'rgba(10,37,64,0.4)' }}>
                            {f.place <= 3 ? medalEmoji[f.place - 1] : f.place}
                          </span>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: NAVY }}>{f.name}</span>
                            {f.waveScores.length > 0 && (
                              <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                                {f.waveScores.slice(0, 15).map((s, i) => {
                                  const sorted = [...f.waveScores].sort((a, b) => b - a)
                                  const isTop = s >= sorted[1]
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
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: 20, color: f.place === 1 ? TEAL : NAVY }}>
                              {f.total.toFixed(2)}
                            </span>
                            {season && season.points[String(f.place)] && (
                              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: TEAL, fontWeight: 600, marginTop: 2 }}>+{season.points[String(f.place)]} pts</div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'rgba(10,37,64,0.4)', fontSize: 14 }}>No final results available.</p>
                )}
              </ScrollReveal>
            </div>
          </section>

          {/* ── Heat Breakdown — Navy ── */}
          <WaveDivider color={NAVY} bg="#FFFFFF" />
          <section style={{ backgroundColor: NAVY, padding: '64px 24px' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
              <ScrollReveal>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>HEAT-BY-HEAT</div>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 20 }}>
                  📊 {activeDiv.name} — All Rounds
                </h2>

                {[...activeDiv.rounds].reverse().map((round) => {
                  const isExpanded = expandedRounds[round.id] ?? (round.name.toLowerCase().includes('final') && !round.name.toLowerCase().includes('semi') && !round.name.toLowerCase().includes('quarter'))
                  return (
                    <div key={round.id} style={{ marginBottom: 12 }}>
                      <button
                        onClick={() => toggleRound(round.id)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          width: '100%', padding: '12px 18px', borderRadius: 10,
                          border: '1px solid rgba(255,255,255,0.08)',
                          background: isExpanded ? 'rgba(43,165,160,0.08)' : 'rgba(255,255,255,0.03)',
                          cursor: 'pointer',
                          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14,
                          color: isExpanded ? TEAL : 'rgba(255,255,255,0.7)',
                          transition: 'all 0.2s',
                        }}
                      >
                        <span>{round.name} ({round.heats.length} heat{round.heats.length !== 1 ? 's' : ''})</span>
                        <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', fontSize: 12 }}>▼</span>
                      </button>
                      {isExpanded && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10, paddingLeft: 4 }}>
                          {round.heats.map(heat => (
                            <div key={heat.id} style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                              <div style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.04)', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.05em' }}>
                                HEAT {heat.heatNumber}
                              </div>
                              {heat.athletes.map((a, ai) => (
                                <Link key={a.athleteId} href={`/athletes/${a.athleteId}`} style={{ textDecoration: 'none' }}>
                                  <div style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '10px 14px',
                                    borderTop: ai > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                    background: a.advanced ? 'rgba(43,165,160,0.06)' : 'transparent',
                                  }}>
                                    {/* Position */}
                                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, color: a.resultPosition === 1 ? TEAL : 'rgba(255,255,255,0.4)', minWidth: 20, textAlign: 'center' }}>
                                      {a.resultPosition || '—'}
                                    </span>
                                    {/* Jersey */}
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: jerseyColors[a.jerseyColor || ''] || 'rgba(255,255,255,0.15)', flexShrink: 0, border: a.jerseyColor === 'white' ? '1px solid rgba(255,255,255,0.3)' : 'none' }} />
                                    {/* Name + waves */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: a.advanced ? '#fff' : 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {a.name}
                                        {a.advanced && <span style={{ fontSize: 10, color: TEAL, marginLeft: 6, fontWeight: 400 }}>ADV</span>}
                                      </div>
                                      {a.waveScores.length > 0 && (
                                        <div style={{ display: 'flex', gap: 3, marginTop: 3, flexWrap: 'wrap' }}>
                                          {a.waveScores.map((s, wi) => {
                                            const sorted = [...a.waveScores].sort((x, y) => y - x)
                                            const isTop = s >= sorted[1]
                                            return (
                                              <span key={wi} style={{
                                                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                                                padding: '1px 5px', borderRadius: 6, fontWeight: 600,
                                                background: isTop ? 'rgba(43,165,160,0.15)' : 'rgba(255,255,255,0.05)',
                                                color: isTop ? TEAL : 'rgba(255,255,255,0.35)',
                                              }}>
                                                {s.toFixed(1)}
                                              </span>
                                            )
                                          })}
                                        </div>
                                      )}
                                    </div>
                                    {/* Total */}
                                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 15, color: a.resultPosition === 1 ? TEAL : '#fff', minWidth: 45, textAlign: 'right' }}>
                                      {a.totalScore?.toFixed(2) || '0.00'}
                                    </span>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </ScrollReveal>
            </div>
          </section>

          {/* ── Season Points — White ── */}
          {seasonPoints.length > 0 && (
            <>
              <WaveDivider color="#FFFFFF" bg={NAVY} />
              <section style={{ backgroundColor: '#FFFFFF', padding: '64px 24px' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                  <ScrollReveal>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(10,37,64,0.3)', marginBottom: 8 }}>SEASON STANDINGS</div>
                    <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: NAVY, marginBottom: 20 }}>
                      {season?.name || 'Season Points'} — {activeDiv.name}
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {seasonPoints
                        .filter(sp => sp.divisionId === activeDiv.id)
                        .sort((a, b) => b.totalPoints - a.totalPoints)
                        .map((sp, i) => (
                          <Link key={sp.athleteId} href={`/athletes/${sp.athleteId}`} style={{ textDecoration: 'none' }}>
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: 12,
                              padding: '10px 16px', borderRadius: 10,
                              background: i < 3 ? medalBg[i] : 'rgba(10,37,64,0.02)',
                              border: `1px solid ${i < 3 ? 'rgba(10,37,64,0.08)' : 'rgba(10,37,64,0.04)'}`,
                            }}>
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, color: i < 3 ? medalColors[i] : 'rgba(10,37,64,0.4)', minWidth: 24 }}>
                                {i < 3 ? medalEmoji[i] : i + 1}
                              </span>
                              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: NAVY, flex: 1 }}>{sp.name}</span>
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, color: TEAL }}>{sp.totalPoints} pts</span>
                            </div>
                          </Link>
                        ))}
                    </div>
                  </ScrollReveal>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  )
}
