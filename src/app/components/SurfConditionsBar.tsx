"use client"
import { useState, useEffect } from "react"

interface Conditions {
  waveHeight: number
  wavePeriod: number
  waveDirection: number
  windSpeed: number
  windDirection: number
}

const SPOTS = [
  { name: "Soup Bowl", lat: 13.2117, lon: -59.5233 },
  { name: "South Point", lat: 13.0542, lon: -59.5289 },
  { name: "Freights", lat: 13.0656, lon: -59.5492 },
  { name: "Drill Hall", lat: 13.0797, lon: -59.5986 },
]

function degToCompass(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
  return dirs[Math.round(deg / 22.5) % 16]
}

function metersToFeet(m: number): string {
  return (m * 3.28084).toFixed(1)
}

function ratingDot(height: number, period: number): string {
  const score = height * 0.6 + period * 0.15
  if (score > 2.5) return "#ef4444"
  if (score > 1.5) return "#22c55e"
  if (score > 0.8) return "#eab308"
  return "rgba(255,255,255,0.2)"
}

export function SurfConditionsBar() {
  const [data, setData] = useState<Record<string, Conditions>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const fetchAll = async () => {
      const results: Record<string, Conditions> = {}
      await Promise.all(SPOTS.map(async (spot) => {
        try {
          const [marineRes, weatherRes] = await Promise.all([
            fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${spot.lat}&longitude=${spot.lon}&current=wave_height,wave_period,wave_direction&timezone=America/Barbados`),
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${spot.lat}&longitude=${spot.lon}&current=wind_speed_10m,wind_direction_10m&timezone=America/Barbados`),
          ])
          const marine = await marineRes.json()
          const weather = await weatherRes.json()
          results[spot.name] = {
            waveHeight: marine.current?.wave_height ?? 0,
            wavePeriod: marine.current?.wave_period ?? 0,
            waveDirection: marine.current?.wave_direction ?? 0,
            windSpeed: weather.current?.wind_speed_10m ?? 0,
            windDirection: weather.current?.wind_direction_10m ?? 0,
          }
        } catch { /* skip */ }
      }))
      if (mounted) { setData(results); setLoading(false) }
    }
    fetchAll()
    const interval = setInterval(fetchAll, 300000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  if (loading || Object.keys(data).length === 0) return null

  return (
    <div style={{ backgroundColor: "rgba(10,37,64,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "10px 24px", overflow: "hidden" }}>
      <div className="no-scrollbar" style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "center", gap: "clamp(16px, 3vw, 40px)", overflowX: "auto" }}>
        {SPOTS.map(spot => {
          const c = data[spot.name]
          if (!c) return null
          return (
            <div key={spot.name} style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", flexShrink: 0 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: ratingDot(c.waveHeight, c.wavePeriod), display: "inline-block" }} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{spot.name}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                {metersToFeet(c.waveHeight)}ft · {c.wavePeriod}s {degToCompass(c.waveDirection)} · {Math.round(c.windSpeed)}kph {degToCompass(c.windDirection)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
