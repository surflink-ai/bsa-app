'use client'
import { useEffect, useState } from 'react'

export function CountdownTimer({ target, targetDate }: { target?: string; targetDate?: string }) {
  const tgt = target || targetDate || ''
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 })
  useEffect(() => {
    const calc = () => {
      const diff = Math.max(0, new Date(tgt).getTime() - Date.now())
      setT({ d: Math.floor(diff / 86400000), h: Math.floor((diff / 3600000) % 24), m: Math.floor((diff / 60000) % 60), s: Math.floor((diff / 1000) % 60) })
    }
    calc()
    const i = setInterval(calc, 1000)
    return () => clearInterval(i)
  }, [tgt])
  const units = [{ label: 'Days', value: t.d }, { label: 'Hours', value: t.h }, { label: 'Minutes', value: t.m }, { label: 'Seconds', value: t.s }]
  return (
    <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
      {units.map(u => (
        <div key={u.label} style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, color: '#1478B5', lineHeight: 1 }}>{String(u.value).padStart(2, '0')}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(26,26,26,0.4)', marginTop: '0.5rem' }}>{u.label}</div>
        </div>
      ))}
    </div>
  )
}

export default CountdownTimer
