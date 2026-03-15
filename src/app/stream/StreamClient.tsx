'use client'

export function StreamClient() {
  return (
    <div style={{
      minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16, padding: 40, textAlign: 'center',
      background: '#0A2540',
    }}>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700,
        color: '#fff',
      }}>
        Stream Ended
      </div>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif", fontSize: 16,
        color: 'rgba(255,255,255,0.4)', maxWidth: 400,
      }}>
        The SOTY Championship Event #1 live stream has ended. Check back for the next event.
      </div>
      <a href="/" style={{
        marginTop: 16, fontFamily: "'Space Grotesk', sans-serif", fontSize: 14,
        fontWeight: 600, color: '#2BA5A0', textDecoration: 'none',
      }}>
        ← Back to bsa.surf
      </a>
    </div>
  )
}
