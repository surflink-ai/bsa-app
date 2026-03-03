'use client'
import { useState, useEffect } from 'react'
import { ScrollReveal } from '../components/ScrollReveal'
import { WaveDivider } from '../components/WaveDivider'

interface Season { id: string; name: string; year: number }
interface Division { id: string; name: string; short_name: string }
interface RankingEntry {
  athlete_name: string; division: string; division_id: string
  points: number; events: number
  results: { event: string; position: number; points: number }[]
}

export function RankingsClient({ seasons, divisions }: { seasons: Season[]; divisions: Division[] }) {
  const [seasonIdx, setSeasonIdx] = useState(0)
  const [divisionId, setDivisionId] = useState<string | null>(null)
  const [rankings, setRankings] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedAthlete, setExpandedAthlete] = useState<string | null>(null)

  const currentSeason = seasons[seasonIdx]

  useEffect(() => {
    if (!currentSeason) { setLoading(false); return }
    setLoading(true)
    const params = new URLSearchParams({ season: currentSeason.id })
    if (divisionId) params.set('division', divisionId)
    fetch(`/api/rankings?${params}`).then(r => r.json()).then(d => {
      setRankings(d.rankings || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [currentSeason, divisionId])

  // Group by division
  const grouped: Record<string, RankingEntry[]> = {}
  rankings.forEach(r => {
    if (!grouped[r.division]) grouped[r.division] = []
    grouped[r.division].push(r)
  })

  return (
    <div className="pb-20 md:pb-0">
      {/* Hero */}
      <section style={{ backgroundColor: '#0A2540', padding: '120px 24px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: 12 }}>Championships</p>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(2rem,5vw,3rem)', color: '#fff', marginBottom: 24 }}>Rankings</h1>

          {/* Season tabs */}
          {seasons.length > 1 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
              {seasons.map((s, i) => (
                <button key={s.id} onClick={() => setSeasonIdx(i)} style={{
                  fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 500,
                  padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  backgroundColor: seasonIdx === i ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                  color: seasonIdx === i ? '#fff' : 'rgba(255,255,255,0.4)',
                }}>{s.name}</button>
              ))}
            </div>
          )}

          {/* Division filter */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <button onClick={() => setDivisionId(null)} style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.06em',
              padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              backgroundColor: !divisionId ? 'rgba(43,165,160,0.2)' : 'rgba(255,255,255,0.04)',
              color: !divisionId ? '#2BA5A0' : 'rgba(255,255,255,0.3)',
            }}>All</button>
            {divisions.map(d => (
              <button key={d.id} onClick={() => setDivisionId(d.id)} style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.06em',
                padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                backgroundColor: divisionId === d.id ? 'rgba(43,165,160,0.2)' : 'rgba(255,255,255,0.04)',
                color: divisionId === d.id ? '#2BA5A0' : 'rgba(255,255,255,0.3)',
              }}>{d.short_name || d.name}</button>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider color="#FFFFFF" bg="#0A2540" />

      <section style={{ backgroundColor: '#FFFFFF', padding: '32px 24px 80px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'rgba(26,26,26,0.3)', padding: '3rem 0', fontSize: 13 }}>Loading rankings...</p>
          ) : rankings.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'rgba(26,26,26,0.3)', padding: '3rem 0', fontSize: 14 }}>
              No results yet this season. Rankings will appear after events are completed.
            </p>
          ) : (
            Object.entries(grouped).map(([divName, entries]) => (
              <ScrollReveal key={divName}>
                <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 18, color: '#0A2540', marginBottom: 16, marginTop: 32 }}>
                  {divName}
                </h2>
                <div style={{ borderRadius: 12, border: '1px solid rgba(10,37,64,0.06)', overflow: 'hidden', marginBottom: 24 }}>
                  {/* Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 80px 80px', padding: '10px 20px', borderBottom: '1px solid rgba(10,37,64,0.06)', background: 'rgba(10,37,64,0.02)' }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(10,37,64,0.35)' }}>Rank</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(10,37,64,0.35)' }}>Athlete</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(10,37,64,0.35)', textAlign: 'center' }}>Events</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(10,37,64,0.35)', textAlign: 'right' }}>Points</span>
                  </div>

                  {entries.map((entry, i) => {
                    const isExpanded = expandedAthlete === `${divName}:${entry.athlete_name}`
                    return (
                      <div key={entry.athlete_name}>
                        <button
                          onClick={() => setExpandedAthlete(isExpanded ? null : `${divName}:${entry.athlete_name}`)}
                          style={{
                            display: 'grid', gridTemplateColumns: '48px 1fr 80px 80px', width: '100%',
                            padding: '14px 20px', border: 'none', cursor: 'pointer', textAlign: 'left',
                            borderBottom: '1px solid rgba(10,37,64,0.04)',
                            background: i === 0 ? 'rgba(43,165,160,0.03)' : '#fff',
                          }}
                        >
                          <span style={{
                            fontFamily: "'JetBrains Mono',monospace", fontSize: 16, fontWeight: 700,
                            color: i < 3 ? '#2BA5A0' : 'rgba(10,37,64,0.25)',
                          }}>{i + 1}</span>
                          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, fontWeight: i === 0 ? 700 : 500, color: '#0A2540' }}>
                            {entry.athlete_name}
                          </span>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: 'rgba(10,37,64,0.4)', textAlign: 'center' }}>
                            {entry.events}
                          </span>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 16, fontWeight: 700, color: i === 0 ? '#2BA5A0' : '#0A2540', textAlign: 'right' }}>
                            {entry.points}
                          </span>
                        </button>

                        {/* Expanded: event results */}
                        {isExpanded && entry.results.length > 0 && (
                          <div style={{ padding: '8px 20px 16px 68px', background: 'rgba(10,37,64,0.015)' }}>
                            {entry.results.map((r, ri) => (
                              <div key={ri} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                                <span style={{ color: 'rgba(10,37,64,0.5)' }}>{r.event}</span>
                                <span style={{ fontFamily: "'JetBrains Mono',monospace", color: 'rgba(10,37,64,0.4)' }}>
                                  #{r.position} — {r.points}pts
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </ScrollReveal>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
