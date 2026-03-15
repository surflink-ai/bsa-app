'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ── Config ──
const YOUTUBE_VIDEO_ID = 'Xk8qZEY-KJw'
const POLL_INTERVAL = 10_000
const SCORES_API = '/api/stream/scores'

// ── Types ──
interface RideScore {
  total: number
  scoring_ride?: boolean
}

interface HeatResult {
  place: number
  total: number
  needs: number | null
  winBy: number | null
  rides: Record<string, RideScore[]>
  competitor: {
    athlete: { id: string; name: string }
    bib: string | null
  }
}

interface Heat {
  id: string
  position: number
  round: string
  startTime: string | null
  endTime: string | null
  config: { totalCountingRides: number; maxRideScore: number }
  result: HeatResult[]
}

interface EventDivision {
  id: string
  division: { id: string; name: string }
  status: string
  heats: Heat[]
}

// ── Helpers ──
function getTopWaves(rides: Record<string, RideScore[]>, count: number): number[] {
  const all: number[] = []
  for (const rideList of Object.values(rides)) {
    for (const r of rideList) {
      if (r.total != null) all.push(r.total)
    }
  }
  return all.sort((a, b) => b - a).slice(0, count)
}

function getAllWaves(rides: Record<string, RideScore[]>): { total: number; scoring: boolean }[] {
  const all: { total: number; scoring: boolean }[] = []
  for (const rideList of Object.values(rides)) {
    for (const r of rideList) {
      if (r.total != null) all.push({ total: r.total, scoring: !!r.scoring_ride })
    }
  }
  return all
}

function findActiveHeat(divisions: EventDivision[]): { division: EventDivision; heat: Heat } | null {
  // Look for heats that have scores but aren't the final result yet (most recently active)
  // Strategy: find heats with scores where endTime is null or recent
  for (const div of divisions) {
    for (const heat of div.heats) {
      const hasScores = heat.result.some(r => r.total > 0)
      if (hasScores && !heat.endTime) {
        return { division: div, heat }
      }
    }
  }
  // Fallback: most recent heat with scores
  let latest: { division: EventDivision; heat: Heat; maxScore: number } | null = null
  for (const div of divisions) {
    for (const heat of div.heats) {
      const hasScores = heat.result.some(r => r.total > 0)
      if (hasScores) {
        const maxScore = Math.max(...heat.result.map(r => r.total))
        if (!latest || maxScore > latest.maxScore) {
          latest = { division: div, heat, maxScore }
        }
      }
    }
  }
  return latest ? { division: latest.division, heat: latest.heat } : null
}

