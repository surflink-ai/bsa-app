'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ScrollReveal } from '../components/ScrollReveal'
import { SearchIcon } from '../components/Icons'

export function AthletesClient({ athletes }: { athletes: { id: string; name: string; image: string | null; count: number }[] }) {
  const [q, setQ] = useState('')
  const list = q ? athletes.filter(a => a.name.toLowerCase().includes(q.toLowerCase())) : athletes
  return (
    <div className="pb-20 md:pb-0" style={{ paddingTop: '5rem' }}>
      <div className="max-w-7xl mx-auto px-6 md:px-8" style={{ padding: 'clamp(2rem,4vw,4rem) 1.5rem' }}>
        <ScrollReveal><p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: '1rem' }}>Athletes</p><h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(2rem,5vw,3rem)', color: '#0A2540', marginBottom: '2rem' }}>Competitor Directory</h1></ScrollReveal>
        <ScrollReveal><div style={{ position: 'relative', maxWidth: '24rem', marginBottom: '2.5rem' }}><div style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(26,26,26,0.25)' }}><SearchIcon size={18} /></div><input type="text" placeholder="Search athletes..." value={q} onChange={e => setQ(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '0.75rem', border: '1px solid rgba(26,26,26,0.08)', backgroundColor: '#fff', fontSize: '0.9rem', color: '#1A1A1A', outline: 'none' }} /></div></ScrollReveal>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {list.map((a, i) => (
            <ScrollReveal key={a.id} delay={Math.min(i * 40, 400)}>
              <Link href={`/athletes/${a.id}`} style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', backgroundColor: '#F2EDE4', margin: '0 auto 0.75rem' }}>{a.image ? <img src={a.image} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.25rem', color: 'rgba(10,37,64,0.15)' }}>{a.name.charAt(0)}</div>}</div>
                <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '0.85rem', color: '#0A2540' }}>{a.name}</p>
                <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.65rem', color: 'rgba(26,26,26,0.3)' }}>{a.count} event{a.count !== 1 ? 's' : ''}</p>
              </Link>
            </ScrollReveal>
          ))}
        </div>
        {list.length === 0 && <p style={{ textAlign: 'center', color: 'rgba(26,26,26,0.3)', padding: '3rem 0' }}>{q ? 'No athletes match.' : 'No data available.'}</p>}
      </div>
    </div>
  )
}
