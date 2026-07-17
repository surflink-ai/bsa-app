import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '70vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: '120px 24px', backgroundColor: '#0A2540', color: '#fff',
    }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: 16 }}>
        404
      </div>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', marginBottom: 12 }}>
        Wiped out
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 420, marginBottom: 28, lineHeight: 1.6 }}>
        That page paddled out and never came back. Let&rsquo;s get you to calmer water.
      </p>
      <Link href="/" style={{
        padding: '12px 24px', borderRadius: 8, backgroundColor: '#2BA5A0',
        color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 14,
      }}>
        Back to home
      </Link>
    </div>
  )
}
