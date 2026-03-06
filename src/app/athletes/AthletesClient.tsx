'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ScrollReveal } from '../components/ScrollReveal'
import { SearchIcon } from '../components/Icons'
import { WaveDivider } from '../components/WaveDivider'

interface Athlete { id: string; name: string; image: string | null; count: number }

export function AthletesClient({ athletes }: { athletes: Athlete[] }) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'photo'>('all')

  const withPhotos = useMemo(() => athletes.filter(a => a.image), [athletes])

  const list = useMemo(() => {
    let result = filter === 'photo' ? withPhotos : athletes
    if (q) result = result.filter(a => a.name.toLowerCase().includes(q.toLowerCase()))
    return result
  }, [athletes, withPhotos, filter, q])

  return (
    <div className="pb-20 md:pb-0">
      {/* Hero */}
      <section style={{ backgroundColor: '#0A2540', padding: '120px 24px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: 12 }}>Representing Barbados</p>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(2rem,5vw,3rem)', color: '#fff', marginBottom: 8 }}>Athletes</h1>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
            {[
              { value: athletes.length, label: 'Athletes' },
              { value: withPhotos.length, label: 'With Profiles' },
              { value: athletes.length > 0 ? Math.max(...athletes.map(a => a.count)) : 0, label: 'Most Events' },
              { value: athletes.filter(a => a.count > 0).length, label: 'Active Competitors' },
            ].map(stat => (
              <div key={stat.label} style={{
                padding: '14px 20px', background: 'rgba(255,255,255,0.04)',
                borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 24, color: '#fff', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider color="#FFFFFF" bg="#0A2540" />

      {/* Directory */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '32px 24px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
              <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 400 }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(26,26,26,0.2)' }}><SearchIcon size={16} /></div>
                <input type="text" placeholder="Search..." value={q} onChange={e => setQ(e.target.value)} style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: 8, border: '1px solid rgba(10,37,64,0.08)', fontSize: 14, color: '#0A2540', outline: 'none', fontFamily: "'Space Grotesk',sans-serif" }} />
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['all', 'photo'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: filter === f ? '#0A2540' : 'rgba(10,37,64,0.04)', color: filter === f ? '#fff' : 'rgba(26,26,26,0.4)' }}>{f === 'all' ? 'All' : 'With Photo'}</button>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {list.map((a, i) => (
              <ScrollReveal key={a.id} delay={Math.min(i * 20, 200)}>
                <Link href={`/athletes/${a.id}`} style={{ display: 'block', textDecoration: 'none' }}>
                  <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(10,37,64,0.06)', transition: 'box-shadow 0.2s' }}>
                    <div style={{ aspectRatio: '1', overflow: 'hidden', backgroundColor: '#0A2540' }}>
                      {a.image ? <img src={a.image} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.08)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 28 }}>{a.name.split(' ').map((n: string) => n[0]).join('')}</div>}
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 12, color: '#0A2540', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(26,26,26,0.3)' }}>{a.count} events</div>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
          {list.length === 0 && <p style={{ textAlign: 'center', color: 'rgba(26,26,26,0.3)', padding: '3rem 0' }}>{q ? 'No results.' : 'No data.'}</p>}
        </div>
      </section>
    </div>
  )
}
