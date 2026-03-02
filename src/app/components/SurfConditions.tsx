"use client"
import { useState, useEffect } from "react"

interface Conditions {
  waveHeight: number
  wavePeriod: number
  waveDirection: number
  windSpeed: number
  windDirection: number
  windGusts: number
  waterTemp: number
}

const SPOTS = [
  { name: "Soup Bowl", lat: 13.2117, lon: -59.5233, coast: "East" },
  { name: "South Point", lat: 13.0542, lon: -59.5289, coast: "South" },
  { name: "Freights Bay", lat: 13.0656, lon: -59.5492, coast: "South" },
  { name: "Drill Hall", lat: 13.0797, lon: -59.5986, coast: "South" },
]

function degToCompass(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
  return dirs[Math.round(deg / 22.5) % 16]
}

function waveRating(height: number, period: number): { label: string; color: string } {
  const score = height * 0.6 + period * 0.15
  if (score > 2.5) return { label: "Firing", color: "#ef4444" }
  if (score > 1.5) return { label: "Good", color: "#22c55e" }
  if (score > 0.8) return { label: "Fair", color: "#eab308" }
  return { label: "Flat", color: "rgba(26,26,26,0.3)" }
}

function metersToFeet(m: number): string {
  return (m * 3.28084).toFixed(1)
}

export function SurfConditions() {
  const [data, setData] = useState<Record<string, Conditions>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const fetchAll = async () => {
      const results: Record<string, Conditions> = {}
      await Promise.all(SPOTS.map(async (spot) => {
        try {
          const marineRes = await fetch(
            `https://marine-api.open-meteo.com/v1/marine?latitude=${spot.lat}&longitude=${spot.lon}&current=wave_height,wave_period,wave_direction,ocean_temperature&timezone=America/Barbados`
          )
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${spot.lat}&longitude=${spot.lon}&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=America/Barbados`
          )
          const marine = await marineRes.json()
          const weather = await weatherRes.json()
          results[spot.name] = {
            waveHeight: marine.current?.wave_height ?? 0,
            wavePeriod: marine.current?.wave_period ?? 0,
            waveDirection: marine.current?.wave_direction ?? 0,
            windSpeed: weather.current?.wind_speed_10m ?? 0,
            windDirection: weather.current?.wind_direction_10m ?? 0,
            windGusts: weather.current?.wind_gusts_10m ?? 0,
            waterTemp: marine.current?.ocean_temperature ?? 0,
          }
        } catch { /* skip spot */ }
      }))
      if (mounted) { setData(results); setLoading(false) }
    }
    fetchAll()
    const interval = setInterval(fetchAll, 300000) // refresh every 5 min
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  if (loading) return null

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>CURRENT CONDITIONS</div>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem, 4vw, 3rem)", color: "#fff", lineHeight: 1.15, marginBottom: 32 }}>Surf Report</h2>
      <div className="grid-responsive-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {SPOTS.map(spot => {
          const c = data[spot.name]
          if (!c) return null
          const rating = waveRating(c.waveHeight, c.wavePeriod)
          return (
            <div key={spot.name} style={{ backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, color: "#fff" }}>{spot.name}</h3>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, backgroundColor: `${rating.color}20`, color: rating.color }}>{rating.label}</span>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>{spot.coast} Coast</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>Waves</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: "#fff" }}>{metersToFeet(c.waveHeight)}ft</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{c.wavePeriod}s {degToCompass(c.waveDirection)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>Wind</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: "#fff" }}>{Math.round(c.windSpeed)}kph</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{degToCompass(c.windDirection)} G{Math.round(c.windGusts)}</div>
                </div>
              </div>
              {c.waterTemp > 0 && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Water: {Math.round(c.waterTemp * 9/5 + 32)}°F / {Math.round(c.waterTemp)}°C</div>}
            </div>
          )
        })}
      </div>
      <div style={{ textAlign: "right", marginTop: 12 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.2)" }}>Data: Open-Meteo Marine API · Updates every 5 min</span>
      </div>
    </div>
  )
}
