'use client'
import Link from 'next/link'
import { ScrollReveal } from '../../components/ScrollReveal'
import { WaveDivider } from '../../components/WaveDivider'

interface AthleteResult { eid: string; ename: string; date: string; div: string; place: number; total: number | null }
const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']

export function AthleteDetailClient({ athlete, results }: { athlete: { id: string; name: string; image: string | null }; results: AthleteResult[] }) {
  const wins = results.filter(r => r.place === 1).length
  const podiums = results.filter(r => r.place <= 3).length
  const bestScore = Math.max(...results.map(r => r.total || 0), 0)
  const winRate = results.length > 0 ? Math.round((wins / results.length) * 100) : 0

  // Divisions competed in
  const divisions = [...new Set(results.map(r => r.div))]

  // Recent form: last 5
  const recentForm = results.slice(0, 5)

  // Season breakdown
  const seasons = [...new Set(results.map(r => new Date(r.date).getFullYear()))].sort((a, b) => b - a)

  return (
    <div className="pb-20 md:pb-0">
      {/* Hero */}
      <section style={{ backgroundColor: '#0A2540', padding: '120px 24px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <Link href="/athletes" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', marginBottom: 24, display: 'inline-block', letterSpacing: '0.08em' }}>← ATHLETES</Link>

          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
            <div style={{ width: 96, height: 96, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
              {athlete.image ? <img src={athlete.image} alt={athlete.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.1)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 28 }}>{athlete.name.split(' ').map((n: string) => n[0]).join('')}</div>}
            </div>
            <div>
              <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(1.75rem,4vw,2.5rem)', color: '#fff', marginBottom: 4 }}>{athlete.name}</h1>
              <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>BARBADOS 🇧🇧 · {divisions.length > 0 ? divisions.join(', ') : 'Competitor'}</p>
            </div>
          </div>

          {/* Stats dashboard */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }} className="grid-responsive-5">
            {[
              { val: results.length.toString(), label: 'Events' },
              { val: wins.toString(), label: 'Wins' },
              { val: podiums.toString(), label: 'Podiums' },
              { val: `${winRate}%`, label: 'Win Rate' },
              { val: bestScore > 0 ? bestScore.toFixed(2) : '—', label: 'Best Score' },
            ].map(s => (
              <div key={s.label} style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22, color: '#fff' }}>{s.val}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <WaveDivider color="#FFFFFF" bg="#0A2540" />

      <section style={{ backgroundColor: '#FFFFFF', padding: '32px 24px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {/* Recent form */}
          {recentForm.length > 0 && (
            <ScrollReveal>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 16, color: '#0A2540', marginBottom: 12 }}>Recent Form</h2>
              <div style={{ display: 'flex', gap: 8, marginBottom: 40, flexWrap: 'wrap' }}>
                {recentForm.map((r, i) => (
                  <Link key={`${r.eid}-${r.div}-${i}`} href={`/events/${r.eid}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(10,37,64,0.06)', backgroundColor: r.place === 1 ? 'rgba(255,215,0,0.06)' : r.place <= 3 ? 'rgba(43,165,160,0.04)' : '#fff' }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 14, color: r.place <= 3 ? medalColors[r.place - 1] || '#2BA5A0' : 'rgba(26,26,26,0.25)' }}>#{r.place}</span>
                    <div>
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, fontWeight: 600, color: '#0A2540' }}>{r.div}</div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'rgba(26,26,26,0.3)' }}>{new Date(r.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                    </div>
                    {r.total && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 600, color: 'rgba(26,26,26,0.4)', marginLeft: 4 }}>{r.total.toFixed(2)}</span>}
                  </Link>
                ))}
              </div>
            </ScrollReveal>
          )}

          {/* Season breakdown */}
          {seasons.map(year => {
            const seasonResults = results.filter(r => new Date(r.date).getFullYear() === year)
            return (
              <ScrollReveal key={year}>
                <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 16, color: '#0A2540', marginBottom: 12, marginTop: 8 }}>{year} Season</h2>
                <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(10,37,64,0.06)', marginBottom: 32 }}>
                  {seasonResults.map((r, i) => (
                    <Link key={`${r.eid}-${r.div}`} href={`/events/${r.eid}`} style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto auto', gap: 12, alignItems: 'center', padding: '10px 16px', textDecoration: 'none', borderBottom: i < seasonResults.length - 1 ? '1px solid rgba(10,37,64,0.04)' : 'none', backgroundColor: '#fff' }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 13, color: r.place <= 3 ? medalColors[r.place - 1] || '#999' : 'rgba(26,26,26,0.2)', textAlign: 'center' }}>#{r.place}</span>
                      <div>
                        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500, fontSize: 13, color: '#0A2540' }}>{r.ename}</div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(26,26,26,0.3)' }}>{r.div} · {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      </div>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'rgba(26,26,26,0.4)' }}>{r.total?.toFixed(2)}</span>
                      {/* Visual bar */}
                      <div style={{ width: 48, height: 6, borderRadius: 3, backgroundColor: 'rgba(10,37,64,0.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(((r.total || 0) / 20) * 100, 100)}%`, backgroundColor: r.place === 1 ? '#FFD700' : r.place <= 3 ? '#2BA5A0' : '#1478B5', borderRadius: 3 }} />
                      </div>
                    </Link>
                  ))}
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </section>
    </div>
  )
}
