"use client"
import Link from "next/link"
import { useState } from "react"
import type { BSAOrg, BSAEvent } from "@/lib/liveheats"
import { ScrollReveal } from "./components/ScrollReveal"
import { CountUp } from "./components/CountUp"
import { CountdownTimer } from "./components/CountdownTimer"
import { WaveDivider } from "./components/WaveDivider"
import { ChevronDownIcon, ArrowRightIcon, TrophyIcon, UsersIcon, CompassIcon } from "./components/Icons"
import { SurfConditionsBar } from "./components/SurfConditionsBar"
import { getLatestArticles, getCategoryLabel } from "@/lib/news"

interface Props {
  org: BSAOrg & { events: BSAEvent[]; series: { id: string; name: string }[] }
  upcomingEvents: BSAEvent[]
  pastEvents: BSAEvent[]
  latestResults: {
    event: { id: string; name: string; eventDivisions: { division: { name: string }; ranking: { place: number; total: number; competitor: { athlete: { id: string; name: string; image: string | null } } }[] }[] }
    eventName: string
    eventDate: string
  } | null
}

// 2026 SOTY Schedule (verified from BSA Instagram Feb 25, 2026)
const SCHEDULE_2026 = [
  { num: 1, date: "March 14", location: "Drill Hall", status: "next" },
  { num: 2, date: "April 11", location: "South Point", status: "upcoming" },
  { num: 3, date: "May 9", location: "Long Beach", status: "upcoming" },
  { num: 4, date: "September 26", location: "Parlour", status: "upcoming" },
  { num: 5, date: "Nov 27–29", location: "Soup Bowl", status: "upcoming", special: "Independence Pro & Nationals" },
]

// BSA Management Committee 2026-2027 (verified from BSA Instagram)
const COMMITTEE = [
  { name: "Stewart Stoute", title: "President", initials: "SS" },
  { name: "Barry Banfield", title: "Vice President", initials: "BB" },
  { name: "Lorena Brits", title: "Secretary", initials: "LB" },
  { name: "Nick Hughes", title: "Treasurer", initials: "NH" },
  { name: "Stefan Corbin", title: "PR Officer", initials: "SC" },
  { name: "Jacob Burke", title: "Committee", initials: "JB" },
  { name: "Noah Campbell", title: "Committee", initials: "NC" },
  { name: "Christopher Clarke", title: "Committee", initials: "CC" },
]

const COMPETITION_BREAKS = [
  { name: "Soup Bowl", coast: "East Coast", desc: "Powerful right-hand coral reef break at Bathsheba. Handles swells from 3–16ft+ with heavy barrel sections on NE swells. Best with SW/S winds. Home of the Independence Pro and annual Nationals." },
  { name: "South Point", coast: "South Coast", desc: "Left-hand coral reef break below the South Point Lighthouse. Needs S/SW swell to fire, works best on mid to high tide. Long walls with hollow rights on the inside." },
  { name: "Freights Bay", coast: "South Coast", desc: "Fast hollow left-hand point break over sand and rock, south of Oistins. Three takeoff sections along the cliff — needs solid S/SW swell (5ft+) to break. Best with N winds." },
  { name: "Drill Hall", coast: "South Coast", desc: "Reef break near the Garrison with rights and lefts. Sheltered from the prevailing trade winds, making it one of the most competition-friendly spots on the south coast." },
  { name: "Parlour", coast: "East Coast", desc: "Reef break just south of Bathsheba, receiving year-round Atlantic trade wind swell. Shorter, punchy waves with a rocky bottom — consistent but best on smaller days." },
  { name: "Long Beach", coast: "South Coast", desc: "Sandy beach break on the south-east coast with multiple shifting peaks. Works on most tides and handles a range of swell sizes. Popular for all levels." },
]

