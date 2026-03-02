'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ScrollReveal } from '../components/ScrollReveal'
import { WaveDivider } from '../components/WaveDivider'
import type { SeriesInfo } from '@/lib/liveheats'

export function RankingsClient({ series }: { series: SeriesInfo[] }) {
  const [idx, setIdx] = useState(series.length > 0 ? series.length - 1 : 0)
  const cur = series[idx] || null
  return (
    <div className="pb-20 md:pb-0">
      {/* Hero */}
      <section style={{ backgroundColor: '#0A2540', padding: '120px 24px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: 12 }}>Championships</p>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(2rem,5vw,3rem)', color: '#fff' }}>Rankings</h1>
        </div>
      </section>
      <WaveDivider color="#FFFFFF" bg="#0A2540" />

      <section style={{ backgroundColor: '#FFFFFF', padding: '32px 24px 80px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {series.length > 1 && (
            <ScrollReveal>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 32 }}>
                {series.map((s, i) => (
                  <button key={s.id} onClick={() => setIdx(i)} style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', backgroundColor: idx === i ? '#0A2540' : 'rgba(10,37,64,0.04)', color: idx === i ? '#fff' : 'rgba(26,26,26,0.4)', transition: 'all 0.2s' }}>{s.name}</button>
                ))}
              </div>
            </ScrollReveal>
          )}
          {cur ? (
            <ScrollReveal>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 18, color: '#0A2540', marginBottom: 6 }}>{cur.name}</h2>
              <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'rgba(26,26,26,0.3)', marginBottom: 24 }}>{cur.events.length} event{cur.events.length !== 1 ? 's' : ''} in series</p>
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(10,37,64,0.06)' }}>
                {cur.events.map((e, i) => (
                  <Link key={e.id} href={`/events/${e.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < cur.events.length - 1 ? '1px solid rgba(10,37,64,0.04)' : 'none', backgroundColor: '#fff', textDecoration: 'none' }}>
                    <div>
                      <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500, fontSize: 14, color: '#0A2540' }}>{e.name}</span>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(26,26,26,0.3)', marginTop: 2 }}>{new Date(e.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, backgroundColor: e.status === 'results_published' ? 'rgba(20,120,181,0.08)' : 'rgba(43,165,160,0.08)', color: e.status === 'results_published' ? '#1478B5' : '#2BA5A0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{e.status === 'results_published' ? 'Complete' : e.status}</span>
                  </Link>
                ))}
              </div>
            </ScrollReveal>
          ) : <p style={{ textAlign: 'center', color: 'rgba(26,26,26,0.3)', padding: '3rem 0' }}>No series data available.</p>}
        </div>
      </section>
    </div>
  )
}
