'use client'

import { useState, useEffect } from 'react'

export function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number; secs: number } | null>(null)

  useEffect(() => {
    function calc() {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) return null
      return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      }
    }
    setTimeLeft(calc())
    const id = setInterval(() => setTimeLeft(calc()), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  if (!timeLeft) return <p className="text-white/40 text-sm">Event started</p>

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hrs', value: timeLeft.hours },
    { label: 'Min', value: timeLeft.mins },
    { label: 'Sec', value: timeLeft.secs },
  ]

  return (
    <div className="flex gap-3">
      {units.map((u) => (
        <div key={u.label} className="bg-white/5 rounded-lg px-3 py-2 text-center min-w-[52px]">
          <div className="text-xl font-bold font-mono">{String(u.value).padStart(2, '0')}</div>
          <div className="text-[10px] text-white/40 uppercase tracking-wider">{u.label}</div>
        </div>
      ))}
    </div>
  )
}
