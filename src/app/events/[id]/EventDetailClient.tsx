'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ScrollReveal } from '../../components/ScrollReveal'
import { PhotoGallery } from '../../components/PhotoGallery'
import { ChevronDownIcon } from '../../components/Icons'
import { WaveDivider } from '../../components/WaveDivider'
import type { EventDivisionFull } from '@/lib/liveheats'

interface Photo { src: string; alt?: string; credit?: string }

const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']

export function EventDetailClient({ event, photos }: { event: { id: string; name: string; date: string; status: string; eventDivisions: EventDivisionFull[] }; photos?: Photo[] }) {
  const [tab, setTab] = useState(0)
  const [open, setOpen] = useState<string | null>(null)
  const div = event.eventDivisions[tab]
  return (
    <div className="pb-20 md:pb-0">
      {/* Hero */}
      <section style={{ backgroundColor: '#0A2540', padding: '120px 24px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <Link href="/events" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', marginBottom: 16, display: 'inline-block', letterSpacing: '0.08em' }}>← EVENTS</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(1.5rem,4vw,2.5rem)', color: '#fff' }}>{event.name}</h1>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, backgroundColor: event.status === 'results_published' ? 'rgba(20,120,181,0.2)' : 'rgba(43,165,160,0.2)', color: event.status === 'results_published' ? '#5BB8F5' : '#2BA5A0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{event.status === 'results_published' ? 'Results' : event.status}</span>
          </div>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </section>
      <WaveDivider color="#FFFFFF" bg="#0A2540" />

      <section style={{ backgroundColor: '#FFFFFF', padding: '32px 24px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {/* Division tabs */}
          {event.eventDivisions.length > 0 && (
            <ScrollReveal>
              <div className="no-scrollbar" style={{ display: 'flex', gap: 4, overflowX: 'auto', marginBottom: 32 }}>
                {event.eventDivisions.map((d, i) => (
                  <button key={d.id} onClick={() => { setTab(i); setOpen(null) }} style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', backgroundColor: tab === i ? '#0A2540' : 'rgba(10,37,64,0.04)', color: tab === i ? '#fff' : 'rgba(26,26,26,0.5)', transition: 'all 0.2s' }}>{d.division.name}</button>
                ))}
              </div>
            </ScrollReveal>
          )}

          {/* Final Rankings */}
          {div?.ranking && div.ranking.length > 0 && (
            <ScrollReveal>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 16, color: '#0A2540', marginBottom: 16 }}>Final Rankings</h2>
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(10,37,64,0.06)', marginBottom: 32 }}>
                {div.ranking.map((r, i) => (
                  <Link key={i} href={`/athletes/${r.competitor.athlete.id}`} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', gap: 14, textDecoration: 'none', borderBottom: i < div.ranking.length - 1 ? '1px solid rgba(10,37,64,0.04)' : 'none', backgroundColor: '#fff' }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 14, color: i < 3 ? medalColors[i] : 'rgba(26,26,26,0.2)', width: 28, textAlign: 'center' }}>{r.place}</span>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#0A2540', overflow: 'hidden', flexShrink: 0, border: i < 3 ? `2px solid ${medalColors[i]}` : '2px solid transparent' }}>
                      {r.competitor.athlete.image ? <img src={r.competitor.athlete.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>{r.competitor.athlete.name.split(' ').map((n: string) => n[0]).join('')}</div>}
                    </div>
                    <span style={{ flex: 1, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14, color: '#0A2540' }}>{r.competitor.athlete.name}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: 13, color: i < 3 ? '#0A2540' : 'rgba(26,26,26,0.4)' }}>{r.total?.toFixed(2)}</span>
                  </Link>
                ))}
              </div>
            </ScrollReveal>
          )}

          {/* Heat Results */}
          {div?.heats && div.heats.length > 0 && (
            <ScrollReveal>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 16, color: '#0A2540', marginBottom: 16 }}>Heat Results</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {div.heats.map(h => (
                  <div key={h.id} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(10,37,64,0.06)' }}>
                    <button onClick={() => setOpen(open === h.id ? null : h.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', border: 'none', cursor: 'pointer', backgroundColor: '#fff', fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, fontWeight: 500, color: '#0A2540' }}>
                      <span>{h.round} · Heat {h.position}</span>
                      <span style={{ transform: open === h.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'rgba(26,26,26,0.25)' }}><ChevronDownIcon size={16} /></span>
                    </button>
                    {open === h.id && h.result && (
                      <div style={{ borderTop: '1px solid rgba(10,37,64,0.04)' }}>
                        {h.result.map((r, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', gap: 12, borderBottom: i < h.result.length - 1 ? '1px solid rgba(10,37,64,0.04)' : 'none' }}>
                            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: 13, color: r.place === 1 ? '#1478B5' : 'rgba(26,26,26,0.25)', width: 24, textAlign: 'center' }}>{r.place}</span>
                            <span style={{ flex: 1, fontSize: 14, color: '#0A2540', fontWeight: 500 }}>{r.competitor.athlete.name}</span>
                            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: 13, color: r.place === 1 ? '#1478B5' : 'rgba(26,26,26,0.4)' }}>{r.total?.toFixed(2)}</span>
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
