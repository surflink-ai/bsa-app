'use client'
import { useState } from 'react'
import { ScrollReveal } from '../components/ScrollReveal'
import type { Champion } from '@/lib/history'

export function HistoryClient({ championsByYear, years }: { championsByYear: Record<number, Champion[]>; years: number[] }) {
  const [selectedYear, setSelectedYear] = useState<number | null>(years[0] || null)

  return (
    <div className="pb-20 md:pb-0" style={{ paddingTop: '5rem' }}>
      <div className="max-w-4xl mx-auto px-6 md:px-8" style={{ padding: 'clamp(2rem,4vw,4rem) 1.5rem' }}>
        <ScrollReveal>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: '1rem' }}>Hall of Champions</p>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(2rem,5vw,3rem)', color: '#0A2540', marginBottom: '0.5rem' }}>Historical Records</h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(26,26,26,0.45)', marginBottom: '2.5rem', maxWidth: 600 }}>A record of BSA national champions across all divisions since the founding of the association.</p>
        </ScrollReveal>

        {years.length > 0 ? (
          <>
            <ScrollReveal>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
                {years.map(y => (
                  <button key={y} onClick={() => setSelectedYear(y)} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.8rem', padding: '0.45rem 1rem', borderRadius: '999px', border: 'none', cursor: 'pointer', backgroundColor: selectedYear === y ? '#0A2540' : '#F2EDE4', color: selectedYear === y ? '#fff' : 'rgba(26,26,26,0.5)' }}>{y}</button>
                ))}
              </div>
            </ScrollReveal>

            {selectedYear && championsByYear[selectedYear] && (
              <ScrollReveal>
                <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '1.25rem', color: '#0A2540', marginBottom: '1.5rem' }}>{selectedYear} Champions</h2>
                <div style={{ backgroundColor: '#fff', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  {championsByYear[selectedYear].map((c, i) => (
                    <div key={`${c.division}-${c.name}`} style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.25rem', gap: '1rem', borderBottom: i < championsByYear[selectedYear].length - 1 ? '1px solid rgba(26,26,26,0.04)' : 'none', backgroundColor: i % 2 === 0 ? '#fff' : '#FFFFFF' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#F2EDE4', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {c.image ? <img src={c.image} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1rem', color: 'rgba(10,37,64,0.15)', fontWeight: 600 }}>🏆</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '0.95rem', color: '#0A2540' }}>{c.name}</div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.7rem', color: 'rgba(26,26,26,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{c.division}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            )}
          </>
        ) : (
          <p style={{ textAlign: 'center', color: 'rgba(26,26,26,0.3)', padding: '3rem 0' }}>Historical records coming soon. Check back as we compile championship data from past seasons.</p>
        )}
      </div>
    </div>
  )
}
