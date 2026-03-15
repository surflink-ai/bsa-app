'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ── Config ──
const YOUTUBE_VIDEO_ID = 'Xk8qZEY-KJw'
const POLL_INTERVAL = 3_000
const SCORES_API = '/api/stream/scores'

// ── Types ──
interface RideScore { total: number; scoring_ride?: boolean }
interface HeatResult {
  place: number; total: number; needs: number | null; winBy: number | null
  rides: Record<string, RideScore[]>
  competitor: { athlete: { id: string; name: string }; bib: string | null }
}
interface HeatCompetitor {
  position: number; priority: number | null; athlete: { id: string; name: string }
}
interface Heat {
  id: string; position: number; round: string
  startTime: string | null; endTime: string | null
  heatDurationMinutes: number | null
  config: { totalCountingRides: number; maxRideScore: number; jerseyOrder: string[]; hasPriority: boolean }
  competitors: HeatCompetitor[]
  result: HeatResult[]
}
interface EventDivision {
  id: string; division: { id: string; name: string }; status: string; heats: Heat[]
}

// ── Helpers ──
const JERSEY_HEX: Record<string, string> = {
  red: '#DC2626', white: '#E2E8F0', green: '#16A34A', blue: '#2563EB',
  black: '#374151', yellow: '#EAB308', pink: '#EC4899', orange: '#EA580C',
}

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

function getPendingCount(rides: Record<string, RideScore[]>): number {
  let count = 0
  for (const rideList of Object.values(rides)) for (const r of rideList) if (r.total == null) count++
  return count
}

function getJerseyColor(heat: Heat, athleteId: string): string | null {
  const comp = heat.competitors?.find(c => c.athlete.id === athleteId)
  if (comp == null || !heat.config.jerseyOrder) return null
  return heat.config.jerseyOrder[comp.position] || null
}

function hasPriority(heat: Heat, athleteId: string): boolean {
  if (!heat.config.hasPriority) return false
  const comp = heat.competitors?.find(c => c.athlete.id === athleteId)
  return comp?.priority === 1
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

function formatTime(ms: number): string {
  if (ms <= 0) return '0:00'
  const mins = Math.floor(ms / 60000)
  const secs = Math.floor((ms % 60000) / 1000)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// ── Sub-components ──

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

function HeatPickers({ scoredDivisions, divisions, currentDiv, selectedDivId, selectedHeatId, setSelectedDivId, setSelectedHeatId, dark }: {
  scoredDivisions: EventDivision[]; divisions: EventDivision[]; currentDiv: EventDivision | undefined
  selectedDivId: string | null; selectedHeatId: string | null
  setSelectedDivId: (id: string) => void; setSelectedHeatId: (id: string) => void
  dark?: boolean
}) {
  const bg = dark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.06)'
  const border = dark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.1)'
  const optBg = dark ? '#111' : '#0A2540'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {scoredDivisions.length > 0 && (
        <select value={selectedDivId || ''} onClick={e => e.stopPropagation()} onChange={e => {
          const id = e.target.value; setSelectedDivId(id)
          const div = divisions.find(d => d.id === id)
          if (div) { const s = div.heats.filter(h => h.result.some(r => r.total > 0)); if (s.length) setSelectedHeatId(s[s.length - 1].id) }
        }} style={{ background: bg, border, borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
          {scoredDivisions.map(d => <option key={d.id} value={d.id} style={{ background: optBg }}>{d.division.name}</option>)}
        </select>
      )}
      {currentDiv && (
        <select value={selectedHeatId || ''} onClick={e => e.stopPropagation()} onChange={e => setSelectedHeatId(e.target.value)}
          style={{ background: bg, border, borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer', outline: 'none' }}>
          {currentDiv.heats
            .filter(h => h.result.some(r => r.total > 0) || (h.startTime && !h.endTime))
            .map(h => <option key={h.id} value={h.id} style={{ background: optBg }}>{h.round} {h.position > 0 ? `H${h.position}` : ''}</option>)}
        </select>
      )}
    </div>
  )
}

function TimerBar({ currentDiv, currentHeat, heatIsLive, timeRemaining, size }: {
  currentDiv: EventDivision | undefined; currentHeat: Heat | undefined
  heatIsLive: boolean; timeRemaining: number | null; size: 'sm' | 'lg'
}) {
  const isSm = size === 'sm'
  const urgent = timeRemaining !== null && timeRemaining < 120000
  const warning = timeRemaining !== null && timeRemaining < 300000 && !urgent
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: isSm ? '5px 12px' : '10px 14px',
      background: urgent ? 'rgba(220,38,38,0.08)' : 'rgba(255,255,255,0.04)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      transition: 'background 0.5s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
        {heatIsLive && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 7px', borderRadius: 3, background: 'rgba(220,38,38,0.9)',
            fontSize: isSm ? 7 : 8, fontWeight: 700, color: '#fff',
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em',
          }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s ease-in-out infinite' }} />
            LIVE
          </span>
        )}
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif", fontSize: isSm ? 10 : 11, fontWeight: 700,
          color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {currentDiv?.division.name}
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: isSm ? 8 : 9,
          color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap',
        }}>
          {currentHeat?.round} {currentHeat && currentHeat.position > 0 ? `H${currentHeat.position}` : ''}
        </span>
      </div>
      {timeRemaining !== null && (
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: isSm ? 13 : 18, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
          color: urgent ? '#DC2626' : warning ? '#EAB308' : '#2BA5A0',
          animation: urgent ? 'timerPulse 1s ease-in-out infinite' : 'none',
          transition: 'color 0.5s ease',
          flexShrink: 0, marginLeft: 12,
        }}>
          {formatTime(timeRemaining)}
        </span>
      )}
    </div>
  )
}

