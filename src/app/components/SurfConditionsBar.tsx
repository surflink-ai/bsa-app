"use client"
import { useState, useEffect } from "react"

// Only these 4 spots, in this order
const FEATURED_SPOTS = [
  { id: "5842041f4e65fad6a7708b48", name: "Soup Bowl" },
  { id: "5842041f4e65fad6a7708c81", name: "Brandon's" },
  { id: "584204204e65fad6a77099c0", name: "Freights" },
  { id: "584204204e65fad6a77099c3", name: "Tropicana" },
]

interface SpotForecast {
  name: string
  waveMin: number
  waveMax: number
  conditions: string
  windSpeed: number
  windDir: string
  swellHeight: number
  swellPeriod: number
}

const conditionColors: Record<string, string> = {
  EPIC: "#8B5CF6",
  GOOD: "#22c55e",
  FAIR: "#22c55e",
  FAIR_TO_GOOD: "#22c55e",
  POOR_TO_FAIR: "#eab308",
  POOR: "#f97316",
  VERY_POOR: "#ef4444",
  FLAT: "rgba(255,255,255,0.15)",
}

const conditionLabels: Record<string, string> = {
  EPIC: "Epic",
  GOOD: "Good",
  FAIR: "Fair",
  FAIR_TO_GOOD: "Fair-Good",
  POOR_TO_FAIR: "Poor-Fair",
  POOR: "Poor",
  VERY_POOR: "Very Poor",
  FLAT: "Flat",
}

function windDirLabel(deg: number): string {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"]
  return dirs[Math.round(deg / 22.5) % 16]
}

export function SurfConditionsBar() {
  const [spots, setSpots] = useState<SpotForecast[]>([])

  useEffect(() => {
    let mounted = true

    async function fetchAll() {
      try {
        // Use overview endpoint — has Surfline-corrected wave heights per spot
        const res = await fetch('/api/conditions')
        if (!res.ok) return
        const d = await res.json()
        // Collect all spots from all coasts
        const allSpots = [...(d.east || []), ...(d.south || []), ...(d.west || [])]
        const spotMap = new Map(allSpots.map((s: any) => [s.spotId, s]))

        const results = FEATURED_SPOTS.map(spot => {
          const s = spotMap.get(spot.id)
          if (!s) return null
          return {
            name: spot.name,
            waveMin: s.waveMin || 0,
            waveMax: s.waveMax || 0,
            conditions: s.conditions || "FLAT",
            windSpeed: s.windSpeed || 0,
            windDir: s.windType || s.windDir || "",
            swellHeight: s.swellHeight || 0,
            swellPeriod: s.swellPeriod || 0,
          } as SpotForecast
        })
        if (mounted) setSpots(results.filter(Boolean) as SpotForecast[])
      } catch { /* silent */ }
    }

    fetchAll()
    const interval = setInterval(fetchAll, 900000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  if (spots.length === 0) return null

  return (
    <div style={{ backgroundColor: "#0A2540", padding: "12px 24px", overflow: "hidden" }}>
      <div className="no-scrollbar" style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "center", gap: "clamp(20px, 4vw, 48px)", overflowX: "auto" }}>
        {spots.map(spot => (
          <div key={spot.name} style={{ display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap", flexShrink: 0 }}>
            {/* Condition dot */}
            <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: conditionColors[spot.conditions] || "rgba(255,255,255,0.15)", display: "inline-block", flexShrink: 0 }} />
            {/* Spot name */}
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
              {spot.name}
            </span>
            {/* Wave height */}
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: "#fff" }}>
              {spot.waveMin}-{spot.waveMax}ft
            </span>
            {/* Condition label */}
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: conditionColors[spot.conditions] || "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {conditionLabels[spot.conditions] || spot.conditions}
            </span>
            {/* Wind */}
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
              {spot.windSpeed}kts {spot.windDir}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
