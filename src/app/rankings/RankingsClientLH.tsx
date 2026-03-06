'use client'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { ScrollReveal } from '../components/ScrollReveal'
import { WaveDivider } from '../components/WaveDivider'
import type { SeriesInfo } from '@/lib/liveheats'

/* ── Types ─────────────────────────────────────────────────── */
interface Athlete {
  id: string; name: string; nationality: string | null; image: string | null
}
interface RankResult {
  place: number | null; points: number; dropped: boolean | null
}
interface RankEntry {
  athlete: Athlete
  division: { id: string; name: string }
  place: number
  points: number
  results: RankResult[]
}

/* ── Division config ───────────────────────────────────────── */
const DIVISION_ORDER: { id: string; label: string; emoji: string; color: string }[] = [
  { id: '7747', label: 'Open Men', emoji: '', color: '#2BA5A0' },
  { id: '7746', label: 'Open Women', emoji: '', color: '#E74C9B' },
  { id: '7741', label: 'U18 Boys', emoji: '', color: '#F5A623' },
  { id: '7743', label: 'U18 Girls', emoji: '', color: '#9B59B6' },
  { id: '7740', label: 'U16 Boys', emoji: '', color: '#3498DB' },
  { id: '16171', label: 'U16 Girls', emoji: '', color: '#E91E63' },
  { id: '7739', label: 'U14 Boys', emoji: '', color: '#00BCD4' },
  { id: '16305', label: 'Longboard', emoji: '', color: '#8BC34A' },
  { id: '7744', label: 'Grand Masters', emoji: '', color: '#FF9800' },
  { id: '16304', label: 'Novis', emoji: '', color: '#4CAF50' },
]

/* ── Helpers ───────────────────────────────────────────────── */
function getPlaceSuffix(n: number) {
  if (n >= 11 && n <= 13) return 'th'
  switch (n % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

/* ── AnimatedNumber ────────────────────────────────────────── */
function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<number>(0)

  useEffect(() => {
    const start = ref.current
    const diff = value - start
    const startTime = performance.now()

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(start + diff * eased)
      setDisplay(current)
      if (progress < 1) requestAnimationFrame(tick)
      else ref.current = value
    }
    requestAnimationFrame(tick)
  }, [value, duration])

  return <>{display.toLocaleString()}</>
}

