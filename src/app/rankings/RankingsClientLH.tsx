'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ScrollReveal } from '../components/ScrollReveal'
import { WaveDivider } from '../components/WaveDivider'
import type { SeriesInfo } from '@/lib/liveheats'

export function RankingsClientLH({ series }: { series: SeriesInfo[] }) {
  const [idx, setIdx] = useState(series.length > 0 ? series.length - 1 : 0)
  const cur = series[idx] || null
  const completed = cur ? cur.events.filter(e => e.status === 'results_published').length : 0
  const total = cur?.events.length || 0
  const progress = total > 0 ? (completed / total) * 100 : 0

  return (
    <div className="pb-20 md:pb-0">
      {/* Hero */}
      <section style={{ backgroundColor: '#0A2540', padding: '120px 24px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: 12 }}>Championships</p>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(2rem,5vw,3rem)', color: '#fff', marginBottom: 24 }}>Rankings</h1>

          {/* Series tabs */}
          {series.length > 1 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {series.map((s, i) => (
                <button key={s.id} onClick={() => setIdx(i)} style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', backgroundColor: idx === i ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)', color: idx === i ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}>{s.name}</button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Series progress */}
      {cur && (
        <section style={{ backgroundColor: '#0A2540', padding: '0 24px 48px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{cur.name}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#2BA5A0' }}>{completed}/{total} complete</span>
            </div>
            <div style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${progress}%`, backgroundColor: '#2BA5A0', borderRadius: 2, transition: 'width 0.5s' }} />
            </div>
          </div>
        </section>
      )}

      <WaveDivider color="#FFFFFF" bg="#0A2540" />

      <section style={{ backgroundColor: '#FFFFFF', padding: '32px 24px 80px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {cur ? (
            <ScrollReveal>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 18, color: '#0A2540', marginBottom: 20 }}>Season Events</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cur.events.map((e, i) => {
                  const isComplete = e.status === 'results_published'
                  return (
                    <Link key={e.id} href={`/events/${e.id}`} style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 16, alignItems: 'center', padding: '14px 20px', borderRadius: 10, border: '1px solid rgba(10,37,64,0.06)', textDecoration: 'none', backgroundColor: '#fff', transition: 'box-shadow 0.2s' }}>
                      {/* Event number */}
                      <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: isComplete ? '#0A2540' : 'rgba(10,37,64,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 14, color: isComplete ? '#fff' : 'rgba(26,26,26,0.3)' }}>{i + 1}</span>
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500, fontSize: 14, color: '#0A2540' }}>{e.name}</div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(26,26,26,0.3)', marginTop: 2 }}>{new Date(e.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 10, backgroundColor: isComplete ? 'rgba(20,120,181,0.08)' : 'rgba(43,165,160,0.08)', color: isComplete ? '#1478B5' : '#2BA5A0', textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.04em' }}>{isComplete ? 'Results' : 'Upcoming'}</span>
                    </Link>
                  )
                })}
              </div>
            </ScrollReveal>
          ) : <p style={{ textAlign: 'center', color: 'rgba(26,26,26,0.3)', padding: '3rem 0' }}>No series data.</p>}
        </div>
      </section>
    </div>
  )
}