function ScoreRows({ sorted, heat, isCompact }: { sorted: HeatResult[]; heat: Heat; isCompact?: boolean }) {
  const anyoneScored = sorted.some(r => r.total > 0)
  const fs = isCompact
    ? { pos: 11, name: 12, needs: 8, wave: 8, total: 15, row: 48 }
    : { pos: 16, name: 14, needs: 10, wave: 10, total: 20, row: 64 }
  return (
    <>
      {sorted.map((r, i) => {
        const isLeader = i === 0 && r.total > 0
        const waves = getAllWaves(r.rides)
        const topWaves = getTopWaves(r.rides, heat.config.totalCountingRides)
        const pending = getPendingCount(r.rides)
        const jersey = getJerseyColor(heat, r.competitor.athlete.id)
        const hasPri = hasPriority(heat, r.competitor.athlete.id)
        const bestWave = waves.length > 0 ? Math.max(...waves) : 0
        const isExcellent = bestWave >= 8
        const isGood = bestWave >= 6 && !isExcellent

        return (
          <div key={r.competitor.athlete.id} className="score-row" style={{
            display: 'grid',
            gridTemplateColumns: isCompact ? '16px 1fr 58px' : '24px 1fr 64px',
            alignItems: 'center', gap: isCompact ? 6 : 10,
            padding: isCompact ? '0 12px' : '0 14px', height: fs.row,
            background: isLeader
              ? 'linear-gradient(90deg, rgba(43,165,160,0.1) 0%, rgba(43,165,160,0.03) 100%)'
              : 'transparent',
            borderBottom: i < sorted.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            transition: 'background 0.3s ease',
          }}>
            {/* Position */}
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: fs.pos, fontWeight: 700,
              color: isLeader ? '#2BA5A0' : 'rgba(255,255,255,0.25)',
            }}>{r.place}</span>

            {/* Name + Jersey + Priority + Needs */}
            <div style={{ minWidth: 0 }}>
              <span style={{
                fontFamily: "'Space Grotesk', sans-serif", fontSize: fs.name,
                fontWeight: isLeader ? 700 : 500, color: '#fff',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                display: 'flex', alignItems: 'center', gap: isCompact ? 4 : 6,
              }}>
                <JerseyDot color={jersey} size={isCompact ? 8 : 10} />
                {r.competitor.athlete.name}
                {hasPri && (
                  <span style={{
                    fontSize: isCompact ? 7 : 8, fontWeight: 800,
                    color: '#FFD700', fontFamily: "'JetBrains Mono', monospace",
                    background: 'rgba(255,215,0,0.15)', padding: '0 4px', borderRadius: 2,
                    letterSpacing: '0.05em',
                  }}>P</span>
                )}
              </span>
              {/* Wave scores — below name */}
              <div style={{ display: 'flex', gap: isCompact ? 2 : 3, flexWrap: 'nowrap', alignItems: 'center', marginTop: 2 }}>
                {waves.slice(0, isCompact ? 4 : 6).map((w, wi) => {
                  const isCounting = topWaves.includes(w)
                  const isBest = w === bestWave && waves.length > 1
                  return (
                    <span key={wi} style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: fs.wave,
                      padding: isCompact ? '1px 3px' : '2px 5px', borderRadius: 3,
                      color: isCounting ? '#2BA5A0' : 'rgba(255,255,255,0.2)',
                      background: isCounting ? 'rgba(43,165,160,0.12)' : 'transparent',
                      fontWeight: isCounting ? 700 : 400,
                      border: isBest && isExcellent ? '1px solid rgba(43,165,160,0.3)' : isBest && isGood ? '1px solid rgba(43,165,160,0.15)' : 'none',
                    }}>{w.toFixed(1)}</span>
                  )
                })}
                {Array.from({ length: pending }).map((_, pi) => (
                  <span key={`p${pi}`} className="ghost-pill" style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: fs.wave,
                    padding: isCompact ? '1px 3px' : '2px 5px', borderRadius: 3,
                    color: 'rgba(43,165,160,0.4)',
                    border: '1px solid rgba(43,165,160,0.25)',
                    background: 'rgba(43,165,160,0.05)',
                    animation: 'ghostPulse 1.8s ease-in-out infinite',
                  }}>–.–</span>
                ))}
                {waves.length > (isCompact ? 4 : 6) && (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: fs.wave - 1, color: 'rgba(255,255,255,0.12)' }}>
                    +{waves.length - (isCompact ? 4 : 6)}
                  </span>
                )}
                {anyoneScored && r.needs != null && r.needs > 0 && i > 0 && (
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: fs.needs,
                    color: 'rgba(255,255,255,0.25)', marginLeft: 4,
                  }}>needs {r.needs.toFixed(2)}</span>
                )}
              </div>
            </div>

            {/* Total */}
            <span className="score-total" style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: r.total > 0 ? fs.total : isCompact ? 7 : 9,
              fontWeight: r.total > 0 ? 800 : 500, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
              color: isLeader ? '#2BA5A0' : r.total > 0 ? '#fff' : 'rgba(255,255,255,0.2)',
              transition: 'color 0.3s ease',
              letterSpacing: r.total > 0 ? undefined : '0.04em',
            }}>{r.total > 0 ? r.total.toFixed(2) : 'waiting'}</span>
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
  const heatIsLive = !!(currentHeat?.startTime && !currentHeat?.endTime)
  const heatDuration = (currentHeat?.heatDurationMinutes || 20) * 60 * 1000
  const timeRemaining = heatIsLive && currentHeat?.startTime
    ? Math.max(0, heatDuration - (now - new Date(currentHeat.startTime).getTime()))
    : null
  const sorted = currentHeat?.result.sort((a, b) => a.place - b.place) || []

  const handleTap = () => {
    setShowControls(true)
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
    controlsTimeout.current = setTimeout(() => setShowControls(false), 5000)
  }

  const pickerProps = { scoredDivisions, divisions, currentDiv, selectedDivId, selectedHeatId, setSelectedDivId, setSelectedHeatId }
  const timerProps = { currentDiv, currentHeat, heatIsLive, timeRemaining }

  return (
    <>
      {/* ═══ PORTRAIT — Video + Full Scoreboard ═══ */}
      <div className="stream-portrait">
        <div style={{ width: '100%', position: 'relative', paddingTop: '56.25%', background: '#000' }}>
          <iframe
            src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1`}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {currentHeat && (
          <div style={{ background: '#0A2540', minHeight: '50vh' }}>
            <TimerBar {...timerProps} size="lg" />
            <div style={{ padding: '10px 14px 0' }}>
              <HeatPickers {...pickerProps} />
            </div>
            <div style={{
              margin: '10px 14px', background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden',
            }}>
              <ScoreRows sorted={sorted} heat={currentHeat} />
            </div>
            <div style={{
              textAlign: 'center', padding: '4px 0 20px',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
              color: 'rgba(255,255,255,0.1)', letterSpacing: '0.12em',
            }}>BSA · LIVEHEATS · LIVE SCORING</div>
          </div>
        )}

        {!currentHeat && (
          <div style={{
            background: '#0A2540', minHeight: '40vh', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.2)' }}>
              Waiting for scores...
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.1)' }}>
              Scores will appear when the next heat starts
            </div>
          </div>
        )}
      </div>

      {/* ═══ LANDSCAPE — Fullscreen + Overlay ═══ */}
      <div className="stream-landscape" onClick={handleTap} style={{
        position: 'fixed', inset: 0, background: '#000', zIndex: 9999, overflow: 'hidden',
      }}>
        <iframe
          src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1&controls=0&showinfo=0&iv_load_policy=3`}
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100vw', height: '56.25vw', minHeight: '100vh', minWidth: '177.78vh', border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />

        {currentHeat && (
          <div className="overlay-scoreboard" style={{
            position: 'absolute', top: 16, left: 16, zIndex: 10,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)',
            borderRadius: 8, overflow: 'hidden', minWidth: 220,
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}>
            <TimerBar {...timerProps} size="sm" />
            <ScoreRows sorted={sorted} heat={currentHeat} isCompact />
          </div>
        )}

        {showControls && (
          <div style={{
            position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            zIndex: 20, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)',
            borderRadius: 10, padding: '8px 12px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <HeatPickers {...pickerProps} dark />
          </div>
        )}
      </div>

      {/* ── CSS ── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes timerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes ghostPulse {
          0%, 100% { opacity: 1; border-color: rgba(43,165,160,0.25); }
          50% { opacity: 0.4; border-color: rgba(43,165,160,0.1); }
        }

        .score-row {
          transition: background 0.3s ease;
        }

        /* Portrait default */
        .stream-portrait { display: block; }
        .stream-landscape { display: none !important; }

        /* Landscape → overlay mode */
        @media (orientation: landscape) {
          .stream-portrait { display: none !important; }
          .stream-landscape { display: block !important; }
          body > nav, body > footer, body > header,
          body > div > nav, body > div > footer { display: none !important; }
          body { overflow: hidden !important; }
          main { padding: 0 !important; }
        }

        /* Mobile landscape: scale overlay 50% */
        @media (orientation: landscape) and (max-height: 500px) {
          .overlay-scoreboard {
            transform: scale(0.5);
            transform-origin: top left;
          }
        }

        /* Portrait always wins */
        @media (orientation: portrait) {
          .stream-portrait { display: block !important; }
          .stream-landscape { display: none !important; }
        }

        /* Smooth select styling */
        select { -webkit-appearance: none; appearance: none; }
        select option { padding: 8px; }
      `}</style>
    </>
  )
}