// ── Component ──
export function StreamClient() {
  const [divisions, setDivisions] = useState<EventDivision[]>([])
  const [selectedDivId, setSelectedDivId] = useState<string | null>(null)
  const [selectedHeatId, setSelectedHeatId] = useState<string | null>(null)
  const [showOverlay, setShowOverlay] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isLive, setIsLive] = useState(false)
  const prevDataRef = useRef<string>('')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(SCORES_API, { cache: 'no-store' })
      const event = await res.json()
      if (!event || event.error) return

      const divs = event.eventDivisions as EventDivision[]
      const dataHash = JSON.stringify(divs.map(d => d.heats.map(h => h.result.map(r => r.total))))

      if (dataHash !== prevDataRef.current) {
        prevDataRef.current = dataHash
        setDivisions(divs)
        setIsLive(event.status === 'on')
        setLastUpdate(new Date())

        // Auto-select active heat if nothing selected
        if (!selectedDivId || !selectedHeatId) {
          const active = findActiveHeat(divs)
          if (active) {
            setSelectedDivId(active.division.id)
            setSelectedHeatId(active.heat.id)
          }
        }
      }
    } catch (err) {
      console.error('LiveHeats fetch error:', err)
    }
  }, [selectedDivId, selectedHeatId])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchData])

  // Current selection
  const currentDiv = divisions.find(d => d.id === selectedDivId)
  const currentHeat = currentDiv?.heats.find(h => h.id === selectedHeatId)

  // Get all scored heats for the division picker
  const scoredDivisions = divisions.filter(d => d.heats.some(h => h.result.some(r => r.total > 0)))

  return (
    <div style={{ minHeight: '100vh', background: '#0A2540' }}>
      {/* ── YouTube Embed ── */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000', borderRadius: '0 0 0 0' }}>
          <iframe
            src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=0&rel=0&modestbranding=1&playsinline=1`}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />

          {/* ── Score Overlay (on video) ── */}
          {showOverlay && currentHeat && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.85) 30%)',
              padding: '32px 16px 12px',
              pointerEvents: 'none',
            }}>
              {/* Heat info bar */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 8, padding: '0 4px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isLive && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 4,
                      background: 'rgba(220,38,38,0.9)',
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                      color: '#fff', fontFamily: "'JetBrains Mono', monospace",
                      textTransform: 'uppercase',
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s ease-in-out infinite' }} />
                      LIVE
                    </span>
                  )}
                  <span style={{
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff',
                  }}>
                    {currentDiv?.division.name}
                  </span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.5)',
                  }}>
                    {currentHeat.round} {currentHeat.position > 0 ? `H${currentHeat.position}` : ''}
                  </span>
                </div>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.3)',
                }}>
                  Best {currentHeat.config.totalCountingRides} waves
                </span>
              </div>

              {/* Athletes */}
              <div style={{ display: 'flex', gap: 6 }}>
                {currentHeat.result
                  .sort((a, b) => a.place - b.place)
                  .map((r, i) => {
                    const waves = getAllWaves(r.rides)
                    const topWaves = getTopWaves(r.rides, currentHeat.config.totalCountingRides)
                    const isLeader = i === 0 && r.total > 0

                    return (
                      <div key={r.competitor.athlete.id} style={{
                        flex: 1, minWidth: 0,
                        background: isLeader ? 'rgba(43,165,160,0.15)' : 'rgba(255,255,255,0.06)',
                        borderRadius: 8,
                        border: isLeader ? '1px solid rgba(43,165,160,0.3)' : '1px solid rgba(255,255,255,0.08)',
                        padding: '8px 10px',
                      }}>
                        {/* Name + Total */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{
                              fontFamily: "'Space Grotesk', sans-serif",
                              fontSize: 12, fontWeight: isLeader ? 700 : 600, color: '#fff',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                              <span style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 10, fontWeight: 700,
                                color: isLeader ? '#2BA5A0' : 'rgba(255,255,255,0.4)',
                                marginRight: 6,
                              }}>
                                {r.place}
                              </span>
                              {r.competitor.athlete.name}
                            </div>
                            {r.needs != null && r.needs > 0 && i > 0 && (
                              <div style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 1,
                              }}>
                                needs {r.needs.toFixed(2)}
                              </div>
                            )}
                          </div>
                          <div style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 18, fontWeight: 800,
                            color: isLeader ? '#2BA5A0' : '#fff',
                            marginLeft: 8, flexShrink: 0,
                          }}>
                            {r.total > 0 ? r.total.toFixed(2) : '0.00'}
                          </div>
                        </div>

                        {/* Wave scores */}
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                          {waves.map((w, wi) => {
                            const isCounting = topWaves.includes(w.total) && topWaves.indexOf(w.total) < currentHeat.config.totalCountingRides
                            return (
                              <span key={wi} style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 9, padding: '1px 5px', borderRadius: 3,
                                color: isCounting ? '#2BA5A0' : 'rgba(255,255,255,0.35)',
                                background: isCounting ? 'rgba(43,165,160,0.15)' : 'rgba(255,255,255,0.04)',
                                fontWeight: isCounting ? 700 : 400,
                              }}>
                                {w.total.toFixed(1)}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Controls bar ── */}
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Division picker */}
          {scoredDivisions.length > 0 && (
            <select
              value={selectedDivId || ''}
              onChange={(e) => {
                const divId = e.target.value
                setSelectedDivId(divId)
                const div = divisions.find(d => d.id === divId)
                if (div) {
                  // Select most recent scored heat
                  const scoredHeats = div.heats.filter(h => h.result.some(r => r.total > 0))
                  if (scoredHeats.length > 0) {
                    setSelectedHeatId(scoredHeats[scoredHeats.length - 1].id)
                  }
                }
              }}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, padding: '6px 12px', color: '#fff', fontSize: 12,
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
                cursor: 'pointer', outline: 'none',
              }}
            >
              {scoredDivisions.map(d => (
                <option key={d.id} value={d.id} style={{ background: '#0A2540' }}>
                  {d.division.name}
                </option>
              ))}
            </select>
          )}

          {/* Heat picker */}
          {currentDiv && (
            <select
              value={selectedHeatId || ''}
              onChange={(e) => setSelectedHeatId(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, padding: '6px 12px', color: '#fff', fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer', outline: 'none',
              }}
            >
              {currentDiv.heats
                .filter(h => h.result.some(r => r.total > 0))
                .map(h => (
                  <option key={h.id} value={h.id} style={{ background: '#0A2540' }}>
                    {h.round} {h.position > 0 ? `Heat ${h.position}` : 'Final'}
                  </option>
                ))}
            </select>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastUpdate && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
              color: 'rgba(255,255,255,0.2)',
            }}>
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}

          {/* Toggle overlay */}
          <button
            onClick={() => setShowOverlay(!showOverlay)}
            style={{
              background: showOverlay ? 'rgba(43,165,160,0.15)' : 'rgba(255,255,255,0.06)',
              border: showOverlay ? '1px solid rgba(43,165,160,0.3)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, padding: '6px 14px',
              color: showOverlay ? '#2BA5A0' : 'rgba(255,255,255,0.4)',
              fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
              cursor: 'pointer', letterSpacing: '0.05em',
            }}
          >
            {showOverlay ? 'SCORES ON' : 'SCORES OFF'}
          </button>
        </div>
      </div>

      {/* ── Score Panel (below video, detailed) ── */}
      {currentHeat && (
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 16px 24px',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              padding: '12px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: '#fff',
                }}>
                  {currentDiv?.division.name}
                </span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.4)',
                }}>
                  {currentHeat.round} {currentHeat.position > 0 ? `Heat ${currentHeat.position}` : ''}
                </span>
              </div>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em',
              }}>
                Best {currentHeat.config.totalCountingRides} of {currentHeat.config.maxRideScore} max
              </span>
            </div>

            {/* Athletes detail rows */}
            {currentHeat.result
              .sort((a, b) => a.place - b.place)
              .map((r, i) => {
                const waves = getAllWaves(r.rides)
                const topWaves = getTopWaves(r.rides, currentHeat.config.totalCountingRides)
                const isLeader = i === 0 && r.total > 0

                return (
                  <div key={r.competitor.athlete.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '32px 1fr auto auto',
                    alignItems: 'center', gap: 12,
                    padding: '12px 20px',
                    borderBottom: i < currentHeat.result.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: isLeader ? 'rgba(43,165,160,0.04)' : 'transparent',
                  }}>
                    {/* Position */}
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700,
                      color: isLeader ? '#2BA5A0' : 'rgba(255,255,255,0.3)',
                    }}>
                      {r.place}
                    </span>

                    {/* Name + needs */}
                    <div>
                      <div style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 15, fontWeight: isLeader ? 700 : 500, color: '#fff',
                      }}>
                        {r.competitor.athlete.name}
                      </div>
                      {r.needs != null && r.needs > 0 && i > 0 && (
                        <div style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2,
                        }}>
                          needs {r.needs.toFixed(2)}
                        </div>
                      )}
                    </div>

                    {/* Wave pills */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {waves.map((w, wi) => {
                        const isCounting = topWaves.includes(w.total)
                        return (
                          <span key={wi} style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 11, padding: '2px 8px', borderRadius: 4,
                            color: isCounting ? '#2BA5A0' : 'rgba(255,255,255,0.4)',
                            background: isCounting ? 'rgba(43,165,160,0.12)' : 'rgba(255,255,255,0.04)',
                            fontWeight: isCounting ? 700 : 400,
                          }}>
                            {w.total.toFixed(1)}
                          </span>
                        )
                      })}
                    </div>

                    {/* Total */}
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 22, fontWeight: 800,
                      color: isLeader ? '#2BA5A0' : '#fff',
                      textAlign: 'right', minWidth: 70,
                    }}>
                      {r.total > 0 ? r.total.toFixed(2) : '0.00'}
                    </span>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* ── BSA Branding ── */}
      <div style={{ textAlign: 'center', padding: '16px 16px 48px' }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
          letterSpacing: '0.1em', color: 'rgba(255,255,255,0.15)',
        }}>
          BARBADOS SURFING ASSOCIATION &middot; LIVE SCORING BY LIVEHEATS
        </div>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
