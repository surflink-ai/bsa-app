'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ScrollReveal } from '../../components/ScrollReveal'
import { PhotoGallery } from '../../components/PhotoGallery'
import { ChevronDownIcon } from '../../components/Icons'
import { WaveDivider } from '../../components/WaveDivider'
import type { EventDivisionFull } from '@/lib/liveheats'

interface Photo { src: string; alt?: string; credit?: string }
const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']
const medalBg = ['rgba(255,215,0,0.08)', 'rgba(192,192,192,0.08)', 'rgba(205,127,50,0.08)']

export function EventDetailClient({ event, photos }: { event: { id: string; name: string; date: string; status: string; eventDivisions: EventDivisionFull[] }; photos?: Photo[] }) {
  const [tab, setTab] = useState(0)
  const [open, setOpen] = useState<string | null>(null)
  const div = event.eventDivisions[tab]

  // Compute event stats
  const stats = useMemo(() => {
    let totalCompetitors = 0
    let totalHeats = 0
    let highestScore = 0
    for (const d of event.eventDivisions) {
      totalCompetitors += d.ranking?.length || 0
      totalHeats += d.heats?.length || 0
      for (const r of d.ranking || []) {
        if (r.total > highestScore) highestScore = r.total
      }
    }
    return { totalCompetitors, totalHeats, highestScore, divisions: event.eventDivisions.length }
  }, [event])

  return (
    <div className="pb-20 md:pb-0">
      {/* Hero */}
      <section style={{ backgroundColor: '#0A2540', padding: '120px 24px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <Link href="/events" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', marginBottom: 20, display: 'inline-block', letterSpacing: '0.08em' }}>← EVENTS</Link>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(1.5rem,4vw,2.5rem)', color: '#fff', marginBottom: 6 }}>{event.name.replace(/\s*\(SOTY\s*#\d+\s*\([^)]*\)\)/gi, '').replace(/\s*\(Nationals only\)/gi, '').trim()}</h1>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 32 }}>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} className="grid-responsive-4">
            {[
              { val: stats.totalCompetitors, label: 'Competitors' },
              { val: stats.divisions, label: 'Divisions' },
              { val: stats.totalHeats, label: 'Heats' },
              { val: stats.highestScore > 0 ? stats.highestScore.toFixed(2) : '—', label: 'Top Score' },
            ].map(s => (
              <div key={s.label} style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '16px 20px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 24, color: '#fff' }}>{s.val}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {/* Live Scoring link */}
          <div style={{ marginTop: 24 }}>
            <a href="https://heatsync.ai" target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600,
              color: '#2BA5A0', textDecoration: 'none',
              padding: '10px 20px', borderRadius: 8,
              background: 'rgba(43,165,160,0.08)', border: '1px solid rgba(43,165,160,0.15)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" /></svg>
              Live Scoring on HeatSync
            </a>
          </div>
        </div>
      </section>
      <WaveDivider color="#FFFFFF" bg="#0A2540" />

      <section style={{ backgroundColor: '#FFFFFF', padding: '32px 24px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {/* Division tabs */}
          {event.eventDivisions.length > 0 && (
            <div className="no-scrollbar" style={{ display: 'flex', gap: 4, overflowX: 'auto', marginBottom: 32, paddingBottom: 4 }}>
              {event.eventDivisions.map((d, i) => (
                <button key={d.id} onClick={() => { setTab(i); setOpen(null) }} style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', backgroundColor: tab === i ? '#0A2540' : 'rgba(10,37,64,0.04)', color: tab === i ? '#fff' : 'rgba(26,26,26,0.45)', transition: 'all 0.15s' }}>{d.division.name}</button>
              ))}
            </div>
          )}

          {/* Podium — top 3 */}
          {div?.ranking && div.ranking.length >= 3 && (
            <ScrollReveal>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 'clamp(12px,3vw,24px)', marginBottom: 40, padding: '20px 0' }}>
                {[div.ranking[1], div.ranking[0], div.ranking[2]].map((r, i) => {
                  const sizes = [{ img: 64, bar: 80 }, { img: 80, bar: 112 }, { img: 56, bar: 56 }]
                  const place = r.place
                  const color = medalColors[place - 1] || '#999'
                  return (
                    <Link key={r.competitor.athlete.id} href={`/athletes/${r.competitor.athlete.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', width: 'clamp(90px,22vw,140px)' }}>
                      <div style={{ width: sizes[i].img, height: sizes[i].img, borderRadius: '50%', overflow: 'hidden', border: `3px solid ${color}`, marginBottom: 8, boxShadow: i === 1 ? `0 0 20px ${color}40` : 'none' }}>
                        {r.competitor.athlete.image ? <img src={r.competitor.athlete.image} alt={r.competitor.athlete.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A2540', color: 'rgba(255,255,255,0.2)', fontWeight: 600, fontSize: sizes[i].img * 0.28 }}>{r.competitor.athlete.name.split(' ').map((n: string) => n[0]).join('')}</div>}
                      </div>
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 13, color: '#0A2540', textAlign: 'center', lineHeight: 1.2, marginBottom: 2 }}>{r.competitor.athlete.name}</div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 13, color }}>{r.total?.toFixed(2)}</div>
                      <div style={{ width: '100%', height: sizes[i].bar, borderRadius: '8px 8px 0 0', background: `linear-gradient(180deg, ${color}30 0%, ${color}10 100%)`, marginTop: 8, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8, border: `1px solid ${color}20`, borderBottom: 'none' }}>
                        <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 20, color }}>{place}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </ScrollReveal>
          )}

          {/* Full rankings */}
          {div?.ranking && div.ranking.length > 0 && (
            <ScrollReveal>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 16, color: '#0A2540', marginBottom: 12 }}>Full Rankings</h2>
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(10,37,64,0.06)', marginBottom: 32 }}>
                {div.ranking.map((r, i) => {
                  const isMedal = i < 3
                  return (
                    <Link key={i} href={`/athletes/${r.competitor.athlete.id}`} style={{ display: 'grid', gridTemplateColumns: '32px 36px 1fr auto', gap: 12, alignItems: 'center', padding: '10px 16px', textDecoration: 'none', borderBottom: i < div.ranking.length - 1 ? '1px solid rgba(10,37,64,0.04)' : 'none', backgroundColor: isMedal ? medalBg[i] : '#fff' }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 13, color: isMedal ? medalColors[i] : 'rgba(26,26,26,0.2)', textAlign: 'center' }}>{r.place}</span>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', backgroundColor: '#0A2540', border: isMedal ? `2px solid ${medalColors[i]}` : '2px solid transparent' }}>
                        {r.competitor.athlete.image ? <img src={r.competitor.athlete.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>{r.competitor.athlete.name.charAt(0)}</div>}
                      </div>
                      <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: isMedal ? 600 : 500, fontSize: 14, color: '#0A2540' }}>{r.competitor.athlete.name}</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: 13, color: isMedal ? '#0A2540' : 'rgba(26,26,26,0.35)' }}>{r.total?.toFixed(2)}</span>
                    </Link>
                  )
                })}
              </div>
            </ScrollReveal>
          )}

          {/* Heat results */}
          {div?.heats && div.heats.length > 0 && (
            <ScrollReveal>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 16, color: '#0A2540', marginBottom: 12 }}>Heat Results</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 8 }}>
                {div.heats.map(h => (
                  <div key={h.id} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(10,37,64,0.06)' }}>
                    <button onClick={() => setOpen(open === h.id ? null : h.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', border: 'none', cursor: 'pointer', backgroundColor: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 500, color: '#0A2540' }}>
                      <span>{h.round} · Heat {h.position}</span>
                      <span style={{ transform: open === h.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'rgba(26,26,26,0.2)' }}><ChevronDownIcon size={14} /></span>
                    </button>
                    {open === h.id && h.result && (
                      <div style={{ borderTop: '1px solid rgba(10,37,64,0.04)' }}>
                        {h.result.map((r, ri) => (
                          <div key={ri} style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto', gap: 8, alignItems: 'center', padding: '8px 16px', borderBottom: ri < h.result.length - 1 ? '1px solid rgba(10,37,64,0.03)' : 'none' }}>
                            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: 12, color: r.place <= 2 ? '#1478B5' : 'rgba(26,26,26,0.2)', textAlign: 'center' }}>{r.place}</span>
                            <span style={{ fontSize: 13, color: r.place <= 2 ? '#0A2540' : 'rgba(26,26,26,0.5)', fontWeight: r.place <= 2 ? 600 : 400 }}>{r.competitor.athlete.name}</span>
                            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: 12, color: r.place === 1 ? '#1478B5' : 'rgba(26,26,26,0.35)' }}>{r.total?.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollReveal>
          )}

          {photos && photos.length > 0 && <ScrollReveal><div style={{ marginTop: 40 }}><PhotoGallery photos={photos} /></div></ScrollReveal>}
        </div>
      </section>
    </div>
  )
}
