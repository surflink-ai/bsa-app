'use client'
import { useState } from 'react'
import { ScrollReveal } from '../components/ScrollReveal'
import { WaveDivider } from '../components/WaveDivider'
import type { Champion } from '@/lib/history'

const tierHighlight: Record<string, boolean> = { "Open Mens": true, "Open Womens": true, "Pro Mens": true, "Pro Womens": true }

export function HistoryClient({ championsByYear, years }: { championsByYear: Record<number, Champion[]>; years: number[] }) {
  const [selectedYear, setSelectedYear] = useState<number | null>(years[0] || null)
  const champs = selectedYear ? (championsByYear[selectedYear] || []) : []
  const highlighted = champs.filter(c => tierHighlight[c.division])
  const others = champs.filter(c => !tierHighlight[c.division])

  return (
    <div className="pb-20 md:pb-0">
      {/* Hero */}
      <section style={{ backgroundColor: '#0A2540', padding: '120px 24px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: 12 }}>Hall of Champions</p>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(2rem,5vw,3rem)', color: '#fff', marginBottom: 8 }}>Historical Records</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', maxWidth: 520 }}>National champions across all divisions, compiled from BSA Championship data.</p>
        </div>
      </section>
      <WaveDivider color="#FFFFFF" bg="#0A2540" />

      <section style={{ backgroundColor: '#FFFFFF', padding: '32px 24px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {years.length > 0 ? (
            <>
              {/* Year tabs */}
              <ScrollReveal>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 40 }}>
                  {years.map(y => (
                    <button key={y} onClick={() => setSelectedYear(y)} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 700, padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', backgroundColor: selectedYear === y ? '#0A2540' : 'rgba(10,37,64,0.04)', color: selectedYear === y ? '#fff' : 'rgba(26,26,26,0.4)', transition: 'all 0.2s', minWidth: 64 }}>{y}</button>
                  ))}
                </div>
              </ScrollReveal>

              {selectedYear && champs.length > 0 && (
                <>
                  {/* Feature champions (Open/Pro) */}
                  {highlighted.length > 0 && (
                    <ScrollReveal>
                      <div className="grid-responsive-2" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(highlighted.length, 2)}, 1fr)`, gap: 20, marginBottom: 32 }}>
                        {highlighted.map(c => (
                          <div key={`${c.division}-${c.name}`} style={{ backgroundColor: '#0A2540', borderRadius: 12, padding: 28, display: 'flex', alignItems: 'center', gap: 20 }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: '3px solid #FFD700', flexShrink: 0 }}>
                              {c.image ? <img src={c.image} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.2)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 20 }}>🏆</div>}
                            </div>
                            <div>
                              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#FFD700', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{c.division}</div>
                              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 20, color: '#fff' }}>{c.name}</div>
                              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{selectedYear} National Champion</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollReveal>
                  )}

                  {/* Other divisions */}
                  {others.length > 0 && (
                    <ScrollReveal>
                      <div className="grid-responsive-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        {others.map(c => (
                          <div key={`${c.division}-${c.name}`} style={{ borderRadius: 10, padding: '16px 20px', border: '1px solid rgba(10,37,64,0.06)', display: 'flex', alignItems: 'center', gap: 14, backgroundColor: '#fff' }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, backgroundColor: '#0A2540' }}>
                              {c.image ? <img src={c.image} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', fontSize: 12, fontWeight: 600 }}>{c.name.split(' ').map((n: string) => n[0]).join('')}</div>}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14, color: '#0A2540', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(26,26,26,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.division}</div>
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
