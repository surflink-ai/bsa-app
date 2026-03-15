'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ── Config ──
const YOUTUBE_VIDEO_ID = 'Xk8qZEY-KJw'
const POLL_INTERVAL = 3_000
const SCORES_API = '/api/stream/scores'
const HEAT_DURATION_MS = 20 * 60 * 1000 // 20 minutes default

// ── Types ──
interface RideScore { total: number; scoring_ride?: boolean }
interface HeatResult {
  place: number; total: number; needs: number | null; winBy: number | null
  rides: Record<string, RideScore[]>
  competitor: { athlete: { id: string; name: string }; bib: string | null }
}
interface Heat {
  id: string; position: number; round: string
  startTime: string | null; endTime: string | null
  config: { totalCountingRides: number; maxRideScore: number }
  result: HeatResult[]
}
interface EventDivision {
  id: string; division: { id: string; name: string }; status: string; heats: Heat[]
}

// ── Helpers ──
function getTopWaves(rides: Record<string, RideScore[]>, count: number): number[] {
  const all: number[] = []
  for (const rideList of Object.values(rides)) for (const r of rideList) if (r.total != null) all.push(r.total)
  return all.sort((a, b) => b - a).slice(0, count)
}

function getAllWaves(rides: Record<string, RideScore[]>): number[] {
  const all: number[] = []
  for (const rideList of Object.values(rides)) for (const r of rideList) if (r.total != null) all.push(r.total)
  return all
}

function findActiveHeat(divisions: EventDivision[]): { division: EventDivision; heat: Heat } | null {
  // Live heat: has startTime, no endTime
  for (const div of divisions) {
    for (const heat of div.heats) {
      if (heat.startTime && !heat.endTime) return { division: div, heat }
    }
  }
  // Fallback: most recent completed heat
  let latest: { division: EventDivision; heat: Heat; time: number } | null = null
  for (const div of divisions) {
    for (const heat of div.heats) {
      if (heat.endTime) {
        const t = new Date(heat.endTime).getTime()
        if (!latest || t > latest.time) latest = { division: div, heat, time: t }
      }
    }
  }
  return latest ? { division: latest.division, heat: latest.heat } : null
}

function lastName(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts.length > 1 ? parts[parts.length - 1] : name
}

