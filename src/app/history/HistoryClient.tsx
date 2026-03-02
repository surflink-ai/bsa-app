'use client'
import { useState, useMemo } from 'react'
import { ScrollReveal } from '../components/ScrollReveal'
import { WaveDivider } from '../components/WaveDivider'
import type { Champion } from '@/lib/history'

const tierHighlight: Record<string, boolean> = { "Open Mens": true, "Open Womens": true, "Pro Mens": true, "Pro Womens": true }

export function HistoryClient({ championsByYear, years }: { championsByYear: Record<number, Champion[]>; years: number[] }) {
  const [selectedYear, setSelectedYear] = useState<number | null>(years[0] || null)
  const champs = selectedYear ? (championsByYear[selectedYear] || []) : []
  const highlighted = champs.filter(c => tierHighlight[c.division])
  const others = champs.filter(c => !tierHighlight[c.division])

  // Dynasty tracker — find athletes with multiple titles
  const dynasties = useMemo(() => {
    const counts: Record<string, { name: string; image?: string; divisions: Set<string>; years: Set<number>; total: number }> = {}
    for (const year of years) {
      for (const c of championsByYear[year] || []) {
        const key = c.name.toLowerCase()
        if (!counts[key]) counts[key] = { name: c.name, image: c.image, divisions: new Set(), years: new Set(), total: 0 }
        counts[key].divisions.add(c.division)
        counts[key].years.add(year)
        counts[key].total++
        if (c.image) counts[key].image = c.image
      }
    }
    return Object.values(counts).filter(d => d.total >= 3).sort((a, b) => b.total - a.total).slice(0, 6)
  }, [championsByYear, years])

  return (
    <div className="pb-20 md:pb-0">
      {/* Hero */}
      <section style={{ backgroundColor: '#0A2540', padding: '120px 24px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: 12 }}>Hall of Champions</p>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(2rem,5vw,3rem)', color: '#fff', marginBottom: 8 }}>Historical Records</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', maxWidth: 520 }}>National champions across all divisions, {years.length > 0 ? `${years[years.length-1]}–${years[0]}` : 'compiled from BSA data'}.</p>
        </div>
      </section>

      {/* Dynasty tracker */}
      {dynasties.length > 0 && (
        <section style={{ backgroundColor: '#0A2540', padding: '0 24px 48px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 }}>Most Decorated</div>
            <div className="no-scrollbar" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
              {dynasties.map(d => (
                <div key={d.name} style={{ flexShrink: 0, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '16px 20px', border: '1px solid rgba(255,255,255,0.06)', minWidth: 200, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', border: '2px solid #FFD700', flexShrink: 0 }}>
                    {d.image ? <img src={d.image} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.15)', fontWeight: 600, fontSize: 14 }}>🏆</div>}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14, color: '#fff' }}>{d.name}</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#FFD700', fontWeight: 700 }}>{d.total}x Champion</div>
                    <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                      {[...d.years].sort().map(y => (
                        <span key={y} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, padding: '1px 5px', borderRadius: 4, backgroundColor: 'rgba(255,215,0,0.1)', color: 'rgba(255,215,0,0.6)' }}>{y}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <WaveDivider color="#FFFFFF" bg="#0A2540" />

      <section style={{ backgroundColor: '#FFFFFF', padding: '32px 24px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {years.length > 0 ? (
            <>
              {/* Year tabs */}
              <ScrollReveal>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 40 }}>
                  {years.map(y => (
                    <button key={y} onClick={() => setSelectedYear(y)} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, fontWeight: 700, padding: '12px 24px', borderRadius: 8, border: selectedYear === y ? '2px solid #0A2540' : '2px solid rgba(10,37,64,0.08)', cursor: 'pointer', backgroundColor: selectedYear === y ? '#0A2540' : '#fff', color: selectedYear === y ? '#fff' : 'rgba(26,26,26,0.5)', transition: 'all 0.2s', minWidth: 72, textAlign: 'center' }}>{y}</button>
                  ))}
                </div>
              </ScrollReveal>

              {selectedYear && champs.length > 0 && (
                <>
                  {/* Featured champions */}
                  {highlighted.length > 0 && (
                    <ScrollReveal>
                      <div className="grid-responsive-2" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(highlighted.length, 2)}, 1fr)`, gap: 16, marginBottom: 32 }}>
                        {highlighted.map(c => (
                          <div key={`${c.division}-${c.name}`} style={{ background: 'linear-gradient(135deg, #0A2540 0%, #0D3055 100%)', borderRadius: 16, padding: 'clamp(20px,3vw,32px)', display: 'flex', alignItems: 'center', gap: 20 }}>
                            <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', border: '3px solid #FFD700', flexShrink: 0, boxShadow: '0 0 20px rgba(255,215,0,0.15)' }}>
                              {c.image ? <img src={c.image} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.2)', fontWeight: 600, fontSize: 22 }}>🏆</div>}
                            </div>
                            <div>
                              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#FFD700', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>{c.division} · {selectedYear}</div>
                              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(18px,2.5vw,24px)', color: '#fff' }}>{c.name}</div>
                              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>National Champion</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollReveal>
                  )}

                  {/* Other divisions as grid */}
                  {others.length > 0 && (
                    <ScrollReveal>
                      <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14, color: 'rgba(26,26,26,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>All Divisions</h3>
                      <div className="grid-responsive-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                        {others.map(c => (
                          <div key={`${c.division}-${c.name}`} style={{ borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(10,37,64,0.06)', display: 'flex', alignItems: 'center', gap: 12, backgroundColor: '#fff' }}>
                            <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, backgroundColor: '#0A2540', border: '2px solid rgba(10,37,64,0.1)' }}>
                              {c.image ? <img src={c.image} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.12)', fontSize: 11, fontWeight: 600 }}>{c.name.split(' ').map((n: string) => n[0]).join('')}</div>}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 13, color: '#0A2540', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(26,26,26,0.35)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.division}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollReveal>
                  )}
                </>
              )}
            </>
          ) : (
            <p style={{ textAlign: 'center', color: 'rgba(26,26,26,0.3)', padding: '3rem 0' }}>Historical records coming soon.</p>
          )}
        </div>
      </section>
    </div>
  )
}
