'use client'
import { useState, useEffect } from 'react'
export function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  useEffect(() => {
    const u = () => {
      const d = new Date(targetDate).getTime() - Date.now()
      if (d <= 0) return setT({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      setT({ days: Math.floor(d / 864e5), hours: Math.floor((d % 864e5) / 36e5), minutes: Math.floor((d % 36e5) / 6e4), seconds: Math.floor((d % 6e4) / 1e3) })
    }
    u(); const i = setInterval(u, 1000); return () => clearInterval(i)
  }, [targetDate])
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(16px, 4vw, 32px)' }}>
      {Object.entries(t).map(([label, value]) => (
        <div key={label} style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#fff' }}>{String(value).padStart(2, '0')}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginTop: '0.5rem' }}>{label}</div>
        </div>
      ))}
    </div>
  )
}
