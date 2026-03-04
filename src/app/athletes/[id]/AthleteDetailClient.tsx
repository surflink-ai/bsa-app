'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ScrollReveal } from '../../components/ScrollReveal'
import { WaveDivider } from '../../components/WaveDivider'

interface ResultEntry { eid: string; ename: string; date: string; div: string; place: number; total: number; fieldSize: number }
interface HeatEntry { eid: string; ename: string; date: string; div: string; round: string; heatPos: number; place: number; total: number; waves: number[]; opponents: { name: string; total: number; place: number }[] }
interface Rival { name: string; wins: number; losses: number; heats: number }

const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']
const placeBg = ['rgba(255,215,0,0.08)', 'rgba(192,192,192,0.08)', 'rgba(205,127,50,0.08)']

function StatCard({ value, label, sub, accent }: { value: string; label: string; sub?: string; accent?: string }) {
  return (
    <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '18px 16px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      {accent && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: accent }} />}
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 28, color: accent || '#fff', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function PlacementChart({ results }: { results: ResultEntry[] }) {
  if (results.length === 0) return null
  const sorted = [...results].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const maxField = Math.max(...sorted.map(r => r.fieldSize), 10)
  return (
    <div style={{ padding: '16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
        {sorted.map((r, i) => {
          const height = Math.max(((maxField - r.place + 1) / maxField) * 100, 8)
          const color = r.place === 1 ? '#FFD700' : r.place <= 3 ? '#2BA5A0' : '#1478B5'
          return (
            <Link key={`${r.eid}-${r.div}-${i}`} href={`/events/${r.eid}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', minWidth: 0 }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, color, marginBottom: 2 }}>{r.place <= 3 ? `#${r.place}` : ''}</span>
              <div style={{ width: '100%', maxWidth: 32, height: `${height}%`, backgroundColor: `${color}30`, borderRadius: '4px 4px 0 0', border: `1px solid ${color}50`, borderBottom: 'none', transition: 'height 0.3s', position: 'relative' }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', backgroundColor: `${color}40`, borderRadius: '0 0 0 0' }} />
              </div>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: 'rgba(255,255,255,0.2)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', textAlign: 'center' }}>{new Date(r.date).toLocaleDateString('en-US', { month: 'short' }).slice(0, 3)}</span>
            </Link>
          )
        })}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'rgba(255,255,255,0.15)', textAlign: 'center', marginTop: 8 }}>Event Placements Over Time (lower bar = further from 1st)</div>
    </div>
  )
}

function WaveScoreDistribution({ heats }: { heats: HeatEntry[] }) {
  const allWaves = heats.flatMap(h => h.waves).filter(w => w > 0)
  if (allWaves.length === 0) return null
  const buckets = [0, 0, 0, 0, 0] // 0-2, 2-4, 4-6, 6-8, 8-10
  for (const w of allWaves) {
    const idx = Math.min(Math.floor(w / 2), 4)
    buckets[idx]++
  }
  const maxBucket = Math.max(...buckets, 1)
  const labels = ['0-2', '2-4', '4-6', '6-8', '8-10']
  const colors = ['rgba(26,26,26,0.15)', 'rgba(20,120,181,0.4)', '#1478B5', '#2BA5A0', '#FFD700']

  return (
    <div>
      <h3 style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(26,26,26,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Wave Score Distribution</h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
        {buckets.map((count, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 600, color: count > 0 ? '#0A2540' : 'rgba(26,26,26,0.15)', marginBottom: 4 }}>{count || ''}</span>
            <div style={{ width: '100%', height: `${(count / maxBucket) * 60}px`, minHeight: count > 0 ? 4 : 0, backgroundColor: colors[i], borderRadius: 3, transition: 'height 0.3s' }} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'rgba(26,26,26,0.3)', marginTop: 4 }}>{labels[i]}</span>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'rgba(26,26,26,0.2)', textAlign: 'center', marginTop: 8 }}>{allWaves.length} waves total · avg {(allWaves.reduce((s, w) => s + w, 0) / allWaves.length).toFixed(2)}</div>
    </div>
  )
}

interface CompResult {
  event_name: string; event_date: string; division: string; round: string
  heat_number: number; result_position: number | null
  waves: { wave_number: number; score: number }[]
}
interface SeasonPoint {
  season_name: string; division: string; total_points: number
  events_counted: number; best_result: number | null
}

