"use client"
import { useState, useEffect } from "react"

interface Wave { score: number; counted: boolean }
interface Surfer { name: string; score: number; singlet: string; priority: string; waveCount: number; waves: Wave[]; status: string }
interface LiveHeat { round: string; heatNumber: number; timer: string | null; surfers: Surfer[] }
interface LiveData { event: string; division: string; round: string; liveHeat: LiveHeat | null }

const SCRAPER_URL = "https://scraper.corus.surf/api/live"

const singletColors: Record<string, string> = {
  blue: "#1478B5",
  red: "#ef4444",
  white: "#e5e7eb",
  yellow: "#eab308",
  green: "#22c55e",
  black: "#374151",
  pink: "#ec4899",
}

export function LiveScoring() {
  const [data, setData] = useState<LiveData | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let mounted = true
    const poll = async () => {
      try {
        const res = await fetch(SCRAPER_URL, { cache: "no-store" })
        if (!res.ok) throw new Error("not ok")
        const json = await res.json()
        if (mounted) { setData(json); setError(false) }
      } catch { if (mounted) setError(true) }
    }
    poll()
    const interval = setInterval(poll, 10000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  if (error || !data?.liveHeat || !data.liveHeat.surfers?.length) return null

  const heat = data.liveHeat
  const surfers = [...heat.surfers].sort((a, b) => b.score - a.score)

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#ef4444", display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
        LIVE SCORING
      </div>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)", color: "#0A2540", lineHeight: 1.15, marginBottom: 4 }}>{data.event || "Live Competition"}</h2>
      <p style={{ fontSize: 14, color: "rgba(26,26,26,0.4)", marginBottom: 32 }}>
        {data.division} · {heat.round}{heat.heatNumber > 0 ? ` Heat ${heat.heatNumber}` : ""}
        {heat.timer && <span style={{ marginLeft: 12, fontFamily: "'JetBrains Mono', monospace", color: "#1478B5", fontWeight: 600 }}>{heat.timer}</span>}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {surfers.map((s, i) => (
          <div key={s.name} style={{ backgroundColor: "#fff", borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 16, borderLeft: `4px solid ${singletColors[s.singlet] || "#999"}` }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: i === 0 ? "#1478B5" : "rgba(26,26,26,0.2)", minWidth: 28 }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, color: "#0A2540" }}>{s.name}</span>
                {s.priority === "P" && <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", backgroundColor: "#2BA5A0", borderRadius: 4, padding: "1px 5px" }}>P</span>}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                {s.waves.map((w, wi) => (
                  <span key={wi} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "2px 8px", borderRadius: 4, backgroundColor: w.counted ? "rgba(20,120,181,0.08)" : "rgba(26,26,26,0.04)", color: w.counted ? "#1478B5" : "rgba(26,26,26,0.3)", fontWeight: w.counted ? 600 : 400 }}>{w.score.toFixed(2)}</span>
                ))}
              </div>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "clamp(1.25rem, 3vw, 1.75rem)", color: i === 0 ? "#1478B5" : "#0A2540" }}>{s.score.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
