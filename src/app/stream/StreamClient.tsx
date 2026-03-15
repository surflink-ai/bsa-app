'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ── Config ──
const YOUTUBE_VIDEO_ID = 'Xk8qZEY-KJw'
const POLL_INTERVAL = 10_000
const SCORES_API = '/api/stream/scores'

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
  for (const rideList of Object.values(rides)) {
    for (const r of rideList) if (r.total != null) all.push(r.total)
  }
  return all.sort((a, b) => b - a).slice(0, count)
}

function getAllWaves(rides: Record<string, RideScore[]>): { total: number }[] {
  const all: { total: number }[] = []
  for (const rideList of Object.values(rides)) {
    for (const r of rideList) if (r.total != null) all.push({ total: r.total })
  }
  return all
}

function findActiveHeat(divisions: EventDivision[]): { division: EventDivision; heat: Heat } | null {
  for (const div of divisions) {
    for (const heat of div.heats) {
      if (heat.result.some(r => r.total > 0) && !heat.endTime) return { division: div, heat }
    }
  }
  let latest: { division: EventDivision; heat: Heat; max: number } | null = null
  for (const div of divisions) {
    for (const heat of div.heats) {
      if (heat.result.some(r => r.total > 0)) {
        const max = Math.max(...heat.result.map(r => r.total))
        if (!latest || max > latest.max) latest = { division: div, heat, max }
      }
    }
  }
  return latest ? { division: latest.division, heat: latest.heat } : null
}

