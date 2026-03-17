'use client'
import { PageHeader } from '@/components/admin/ui'

const capabilities = [
  { title: 'Judge Panels', desc: '5-judge blind scoring with automatic drop high/low. Assign judges to events and divisions.' },
  { title: 'Head Judge Dashboard', desc: 'See all scores in real-time. Override individual scores with full audit trail.' },
  { title: 'Interference Calls', desc: 'Log interference incidents with priority management. Half-score, DQ, and cascading penalties.' },
  { title: 'Score Analytics', desc: 'Track judge consistency, deviation from panel average, and scoring patterns over time.' },
  { title: 'QR Code Login', desc: 'Judges sign into the scoring app by scanning a QR code at the beach. No passwords needed.' },
  { title: 'Certification', desc: 'Heat certification workflow with 15-minute protest window. Full compliance with ISA rules.' },
]

export default function AdminJudgesPage() {
  return (
    <div>
      <PageHeader title="Judges" subtitle="Judge panel management, scoring oversight, and performance tracking" />

      <div style={{
        padding: '32px', marginBottom: 32, borderRadius: 12, textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(43,165,160,0.06) 0%, rgba(10,37,64,0.04) 100%)',
        border: '2px dashed rgba(43,165,160,0.3)',
      }}>
        <div style={{
          display: 'inline-block', padding: '6px 16px', borderRadius: 20,
          backgroundColor: 'rgba(43,165,160,0.1)', color: '#2BA5A0',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600,
          letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16,
        }}>
          Coming Soon
        </div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 8 }}>
          HeatSync Judge System
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: 'var(--admin-text-muted)', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
          ISA-compliant judging with blind panels, real-time scoring, and head judge oversight. Available when HeatSync is enabled.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {capabilities.map(c => (
          <div key={c.title} style={{
            padding: '20px', borderRadius: 12,
            border: '1px solid var(--admin-border)',
            backgroundColor: 'rgba(0,0,0,0.01)', opacity: 0.6,
          }}>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: 'var(--admin-text)', marginBottom: 6 }}>{c.title}</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--admin-text-muted)', lineHeight: 1.5, margin: 0 }}>{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
