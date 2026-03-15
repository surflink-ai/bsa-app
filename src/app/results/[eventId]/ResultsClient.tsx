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
const TEAL = '#2BA5A0'
const NAVY = '#0A2540'

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
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '6rem 1rem 4rem' }}>
      {/* Header */}
      <ScrollReveal>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/events" style={{ color: TEAL, fontSize: 14, textDecoration: 'none' }}>← Back to Events</Link>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, color: NAVY, margin: '0.5rem 0 0.25rem', fontFamily: 'Space Grotesk, sans-serif' }}>
            {event.name}
          </h1>
          <p style={{ color: 'rgba(10,37,64,0.5)', fontSize: 14, margin: 0 }}>
            {formatDate(event.date, event.endDate)} · {event.location}
          </p>
          {season && (
            <p style={{ color: TEAL, fontSize: 13, margin: '0.25rem 0 0', fontWeight: 600 }}>
              {season.name}
            </p>
          )}
        </div>
      </ScrollReveal>

      {/* Division Tabs */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1.5rem' }}>
        {divisions.map((d, i) => (
          <button
            key={d.id}
            onClick={() => { setActiveDivIdx(i); setExpandedRounds({}) }}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'Space Grotesk, sans-serif',
              background: i === activeDivIdx ? NAVY : 'rgba(10,37,64,0.06)',
              color: i === activeDivIdx ? '#fff' : 'rgba(10,37,64,0.6)',
              transition: 'all 0.2s',
            }}
          >
            {d.shortName}
          </button>
        ))}
      </div>

      <WaveDivider />

      {activeDiv && (
        <>
          {/* Final Standings */}
          {activeDiv.finals.length > 0 && (
            <ScrollReveal>
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: NAVY, margin: '1.5rem 0 1rem', fontFamily: 'Space Grotesk, sans-serif' }}>
                  🏆 {activeDiv.name} — Final Results
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activeDiv.finals.map((f) => (
                    <Link
                      key={f.athleteId}
                      href={`/athletes/${f.athleteId}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '12px 16px',
                          borderRadius: 12,
                          background: f.place <= 3 ? medalBg[f.place - 1] : 'rgba(10,37,64,0.03)',
                          border: f.place === 1 ? '2px solid rgba(255,215,0,0.3)' : '1px solid rgba(10,37,64,0.06)',
                          transition: 'transform 0.15s',
                        }}
                      >
                        <span style={{
                          fontSize: f.place <= 3 ? 24 : 16,
                          minWidth: 36,
                          textAlign: 'center',
                          fontWeight: 700,
                          color: f.place <= 3 ? medalColors[f.place - 1] : 'rgba(10,37,64,0.4)',
                        }}>
                          {f.place <= 3 ? medalEmoji[f.place - 1] : f.place}
                        </span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 700, fontSize: 15, color: NAVY }}>{f.name}</span>
                          {f.waveScores.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                              {f.waveScores.slice(0, 15).map((s, i) => {
                                const sorted = [...f.waveScores].sort((a, b) => b - a)
                                const isTop = s >= sorted[1] // Top 2 counting waves
                                return (
                                  <span key={i} style={{
                                    fontSize: 11,
                                    padding: '2px 6px',
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    fontFamily: 'JetBrains Mono, monospace',
                                    background: isTop ? 'rgba(43,165,160,0.12)' : 'rgba(10,37,64,0.05)',
                                    color: isTop ? TEAL : 'rgba(10,37,64,0.5)',
                                  }}>
                                    {s.toFixed(1)}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontWeight: 800,
                            fontSize: 18,
                            color: f.place === 1 ? TEAL : NAVY,
                          }}>
                            {f.total.toFixed(2)}
                          </span>
                          {season && season.points[String(f.place)] && (
                            <div style={{ fontSize: 11, color: TEAL, fontWeight: 600, marginTop: 2 }}>
                              +{season.points[String(f.place)]} pts
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* Heat-by-Heat Breakdown */}
          <ScrollReveal>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: NAVY, margin: '1.5rem 0 1rem', fontFamily: 'Space Grotesk, sans-serif' }}>
                📊 Heat-by-Heat Breakdown
              </h2>
              {[...activeDiv.rounds].reverse().map((round) => {
                const isExpanded = expandedRounds[round.id] ?? (round.name.toLowerCase().includes('final') && !round.name.toLowerCase().includes('semi'))
                return (
                  <div key={round.id} style={{ marginBottom: 12 }}>
                    <button
                      onClick={() => toggleRound(round.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '10px 16px',
                        borderRadius: 10,
                        border: '1px solid rgba(10,37,64,0.08)',
                        background: isExpanded ? 'rgba(43,165,160,0.06)' : 'rgba(10,37,64,0.02)',
                        cursor: 'pointer',
                        fontFamily: 'Space Grotesk, sans-serif',
                        fontWeight: 700,
                        fontSize: 14,
                        color: NAVY,
                        transition: 'all 0.2s',
                      }}
                    >
                      <span>{round.name} ({round.heats.length} heat{round.heats.length !== 1 ? 's' : ''})</span>
                      <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', fontSize: 12 }}>▼</span>
                    </button>
                    {isExpanded && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, paddingLeft: 8 }}>
                        {round.heats.map(heat => (
                          <div key={heat.id} style={{
                            borderRadius: 10,
                            border: '1px solid rgba(10,37,64,0.06)',
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              padding: '8px 14px',
                              background: 'rgba(10,37,64,0.03)',
                              fontSize: 12,
                              fontWeight: 700,
                              color: 'rgba(10,37,64,0.5)',
                              fontFamily: 'Space Grotesk, sans-serif',
                              borderBottom: '1px solid rgba(10,37,64,0.06)',
                            }}>
                              Heat {heat.heatNumber + 1}
                            </div>
                            <div>
                              {heat.athletes.map((a, i) => {
                                const jerseyColors: Record<string, string> = {
                                  red: '#DC2626', white: '#E5E7EB', green: '#16A34A',
                                  blue: '#2563EB', black: '#1F2937', yellow: '#EAB308', pink: '#EC4899',
                                }
                                return (
                                  <Link
                                    key={a.athleteId + i}
                                    href={`/athletes/${a.athleteId}`}
                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                  >
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      padding: '8px 14px',
                                      borderBottom: i < heat.athletes.length - 1 ? '1px solid rgba(10,37,64,0.04)' : 'none',
                                      background: a.advanced ? 'rgba(43,165,160,0.04)' : 'transparent',
                                    }}>
                                      <span style={{
                                        minWidth: 22,
                                        fontSize: 13,
                                        fontWeight: 700,
                                        color: a.resultPosition && a.resultPosition <= 2 ? TEAL : 'rgba(10,37,64,0.4)',
                                        fontFamily: 'JetBrains Mono, monospace',
                                      }}>
                                        {a.resultPosition || '–'}
                                      </span>
                                      {a.jerseyColor && (
                                        <span style={{
                                          width: 10, height: 10, borderRadius: '50%',
                                          background: jerseyColors[a.jerseyColor] || a.jerseyColor,
                                          border: a.jerseyColor === 'white' ? '1px solid rgba(10,37,64,0.2)' : 'none',
                                          flexShrink: 0,
                                        }} />
                                      )}
                                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: NAVY }}>
                                        {a.name}
                                        {a.advanced && <span style={{ color: TEAL, fontSize: 10, marginLeft: 4 }}>▶</span>}
                                      </span>
                                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '40%' }}>
                                        {a.waveScores.slice(0, 15).map((s, wi) => {
                                          const sorted = [...a.waveScores].sort((x, y) => y - x)
                                          const isTop = sorted.length >= 2 && s >= sorted[1]
                                          return (
                                            <span key={wi} style={{
                                              fontSize: 10,
                                              padding: '1px 4px',
                                              borderRadius: 6,
                                              fontFamily: 'JetBrains Mono, monospace',
                                              fontWeight: 600,
                                              background: isTop ? 'rgba(43,165,160,0.12)' : 'rgba(10,37,64,0.04)',
                                              color: isTop ? TEAL : 'rgba(10,37,64,0.45)',
                                            }}>
                                              {s.toFixed(1)}
                                            </span>
                                          )
                                        })}
                                      </div>
                                      <span style={{
                                        minWidth: 44,
                                        textAlign: 'right',
                                        fontFamily: 'JetBrains Mono, monospace',
                                        fontWeight: 700,
                                        fontSize: 14,
                                        color: a.resultPosition === 1 ? TEAL : NAVY,
                                      }}>
                                        {a.totalScore?.toFixed(2) || '–'}
                                      </span>
                                    </div>
                                  </Link>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollReveal>
        </>
      )}
    </div>
  )
}
