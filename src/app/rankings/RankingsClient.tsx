"use client"
import { useState, useEffect } from "react"
import type { SeriesInfo, EventDivisionFull } from "@/lib/liveheats"
import { ScrollReveal } from "../components/ScrollReveal"

interface RankEntry { athleteId: string; name: string; image: string | null; points: number; eventsCount: number }

export function RankingsClient({ series }: { series: SeriesInfo[] }) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [rankings, setRankings] = useState<RankEntry[]>([])
  const [loading, setLoading] = useState(false)
  const selected = series[selectedIdx]

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    const run = async () => {
      const map = new Map<string, RankEntry>()
      for (const sEvent of selected.events) {
        try {
          const res = await fetch(`/api/event/${sEvent.id}`)
          if (!res.ok) continue
          const ev = await res.json() as { eventDivisions: EventDivisionFull[] }
          for (const div of ev.eventDivisions) {
            for (const r of div.ranking || []) {
              const a = r.competitor.athlete
              const ex = map.get(a.id)
              if (ex) { ex.points += r.total; ex.eventsCount++; if (!ex.image && a.image) ex.image = a.image }
              else map.set(a.id, { athleteId: a.id, name: a.name, image: a.image, points: r.total, eventsCount: 1 })
            }
          }
        } catch { /* skip */ }
      }
      setRankings(Array.from(map.values()).sort((a, b) => b.points - a.points))
      setLoading(false)
    }
    run()
  }, [selected])

  const maxPts = rankings[0]?.points || 1

  if (series.length === 0) {
    return (
      <div style={{ paddingTop: 64 }}>
        <section style={{ backgroundColor: "#FAFAF8", padding: "64px 24px 96px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>RANKINGS</div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem, 4vw, 3rem)", color: "#1A1A1A", marginBottom: 24 }}>Season Rankings</h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "rgba(26,26,26,0.4)", lineHeight: 1.75 }}>No series data available yet.</p>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div style={{ paddingTop: 64 }}>
      <section style={{ backgroundColor: "#FAFAF8", padding: "64px 24px 96px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>RANKINGS</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem, 4vw, 3rem)", color: "#1A1A1A", marginBottom: 32 }}>Season Rankings</h1>
          <div style={{ display: "flex", gap: 8, marginBottom: 40, flexWrap: "wrap" }}>
            {series.map((s, i) => (
              <button key={s.id} onClick={() => setSelectedIdx(i)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: "8px 18px", borderRadius: 6, border: "none", cursor: "pointer", backgroundColor: selectedIdx === i ? "#0A2540" : "rgba(26,26,26,0.06)", color: selectedIdx === i ? "#fff" : "rgba(26,26,26,0.5)", transition: "all 0.2s ease" }}>
                {s.name}
              </button>
            ))}
          </div>
          {loading && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(26,26,26,0.35)" }}>Loading rankings...</p>}
          {!loading && rankings.length === 0 && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "rgba(26,26,26,0.4)" }}>No ranking data for this series yet.</p>}
          {rankings.length > 0 && (
            <div style={{ backgroundColor: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              {rankings.map((r, i) => (
                <ScrollReveal key={r.athleteId}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 24px", backgroundColor: i % 2 === 0 ? "#fff" : "#FAFAF8", borderBottom: "1px solid rgba(26,26,26,0.04)" }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 14, color: i < 3 ? "#1478B5" : "rgba(26,26,26,0.3)", width: 32, textAlign: "center" }}>{i + 1}</div>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#F2EDE4", overflow: "hidden", flexShrink: 0 }}>
                      {r.image ? <img src={r.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: "rgba(26,26,26,0.2)", fontWeight: 600 }}>{r.name.split(" ").map(n => n[0]).join("")}</div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: "#1A1A1A" }}>{r.name}</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(26,26,26,0.3)", marginTop: 2 }}>{r.eventsCount} event{r.eventsCount !== 1 ? "s" : ""}</div>
                    </div>
                    <div style={{ flex: 1, maxWidth: 200, height: 6, backgroundColor: "rgba(26,26,26,0.04)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${(r.points / maxPts) * 100}%`, height: "100%", backgroundColor: "#2BA5A0", borderRadius: 3, transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)" }} />
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 14, color: "#2BA5A0", minWidth: 56, textAlign: "right" }}>{r.points.toFixed(1)}</div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
