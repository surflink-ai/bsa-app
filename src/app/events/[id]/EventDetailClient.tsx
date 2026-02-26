"use client"
import { useState } from "react"
import Link from "next/link"
import type { EventDivisionFull } from "@/lib/liveheats"
import { ScrollReveal } from "../../components/ScrollReveal"
import { ChevronDownIcon } from "../../components/Icons"

interface Props {
  event: { id: string; name: string; date: string; status: string; eventDivisions: EventDivisionFull[] }
}

export function EventDetailClient({ event }: Props) {
  const [activeDivIdx, setActiveDivIdx] = useState(0)
  const [expandedHeats, setExpandedHeats] = useState<Set<string>>(new Set())
  const date = new Date(event.date)
  const div = event.eventDivisions[activeDivIdx]

  const toggleHeat = (id: string) => {
    setExpandedHeats(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const heatsByRound: Record<string, typeof div.heats> = {}
  if (div) { for (const h of div.heats) { if (!heatsByRound[h.round]) heatsByRound[h.round] = []; heatsByRound[h.round].push(h) } }

  const statusColor = event.status === "in_progress" ? "#2BA5A0" : event.status === "results_published" ? "rgba(26,26,26,0.5)" : "#1478B5"
  const statusBg = event.status === "in_progress" ? "rgba(43,165,160,0.12)" : event.status === "results_published" ? "rgba(26,26,26,0.06)" : "rgba(20,120,181,0.1)"
  const statusText = event.status === "in_progress" ? "Live" : event.status === "results_published" ? "Complete" : "Upcoming"

  return (
    <div style={{ paddingTop: 64 }}>
      <section style={{ backgroundColor: "#FAFAF8", padding: "64px 24px 48px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Link href="/events" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(26,26,26,0.4)", textDecoration: "none", marginBottom: 24, display: "inline-block" }}>&larr; All Events</Link>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, marginBottom: 8 }}>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem, 4vw, 2.5rem)", color: "#1A1A1A" }}>{event.name}</h1>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "4px 12px", borderRadius: 16, backgroundColor: statusBg, color: statusColor, textTransform: "uppercase", letterSpacing: "0.1em" }}>{statusText}</span>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "rgba(26,26,26,0.45)" }}>
            {date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </section>

      {event.eventDivisions.length > 0 && (
        <section style={{ backgroundColor: "#F2EDE4", padding: "0 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div className="no-scrollbar" style={{ display: "flex", gap: 4, overflowX: "auto", padding: "16px 0" }}>
              {event.eventDivisions.map((d, i) => (
                <button key={d.id} onClick={() => { setActiveDivIdx(i); setExpandedHeats(new Set()) }} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: "8px 18px", borderRadius: 6, border: "none", cursor: "pointer", whiteSpace: "nowrap", backgroundColor: activeDivIdx === i ? "#0A2540" : "transparent", color: activeDivIdx === i ? "#fff" : "rgba(26,26,26,0.5)", transition: "all 0.2s ease" }}>{d.division.name}</button>
              ))}
            </div>
          </div>
        </section>
      )}

      {div && (
        <section style={{ backgroundColor: "#FAFAF8", padding: "48px 24px 96px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            {div.ranking && div.ranking.length > 0 && (
              <ScrollReveal>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 20 }}>FINAL STANDINGS</div>
                <div style={{ backgroundColor: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", marginBottom: 48 }}>
                  {div.ranking.map((r, i) => (
                    <Link key={`${r.competitor.athlete.id}-${i}`} href={`/athletes/${r.competitor.athlete.id}`} style={{ textDecoration: "none", display: "block" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 24px", backgroundColor: i % 2 === 0 ? "#fff" : "#FAFAF8", borderBottom: "1px solid rgba(26,26,26,0.04)" }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 14, color: i < 3 ? "#1478B5" : "rgba(26,26,26,0.3)", width: 32, textAlign: "center" }}>{r.place}</div>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#F2EDE4", overflow: "hidden", flexShrink: 0 }}>
                          {r.competitor.athlete.image ? <img src={r.competitor.athlete.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: "rgba(26,26,26,0.2)", fontWeight: 600 }}>{r.competitor.athlete.name.split(" ").map(n => n[0]).join("")}</div>
                          )}
                        </div>
                        <div style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: "#1A1A1A" }}>{r.competitor.athlete.name}</div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 14, color: "#2BA5A0" }}>{r.total.toFixed(2)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </ScrollReveal>
            )}
            {Object.keys(heatsByRound).length > 0 && (
              <ScrollReveal>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 20 }}>HEATS</div>
                {Object.entries(heatsByRound).map(([round, heats]) => (
                  <div key={round} style={{ marginBottom: 24 }}>
                    <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 16, color: "#1A1A1A", marginBottom: 12 }}>{round}</h3>
                    {heats.sort((a, b) => a.position - b.position).map(heat => {
                      const isOpen = expandedHeats.has(heat.id)
                      return (
                        <div key={heat.id} style={{ backgroundColor: "#fff", borderRadius: 8, marginBottom: 8, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
                          <button onClick={() => toggleHeat(heat.id)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", border: "none", cursor: "pointer", backgroundColor: "transparent", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#1A1A1A" }}>
                            <span>Heat {heat.position}</span>
                            <span style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease", color: "rgba(26,26,26,0.3)" }}><ChevronDownIcon size={16} /></span>
                          </button>
                          {isOpen && heat.result && (
                            <div style={{ padding: "0 20px 16px" }}>
                              {heat.result.sort((a, b) => a.place - b.place).map((r, ri) => {
                                const waves = Object.values(r.rides || {}).flat()
                                return (
                                  <div key={ri} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderTop: ri > 0 ? "1px solid rgba(26,26,26,0.04)" : "none" }}>
                                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: r.place <= 2 ? "#1478B5" : "rgba(26,26,26,0.3)", width: 24, textAlign: "center", fontWeight: 600 }}>{r.place}</div>
                                    <div style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#1A1A1A" }}>{r.competitor.athlete.name}</div>
                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                      {waves.map((w, wi) => (
                                        <span key={wi} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "2px 6px", borderRadius: 4, backgroundColor: w.scoring_ride ? "rgba(43,165,160,0.1)" : "rgba(26,26,26,0.03)", color: w.scoring_ride ? "#2BA5A0" : "rgba(26,26,26,0.4)", fontWeight: w.scoring_ride ? 600 : 400 }}>{w.total.toFixed(2)}</span>
                                      ))}
                                    </div>
                                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 14, color: "#1A1A1A", minWidth: 48, textAlign: "right" }}>{r.total.toFixed(2)}</div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </ScrollReveal>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
