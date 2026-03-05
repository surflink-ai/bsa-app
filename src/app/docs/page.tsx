import Link from 'next/link'

export const metadata = {
  title: 'Documentation — BSA',
  description: 'Technical documentation for BSA Compete and HeatSync.',
}

export default function DocsPage() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px' }}>
      <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 42, fontWeight: 700, color: '#0A2540', marginBottom: 12 }}>
        Documentation
      </h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, color: '#64748B', marginBottom: 48, lineHeight: 1.6 }}>
        Technical documentation for the Barbados Surfing Association platform.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340, 1fr))', gap: 24 }}>
        <Link href="/docs/compete" style={{ textDecoration: 'none' }}>
          <div style={{
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: 32,
            transition: 'all 0.2s',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
          }}>
            <div style={{ fontSize: 14, fontFamily: 'JetBrains Mono, monospace', color: '#2BA5A0', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Competition System
            </div>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 26, fontWeight: 700, color: '#0A2540', marginBottom: 12 }}>
              BSA Compete
            </h2>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#64748B', lineHeight: 1.6, marginBottom: 16 }}>
              ISA-compliant surf competition management — multi-judge blind scoring, priority system, Apple Watch integration, livestream overlays, and full event lifecycle.
            </p>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#2BA5A0' }}>
              Read docs →
            </div>
          </div>
        </Link>

        <Link href="/docs/heatsync" style={{ textDecoration: 'none' }}>
          <div style={{
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: 32,
            transition: 'all 0.2s',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #F0FDFA 0%, #F1F5F9 100%)',
          }}>
            <div style={{ fontSize: 14, fontFamily: 'JetBrains Mono, monospace', color: '#2BA5A0', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              AI Platform
            </div>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 26, fontWeight: 700, color: '#0A2540', marginBottom: 12 }}>
              HeatSync
            </h2>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#64748B', lineHeight: 1.6, marginBottom: 16 }}>
              The world's first end-to-end AI-assisted surf competition platform — competition management, wearable telemetry, computer vision, and judge assistance in one unified stack.
            </p>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#2BA5A0' }}>
              Read docs →
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