function shortName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length <= 1) return name
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`
}

// ── Component ──
export function StreamClient() {
  const [divisions, setDivisions] = useState<EventDivision[]>([])
  const [selectedDivId, setSelectedDivId] = useState<string | null>(null)
  const [selectedHeatId, setSelectedHeatId] = useState<string | null>(null)
  const [showOverlay, setShowOverlay] = useState(true)
  const [showControls, setShowControls] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const prevDataRef = useRef<string>('')
  const controlsTimeout = useRef<ReturnType<typeof setTimeout>>()

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

  const handleTap = () => {
    setShowControls(true)
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
    controlsTimeout.current = setTimeout(() => setShowControls(false), 4000)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 9999, overflow: 'hidden' }}
      onClick={handleTap}
    >
      {/* ── Fullscreen YouTube ── */}
      <iframe
        src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1&controls=0&showinfo=0&iv_load_policy=3&fs=0`}
        style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100vw', height: '56.25vw', minHeight: '100vh', minWidth: '177.78vh', border: 'none' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />

      {/* ── LIVE badge (top-left) ── */}
      {isLive && (
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 4,
            background: 'rgba(220,38,38,0.9)', backdropFilter: 'blur(8px)',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
            color: '#fff', fontFamily: "'JetBrains Mono', monospace",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s ease-in-out infinite' }} />
            LIVE
          </div>
        </div>
      )}

      {/* ── BSA watermark (top-right) ── */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 10,
        fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700,
        color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em',
      }}>
        BSA
      </div>

      {/* ── Score Overlay (bottom) ── */}
      {showOverlay && currentHeat && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7) 20%, rgba(0,0,0,0.88))',
          padding: '28px 12px 10px',
        }}>
          {/* Division + Round label */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '0 2px',
          }}>
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700,
              color: 'rgba(255,255,255,0.7)',
            }}>
              {currentDiv?.division.name}
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
              color: 'rgba(255,255,255,0.35)',
            }}>
              {currentHeat.round} {currentHeat.position > 0 ? `H${currentHeat.position}` : ''}
            </span>
            <span style={{ flex: 1 }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
              color: 'rgba(255,255,255,0.2)',
            }}>
              Best {currentHeat.config.totalCountingRides}
            </span>
          </div>

          {/* Athlete rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {currentHeat.result
              .sort((a, b) => a.place - b.place)
              .map((r, i) => {
                const waves = getAllWaves(r.rides)
                const topWaves = getTopWaves(r.rides, currentHeat.config.totalCountingRides)
                const isLeader = i === 0 && r.total > 0

                return (
                  <div key={r.competitor.athlete.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '20px 1fr auto 52px',
                    alignItems: 'center', gap: 6,
                    padding: '5px 8px',
                    borderRadius: 6,
                    background: isLeader ? 'rgba(43,165,160,0.12)' : 'rgba(255,255,255,0.04)',
                  }}>
                    {/* Position */}
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700,
                      color: isLeader ? '#2BA5A0' : 'rgba(255,255,255,0.3)',
                    }}>
                      {r.place}
                    </span>

                    {/* Name + needs */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 13, fontWeight: isLeader ? 700 : 500, color: '#fff',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        <span className="athlete-full">{r.competitor.athlete.name}</span>
                        <span className="athlete-short">{shortName(r.competitor.athlete.name)}</span>
                      </div>
                      {r.needs != null && r.needs > 0 && i > 0 && (
                        <div style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: -1,
                        }}>
                          needs {r.needs.toFixed(2)}
                        </div>
                      )}
                    </div>

                    {/* Wave pills */}
                    <div style={{ display: 'flex', gap: 2, flexWrap: 'nowrap', overflow: 'hidden' }}>
                      {waves.slice(0, 6).map((w, wi) => {
                        const isCounting = topWaves.includes(w.total)
                        return (
                          <span key={wi} style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 9, padding: '1px 4px', borderRadius: 3,
                            color: isCounting ? '#2BA5A0' : 'rgba(255,255,255,0.3)',
                            background: isCounting ? 'rgba(43,165,160,0.15)' : 'transparent',
                            fontWeight: isCounting ? 700 : 400,
                            whiteSpace: 'nowrap',
                          }}>
                            {w.total.toFixed(1)}
                          </span>
                        )
                      })}
                      {waves.length > 6 && (
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.15)' }}>+{waves.length - 6}</span>
                      )}
                    </div>

                    {/* Total */}
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 16, fontWeight: 800,
                      color: isLeader ? '#2BA5A0' : '#fff',
                      textAlign: 'right',
                    }}>
                      {r.total > 0 ? r.total.toFixed(2) : '—'}
                    </span>
                  </div>
                )
              })}
          </div>

          {/* BSA credit line */}
          <div style={{
            textAlign: 'center', marginTop: 4,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
            color: 'rgba(255,255,255,0.12)', letterSpacing: '0.1em',
          }}>
            BSA &middot; LIVEHEATS
          </div>
        </div>
      )}

      {/* ── Controls (shown on tap) ── */}
      {showControls && (
        <div style={{
          position: 'absolute', top: '50%', left: 0, right: 0,
          transform: 'translateY(-50%)', zIndex: 20,
          display: 'flex', justifyContent: 'center', gap: 8,
          padding: '0 12px', flexWrap: 'wrap',
        }}>
          {/* Division picker */}
          {scoredDivisions.length > 0 && (
            <select
              value={selectedDivId || ''}
              onClick={(e) => e.stopPropagation()}
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
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
                padding: '8px 16px', color: '#fff', fontSize: 13,
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
                cursor: 'pointer', outline: 'none',
              }}
            >
              {scoredDivisions.map(d => (
                <option key={d.id} value={d.id} style={{ background: '#111' }}>
                  {d.division.name}
                </option>
              ))}
            </select>
          )}

          {/* Heat picker */}
          {currentDiv && (
            <select
              value={selectedHeatId || ''}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setSelectedHeatId(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
                padding: '8px 16px', color: '#fff', fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer', outline: 'none',
              }}
            >
              {currentDiv.heats
                .filter(h => h.result.some(r => r.total > 0))
                .map(h => (
                  <option key={h.id} value={h.id} style={{ background: '#111' }}>
                    {h.round} {h.position > 0 ? `H${h.position}` : ''}
                  </option>
                ))}
            </select>
          )}

          {/* Toggle scores */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowOverlay(!showOverlay) }}
            style={{
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
              border: showOverlay ? '1px solid rgba(43,165,160,0.4)' : '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8, padding: '8px 16px',
              color: showOverlay ? '#2BA5A0' : 'rgba(255,255,255,0.5)',
              fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
              cursor: 'pointer', letterSpacing: '0.05em',
            }}
          >
            SCORES {showOverlay ? 'ON' : 'OFF'}
          </button>
        </div>
      )}

      {/* ── Styles ── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        /* Hide nav/footer in fullscreen stream */
        nav, footer, header, .pb-20 { display: none !important; }
        body { overflow: hidden !important; margin: 0 !important; padding: 0 !important; }

        /* Mobile: show short names, hide full */
        .athlete-short { display: none; }
        @media (max-width: 640px) {
          .athlete-full { display: none !important; }
          .athlete-short { display: inline !important; }
        }
        @media (min-width: 641px) {
          .athlete-full { display: inline; }
          .athlete-short { display: none !important; }
        }
      `}</style>
    </div>
  )
}