/* ── Podium ────────────────────────────────────────────────── */
function Podium({ rankings, color, events }: { rankings: RankEntry[]; color: string; events: { name: string }[] }) {
  const top3 = rankings.slice(0, 3)
  if (top3.length < 1) return null
  // Reorder for podium: [2nd, 1st, 3rd]
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3.length === 2 ? [top3[1], top3[0]] : [top3[0]]
  const heights = [140, 180, 110]
  const podiumHeights = top3.length >= 3 ? heights : top3.length === 2 ? [heights[0], heights[1]] : [heights[1]]

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 12, padding: '40px 0 0', marginBottom: 32 }}>
      {podiumOrder.map((entry, i) => {
        const actualPlace = entry.place
        const h = podiumHeights[i]
        const isFirst = actualPlace === 1
        return (
          <div key={entry.athlete.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: `podium-rise 0.6s ${i * 0.15}s both cubic-bezier(0.34, 1.56, 0.64, 1)` }}>
            {/* Avatar */}
            <div style={{
              width: isFirst ? 80 : 64, height: isFirst ? 80 : 64,
              borderRadius: '50%', marginBottom: 8, position: 'relative',
              background: entry.athlete.image ? `url(${entry.athlete.image}) center/cover` : `linear-gradient(135deg, ${color}, ${color}88)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: isFirst ? '3px solid #F5A623' : '2px solid rgba(255,255,255,0.15)',
              boxShadow: isFirst ? '0 0 24px rgba(245,166,35,0.4)' : 'none',
            }}>
              {!entry.athlete.image && (
                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: isFirst ? 24 : 18, color: '#fff' }}>
                  {getInitials(entry.athlete.name)}
                </span>
              )}
              {/* Medal */}
              <div style={{
                position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
                width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800,
                background: actualPlace === 1 ? 'linear-gradient(135deg, #F5A623, #FFD700)' : actualPlace === 2 ? 'linear-gradient(135deg, #C0C0C0, #E8E8E8)' : 'linear-gradient(135deg, #CD7F32, #DDA15E)',
                color: actualPlace === 1 ? '#000' : actualPlace === 2 ? '#333' : '#000',
                fontFamily: "'Space Grotesk',sans-serif",
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}>
                {actualPlace}
              </div>
            </div>

            {/* Name */}
            <div style={{
              fontFamily: "'Space Grotesk',sans-serif", fontWeight: isFirst ? 700 : 600,
              fontSize: isFirst ? 16 : 14, color: '#fff', textAlign: 'center',
              marginBottom: 2, maxWidth: 120,
            }}>{entry.athlete.name}</div>

            {/* Points */}
            <div style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: isFirst ? 20 : 16,
              fontWeight: 700, color,
              marginBottom: 8,
            }}>
              <AnimatedNumber value={entry.points} /> <span style={{ fontSize: 10, opacity: 0.6 }}>pts</span>
            </div>

            {/* Podium block */}
            <div style={{
              width: isFirst ? 120 : 100, height: h,
              background: actualPlace === 1
                ? `linear-gradient(180deg, ${color}, ${color}44)`
                : `linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))`,
              borderRadius: '12px 12px 0 0',
              border: '1px solid rgba(255,255,255,0.08)',
              borderBottom: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
              paddingTop: 16, gap: 4,
            }}>
              {/* Mini event results */}
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center', padding: '0 8px' }}>
                {entry.results.map((r, ri) => (
                  <div key={ri} style={{
                    width: 20, height: 20, borderRadius: 4, fontSize: 9, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'JetBrains Mono',monospace",
                    background: r.dropped ? 'rgba(255,255,255,0.04)' : r.place === 1 ? 'rgba(245,166,35,0.2)' : 'rgba(255,255,255,0.08)',
                    color: r.dropped ? 'rgba(255,255,255,0.2)' : r.place === 1 ? '#F5A623' : 'rgba(255,255,255,0.5)',
                    textDecoration: r.dropped ? 'line-through' : 'none',
                    border: r.place === 1 ? '1px solid rgba(245,166,35,0.3)' : '1px solid transparent',
                  }} title={r.place ? `Event ${ri + 1}: ${r.place}${getPlaceSuffix(r.place)} (${r.points} pts)` : `Event ${ri + 1}: DNS`}>
                    {r.place || '–'}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: "'JetBrains Mono',monospace" }}>
                {entry.results.filter(r => r.place && !r.dropped).length}/{events.length} events
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Sparkline ─────────────────────────────────────────────── */
function Sparkline({ results, color, total }: { results: RankResult[]; color: string; total: number }) {
  const maxPts = 1000
  const w = 80
  const h = 24
  const step = total > 1 ? w / (total - 1) : w / 2

  const points = results.map((r, i) => {
    const y = r.points > 0 ? h - (r.points / maxPts) * (h - 4) + 2 : h
    return `${i * step},${y}`
  }).join(' ')

  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.7}
      />
      {results.map((r, i) => r.points > 0 ? (
        <circle
          key={i}
          cx={i * step}
          cy={h - (r.points / maxPts) * (h - 4) + 2}
          r={r.place === 1 ? 3 : 2}
          fill={r.place === 1 ? '#F5A623' : color}
          opacity={r.dropped ? 0.3 : 1}
        />
      ) : null)}
    </svg>
  )
}

/* ── Main Component ────────────────────────────────────────── */
export function RankingsClientLH({ series }: { series: SeriesInfo[] }) {
  // Sort series by most recent first, default to 2025
  const sortedSeries = useMemo(() =>
    [...series].sort((a, b) => {
      const yearA = parseInt(a.name.match(/\d{4}/)?.[0] || '0')
      const yearB = parseInt(b.name.match(/\d{4}/)?.[0] || '0')
      return yearB - yearA
    }),
  [series])

  // Default to 2025 (SOTY Championship 2025)
  const default2025Idx = sortedSeries.findIndex(s => s.name.includes('2025'))
  const [seriesIdx, setSeriesIdx] = useState(default2025Idx >= 0 ? default2025Idx : 0)
  const [activeDivIdx, setActiveDivIdx] = useState(0)
  const [rankings, setRankings] = useState<RankEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const currentSeries = sortedSeries[seriesIdx]
  const completedEvents = currentSeries?.events.filter(e => e.status === 'results_published') || []
  const totalEvents = currentSeries?.events.length || 0
  const progress = totalEvents > 0 ? (completedEvents.length / totalEvents) * 100 : 0
  const activeDivision = DIVISION_ORDER[activeDivIdx]

  const fetchRankings = useCallback(async () => {
    if (!currentSeries || !activeDivision) return
    setLoading(true)
    try {
      const res = await fetch(`/api/series-rankings?seriesId=${currentSeries.id}&divisionId=${activeDivision.id}`)
      const data = await res.json()
      setRankings(data.rankings || [])
    } catch { setRankings([]) }
    setLoading(false)
  }, [currentSeries?.id, activeDivision?.id])

  useEffect(() => { fetchRankings() }, [fetchRankings])

  // Stats
  const totalAthletes = rankings.length
  const highestScore = rankings.length > 0 ? rankings[0].points : 0
  const avgEvents = rankings.length > 0
    ? (rankings.reduce((sum, r) => sum + r.results.filter(x => x.place && !x.dropped).length, 0) / rankings.length).toFixed(1)
    : '0'

  return (
    <div className="pb-20 md:pb-0">
      <style jsx global>{`
        @keyframes podium-rise {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .rank-row { transition: all 0.2s; cursor: pointer; }
        .rank-row:hover { background: rgba(43,165,160,0.08) !important; transform: translateX(4px); }
        .division-pill { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
        .division-pill:hover { transform: translateY(-2px); }
        .loading-bar {
          background: linear-gradient(90deg, transparent, rgba(43,165,160,0.3), transparent);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section style={{
        backgroundColor: '#0A2540',
        padding: '100px 24px 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: -100, right: -100,
          width: 500, height: 500,
          background: `radial-gradient(circle, ${activeDivision?.color || '#2BA5A0'}15, transparent 70%)`,
          pointerEvents: 'none', transition: 'background 0.5s',
        }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 14px', borderRadius: 100,
            background: 'rgba(43,165,160,0.1)', border: '1px solid rgba(43,165,160,0.2)',
            marginBottom: 16,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2BA5A0' }} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2BA5A0' }}>
              SOTY Championships
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
            fontSize: 'clamp(2.5rem,6vw,3.5rem)', color: '#fff',
            marginBottom: 8, lineHeight: 1.1,
          }}>
            Season <span style={{ color: activeDivision?.color || '#2BA5A0', transition: 'color 0.3s' }}>Rankings</span>
          </h1>

          {/* Series tabs */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 24 }}>
            {sortedSeries.map((s, i) => {
              const year = s.name.match(/\d{4}/)?.[0] || s.name
              const isActive = seriesIdx === i
              return (
                <button key={s.id} onClick={() => { setSeriesIdx(i); setExpandedId(null) }}
                  style={{
                    fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, fontWeight: 600,
                    padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.03)',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.35)',
                    transition: 'all 0.2s',
                  }}>
                  {year}
                </button>
              )
            })}
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                {currentSeries?.name || 'No series'}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#2BA5A0' }}>
                {completedEvents.length}/{totalEvents} events complete
              </span>
            </div>
            <div style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${progress}%`, backgroundColor: '#2BA5A0', borderRadius: 2, transition: 'width 0.5s' }} />
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
            {[
              { label: 'Athletes', value: totalAthletes, suffix: '' },
              { label: 'Leader', value: highestScore, suffix: ' pts' },
              { label: 'Avg Events', value: avgEvents, suffix: '' },
              { label: 'Season', value: progress === 100 ? 'Complete' : 'Active', suffix: '' },
            ].map(stat => (
              <div key={stat.label} style={{
                padding: '12px 20px', background: 'rgba(255,255,255,0.03)',
                borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
                  {stat.label}
                </div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 700, color: '#fff' }}>
                  {typeof stat.value === 'number' ? <AnimatedNumber value={stat.value} /> : stat.value}{stat.suffix}
                </div>
              </div>
            ))}
          </div>

          {/* Division pills */}
          <div style={{
            display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 0,
          }}>
            {DIVISION_ORDER.map((div, i) => {
              const isActive = activeDivIdx === i
              return (
                <button key={div.id} className="division-pill"
                  onClick={() => { setActiveDivIdx(i); setExpandedId(null) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 100, border: 'none', cursor: 'pointer',
                    backgroundColor: isActive ? `${div.color}22` : 'rgba(255,255,255,0.03)',
                    color: isActive ? div.color : 'rgba(255,255,255,0.4)',
                    fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 600,
                    borderWidth: 1, borderStyle: 'solid',
                    borderColor: isActive ? `${div.color}44` : 'transparent',
                    transition: 'all 0.25s',
                  }}>
                  {div.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <WaveDivider color="#FFFFFF" bg="#0A2540" />

      {/* ── Podium + Rankings (WHITE SECTION) ──────────────── */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '48px 24px 60px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {loading ? (
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
              <div className="loading-bar" style={{ height: 3, borderRadius: 2, maxWidth: 200, margin: '0 auto 16px' }} />
              <p style={{ color: 'rgba(10,37,64,0.3)', fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>Loading rankings...</p>
            </div>
          ) : rankings.length === 0 ? (
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}></div>
              <p style={{ color: 'rgba(10,37,64,0.3)', fontFamily: "'Space Grotesk',sans-serif", fontSize: 16 }}>
                No rankings for this division yet
              </p>
            </div>
          ) : (
            <>
              {/* Podium */}
              <ScrollReveal>
                <div style={{ background: '#0A2540', borderRadius: 20, padding: '8px 24px 0', marginBottom: 32 }}>
                  <Podium rankings={rankings} color={activeDivision.color} events={currentSeries?.events || []} />
                </div>
              </ScrollReveal>

              {/* Event header row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '48px 1fr 80px 80px',
                padding: '12px 16px', marginBottom: 4,
                borderBottom: '1px solid rgba(10,37,64,0.08)',
              }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(10,37,64,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>#</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(10,37,64,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Athlete</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(10,37,64,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>Form</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(10,37,64,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Points</span>
              </div>

              {/* Rankings list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {rankings.map((entry, i) => {
                  const isExpanded = expandedId === entry.athlete.id
                  const eventsPlayed = entry.results.filter(r => r.place && !r.dropped).length
                  const totalEvts = currentSeries?.events.length || 0
                  const winCount = entry.results.filter(r => r.place === 1).length
                  const podiumCount = entry.results.filter(r => r.place && r.place <= 3 && !r.dropped).length
                  const bestResult = Math.min(...entry.results.filter(r => r.place).map(r => r.place!))
                  const gap = i > 0 ? rankings[0].points - entry.points : 0

                  return (
                    <div key={entry.athlete.id}
                      className="rank-row"
                      onClick={() => setExpandedId(isExpanded ? null : entry.athlete.id)}
                      style={{
                        borderRadius: 12,
                        background: isExpanded ? `${activeDivision.color}08` : i < 3 ? 'rgba(10,37,64,0.02)' : 'transparent',
                        border: isExpanded ? `1px solid ${activeDivision.color}33` : '1px solid transparent',
                        animation: `fade-in 0.3s ${Math.min(i * 0.03, 0.5)}s both`,
                        overflow: 'hidden',
                      }}>
                      {/* Main row */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '48px 1fr 80px 80px',
                        padding: '12px 16px',
                        alignItems: 'center',
                      }}>
                        {/* Rank */}
                        <div style={{
                          fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
                          fontSize: i < 3 ? 18 : 14,
                          color: i === 0 ? '#F5A623' : i === 1 ? '#A0A0A0' : i === 2 ? '#CD7F32' : 'rgba(10,37,64,0.25)',
                        }}>
                          {entry.place}
                        </div>

                        {/* Athlete */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                            background: entry.athlete.image ? `url(${entry.athlete.image}) center/cover` : `linear-gradient(135deg, ${activeDivision.color}88, ${activeDivision.color}44)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: i < 3 ? `2px solid ${activeDivision.color}44` : '2px solid rgba(10,37,64,0.08)',
                          }}>
                            {!entry.athlete.image && (
                              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 12, color: '#fff' }}>
                                {getInitials(entry.athlete.name)}
                              </span>
                            )}
                          </div>
                          <div>
                            <div style={{
                              fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14, color: '#0A2540',
                            }}>
                              {entry.athlete.name}
                              {winCount > 0 && <span style={{ marginLeft: 6, fontSize: 11 }} title={`${winCount} event win${winCount > 1 ? 's' : ''}`}>🏆×{winCount}</span>}
                            </div>
                            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(10,37,64,0.35)', marginTop: 1 }}>
                              {eventsPlayed}/{totalEvts} events{entry.athlete.nationality ? ` · ${entry.athlete.nationality}` : ''}
                            </div>
                          </div>
                        </div>

                        {/* Sparkline */}
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <Sparkline results={entry.results} color={activeDivision.color} total={totalEvts} />
                        </div>

                        {/* Points */}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
                            fontSize: 16, color: i < 3 ? activeDivision.color : '#0A2540',
                          }}>
                            <AnimatedNumber value={entry.points} />
                          </div>
                          {gap > 0 && (
                            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(10,37,64,0.2)', marginTop: 1 }}>
                              -{gap}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div style={{
                          padding: '0 16px 16px 76px',
                          animation: 'fade-in 0.2s both',
                        }}>
                          {/* Event-by-event breakdown */}
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                            {(currentSeries?.events || []).map((evt, ei) => {
                              const r = entry.results[ei]
                              const evtName = evt.name.replace(/SOTY Championship \d{4}\s*/, '').replace(/^Event #\d+\s*/, 'Event ' + (ei + 1) + ' ').trim()
                              return (
                                <div key={ei} style={{
                                  padding: '8px 14px', borderRadius: 10,
                                  background: r?.place === 1 ? 'rgba(245,166,35,0.08)' : 'rgba(10,37,64,0.03)',
                                  border: r?.place === 1 ? '1px solid rgba(245,166,35,0.2)' : '1px solid rgba(10,37,64,0.06)',
                                  opacity: r?.dropped ? 0.4 : 1,
                                  minWidth: 100,
                                }}>
                                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(10,37,64,0.35)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                                    {evtName || `Event ${ei + 1}`}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                    <span style={{
                                      fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 18,
                                      color: r?.place === 1 ? '#F5A623' : r?.place ? '#0A2540' : 'rgba(10,37,64,0.15)',
                                    }}>
                                      {r?.place ? `${r.place}${getPlaceSuffix(r.place)}` : 'DNS'}
                                    </span>
                                    {r?.points > 0 && (
                                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: activeDivision.color }}>
                                        {r.points} pts
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {/* Summary stats */}
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            {[
                              { label: 'Best', value: bestResult < Infinity ? `${bestResult}${getPlaceSuffix(bestResult)}` : '–' },
                              { label: 'Podiums', value: `${podiumCount}/${eventsPlayed}` },
                              { label: 'Wins', value: winCount.toString() },
                              { label: 'Total Pts', value: entry.points.toLocaleString() },
                            ].map(s => (
                              <div key={s.label}>
                                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'rgba(10,37,64,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
                                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14, color: '#0A2540' }}>{s.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </section>

      <WaveDivider color="#0A2540" bg="#FFFFFF" />

      {/* ── Season Events (NAVY SECTION) ───────────────────── */}
      <section style={{ backgroundColor: '#0A2540', padding: '48px 24px 60px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <ScrollReveal>
            <h2 style={{
              fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 24,
              color: '#fff', marginBottom: 20,
            }}>
              Season Events
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {(currentSeries?.events || []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((evt, i) => {
                const isComplete = evt.status === 'results_published'
                const d = new Date(evt.date)
                const shortName = evt.name.replace(/SOTY Championship \d{4}\s*/, '').replace(/^Event #\d+\s*/, '').trim()
                return (
                  <a key={evt.id} href={`/events/${evt.id}`} style={{
                    padding: '16px 20px', borderRadius: 12,
                    background: isComplete ? 'rgba(43,165,160,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isComplete ? 'rgba(43,165,160,0.15)' : 'rgba(255,255,255,0.06)'}`,
                    textDecoration: 'none', transition: 'all 0.2s',
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: isComplete ? '#2BA5A0' : 'rgba(255,255,255,0.3)' }}>
                        Event {i + 1}
                      </span>
                      <span style={{
                        fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                        fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.05em',
                        background: isComplete ? 'rgba(43,165,160,0.15)' : 'rgba(245,166,35,0.1)',
                        color: isComplete ? '#2BA5A0' : '#F5A623',
                      }}>
                        {isComplete ? '✓ Results' : 'Upcoming'}
                      </span>
                    </div>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14, color: '#fff' }}>
                      {shortName || evt.name}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                      {d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  </a>
                )
              })}
            </div>
          </ScrollReveal>
        </div>
      </section>

    </div>
  )
}