export function AthleteDetailClient({ athlete, results, heats, rivals, compResults = [], seasonPoints = [] }: {
  athlete: { id: string; name: string; image: string | null }
  results: ResultEntry[]
  heats: HeatEntry[]
  rivals: Rival[]
  compResults?: CompResult[]
  seasonPoints?: SeasonPoint[]
}) {
  const [tab, setTab] = useState<'overview' | 'heats' | 'rivals'>('overview')

  const stats = useMemo(() => {
    const wins = results.filter(r => r.place === 1).length
    const podiums = results.filter(r => r.place <= 3).length
    const bestScore = Math.max(...results.map(r => r.total || 0), 0)
    const avgScore = results.length > 0 ? results.reduce((s, r) => s + r.total, 0) / results.length : 0
    const winRate = results.length > 0 ? Math.round((wins / results.length) * 100) : 0
    const divisions = [...new Set(results.map(r => r.div))]
    const seasons = [...new Set(results.map(r => new Date(r.date).getFullYear()))].sort((a, b) => b - a)
    const allWaves = heats.flatMap(h => h.waves).filter(w => w > 0)
    const bestWave = allWaves.length > 0 ? Math.max(...allWaves) : 0
    const heatWinRate = heats.length > 0 ? Math.round((heats.filter(h => h.place <= 2).length / heats.length) * 100) : 0
    return { wins, podiums, bestScore, avgScore, winRate, divisions, seasons, bestWave, heatWinRate, totalHeats: heats.length, totalWaves: allWaves.length }
  }, [results, heats])

  return (
    <div className="pb-20 md:pb-0">
      {/* Hero */}
      <section style={{ backgroundColor: '#0A2540', padding: '120px 24px 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <Link href="/athletes" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', marginBottom: 20, display: 'inline-block', letterSpacing: '0.08em' }}>← ATHLETES</Link>

          {/* Profile header */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', border: stats.wins > 0 ? '3px solid #FFD700' : '3px solid rgba(255,255,255,0.1)', flexShrink: 0, boxShadow: stats.wins > 0 ? '0 0 24px rgba(255,215,0,0.15)' : 'none' }}>
              {athlete.image ? <img src={athlete.image} alt={athlete.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.1)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 32 }}>{athlete.name.split(' ').map((n: string) => n[0]).join('')}</div>}
            </div>
            <div>
              <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(1.75rem,4vw,2.5rem)', color: '#fff', marginBottom: 4 }}>{athlete.name}</h1>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>BARBADOS 🇧🇧</span>
                {stats.divisions.map(d => (
                  <span key={d} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, padding: '2px 8px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{d}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }} className="grid-responsive-4">
            <StatCard value={results.length.toString()} label="Events" sub={`${stats.seasons.length} season${stats.seasons.length !== 1 ? 's' : ''}`} />
            <StatCard value={stats.wins.toString()} label="Wins" accent={stats.wins > 0 ? '#FFD700' : undefined} sub={`${stats.winRate}% win rate`} />
            <StatCard value={stats.podiums.toString()} label="Podiums" accent={stats.podiums > 0 ? '#2BA5A0' : undefined} sub={`${stats.podiums > 0 ? Math.round((stats.podiums / results.length) * 100) : 0}% podium rate`} />
            <StatCard value={stats.bestScore > 0 ? stats.bestScore.toFixed(2) : '—'} label="Best Total" accent="#1478B5" sub={`avg ${stats.avgScore.toFixed(2)}`} />
          </div>

          {/* Secondary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 10 }} className="grid-responsive-3">
            <StatCard value={stats.totalHeats.toString()} label="Heats Surfed" sub={`${stats.heatWinRate}% advance rate`} />
            <StatCard value={stats.bestWave > 0 ? stats.bestWave.toFixed(2) : '—'} label="Best Wave" sub={`${stats.totalWaves} waves total`} />
            <StatCard value={rivals.length > 0 ? rivals[0].name.split(' ')[1] || rivals[0].name.split(' ')[0] : '—'} label="Top Rival" sub={rivals.length > 0 ? `${rivals[0].wins}W-${rivals[0].losses}L in ${rivals[0].heats} heats` : 'not enough data'} />
          </div>

          {/* Placement chart */}
          <PlacementChart results={results} />
        </div>
      </section>
      <WaveDivider color="#FFFFFF" bg="#0A2540" />

      {/* Tab navigation */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '24px 24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 4, borderBottom: '1px solid rgba(10,37,64,0.06)', paddingBottom: 0 }}>
          {(['overview', 'heats', 'rivals'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 600, padding: '10px 20px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: tab === t ? '#0A2540' : 'rgba(26,26,26,0.3)', borderBottom: tab === t ? '2px solid #0A2540' : '2px solid transparent', marginBottom: -1, transition: 'all 0.15s', textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>
      </section>

      {/* Tab content */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '32px 24px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>

          {/* OVERVIEW TAB */}
          {tab === 'overview' && (
            <>
              {/* Recent form */}
              {results.length > 0 && (
                <ScrollReveal>
                  <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 16, color: '#0A2540', marginBottom: 16 }}>Recent Form</h2>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
                    {results.slice(0, 8).map((r, i) => (
                      <Link key={`${r.eid}-${r.div}-${i}`} href={`/events/${r.eid}`} style={{ textDecoration: 'none', padding: '10px 14px', borderRadius: 10, border: `1px solid ${r.place <= 3 ? medalColors[r.place - 1] + '30' : 'rgba(10,37,64,0.06)'}`, backgroundColor: r.place <= 3 ? placeBg[r.place - 1] : '#fff', display: 'flex', alignItems: 'center', gap: 10, transition: 'transform 0.15s' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: r.place <= 3 ? medalColors[r.place - 1] : 'rgba(10,37,64,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 11, color: r.place <= 3 ? '#fff' : 'rgba(26,26,26,0.3)' }}>{r.place}</span>
                        </div>
                        <div>
                          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, fontWeight: 600, color: '#0A2540', lineHeight: 1.2 }}>{r.ename}</div>
                          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'rgba(26,26,26,0.3)' }}>{r.div} · {r.total?.toFixed(2)} pts</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </ScrollReveal>
              )}

              {/* Two-column: wave distribution + season breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="grid-responsive-2">
                <ScrollReveal>
                  <div style={{ border: '1px solid rgba(10,37,64,0.06)', borderRadius: 12, padding: 20 }}>
                    <WaveScoreDistribution heats={heats} />
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={100}>
                  <div style={{ border: '1px solid rgba(10,37,64,0.06)', borderRadius: 12, padding: 20 }}>
                    <h3 style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(26,26,26,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Season Summary</h3>
                    {stats.seasons.map(yr => {
                      const sr = results.filter(r => new Date(r.date).getFullYear() === yr)
                      const yw = sr.filter(r => r.place === 1).length
                      const yp = sr.filter(r => r.place <= 3).length
                      return (
                        <div key={yr} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(10,37,64,0.04)' }}>
                          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14, color: '#0A2540' }}>{yr}</span>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(26,26,26,0.4)' }}>{sr.length} events</span>
                            {yw > 0 && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#FFD700', fontWeight: 700 }}>{yw}🥇</span>}
                            {yp - yw > 0 && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#2BA5A0' }}>{yp - yw}🥈🥉</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollReveal>
              </div>

              {/* BSA Compete Section */}
              {(compResults.length > 0 || seasonPoints.length > 0) && (
                <div style={{ marginTop: 32 }}>
                  <ScrollReveal>
                    <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 16, color: '#0A2540', marginBottom: 4 }}>BSA Compete</h2>
                    <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(26,26,26,0.3)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Results from BSA&apos;s competition system</p>
                  </ScrollReveal>

                  {/* Season Points */}
                  {seasonPoints.length > 0 && (
                    <ScrollReveal>
                      <div style={{ border: '1px solid rgba(10,37,64,0.06)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
                        <h3 style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(26,26,26,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Season Rankings</h3>
                        {seasonPoints.map((sp, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < seasonPoints.length - 1 ? '1px solid rgba(10,37,64,0.04)' : 'none' }}>
                            <div>
                              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 13, color: '#0A2540' }}>{sp.season_name}</span>
                              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(26,26,26,0.3)', marginLeft: 8 }}>{sp.division}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(26,26,26,0.4)' }}>{sp.events_counted} events</span>
                              {sp.best_result && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: sp.best_result <= 3 ? '#FFD700' : 'rgba(26,26,26,0.4)' }}>Best: #{sp.best_result}</span>}
                              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: '#2BA5A0' }}>{sp.total_points} pts</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollReveal>
                  )}

                  {/* Comp Heat Results */}
                  {compResults.length > 0 && (
                    <ScrollReveal delay={100}>
                      <div style={{ border: '1px solid rgba(10,37,64,0.06)', borderRadius: 12, padding: 20 }}>
                        <h3 style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(26,26,26,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Competition Heats</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {compResults.map((cr, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < compResults.length - 1 ? '1px solid rgba(10,37,64,0.04)' : 'none' }}>
                              <div>
                                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500, fontSize: 13, color: '#0A2540' }}>{cr.round} · Heat {cr.heat_number}</div>
                                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(26,26,26,0.3)' }}>{cr.event_name} · {cr.division}</div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {cr.waves.length > 0 && (
                                  <div style={{ display: 'flex', gap: 3 }}>
                                    {cr.waves.slice(0, 3).map((w, wi) => (
                                      <span key={wi} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 600, padding: '2px 5px', borderRadius: 3, backgroundColor: wi < 2 ? 'rgba(20,120,181,0.08)' : 'rgba(10,37,64,0.03)', color: wi < 2 ? '#1478B5' : 'rgba(26,26,26,0.3)' }}>{w.score.toFixed(1)}</span>
                                    ))}
                                  </div>
                                )}
                                {cr.result_position && (
                                  <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 8, backgroundColor: cr.result_position <= 2 ? 'rgba(43,165,160,0.08)' : 'rgba(26,26,26,0.04)', color: cr.result_position <= 2 ? '#2BA5A0' : 'rgba(26,26,26,0.3)', fontFamily: "'JetBrains Mono',monospace" }}>#{cr.result_position}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </ScrollReveal>
                  )}
                </div>
              )}
            </>
          )}

          {/* HEATS TAB */}
          {tab === 'heats' && (
            <ScrollReveal>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 16, color: '#0A2540' }}>Heat-by-Heat Results</h2>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(26,26,26,0.3)' }}>{heats.length} heats</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {heats.map((h, i) => {
                  const advanced = h.place <= 2
                  return (
                    <div key={`${h.eid}-${h.round}-${h.heatPos}-${i}`} style={{ borderRadius: 10, border: '1px solid rgba(10,37,64,0.06)', overflow: 'hidden', backgroundColor: '#fff' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center', padding: '12px 16px' }}>
                        <div>
                          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500, fontSize: 13, color: '#0A2540' }}>{h.round} · Heat {h.heatPos}</div>
                          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(26,26,26,0.3)' }}>{h.ename} · {h.div}</div>
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 16, color: advanced ? '#2BA5A0' : 'rgba(26,26,26,0.25)' }}>{h.total.toFixed(2)}</div>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 10, backgroundColor: advanced ? 'rgba(43,165,160,0.08)' : 'rgba(26,26,26,0.04)', color: advanced ? '#2BA5A0' : 'rgba(26,26,26,0.3)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase' }}>{advanced ? 'Advanced' : `#${h.place}`}</span>
                      </div>
                      {/* Wave scores */}
                      {h.waves.length > 0 && (
                        <div style={{ padding: '0 16px 10px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {h.waves.map((w, wi) => (
                            <span key={wi} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, backgroundColor: wi < 2 ? 'rgba(20,120,181,0.08)' : 'rgba(10,37,64,0.03)', color: wi < 2 ? '#1478B5' : 'rgba(26,26,26,0.3)' }}>{w.toFixed(2)}</span>
                          ))}
                        </div>
                      )}
                      {/* Opponents */}
                      <div style={{ borderTop: '1px solid rgba(10,37,64,0.04)', padding: '8px 16px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {h.opponents.map((opp, oi) => (
                          <span key={oi} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: opp.place < h.place ? 'rgba(200,50,50,0.5)' : 'rgba(26,26,26,0.3)' }}>
                            {opp.place < h.place ? '▲' : '▼'} {opp.name.split(' ').pop()} {opp.total.toFixed(2)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
              {heats.length === 0 && <p style={{ textAlign: 'center', color: 'rgba(26,26,26,0.3)', padding: '3rem 0' }}>No heat data available.</p>}
            </ScrollReveal>
          )}

          {/* RIVALS TAB */}
          {tab === 'rivals' && (
            <ScrollReveal>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 16, color: '#0A2540', marginBottom: 16 }}>Head-to-Head Records</h2>
              {rivals.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {rivals.map(r => {
                    const total = r.wins + r.losses
                    const winPct = total > 0 ? (r.wins / total) * 100 : 50
                    return (
                      <div key={r.name} style={{ borderRadius: 12, border: '1px solid rgba(10,37,64,0.06)', padding: 20, backgroundColor: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14, color: '#0A2540' }}>vs {r.name}</span>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(26,26,26,0.3)' }}>{r.heats} heats</span>
                        </div>
                        {/* W/L bar */}
                        <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                          <div style={{ width: `${winPct}%`, backgroundColor: '#2BA5A0', transition: 'width 0.3s' }} />
                          <div style={{ flex: 1, backgroundColor: 'rgba(200,50,50,0.2)' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: '#2BA5A0' }}>{r.wins}W</span>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: 'rgba(200,50,50,0.5)' }}>{r.losses}L</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: 'rgba(26,26,26,0.3)', padding: '3rem 0' }}>Need at least 2 heats against an opponent to track rivalry data.</p>
              )}
            </ScrollReveal>
          )}
        </div>
      </section>
    </div>
  )
}
