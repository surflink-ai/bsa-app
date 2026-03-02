"use client"
import Link from "next/link"
import { ScrollReveal } from "../../components/ScrollReveal"

interface Props {
  athlete: { id: string; name: string; image: string | null; nationality: string | null }
  history: { eventId: string; eventName: string; eventDate: string; division: string; place: number; score: number }[]
}

export function AthleteDetailClient({ athlete, history }: Props) {
  const bestFinish = history.length > 0 ? Math.min(...history.map(h => h.place)) : null
  const avgScore = history.length > 0 ? history.reduce((s, h) => s + h.score, 0) / history.length : 0
  return (
    <div style={{ paddingTop: 64 }}>
      <section style={{ backgroundColor: "#FFFFFF", padding: "64px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Link href="/athletes" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(26,26,26,0.4)", textDecoration: "none", marginBottom: 32, display: "inline-block" }}>&larr; All Athletes</Link>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 32, alignItems: "center", marginBottom: 48 }}>
            <div style={{ width: 120, height: 120, borderRadius: "50%", backgroundColor: "#F2EDE4", overflow: "hidden", flexShrink: 0 }}>
              {athlete.image ? <img src={athlete.image} alt={athlete.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 600, color: "rgba(26,26,26,0.15)" }}>{athlete.name.split(" ").map(n => n[0]).join("")}</div>
              )}
            </div>
            <div>
              <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem, 4vw, 2.5rem)", color: "#1A1A1A", marginBottom: 4 }}>{athlete.name}</h1>
              {athlete.nationality && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(26,26,26,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{athlete.nationality}</div>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 48, flexWrap: "wrap", marginBottom: 48 }}>
            {[
              { val: String(history.length), label: "Events" },
              { val: bestFinish ? `#${bestFinish}` : "--", label: "Best Finish" },
              { val: avgScore > 0 ? avgScore.toFixed(2) : "--", label: "Avg Score" },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 28, color: "#1A1A1A" }}>{s.val}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(26,26,26,0.35)", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section style={{ backgroundColor: "#F2EDE4", padding: "48px 24px 96px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 20 }}>COMPETITION HISTORY</div>
          {history.length > 0 ? (
            <div style={{ backgroundColor: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              {history.map((h, i) => (
                <ScrollReveal key={`${h.eventId}-${h.division}-${i}`}>
                  <Link href={`/events/${h.eventId}`} style={{ textDecoration: "none", display: "block" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, padding: "14px 24px", backgroundColor: i % 2 === 0 ? "#fff" : "#FFFFFF", borderBottom: "1px solid rgba(26,26,26,0.04)" }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 14, color: h.place <= 3 ? "#1478B5" : "rgba(26,26,26,0.3)", width: 32, textAlign: "center" }}>#{h.place}</div>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: "#1A1A1A" }}>{h.eventName}</div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(26,26,26,0.35)", marginTop: 2 }}>{new Date(h.eventDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })} &middot; {h.division}</div>
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 14, color: "#2BA5A0" }}>{h.score.toFixed(2)}</div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "rgba(26,26,26,0.4)" }}>No competition history available.</p>
          )}
        </div>
      </section>
    </div>
  )
}
