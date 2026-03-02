'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ScrollReveal } from '../components/ScrollReveal'
import { SearchIcon } from '../components/Icons'
import { WaveDivider } from '../components/WaveDivider'

export function AthletesClient({ athletes }: { athletes: { id: string; name: string; image: string | null; count: number }[] }) {
  const [q, setQ] = useState('')
  const list = q ? athletes.filter(a => a.name.toLowerCase().includes(q.toLowerCase())) : athletes
  return (
    <div className="pb-20 md:pb-0">
      {/* Hero */}
      <section style={{ backgroundColor: '#0A2540', padding: '120px 24px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: 12 }}>Representing Barbados</p>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(2rem,5vw,3rem)', color: '#fff', marginBottom: 8 }}>Athletes</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>{athletes.length} registered competitors</p>
        </div>
      </section>
      <WaveDivider color="#FFFFFF" bg="#0A2540" />

      <section style={{ backgroundColor: '#FFFFFF', padding: '32px 24px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ position: 'relative', maxWidth: 400, marginBottom: 32 }}>
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(26,26,26,0.2)' }}><SearchIcon size={18} /></div>
              <input type="text" placeholder="Search athletes..." value={q} onChange={e => setQ(e.target.value)} style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: 10, border: '1px solid rgba(10,37,64,0.08)', backgroundColor: '#fff', fontSize: 14, color: '#0A2540', outline: 'none', fontFamily: "'Space Grotesk',sans-serif" }} />
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {list.map((a, i) => (
              <ScrollReveal key={a.id} delay={Math.min(i * 30, 300)}>
                <Link href={`/athletes/${a.id}`} style={{ display: 'block', textDecoration: 'none' }}>
                  <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(10,37,64,0.06)', backgroundColor: '#fff', transition: 'box-shadow 0.2s' }}>
                    <div style={{ aspectRatio: '1', overflow: 'hidden', backgroundColor: '#0A2540' }}>
                      {a.image ? <img src={a.image} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, color: 'rgba(255,255,255,0.1)', fontWeight: 600 }}>{a.name.split(' ').map((n: string) => n[0]).join('')}</div>}
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 13, color: '#0A2540', marginBottom: 2 }}>{a.name}</p>
                      <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(26,26,26,0.3)', letterSpacing: '0.06em' }}>{a.count} event{a.count !== 1 ? 's' : ''} · 🇧🇧</p>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
          {list.length === 0 && <p style={{ textAlign: 'center', color: 'rgba(26,26,26,0.3)', padding: '3rem 0' }}>{q ? 'No athletes match your search.' : 'No data available.'}</p>}
        </div>
      </section>
    </div>
  )
}
