'use client'
import { useState } from 'react'
import { ScrollReveal } from '../components/ScrollReveal'
import type { SeriesInfo } from '@/lib/liveheats'

export function RankingsClient({ series }: { series: SeriesInfo[] }) {
  const [idx, setIdx] = useState(series.length > 0 ? series.length - 1 : 0)
  const cur = series[idx] || null
  return (
    <div className="pb-20 md:pb-0" style={{ paddingTop: '5rem' }}>
      <div className="max-w-4xl mx-auto px-6 md:px-8" style={{ padding: 'clamp(2rem,4vw,4rem) 1.5rem' }}>
        <ScrollReveal><p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: '1rem' }}>Championships</p><h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(2rem,5vw,3rem)', color: '#0A2540', marginBottom: '2rem' }}>Rankings</h1></ScrollReveal>
        {series.length > 1 && <ScrollReveal><div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>{series.map((s, i) => <button key={s.id} onClick={() => setIdx(i)} style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '0.8rem', fontWeight: 500, padding: '0.5rem 1rem', borderRadius: '999px', border: 'none', cursor: 'pointer', backgroundColor: idx === i ? '#0A2540' : '#F2EDE4', color: idx === i ? '#fff' : 'rgba(26,26,26,0.5)' }}>{s.name}</button>)}</div></ScrollReveal>}
        {cur ? <ScrollReveal>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '1.1rem', color: '#0A2540', marginBottom: '0.5rem' }}>{cur.name}</h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(26,26,26,0.35)', marginBottom: '1.5rem' }}>{cur.events.length} event{cur.events.length !== 1 ? 's' : ''} in series</p>
          <div style={{ backgroundColor: '#fff', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {cur.events.map((e, i) => <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', borderBottom: i < cur.events.length - 1 ? '1px solid rgba(26,26,26,0.04)' : 'none', backgroundColor: i % 2 === 0 ? '#fff' : '#FAFAF8' }}><div><span style={{ fontWeight: 500, fontSize: '0.9rem', color: '#0A2540' }}>{e.name}</span><div style={{ fontSize: '0.75rem', color: 'rgba(26,26,26,0.35)', marginTop: '0.15rem' }}>{new Date(e.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div></div><span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '999px', backgroundColor: e.status === 'results_published' ? 'rgba(20,120,181,0.08)' : 'rgba(43,165,160,0.08)', color: e.status === 'results_published' ? '#1478B5' : '#2BA5A0', textTransform: 'uppercase' }}>{e.status === 'results_published' ? 'Complete' : e.status}</span></div>)}
          </div>
        </ScrollReveal> : <p style={{ textAlign: 'center', color: 'rgba(26,26,26,0.3)', padding: '3rem 0' }}>No series data available.</p>}
      </div>
    </div>
  )
}
