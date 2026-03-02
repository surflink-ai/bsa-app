'use client'
import Link from 'next/link'
import { ScrollReveal } from '../../components/ScrollReveal'
import { WaveDivider } from '../../components/WaveDivider'

interface AthleteResult { eid: string; ename: string; date: string; div: string; place: number; total: number | null }

const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']

export function AthleteDetailClient({ athlete, results }: { athlete: { id: string; name: string; image: string | null }; results: AthleteResult[] }) {
  const wins = results.filter(r => r.place === 1).length
  const podiums = results.filter(r => r.place <= 3).length
  const bestScore = Math.max(...results.map(r => r.total || 0))

  return (
    <div className="pb-20 md:pb-0">
      {/* Hero */}
      <section style={{ backgroundColor: '#0A2540', padding: '120px 24px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <Link href="/athletes" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', marginBottom: 20, display: 'inline-block', letterSpacing: '0.08em' }}>← ATHLETES</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
              {athlete.image ? <img src={athlete.image} alt={athlete.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.15)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 24 }}>{athlete.name.split(' ').map((n: string) => n[0]).join('')}</div>}
            </div>
            <div>
              <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(1.5rem,4vw,2.5rem)', color: '#fff', marginBottom: 4 }}>{athlete.name}</h1>
              <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>BARBADOS 🇧🇧</p>
            </div>
          </div>
          {/* Quick stats */}
          <div style={{ display: 'flex', gap: 32, marginTop: 28 }}>
            {[{ val: results.length, label: 'Events' }, { val: wins, label: 'Wins' }, { val: podiums, label: 'Podiums' }, { val: bestScore > 0 ? bestScore.toFixed(2) : '—', label: 'Best Score' }].map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22, color: '#fff' }}>{s.val}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <WaveDivider color="#FFFFFF" bg="#0A2540" />

      <section style={{ backgroundColor: '#FFFFFF', padding: '32px 24px 80px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <ScrollReveal>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 18, color: '#0A2540', marginBottom: 20 }}>Competition History</h2>
            {results.length > 0 ? (
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(10,37,64,0.06)' }}>
                {results.map((r, i) => (
                  <Link key={`${r.eid}-${r.div}`} href={`/events/${r.eid}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16, padding: '12px 20px', textDecoration: 'none', borderBottom: i < results.length - 1 ? '1px solid rgba(10,37,64,0.04)' : 'none', alignItems: 'center', backgroundColor: '#fff' }}>
                    <div>
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500, fontSize: 14, color: '#0A2540' }}>{r.ename}</div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(26,26,26,0.3)', marginTop: 2 }}>{r.div} · {new Date(r.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</div>
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 14, color: r.place <= 3 ? (medalColors[r.place - 1] || '#1478B5') : 'rgba(26,26,26,0.3)' }}>#{r.place}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: 'rgba(26,26,26,0.4)' }}>{r.total?.toFixed(2)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p style={{ color: 'rgba(26,26,26,0.3)', padding: '2rem 0' }}>No competition history found.</p>
            )}
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
