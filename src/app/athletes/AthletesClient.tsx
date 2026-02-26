"use client"
import { useState } from "react"
import Link from "next/link"
import { ScrollReveal } from "../components/ScrollReveal"
import { SearchIcon } from "../components/Icons"

interface Athlete { id: string; name: string; image: string | null; nationality: string | null; eventCount: number }

export function AthletesClient({ athletes }: { athletes: Athlete[] }) {
  const [search, setSearch] = useState("")
  const filtered = athletes.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <div style={{ paddingTop: 64 }}>
      <section style={{ backgroundColor: "#FAFAF8", padding: "64px 24px 96px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>ATHLETES</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem, 4vw, 3rem)", color: "#1A1A1A", marginBottom: 32 }}>BSA Competitors</h1>
          <div style={{ position: "relative", maxWidth: 400, marginBottom: 48 }}>
            <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(26,26,26,0.3)" }}><SearchIcon size={18} /></div>
            <input type="text" placeholder="Search athletes..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", padding: "12px 16px 12px 42px", fontFamily: "'DM Sans', sans-serif", fontSize: 14, border: "1px solid rgba(26,26,26,0.1)", borderRadius: 8, backgroundColor: "#fff", outline: "none" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 24 }}>
            {filtered.map(a => (
              <ScrollReveal key={a.id}>
                <Link href={`/athletes/${a.id}`} style={{ textDecoration: "none", display: "block" }}>
                  <div style={{ backgroundColor: "#fff", borderRadius: 10, padding: 24, textAlign: "center", transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <div style={{ width: 80, height: 80, borderRadius: "50%", margin: "0 auto 16px", backgroundColor: "#F2EDE4", overflow: "hidden" }}>
                      {a.image ? <img src={a.image} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 600, color: "rgba(26,26,26,0.15)" }}>{a.name.split(" ").map(n => n[0]).join("")}</div>
                      )}
                    </div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, color: "#1A1A1A", marginBottom: 4 }}>{a.name}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(26,26,26,0.35)", letterSpacing: "0.1em" }}>{a.eventCount} event{a.eventCount !== 1 ? "s" : ""}</div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
          {filtered.length === 0 && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "rgba(26,26,26,0.4)", textAlign: "center", padding: "48px 0" }}>No athletes found.</p>}
        </div>
      </section>
    </div>
  )
}
