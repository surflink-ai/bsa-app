"use client"
import { useState } from "react"
import Link from "next/link"
import type { BSAEvent } from "@/lib/liveheats"
import { ScrollReveal } from "../components/ScrollReveal"
import { CalendarIcon, MapPinIcon, ArrowRightIcon } from "../components/Icons"

function EventCard({ event }: { event: BSAEvent }) {
  const date = new Date(event.date)
  return (
    <Link href={`/events/${event.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div style={{ backgroundColor: "#fff", borderRadius: 10, padding: 28, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease", cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 18, color: "#1A1A1A", marginBottom: 8 }}>{event.name}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(26,26,26,0.45)", marginBottom: 4 }}>
              <CalendarIcon size={14} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>{date.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
            {event.location && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(26,26,26,0.35)" }}>
                <MapPinIcon size={14} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>{event.location.formattedAddress}</span>
              </div>
            )}
          </div>
          {event.eventDivisions.length > 0 && (
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "4px 10px", borderRadius: 16, backgroundColor: "rgba(26,26,26,0.04)", color: "rgba(26,26,26,0.5)" }}>
              {event.eventDivisions.length} div{event.eventDivisions.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#1478B5", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600 }}>
          View Details <ArrowRightIcon size={13} />
        </div>
      </div>
    </Link>
  )
}

export function EventsClient({ upcomingEvents, pastEvents }: { upcomingEvents: BSAEvent[]; pastEvents: BSAEvent[] }) {
  const years = [...new Set(pastEvents.map(e => new Date(e.date).getFullYear()))].sort((a, b) => b - a)
  const [selectedYear, setSelectedYear] = useState(years[0] || new Date().getFullYear())
  const filteredPast = pastEvents.filter(e => new Date(e.date).getFullYear() === selectedYear)

  return (
    <div style={{ paddingTop: 64 }}>
      <section style={{ backgroundColor: "#FAFAF8", padding: "64px 24px 48px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>UPCOMING EVENTS</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem, 4vw, 3rem)", color: "#1A1A1A", marginBottom: 40 }}>Competition Calendar</h1>
          {upcomingEvents.length > 0 ? (
            <div style={{ display: "grid", gap: 16 }}>{upcomingEvents.map(e => <ScrollReveal key={e.id}><EventCard event={e} /></ScrollReveal>)}</div>
          ) : (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "rgba(26,26,26,0.4)" }}>No upcoming events scheduled. Check back soon.</p>
          )}
        </div>
      </section>
      <section style={{ backgroundColor: "#F2EDE4", padding: "64px 24px 96px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>PAST EVENTS</div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#1A1A1A", marginBottom: 32 }}>Results Archive</h2>
          {years.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
              {years.map(y => (
                <button key={y} onClick={() => setSelectedYear(y)} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500, padding: "8px 18px", borderRadius: 6, border: "none", cursor: "pointer", backgroundColor: selectedYear === y ? "#0A2540" : "rgba(26,26,26,0.06)", color: selectedYear === y ? "#fff" : "rgba(26,26,26,0.5)", transition: "all 0.2s ease" }}>
                  {y}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: "grid", gap: 16 }}>{filteredPast.map(e => <ScrollReveal key={e.id}><EventCard event={e} /></ScrollReveal>)}</div>
          {filteredPast.length === 0 && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "rgba(26,26,26,0.4)" }}>No events for {selectedYear}.</p>}
        </div>
      </section>
    </div>
  )
}
