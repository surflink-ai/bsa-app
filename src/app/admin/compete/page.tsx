'use client'
import { PageHeader } from '@/components/admin/ui'

const features = [
  { icon: '📋', title: 'Event Management', desc: 'Create events, set dates, locations, divisions. Full event lifecycle from draft to results published.' },
  { icon: '🏄', title: 'Heat Draw & Seeding', desc: 'Automatic snake-seed bracket generation based on SOTY rankings. Manual override available.' },
  { icon: '⚖️', title: 'ISA Scoring System', desc: '5-judge blind panels with drop high/low. International Surfing Association compliant scoring.' },
  { icon: '📊', title: 'Live Scoring Dashboard', desc: 'Real-time score entry, priority management, interference calls. Works on iPad at the beach.' },
  { icon: '🏆', title: 'Results & Rankings', desc: 'Automatic SOTY points calculation. Season standings update instantly after each event.' },
  { icon: '📺', title: 'Stream Integration', desc: 'Score overlay for live streams. OBS Browser Source with real-time heat data.' },
  { icon: '⌚', title: 'Apple Watch Support', desc: 'Priority display on athlete\'s wrist. WiFi-connected via Starlink at the beach.' },
  { icon: '🤖', title: 'AI Judge Co-Pilot', desc: 'Computer vision analysis, telemetry scoring suggestions, consistency alerts for head judge.' },
]

export default function AdminCompetePage() {
  return (
    <div>
      <PageHeader title="Competition Management" subtitle="Powered by HeatSync — ISA-compliant surf competition platform" />

      {/* Coming Soon Banner */}
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
          HeatSync Competition Platform
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: 'var(--admin-text-muted)', maxWidth: 500, margin: '0 auto 24px', lineHeight: 1.6 }}>
          A purpose-built competition management system replacing LiveHeats. Create events, manage judges, run live scoring, and generate results — all from this dashboard.
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--admin-text-muted)', opacity: 0.7 }}>
          HeatSync integration requires a separate agreement. Contact SurfLink to enable.
        </p>
      </div>

      {/* Feature Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
        {features.map(f => (
          <div key={f.title} style={{
            padding: '20px', borderRadius: 12,
            border: '1px solid var(--admin-border)',
            backgroundColor: 'rgba(0,0,0,0.01)',
            opacity: 0.6,
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: 'var(--admin-text)', marginBottom: 6 }}>{f.title}</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--admin-text-muted)', lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{
        padding: '20px 24px', borderRadius: 12,
        backgroundColor: 'rgba(43,165,160,0.04)',
        border: '1px solid rgba(43,165,160,0.15)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: 'var(--admin-text)', marginBottom: 2 }}>Ready to upgrade your competition workflow?</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--admin-text-muted)' }}>HeatSync replaces LiveHeats with a BSA-owned platform. Full ISA compliance.</div>
        </div>
        <a href="mailto:paew82@gmail.com?subject=HeatSync%20for%20BSA" style={{
          padding: '10px 24px', borderRadius: 8, backgroundColor: '#2BA5A0', color: '#fff',
          fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600,
          textDecoration: 'none', whiteSpace: 'nowrap',
        }}>
          Contact SurfLink
        </a>
      </div>
    </div>
  )
}