function formatTime(ms: number): string {
  if (ms <= 0) return '0:00'
  const mins = Math.floor(ms / 60000)
  const secs = Math.floor((ms % 60000) / 1000)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// ── Component ──
export function StreamClient() {
  const [divisions, setDivisions] = useState<EventDivision[]>([])
  const [selectedDivId, setSelectedDivId] = useState<string | null>(null)
  const [selectedHeatId, setSelectedHeatId] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [now, setNow] = useState(Date.now())
  const prevDataRef = useRef<string>('')
  const controlsTimeout = useRef<ReturnType<typeof setTimeout>>(null)

  // Clock tick for timer
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i) }, [])

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
        if (!selectedDivId || !selectedHeatId) {
          const active = findActiveHeat(divs)
          if (active) { setSelectedDivId(active.division.id); setSelectedHeatId(active.heat.id) }
        }
      }
    } catch (err) { console.error('Score fetch error:', err) }
  }, [selectedDivId, selectedHeatId])

  useEffect(() => { fetchData(); const i = setInterval(fetchData, POLL_INTERVAL); return () => clearInterval(i) }, [fetchData])

  const currentDiv = divisions.find(d => d.id === selectedDivId)
  const currentHeat = currentDiv?.heats.find(h => h.id === selectedHeatId)
  const scoredDivisions = divisions.filter(d => d.heats.some(h => h.result.some(r => r.total > 0)))

  // Timer
  const heatIsLive = currentHeat?.startTime && !currentHeat?.endTime
  const timeRemaining = heatIsLive && currentHeat?.startTime
    ? Math.max(0, HEAT_DURATION_MS - (now - new Date(currentHeat.startTime).getTime()))
    : null

  const handleTap = () => {
    setShowControls(true)
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
    controlsTimeout.current = setTimeout(() => setShowControls(false), 5000)
  }

  const sorted = currentHeat?.result.sort((a, b) => a.place - b.place) || []

  return (
    <>
      {/* ── Mobile: 16:9 video + score panel below ── */}
      <div className="stream-mobile" onClick={handleTap}>
        {/* Video */}
        <div style={{ width: '100%', position: 'relative', paddingTop: '56.25%', background: '#000' }}>
          <iframe
            src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1`}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          {/* WSL-style scoreboard top-left ON video — ultra compact */}
          {currentHeat && (
            <div style={{
              position: 'absolute', top: 6, left: 6, zIndex: 10,
              background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
              borderRadius: 4, overflow: 'hidden', width: 140,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '2px 5px', background: 'rgba(255,255,255,0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 0, flex: 1 }}>
                  {heatIsLive && (
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#DC2626', flexShrink: 0, animation: 'pulse 1.5s ease-in-out infinite' }} />
                  )}
                  <span style={{
                    fontSize: 6, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {currentDiv?.division.name} · {currentHeat.round.replace('Quarterfinal', 'QF').replace('Semifinal', 'SF')} {currentHeat.position > 0 ? `H${currentHeat.position}` : ''}
                  </span>
                </div>
                {timeRemaining !== null && (
                  <span style={{
                    fontSize: 8, fontWeight: 800, fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                    color: timeRemaining < 120000 ? '#DC2626' : 'rgba(255,255,255,0.6)',
                  }}>
                    {formatTime(timeRemaining)}
                  </span>
                )}
              </div>
              {/* Athletes */}
              {sorted.map((r, i) => {
                const isLeader = i === 0 && r.total > 0
                return (
                  <div key={r.competitor.athlete.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '3px 5px', height: 24,
                    background: isLeader ? 'rgba(43,165,160,0.1)' : 'transparent',
                    borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}>
                    <span style={{
                      fontSize: 8, fontWeight: isLeader ? 700 : 500, color: '#fff',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 85,
                    }}>
                      {lastName(r.competitor.athlete.name)}
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                      color: isLeader ? '#2BA5A0' : 'rgba(255,255,255,0.7)',
                    }}>
                      {r.total > 0 ? r.total.toFixed(2) : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Score detail panel below video (mobile) */}
        {currentHeat && (
          <div style={{ background: '#0A2540', padding: '12px' }}>
            {/* Division + heat selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              {scoredDivisions.length > 0 && (
                <select
                  value={selectedDivId || ''}
                  onChange={(e) => {
                    const divId = e.target.value
                    setSelectedDivId(divId)
                    const div = divisions.find(d => d.id === divId)
                    if (div) {
                      const scored = div.heats.filter(h => h.result.some(r => r.total > 0))
                      if (scored.length) setSelectedHeatId(scored[scored.length - 1].id)
                    }
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 12,
                    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, cursor: 'pointer', outline: 'none',
                  }}
                >
                  {scoredDivisions.map(d => (
                    <option key={d.id} value={d.id} style={{ background: '#0A2540' }}>{d.division.name}</option>
                  ))}
                </select>
              )}
              {currentDiv && (
                <select
                  value={selectedHeatId || ''}
                  onChange={(e) => setSelectedHeatId(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer', outline: 'none',
                  }}
                >
                  {currentDiv.heats
                    .filter(h => h.result.some(r => r.total > 0) || (h.startTime && !h.endTime))
                    .map(h => (
                      <option key={h.id} value={h.id} style={{ background: '#0A2540' }}>
                        {h.round} {h.position > 0 ? `H${h.position}` : ''}
                      </option>
                    ))}
                </select>
              )}
              {timeRemaining !== null && (
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 800,
                  color: timeRemaining < 120000 ? '#DC2626' : '#2BA5A0',
                  marginLeft: 'auto',
                }}>
                  {formatTime(timeRemaining)}
                </span>
              )}
            </div>

            {/* Detailed athlete rows */}
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10, overflow: 'hidden',
            }}>
              {sorted.map((r, i) => {
                const waves = getAllWaves(r.rides)
                const topWaves = getTopWaves(r.rides, currentHeat.config.totalCountingRides)
                const isLeader = i === 0 && r.total > 0
                return (
                  <div key={r.competitor.athlete.id} style={{
                    display: 'grid', gridTemplateColumns: '24px 1fr auto 56px',
                    alignItems: 'center', gap: 8, padding: '10px 12px', minHeight: 52,
                    background: isLeader ? 'rgba(43,165,160,0.04)' : 'transparent',
                    borderBottom: i < sorted.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700,
                      color: isLeader ? '#2BA5A0' : 'rgba(255,255,255,0.3)',
                    }}>{r.place}</span>
                    <div>
                      <div style={{
                        fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: isLeader ? 700 : 500,
                        color: '#fff',
                      }}>{r.competitor.athlete.name}</div>
                      {r.needs != null && r.needs > 0 && i > 0 && (
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                          needs {r.needs.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {waves.slice(0, 5).map((w, wi) => {
                        const isCounting = topWaves.includes(w)
                        return (
                          <span key={wi} style={{
                            fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                            padding: '1px 4px', borderRadius: 3,
                            color: isCounting ? '#2BA5A0' : 'rgba(255,255,255,0.3)',
                            background: isCounting ? 'rgba(43,165,160,0.12)' : 'transparent',
                            fontWeight: isCounting ? 700 : 400,
                          }}>{w.toFixed(1)}</span>
                        )
                      })}
                      {waves.length > 5 && (
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>+{waves.length - 5}</span>
                      )}
                    </div>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 800,
                      color: isLeader ? '#2BA5A0' : '#fff', textAlign: 'right',
                    }}>{r.total > 0 ? r.total.toFixed(2) : '—'}</span>
                  </div>
                )
              })}
            </div>

            <div style={{
              textAlign: 'center', marginTop: 8,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
              color: 'rgba(255,255,255,0.12)', letterSpacing: '0.1em',
            }}>BSA &middot; LIVEHEATS</div>
          </div>
        )}
      </div>

      {/* ── Desktop: fullscreen with WSL-style overlay ── */}
      <div className="stream-desktop" onClick={handleTap} style={{
        position: 'fixed', inset: 0, background: '#000', zIndex: 9999, overflow: 'hidden',
      }}>
        <iframe
          src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1&controls=0&showinfo=0&iv_load_policy=3`}
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100vw', height: '56.25vw', minHeight: '100vh', minWidth: '177.78vh', border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />

        {/* Scoreboard — top-left (desktop size) */}
        {currentHeat && (
          <div style={{
            position: 'absolute', top: 16, left: 16, zIndex: 10,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)',
            borderRadius: 8, overflow: 'hidden', minWidth: 220,
            fontFamily: "'JetBrains Mono', monospace",
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}>
            {/* Header bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 12px', background: 'rgba(255,255,255,0.06)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {heatIsLive && (
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '1px 6px', borderRadius: 3, background: 'rgba(220,38,38,0.9)',
                    fontSize: 8, fontWeight: 700, color: '#fff', letterSpacing: '0.1em',
                  }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    LIVE
                  </span>
                )}
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>
                  {currentDiv?.division.name}
                </span>
              </div>
              {timeRemaining !== null && (
                <span style={{
                  fontSize: 14, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                  color: timeRemaining < 120000 ? '#DC2626' : '#2BA5A0',
                }}>
                  {formatTime(timeRemaining)}
                </span>
              )}
            </div>

            {/* Round */}
            <div style={{
              padding: '3px 12px', fontSize: 8, color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              {currentHeat.round} {currentHeat.position > 0 ? `Heat ${currentHeat.position}` : ''} &middot; Best {currentHeat.config.totalCountingRides}
            </div>

            {/* Athletes */}
            {sorted.map((r, i) => {
              const isLeader = i === 0 && r.total > 0
              const waves = getAllWaves(r.rides)
              const topWaves = getTopWaves(r.rides, currentHeat.config.totalCountingRides)
              return (
                <div key={r.competitor.athlete.id} style={{
                  display: 'grid', gridTemplateColumns: '16px 1fr auto 58px',
                  alignItems: 'center', gap: 6, padding: '6px 12px', minHeight: 40,
                  background: isLeader ? 'rgba(43,165,160,0.08)' : 'transparent',
                  borderBottom: i < sorted.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isLeader ? '#2BA5A0' : 'rgba(255,255,255,0.3)' }}>
                    {r.place}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <span style={{
                      fontSize: 12, fontWeight: isLeader ? 700 : 500, color: '#fff',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block',
                    }}>
                      {r.competitor.athlete.name}
                    </span>
                    {r.needs != null && r.needs > 0 && i > 0 && (
                      <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>needs {r.needs.toFixed(2)}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {waves.slice(0, 4).map((w, wi) => {
                      const isCounting = topWaves.includes(w)
                      return (
                        <span key={wi} style={{
                          fontSize: 8, padding: '1px 3px', borderRadius: 2,
                          color: isCounting ? '#2BA5A0' : 'rgba(255,255,255,0.25)',
                          fontWeight: isCounting ? 700 : 400,
                        }}>{w.toFixed(1)}</span>
                      )
                    })}
                  </div>
                  <span style={{
                    fontSize: 15, fontWeight: 800, textAlign: 'right',
                    color: isLeader ? '#2BA5A0' : '#fff', fontVariantNumeric: 'tabular-nums',
                  }}>
                    {r.total > 0 ? r.total.toFixed(2) : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* BSA watermark top-right */}
        <div style={{
          position: 'absolute', top: 16, right: 16, zIndex: 10,
          fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700,
          color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em',
        }}>BSA</div>

        {/* Controls on tap */}
        {showControls && (
          <div style={{
            position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            zIndex: 20, display: 'flex', gap: 8,
          }}>
            {scoredDivisions.length > 0 && (
              <select
                value={selectedDivId || ''}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const divId = e.target.value; setSelectedDivId(divId)
                  const div = divisions.find(d => d.id === divId)
                  if (div) { const s = div.heats.filter(h => h.result.some(r => r.total > 0)); if (s.length) setSelectedHeatId(s[s.length - 1].id) }
                }}
                style={{
                  background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
                  padding: '8px 16px', color: '#fff', fontSize: 13,
                  fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, cursor: 'pointer', outline: 'none',
                }}
              >
                {scoredDivisions.map(d => (<option key={d.id} value={d.id} style={{ background: '#111' }}>{d.division.name}</option>))}
              </select>
            )}
            {currentDiv && (
              <select
                value={selectedHeatId || ''}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setSelectedHeatId(e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
                  padding: '8px 16px', color: '#fff', fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer', outline: 'none',
                }}
              >
                {currentDiv.heats
                  .filter(h => h.result.some(r => r.total > 0) || (h.startTime && !h.endTime))
                  .map(h => (<option key={h.id} value={h.id} style={{ background: '#111' }}>{h.round} {h.position > 0 ? `H${h.position}` : ''}</option>))}
              </select>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

        /* Mobile: show mobile, hide desktop */
        .stream-mobile { display: block; }
        .stream-desktop { display: none !important; }

        @media (min-width: 769px) and (orientation: landscape) {
          .stream-mobile { display: none !important; }
          .stream-desktop { display: block !important; }
          body > nav, body > footer, body > header { display: none !important; }
          body { overflow: hidden !important; }
          main { padding: 0 !important; }
        }

        @media (orientation: portrait) {
          .stream-mobile { display: block; }
          .stream-desktop { display: none !important; }
        }
      `}</style>
    </>
  )
}
