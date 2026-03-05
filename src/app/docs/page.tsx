import Link from 'next/link'

export const metadata = {
  title: 'Documentation — BSA',
  description: 'Documentation for the BSA website and HeatSync competition platform.',
}

export default function DocsPage() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px' }}>
      <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 42, fontWeight: 700, color: '#0A2540', marginBottom: 12 }}>
        Documentation
      </h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, color: '#64748B', marginBottom: 48, lineHeight: 1.6 }}>
        Technical documentation for the Barbados Surfing Association.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <a href="https://heatsync.ai/docs" style={{ textDecoration: 'none' }}>
          <div style={{
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: 32,
            background: 'linear-gradient(135deg, #F0FDFA 0%, #F1F5F9 100%)',
          }}>
            <div style={{ fontSize: 14, fontFamily: 'JetBrains Mono, monospace', color: '#2BA5A0', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Competition Platform
            </div>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 26, fontWeight: 700, color: '#0A2540', marginBottom: 12 }}>
              HeatSync
            </h2>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#64748B', lineHeight: 1.6, marginBottom: 16 }}>
              AI-powered surf competition platform — ISA-compliant scoring, Apple Watch priority, livestream overlays, and judge assistance. Hosted at heatsync.ai.
            </p>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#2BA5A0' }}>
              heatsync.ai/docs →
            </div>
          </div>
        </a>
      </div>
    </div>
  )
}
