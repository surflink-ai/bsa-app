'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ── Config ──
const YOUTUBE_VIDEO_ID = 'Xk8qZEY-KJw'
const POLL_INTERVAL = 3_000
const SCORES_API = '/api/stream/scores'
const HEAT_DURATION_MS = 20 * 60 * 1000

// ── Types ──
interface RideScore { total: number; scoring_ride?: boolean }
interface HeatResult {
  place: number; total: number; needs: number | null; winBy: number | null
  rides: Record<string, RideScore[]>
  competitor: { athlete: { id: string; name: string }; bib: string | null }
}
interface HeatCompetitor {
  position: number; athlete: { id: string; name: string }
}
interface Heat {
  id: string; position: number; round: string
  startTime: string | null; endTime: string | null
  config: { totalCountingRides: number; maxRideScore: number; jerseyOrder: string[] }
  competitors: HeatCompetitor[]
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
  for (const div of divisions) {
    for (const heat of div.heats) {
      if (heat.startTime && !heat.endTime) return { division: div, heat }
    }
  }
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

const JERSEY_HEX: Record<string, string> = {
  red: '#DC2626', white: '#E2E8F0', green: '#16A34A', blue: '#2563EB',
  black: '#1E293B', yellow: '#EAB308', pink: '#EC4899', orange: '#EA580C',
}

function getJerseyColor(heat: Heat, athleteId: string): string | null {
  const comp = heat.competitors?.find(c => c.athlete.id === athleteId)
  if (comp == null || !heat.config.jerseyOrder) return null
  return heat.config.jerseyOrder[comp.position] || null
}

function formatTime(ms: number): string {
  if (ms <= 0) return '0:00'
  const mins = Math.floor(ms / 60000)
  const secs = Math.floor((ms % 60000) / 1000)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// ── Shared: Pickers ──
function HeatPickers({ scoredDivisions, divisions, currentDiv, selectedDivId, selectedHeatId, setSelectedDivId, setSelectedHeatId, style }: {
  scoredDivisions: EventDivision[]; divisions: EventDivision[]; currentDiv: EventDivision | undefined
  selectedDivId: string | null; selectedHeatId: string | null
  setSelectedDivId: (id: string) => void; setSelectedHeatId: (id: string) => void
  style?: React.CSSProperties
}) {
  const selStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 12,
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, cursor: 'pointer', outline: 'none',
    ...extra,
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', ...style }}>
      {scoredDivisions.length > 0 && (
        <select value={selectedDivId || ''} onClick={e => e.stopPropagation()} onChange={e => {
          const id = e.target.value; setSelectedDivId(id)
          const div = divisions.find(d => d.id === id)
          if (div) { const s = div.heats.filter(h => h.result.some(r => r.total > 0)); if (s.length) setSelectedHeatId(s[s.length - 1].id) }
        }} style={selStyle()}>
          {scoredDivisions.map(d => <option key={d.id} value={d.id} style={{ background: '#0A2540' }}>{d.division.name}</option>)}
        </select>
      )}
      {currentDiv && (
        <select value={selectedHeatId || ''} onClick={e => e.stopPropagation()} onChange={e => setSelectedHeatId(e.target.value)}
          style={selStyle({ fontFamily: "'JetBrains Mono', monospace" })}>
          {currentDiv.heats
            .filter(h => h.result.some(r => r.total > 0) || (h.startTime && !h.endTime))
            .map(h => <option key={h.id} value={h.id} style={{ background: '#0A2540' }}>{h.round} {h.position > 0 ? `H${h.position}` : ''}</option>)}
        </select>
      )}
    </div>
  )
}

// ── Shared: Full scoreboard rows (used in mobile portrait below video AND desktop overlay) ──
function JerseyDot({ color, size }: { color: string | null; size: number }) {
  if (!color || !JERSEY_HEX[color]) return null
  return (
    <span style={{
      display: 'inline-block', width: size, height: size, borderRadius: 2,
      background: JERSEY_HEX[color],
      border: color === 'white' ? '1px solid rgba(255,255,255,0.3)' : 'none',
      flexShrink: 0,
    }} />
  )
}

function ScoreRows({ sorted, heat, isCompact }: { sorted: HeatResult[]; heat: Heat; isCompact?: boolean }) {
  const fs = isCompact ? { pos: 11, name: 12, needs: 8, wave: 8, total: 15, row: 48 }
    : { pos: 18, name: 15, needs: 10, wave: 10, total: 20, row: 64 }
  return (
    <>
      {sorted.map((r, i) => {
        const isLeader = i === 0 && r.total > 0
        const waves = getAllWaves(r.rides)
        const topWaves = getTopWaves(r.rides, heat.config.totalCountingRides)
        const jersey = getJerseyColor(heat, r.competitor.athlete.id)
        return (
          <div key={r.competitor.athlete.id} style={{
            display: 'grid', gridTemplateColumns: isCompact ? '16px 1fr auto 58px' : '28px 1fr auto 64px',
            alignItems: 'center', gap: isCompact ? 6 : 10,
            padding: isCompact ? '0 12px' : '0 14px', height: fs.row,
            background: isLeader ? 'rgba(43,165,160,0.06)' : 'transparent',
            borderBottom: i < sorted.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: fs.pos, fontWeight: 700,
              color: isLeader ? '#2BA5A0' : 'rgba(255,255,255,0.3)',
            }}>{r.place}</span>
            <div style={{ minWidth: 0 }}>
              <span style={{
                fontFamily: "'Space Grotesk', sans-serif", fontSize: fs.name,
                fontWeight: isLeader ? 700 : 500, color: '#fff',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                display: 'flex', alignItems: 'center', gap: isCompact ? 4 : 6,
              }}>
                <JerseyDot color={jersey} size={isCompact ? 8 : 10} />
                {r.competitor.athlete.name}
              </span>
              {r.needs != null && r.needs > 0 && i > 0 && (
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: fs.needs,
                  color: 'rgba(255,255,255,0.3)', display: 'block', marginTop: 1,
                }}>needs {r.needs.toFixed(2)}</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: isCompact ? 2 : 3, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {waves.slice(0, isCompact ? 4 : 6).map((w, wi) => {
                const isCounting = topWaves.includes(w)
                return (
                  <span key={wi} style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: fs.wave,
                    padding: isCompact ? '1px 3px' : '2px 5px', borderRadius: 3,
                    color: isCounting ? '#2BA5A0' : 'rgba(255,255,255,0.25)',
                    background: isCounting ? 'rgba(43,165,160,0.12)' : 'transparent',
                    fontWeight: isCounting ? 700 : 400,
                  }}>{w.toFixed(1)}</span>
                )
              })}
              {waves.length > (isCompact ? 4 : 6) && (
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: fs.wave - 1, color: 'rgba(255,255,255,0.15)' }}>
                  +{waves.length - (isCompact ? 4 : 6)}
                </span>
              )}
            </div>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: fs.total,
              fontWeight: 800, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
              color: isLeader ? '#2BA5A0' : '#fff',
            }}>{r.total > 0 ? r.total.toFixed(2) : '—'}</span>
          </div>
        )
      })}
    </>
  )
}

