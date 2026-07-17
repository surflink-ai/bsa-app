'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div style={{
      minHeight: '70vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: '120px 24px', backgroundColor: '#0A2540', color: '#fff',
    }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: 16 }}>
        SOMETHING BROKE
      </div>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', marginBottom: 12 }}>
        Unexpected wave
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 420, marginBottom: 28, lineHeight: 1.6 }}>
        We hit an error loading this page. Try again — if it keeps happening, let the BSA committee know.
      </p>
      <button onClick={reset} style={{
        padding: '12px 24px', borderRadius: 8, backgroundColor: '#2BA5A0',
        color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
      }}>
        Try again
      </button>
    </div>
  )
}