export function HomeClient({ org, upcomingEvents, pastEvents, latestResults }: Props) {
  const nextEvent = upcomingEvents[0] || null
  const totalEvents = org.events.length

  // Latest results: Open Mens + Open Womens only
  const displayDivisions: { divName: string; podium: { place: number; name: string; score: number; image: string | null }[] }[] = []
  if (latestResults) {
    for (const div of latestResults.event.eventDivisions) {
      const name = div.division.name.toLowerCase()
      const isOpenMens = name.includes("open") && name.includes("men") && !name.includes("women")
      const isOpenWomens = name.includes("open") && name.includes("women")
      if ((isOpenMens || isOpenWomens) && div.ranking && div.ranking.length >= 3) {
        displayDivisions.push({
          divName: div.division.name,
          podium: div.ranking.slice(0, 3).map(r => ({
            place: r.place,
            name: r.competitor.athlete.name,
            score: r.total,
            image: r.competitor.athlete.image,
          })),
        })
      }
    }
  }

  // Athletes: ONLY those with profile photos
  const featuredAthletes: { id: string; name: string; image: string }[] = []
  if (latestResults) {
    for (const div of latestResults.event.eventDivisions) {
      for (const r of div.ranking || []) {
        if (featuredAthletes.length >= 12) break
        const a = r.competitor.athlete
        if (a.image && !featuredAthletes.find(f => f.id === a.id))
          featuredAthletes.push({ id: a.id, name: a.name, image: a.image })
      }
    }
  }

  // Podium component
  const PodiumBlock = ({ data, divName }: { data: typeof displayDivisions[0]["podium"]; divName: string }) => {
    const order = [data[1], data[0], data[2]].filter(Boolean)
    const configs = [
      { img: 64, bar: 100, accent: "#C0C0C0", label: "2nd" },
      { img: 88, bar: 140, accent: "#FFD700", label: "1st" },
      { img: 64, bar: 72, accent: "#CD7F32", label: "3rd" },
    ]
    return (
      <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: "32px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, color: "#0A2540", textAlign: "center", marginBottom: 28, textTransform: "uppercase", letterSpacing: "0.08em" }}>{divName}</h3>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: "clamp(16px, 4vw, 32px)" }}>
          {order.map((p, i) => (
            <div key={p.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "clamp(80px, 20vw, 120px)" }}>
              <div style={{ width: configs[i].img, height: configs[i].img, borderRadius: "50%", overflow: "hidden", marginBottom: 10, border: `3px solid ${configs[i].accent}`, boxShadow: i === 1 ? "0 0 16px rgba(255,215,0,0.3)" : "none" }}>
                {p.image ? <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0A2540", color: "rgba(255,255,255,0.3)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: configs[i].img * 0.28 }}>{p.name.split(" ").map((n: string) => n[0]).join("")}</div>}
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, color: "#0A2540", textAlign: "center", lineHeight: 1.3, marginBottom: 2 }}>{p.name}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 12, color: configs[i].accent === "#FFD700" ? "#B8860B" : "#2BA5A0", marginBottom: 8 }}>{p.score.toFixed(2)}</div>
              <div style={{ width: "100%", height: configs[i].bar, borderRadius: "8px 8px 0 0", background: i === 1 ? "linear-gradient(180deg, #1478B5 0%, #0A2540 100%)" : i === 0 ? "linear-gradient(180deg, #2BA5A0 0%, #0A2540 100%)" : "#0A2540", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 10, opacity: i === 2 ? 0.5 : 1 }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: "#fff" }}>{p.place}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="pb-20 md:pb-0">
      {/* HERO — navy */}
      <section style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0A2540 0%, #0D3055 50%, #0A2540 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: "0 24px" }}>
        <svg style={{ position: "absolute", bottom: 0, left: 0, right: 0, opacity: 0.04 }} viewBox="0 0 1440 320" preserveAspectRatio="none"><path fill="#fff" d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,229.3C672,235,768,213,864,192C960,171,1056,149,1152,154.7C1248,160,1344,192,1392,208L1440,224L1440,320L0,320Z" /></svg>
        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <div className="anim-scale"><img src="https://liveheats.com/images/dbb2a21b-7566-4629-8ea5-4c08a0b2877b.webp" alt="BSA Logo" style={{ width: 100, height: 100, borderRadius: "50%", margin: "0 auto 32px", objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)" }} /></div>
          <h1 className="anim-fade-1" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(2rem, 5vw, 4rem)", color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.05, maxWidth: 800, margin: "0 auto" }}>BARBADOS SURFING<br />ASSOCIATION</h1>
          <p className="anim-fade-2" style={{ fontSize: "clamp(0.95rem, 2vw, 1.2rem)", color: "rgba(255,255,255,0.55)", maxWidth: 480, margin: "20px auto 0", lineHeight: 1.6 }}>The National Governing Body for Surfing in Barbados</p>
          <p className="anim-fade-3" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 24 }}>EST. 1995 &middot; ISA Member Federation</p>
        </div>
        <div className="anim-fade-4 anim-float" style={{ position: "absolute", bottom: 32, color: "rgba(255,255,255,0.25)" }}><ChevronDownIcon size={24} /></div>
      </section>

      {/* SURF CONDITIONS BAR */}
      <SurfConditionsBar />

      {/* STATS — white */}
      <WaveDivider color="#FFFFFF" bg="#0A2540" />
      <section style={{ backgroundColor: "#FFFFFF", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, textAlign: "center" }} className="stagger grid-responsive-4">
            {[{ end: 250, suffix: "+", label: "Athletes" }, { end: totalEvents, suffix: "", label: "Sanctioned Events" }, { end: org.series.length || 6, suffix: "", label: "SOTY Seasons" }, { end: COMPETITION_BREAKS.length, suffix: "", label: "Competition Breaks" }].map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 100}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(2rem, 4vw, 3rem)", color: "#0A2540" }}><CountUp end={stat.end} suffix={stat.suffix} /></div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(26,26,26,0.4)", marginTop: 8 }}>{stat.label}</div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* NEXT EVENT + FULL SCHEDULE — navy */}
      {nextEvent && (<>
        <WaveDivider color="#0A2540" bg="#FFFFFF" />
        <section style={{ backgroundColor: "#0A2540", padding: "80px 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <ScrollReveal>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }} className="grid-responsive-2">
                {/* Left: Next event with countdown */}
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>NEXT EVENT</div>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2.5rem)", color: "#fff", lineHeight: 1.15, marginBottom: 12 }}>{nextEvent.name}</h2>
                  <div style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>{new Date(nextEvent.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 24 }}>Drill Hall, South Coast</div>
                  <div style={{ marginBottom: 28 }}><CountdownTimer targetDate={nextEvent.date} /></div>
                  {nextEvent.eventDivisions.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 28 }}>
                      {nextEvent.eventDivisions.map(d => (
                        <span key={d.id} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, padding: "4px 10px", borderRadius: 20, backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{d.division.name}</span>
                      ))}
                    </div>
                  )}
                  <a href="https://bsa.surf" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "#fff", backgroundColor: "#1478B5", padding: "12px 28px", borderRadius: 6, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.05em" }}>Register on BSA.surf <ArrowRightIcon size={16} /></a>
                </div>
                {/* Right: Full 2026 schedule */}
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>2026 SEASON</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {SCHEDULE_2026.map((event, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderBottom: i < SCHEDULE_2026.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                        <div style={{ width: 32, textAlign: "center" }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: event.status === "next" ? "#2BA5A0" : "rgba(255,255,255,0.2)", fontWeight: 700 }}>#{event.num}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: event.status === "next" ? "#fff" : "rgba(255,255,255,0.5)" }}>{event.special || `SOTY Event #${event.num}`}</div>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{event.date} · {event.location}</div>
                        </div>
                        {event.status === "next" && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, padding: "3px 8px", borderRadius: 10, backgroundColor: "#2BA5A0", color: "#fff", textTransform: "uppercase", letterSpacing: "0.1em" }}>Next</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </>)}

      {/* LATEST RESULTS — white */}
      {displayDivisions.length > 0 && latestResults && (<>
        <WaveDivider color="#FFFFFF" bg="#0A2540" />
        <section style={{ backgroundColor: "#FFFFFF", padding: "80px 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <ScrollReveal>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>LATEST RESULTS</div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2.5rem)", color: "#0A2540", lineHeight: 1.15, marginBottom: 8 }}>{latestResults.eventName}</h2>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(26,26,26,0.35)", marginBottom: 48 }}>{new Date(latestResults.eventDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
            </ScrollReveal>
            <div className="grid-responsive-2" style={{ display: "grid", gridTemplateColumns: displayDivisions.length > 1 ? "repeat(2, 1fr)" : "1fr", gap: 32, marginBottom: 32 }}>
              {displayDivisions.map(d => (
                <ScrollReveal key={d.divName}><PodiumBlock data={d.podium} divName={d.divName} /></ScrollReveal>
              ))}
            </div>
            <div style={{ textAlign: "center" }}><Link href={`/events/${latestResults.event.id}`} style={{ fontSize: 14, fontWeight: 600, color: "#1478B5", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>View Full Results <ArrowRightIcon size={14} /></Link></div>
          </div>
        </section>
      </>)}

      {/* ATHLETES — navy (only those with photos) */}
      {featuredAthletes.length > 0 && (<>
        <WaveDivider color="#0A2540" bg="#FFFFFF" />
        <section style={{ backgroundColor: "#0A2540", padding: "80px 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <ScrollReveal>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>REPRESENTING BARBADOS</div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2.5rem)", color: "#fff", lineHeight: 1.15, marginBottom: 48 }}>Our Athletes</h2>
            </ScrollReveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }} className="stagger grid-responsive-4">
              {featuredAthletes.slice(0, 8).map(a => (
                <ScrollReveal key={a.id}>
                  <Link href={`/athletes/${a.id}`} style={{ textDecoration: "none", display: "block" }}>
                    <div style={{ borderRadius: 12, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.04)", transition: "transform 0.2s" }}>
                      <div style={{ aspectRatio: "1", overflow: "hidden" }}>
                        <img src={a.image} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }} />
                      </div>
                      <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: "#fff" }}>{a.name}</div>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginTop: 3, textTransform: "uppercase" }}>Barbados 🇧🇧</div>
                        </div>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, padding: "3px 8px", borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>Claim</span>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <Link href="/athletes" style={{ fontSize: 14, fontWeight: 600, color: "#2BA5A0", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>View All Athletes <ArrowRightIcon size={14} /></Link>
            </div>
          </div>
        </section>
      </>)}

      {/* ABOUT — white */}
      <WaveDivider color="#FFFFFF" bg="#0A2540" />
      <section style={{ backgroundColor: "#FFFFFF", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>WHO WE ARE</div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2.5rem)", color: "#0A2540", lineHeight: 1.15, marginBottom: 24, maxWidth: 680 }}>Developing world-class surfing talent in the heart of the Caribbean</h2>
            <p style={{ fontSize: "1rem", lineHeight: 1.9, color: "rgba(26,26,26,0.55)", maxWidth: 640, marginBottom: 64 }}>Founded in 1995, the Barbados Surfing Association is the recognised national governing body for the sport of surfing in Barbados and an affiliated member of the International Surfing Association. We organise national championship events, develop competitive surfers from grassroots to elite level, and represent Barbados at international competitions.</p>
          </ScrollReveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }} className="stagger grid-responsive-3">
            {[
              { title: "COMPETE", desc: "Championship events throughout the year, from groms to open divisions, providing a competitive pathway for all Barbadian surfers." },
              { title: "DEVELOP", desc: "Coaching programmes, surf camps, and athlete development to nurture the next generation of Caribbean surfing talent." },
              { title: "REPRESENT", desc: "Sending national teams to ISA World Championships, Pan American Games, and Caribbean Surfing Championships." },
            ].map(item => (
              <ScrollReveal key={item.title}>
                <div style={{ borderTop: "2px solid #2BA5A0", paddingTop: 24 }}>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, color: "#0A2540", marginBottom: 12, letterSpacing: "0.08em" }}>{item.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(26,26,26,0.5)" }}>{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* LEADERSHIP — navy */}
      <WaveDivider color="#0A2540" bg="#FFFFFF" />
      <section style={{ backgroundColor: "#0A2540", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>LEADERSHIP</div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2.5rem)", color: "#fff", marginBottom: 12 }}>Management Committee</h2>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 48 }}>2026–2027 TERM</p>
          </ScrollReveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, textAlign: "center" }} className="stagger grid-responsive-4">
            {COMMITTEE.slice(0, 8).map((m, i) => (
              <ScrollReveal key={i} delay={i * 60}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: "rgba(255,255,255,0.2)", fontSize: 16 }}>{m.initials}</span>
                </div>
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: "#fff" }}>{m.name}</p>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{m.title}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* COMPETITION BREAKS — white */}
      <WaveDivider color="#FFFFFF" bg="#0A2540" />
      <section style={{ backgroundColor: "#FFFFFF", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>OUR WAVES</div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2.5rem)", color: "#0A2540", lineHeight: 1.15, marginBottom: 48 }}>Competition Breaks</h2>
          </ScrollReveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="stagger grid-responsive-3">
            {COMPETITION_BREAKS.map(spot => (
              <ScrollReveal key={spot.name}>
                <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 24, border: "1px solid rgba(10,37,64,0.06)", height: "100%", display: "flex", flexDirection: "column" }}>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 16, color: "#0A2540", marginBottom: 4 }}>{spot.name}</h3>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#2BA5A0", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>{spot.coast}</div>
                  <p style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(26,26,26,0.5)", flex: 1 }}>{spot.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* GET INVOLVED — navy */}
      <WaveDivider color="#0A2540" bg="#FFFFFF" />
      <section style={{ backgroundColor: "#0A2540", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>JOIN US</div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2.5rem)", color: "#fff", lineHeight: 1.15, marginBottom: 48 }}>Get Involved</h2>
          </ScrollReveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }} className="stagger grid-responsive-3">
            {[
              { icon: <TrophyIcon size={28} />, title: "Compete", desc: "Enter BSA-sanctioned events and compete for national titles across all divisions.", link: "/events", linkText: "View Events" },
              { icon: <UsersIcon size={28} />, title: "Register", desc: "Sign up on BSA.surf to enter competitions, access coaching, and be eligible for national team selection.", link: "https://bsa.surf", linkText: "Register on BSA.surf" },
              { icon: <CompassIcon size={28} />, title: "Sponsor", desc: "Partner with the BSA to support competitive surfing in Barbados and the Caribbean.", link: "mailto:barbadossurfingassociation@gmail.com", linkText: "Get in Touch" },
            ].map(item => (
              <ScrollReveal key={item.title}>
                <div style={{ backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 28, height: "100%", display: "flex", flexDirection: "column" }}>
                  <div style={{ color: "#2BA5A0", marginBottom: 16 }}>{item.icon}</div>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 18, color: "#fff", marginBottom: 10 }}>{item.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(255,255,255,0.4)", marginBottom: 20, flex: 1 }}>{item.desc}</p>
                  <Link href={item.link} style={{ fontSize: 13, fontWeight: 600, color: "#2BA5A0", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>{item.linkText} <ArrowRightIcon size={14} /></Link>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* NEWS — white */}
      <WaveDivider color="#FFFFFF" bg="#0A2540" />
      <section style={{ backgroundColor: "#FFFFFF", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>LATEST NEWS</div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2.5rem)", color: "#0A2540", lineHeight: 1.15, marginBottom: 32 }}>What&apos;s Happening</h2>
          </ScrollReveal>
          <div className="grid-responsive-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {getLatestArticles(3).map(article => (
              <ScrollReveal key={article.slug}>
                <Link href={`/news/${article.slug}`} style={{ textDecoration: "none", display: "block", height: "100%" }}>
                  <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 24, border: "1px solid rgba(10,37,64,0.06)", height: "100%", display: "flex", flexDirection: "column", transition: "box-shadow 0.2s" }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: "#2BA5A0", marginBottom: 10 }}>{getCategoryLabel(article.category)}</div>
                    <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 17, color: "#0A2540", marginBottom: 10, lineHeight: 1.35, flex: 0 }}>{article.title}</h3>
                    <p style={{ fontSize: 14, color: "rgba(26,26,26,0.5)", lineHeight: 1.6, marginBottom: 16, flex: 1 }}>{article.excerpt}</p>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(26,26,26,0.3)" }}>{new Date(article.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 28 }}>
            <Link href="/news" style={{ fontSize: 14, fontWeight: 600, color: "#1478B5", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>View All News <ArrowRightIcon size={14} /></Link>
          </div>
        </div>
      </section>

      {/* SOCIAL — navy */}
      <WaveDivider color="#0A2540" bg="#FFFFFF" />
      <section style={{ backgroundColor: "#0A2540", padding: "64px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", textAlign: "center" }}>
          <ScrollReveal>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>FOLLOW US</div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "#fff", marginBottom: 32 }}>Stay Connected</h2>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
              {[
                { platform: "Instagram", handle: "@barbadossurfingassociation", url: "https://www.instagram.com/barbadossurfingassociation/", icon: "📸" },
                { platform: "Facebook", handle: "BSA Surf", url: "https://www.facebook.com/bsasurf/", icon: "👤" },
              ].map(link => (
                <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "16px 28px", textDecoration: "none", border: "1px solid rgba(255,255,255,0.06)", transition: "background 0.2s" }}>
                  <span style={{ fontSize: 22 }}>{link.icon}</span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: "#fff" }}>{link.platform}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{link.handle}</div>
                  </div>
                </a>
              ))}
              <a href="mailto:barbadossurfingassociation@gmail.com" style={{ display: "flex", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "16px 28px", textDecoration: "none", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: 22 }}>✉️</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: "#fff" }}>Email</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>barbadossurfingassociation@gmail.com</div>
                </div>
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