// ── Main Component ──
export function StreamClient() {
  const [divisions, setDivisions] = useState<EventDivision[]>([])
  const [selectedDivId, setSelectedDivId] = useState<string | null>(null)
  const [selectedHeatId, setSelectedHeatId] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [now, setNow] = useState(Date.now())
  const prevDataRef = useRef<string>('')
  const controlsTimeout = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i) }, [])

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(SCORES_API, { cache: 'no-store' })
      const event = await res.json()
      if (!event || event.error) return
      const divs = event.eventDivisions as EventDivision[]
      const hash = JSON.stringify(divs.map(d => d.heats.map(h => h.result.map(r => r.total))))
      if (hash !== prevDataRef.current) {
        prevDataRef.current = hash
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
  const heatIsLive = currentHeat?.startTime && !currentHeat?.endTime
  const timeRemaining = heatIsLive && currentHeat?.startTime
    ? Math.max(0, HEAT_DURATION_MS - (now - new Date(currentHeat.startTime).getTime()))
    : null
  const sorted = currentHeat?.result.sort((a, b) => a.place - b.place) || []

  const handleTap = () => {
    setShowControls(true)
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
    controlsTimeout.current = setTimeout(() => setShowControls(false), 5000)
  }

  const pickerProps = { scoredDivisions, divisions, currentDiv, selectedDivId, selectedHeatId, setSelectedDivId, setSelectedHeatId }

  // ── Timer bar (shared) ──
  const TimerBar = ({ size }: { size: 'sm' | 'lg' }) => {
    const isSm = size === 'sm'
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isSm ? '4px 12px' : '8px 14px',
        background: 'rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {heatIsLive && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '1px 6px', borderRadius: 3, background: 'rgba(220,38,38,0.9)',
              fontSize: isSm ? 8 : 9, fontWeight: 700, color: '#fff',
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em',
            }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s ease-in-out infinite' }} />
              LIVE
            </span>
          )}
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif", fontSize: isSm ? 10 : 11, fontWeight: 700,
            color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap',
          }}>
            {currentDiv?.division.name}
          </span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: isSm ? 8 : 9,
            color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', whiteSpace: 'nowrap',
          }}>
            {currentHeat?.round} {currentHeat && currentHeat.position > 0 ? `H${currentHeat.position}` : ''} · Best {currentHeat?.config.totalCountingRides}
          </span>
        </div>
        {timeRemaining !== null && (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: isSm ? 14 : 18, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
            color: timeRemaining < 120000 ? '#DC2626' : '#2BA5A0',
          }}>
            {formatTime(timeRemaining)}
          </span>
        )}
      </div>
    )
  }

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════
          MOBILE PORTRAIT — Video top, full scoreboard below
         ═══════════════════════════════════════════════════════════ */}
      <div className="stream-portrait">
        {/* 16:9 Video — clean, no overlay */}
        <div style={{ width: '100%', position: 'relative', paddingTop: '56.25%', background: '#000' }}>
          <iframe
            src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1`}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Full scoreboard */}
        {currentHeat && (
          <div style={{ background: '#0A2540' }}>
            {/* Timer bar */}
            <TimerBar size="lg" />

            {/* Pickers */}
            <div style={{ padding: '10px 14px 0' }}>
              <HeatPickers {...pickerProps} />
            </div>

            {/* Score rows — full data */}
            <div style={{
              margin: '10px 14px', background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden',
            }}>
              <ScoreRows sorted={sorted} heat={currentHeat} />
            </div>

            <div style={{
              textAlign: 'center', padding: '4px 0 16px',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
              color: 'rgba(255,255,255,0.12)', letterSpacing: '0.1em',
            }}>BSA · LIVEHEATS</div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          LANDSCAPE / DESKTOP — Fullscreen video + overlay
         ═══════════════════════════════════════════════════════════ */}
      <div className="stream-landscape" onClick={handleTap} style={{
        position: 'fixed', inset: 0, background: '#000', zIndex: 9999, overflow: 'hidden',
      }}>
        <iframe
          src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1&controls=0&showinfo=0&iv_load_policy=3`}
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100vw', height: '56.25vw', minHeight: '100vh', minWidth: '177.78vh', border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />

        {/* Overlay scoreboard top-left */}
        {currentHeat && (
          <div className="overlay-scoreboard" style={{
            position: 'absolute', top: 16, left: 16, zIndex: 10,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)',
            borderRadius: 8, overflow: 'hidden', minWidth: 220,
            fontFamily: "'JetBrains Mono', monospace",
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}>
            <TimerBar size="sm" />
            <ScoreRows sorted={sorted} heat={currentHeat} isCompact />
          </div>
        )}

        {/* BSA watermark */}
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
            <HeatPickers {...pickerProps} style={{
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
              borderRadius: 8, padding: '4px 8px',
            }} />
          </div>
        )}
      </div>

      {/* ── CSS ── */}
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

        /* Default: portrait mode */
        .stream-portrait { display: block; }
        .stream-landscape { display: none !important; }

        /* Landscape (any device) OR desktop wide */
        @media (orientation: landscape) {
          .stream-portrait { display: none !important; }
          .stream-landscape { display: block !important; }
          body > nav, body > footer, body > header,
          body > div > nav, body > div > footer { display: none !important; }
          body { overflow: hidden !important; }
          main { padding: 0 !important; }
        }

        /* Force portrait mode for narrow portrait screens */
        @media (orientation: portrait) {
          .stream-portrait { display: block !important; }
          .stream-landscape { display: none !important; }
        }

        /* Mobile landscape: scale down overlay 50% */
        @media (orientation: landscape) and (max-height: 500px) {
          .overlay-scoreboard {
            transform: scale(0.5);
            transform-origin: top left;
          }
        }
      `}</style>
    </>
  )
}
