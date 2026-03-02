"use client"
import { useState, useEffect } from "react"

interface SpotData {
  spotId: string
  name: string
  conditions: string
  waveMin: number
  waveMax: number
  coast: string
}

const conditionColors: Record<string, string> = {
  EPIC: "#8B5CF6",
  GOOD: "#22c55e",
  FAIR: "#22c55e",
  FAIR_TO_GOOD: "#22c55e",
  POOR_TO_FAIR: "#eab308",
  POOR: "#f97316",
  VERY_POOR: "#ef4444",
  FLAT: "rgba(255,255,255,0.2)",
}

export function SurfConditionsBar() {
  const [spots, setSpots] = useState<SpotData[]>([])

  useEffect(() => {
    let mounted = true

    async function fetchData() {
      try {
        const res = await fetch("/api/conditions")
        if (!res.ok) return
        const data = await res.json()
        const all: SpotData[] = [
          ...(data.east || []),
          ...(data.south || []),
          ...(data.west || []),
        ].filter((s: SpotData) => s.waveMax > 0)
        all.sort((a, b) => b.waveMax - a.waveMax)
        if (mounted) setSpots(all.slice(0, 8))
      } catch { /* silent */ }
    }

    fetchData()
    const interval = setInterval(fetchData, 900000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  if (spots.length === 0) return null

  return (
    <div style={{ backgroundColor: "rgba(10,37,64,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "10px 24px", overflow: "hidden" }}>
      <div className="no-scrollbar" style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "center", gap: "clamp(16px, 3vw, 40px)", overflowX: "auto" }}>
        {spots.map(spot => (
          <div key={spot.spotId} style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", flexShrink: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: conditionColors[spot.conditions] || "rgba(255,255,255,0.2)", display: "inline-block" }} />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{spot.name}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
              {spot.waveMin}-{spot.waveMax}ft
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
