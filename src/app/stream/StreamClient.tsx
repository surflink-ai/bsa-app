'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

// ── Config ──
const POLL_INTERVAL = 3_000
const SCORES_API = '/api/stream/scores'

// ── Props ──
interface VODEntry { id: string; title: string; youtube_id: string; date: string; thumbnail?: string }
interface StreamProps {
  active: boolean
  title: string | null
  streamUrl: string | null
  embedCode: string | null
  sourceType: string
  youtubeVideoId: string | null
  overlayEnabled: boolean
  vodEnabled: boolean
  vodPlaylist: VODEntry[]
  scheduledTime: string | null
  scheduledTitle: string | null
}

// ── Score Types ──
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

function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i) }, [])
  const diff = Math.max(0, new Date(target).getTime() - now)
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  const units = [
    { label: 'DAYS', value: d }, { label: 'HRS', value: h },
    { label: 'MIN', value: m }, { label: 'SEC', value: s },
  ]
  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
      {units.map(u => (
        <div key={u.label} style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, color: '#fff' }}>{String(u.value).padStart(2, '0')}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.15em' }}>{u.label}</div>
        </div>
      ))}
    </div>
  )
}

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
            .map(h => <option key={h.id} value={h.id} style={{ background: optBg }}>{h.round} H{h.position + 1}</option>)}
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
          {currentHeat?.round} {currentHeat != null ? `H${currentHeat.position + 1}` : ''}
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
export function StreamClient({ config }: { config: StreamProps | null }) {
  const [divisions, setDivisions] = useState<EventDivision[]>([])
  const [selectedDivId, setSelectedDivId] = useState<string | null>(null)
  const [selectedHeatId, setSelectedHeatId] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [selectedVOD, setSelectedVOD] = useState<VODEntry | null>(null)
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

  useEffect(() => {
    if (config?.active) {
      fetchData()
      const i = setInterval(fetchData, POLL_INTERVAL)
      return () => clearInterval(i)
    }
  }, [fetchData, config?.active])

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

  // Get the YouTube embed URL from config
  const youtubeEmbedUrl = config?.youtubeVideoId
    ? `https://www.youtube.com/embed/${config.youtubeVideoId}?rel=0&modestbranding=1&playsinline=1&controls=0&showinfo=0&iv_load_policy=3`
    : config?.embedCode || null

  const youtubeEmbedUrlLandscape = config?.youtubeVideoId
    ? `https://www.youtube.com/embed/${config.youtubeVideoId}?rel=0&modestbranding=1&playsinline=1&controls=0&showinfo=0&iv_load_policy=3`
    : config?.embedCode || null

  // ── LIVE — Full scoring experience ──
  if (config?.active && (config.youtubeVideoId || config.embedCode)) {
    return (
      <>
        {/* ═══ PORTRAIT / DESKTOP — Video + Scoreboard in one viewport ═══ */}
        <div className="stream-portrait" style={{
          backgroundColor: '#0A2540', height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Video — takes its natural 16:9 space */}
          <div style={{ width: '100%', background: '#000', flexShrink: 0 }}>
            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
              <iframe
                src={youtubeEmbedUrl!}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          {/* Scoreboard — fills remaining space */}
          {currentHeat && (
            <div style={{ flex: 1, overflow: 'auto', background: '#0A2540' }}>
              <TimerBar {...timerProps} size="lg" />
              <div style={{ padding: '8px 14px 0' }}>
                <HeatPickers {...pickerProps} />
              </div>
              <div style={{
                margin: '8px 14px', background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden',
              }}>
                <ScoreRows sorted={sorted} heat={currentHeat} />
              </div>
              <div style={{
                textAlign: 'center', padding: '4px 0 8px',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
                color: 'rgba(255,255,255,0.1)', letterSpacing: '0.12em',
              }}>BSA · LIVEHEATS · LIVE SCORING</div>
            </div>
          )}

          {!currentHeat && (
            <div style={{
              flex: 1, background: '#0A2540', display: 'flex',
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

        {/* ═══ DESKTOP — BSA page with video + overlay scoreboard ═══ */}
        <div className="stream-desktop" onClick={handleTap} style={{ backgroundColor: '#0A2540', cursor: 'pointer' }}>
          <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000' }}>
            <iframe
              src={youtubeEmbedUrl!}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            {currentHeat && (
              <div className="overlay-scoreboard" style={{
                position: 'absolute', top: 16, left: 16, zIndex: 10,
                background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)',
                borderRadius: 8, overflow: 'hidden', minWidth: 280,
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              }}>
                <TimerBar {...timerProps} size="sm" />
                <ScoreRows sorted={sorted} heat={currentHeat} isCompact />
              </div>
            )}
            {showControls && (
              <div style={{
                position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                zIndex: 20, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)',
                borderRadius: 10, padding: '8px 12px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <HeatPickers {...pickerProps} dark />
              </div>
            )}
          </div>
          <div style={{
            textAlign: 'center', padding: '12px 0',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
            color: 'rgba(255,255,255,0.15)', letterSpacing: '0.12em',
          }}>BSA · LIVEHEATS · LIVE SCORING · TAP VIDEO TO CHANGE HEAT</div>
        </div>

        {/* ═══ MOBILE LANDSCAPE — Fullscreen + Overlay ═══ */}
        <div className="stream-landscape" onClick={handleTap} style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: '#000', zIndex: 9999, overflow: 'hidden',
        }}>
          <iframe
            src={youtubeEmbedUrlLandscape!}
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

          /* Default: desktop view (BSA page + video with overlay) */
          .stream-portrait { display: none; }
          .stream-desktop { display: block; }
          .stream-landscape { display: none; }

          /* Mobile portrait (phones upright, <=768px) → stacked layout */
          @media (orientation: portrait) and (max-width: 768px) {
            .stream-portrait { display: flex !important; }
            .stream-desktop { display: none !important; }
            .stream-landscape { display: none !important; }
          }

          /* Mobile landscape (small screens rotated) → fullscreen overlay */
          @media (orientation: landscape) and (max-height: 500px) {
            .stream-portrait { display: none !important; }
            .stream-desktop { display: none !important; }
            .stream-landscape { display: block !important; }
            body > nav, body > footer, body > header,
            body > div > nav, body > div > footer { display: none !important; }
            body { overflow: hidden !important; margin: 0 !important; padding: 0 !important; }
            main { padding: 0 !important; margin: 0 !important; }
            html { overflow: hidden !important; }

            .overlay-scoreboard {
              transform: scale(0.5);
              transform-origin: top left;
            }
          }

          /* Smooth select styling */
          select { -webkit-appearance: none; appearance: none; }
          select option { padding: 8px; }
        `}</style>
      </>
    )
  }

  // ── VOD PLAYER (selected video) ──
  if (selectedVOD) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0A2540', padding: '24px 16px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <button onClick={() => setSelectedVOD(null)} style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'rgba(255,255,255,0.4)',
            background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16, padding: 0,
          }}>← Back to Library</button>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 16 }}>{selectedVOD.title}</h2>
          <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' }}>
            <iframe
              src={`https://www.youtube.com/embed/${selectedVOD.youtube_id}?autoplay=1`}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    )
  }

  // ── OFFLINE with Countdown or VOD Library ──
  const hasSchedule = config?.scheduledTime && new Date(config.scheduledTime) > new Date()
  const hasVOD = config?.vodEnabled && (config.vodPlaylist || []).length > 0
  const vodList = config?.vodPlaylist || []

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A2540' }}>
      <div style={{
        padding: hasSchedule ? '80px 24px 60px' : '120px 24px', textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: hasVOD ? 'auto' : '60vh',
      }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#2BA5A0', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 16 }}>
          {hasSchedule ? 'NEXT LIVE STREAM' : 'BSA LIVE'}
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 3rem)', fontWeight: 700, color: '#fff', marginBottom: 16, maxWidth: 600 }}>
          {hasSchedule
            ? config?.scheduledTitle || 'Upcoming Event'
            : 'No Live Stream Right Now'
          }
        </h1>

        {hasSchedule && config?.scheduledTime && (
          <>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>
              {new Date(config.scheduledTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              {' at '}
              {new Date(config.scheduledTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </div>
            <Countdown target={config.scheduledTime} />
          </>
        )}

        {!hasSchedule && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: 'rgba(255,255,255,0.4)', maxWidth: 400 }}>
            Check back during BSA events for live competition coverage with real-time scoring.
          </p>
        )}

        <Link href="/" style={{
          marginTop: 32, fontFamily: "'Space Grotesk', sans-serif", fontSize: 14,
          fontWeight: 600, color: '#2BA5A0', textDecoration: 'none',
        }}>
          ← Back to bsa.surf
        </Link>
      </div>

      {hasVOD && (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 80px' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#2BA5A0',
            textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 24,
          }}>
            Event Replays
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {vodList.map(vod => (
              <button key={vod.id} onClick={() => setSelectedVOD(vod)} style={{
                display: 'block', textAlign: 'left', cursor: 'pointer',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12, overflow: 'hidden', padding: 0, width: '100%',
              }}>
                <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
                  {vod.thumbnail && <img src={vod.thumbnail} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ width: 0, height: 0, borderLeft: '16px solid #fff', borderTop: '10px solid transparent', borderBottom: '10px solid transparent', marginLeft: 4 }} />
                  </div>
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{vod.title}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{vod.date}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
