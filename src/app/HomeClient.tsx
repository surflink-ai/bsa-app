"use client"
import Link from "next/link"
import type { BSAOrg, BSAEvent } from "@/lib/liveheats"
import { ScrollReveal } from "./components/ScrollReveal"
import { CountUp } from "./components/CountUp"
import { CountdownTimer } from "./components/CountdownTimer"
import { ChevronDownIcon, ArrowRightIcon, TrophyIcon, UsersIcon, CompassIcon } from "./components/Icons"

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

export function HomeClient({ org, upcomingEvents, pastEvents, latestResults }: Props) {
  const nextEvent = upcomingEvents[0] || null
  const totalEvents = org.events.length
  let podium: { place: number; name: string; score: number; image: string | null }[] = []
  let podiumDivision = ""
  if (latestResults) {
    const div = latestResults.event.eventDivisions.find(d => d.division.name.toLowerCase().includes("open") && d.division.name.toLowerCase().includes("men")) || latestResults.event.eventDivisions[0]
    if (div?.ranking) {
      podiumDivision = div.division.name
      podium = div.ranking.slice(0, 3).map(r => ({ place: r.place, name: r.competitor.athlete.name, score: r.total, image: r.competitor.athlete.image }))
    }
  }
  const featuredAthletes: { id: string; name: string; image: string | null }[] = []
  if (latestResults) {
    for (const div of latestResults.event.eventDivisions) {
      for (const r of div.ranking || []) {
        if (featuredAthletes.length >= 4) break
        if (r.competitor.athlete.image && !featuredAthletes.find(a => a.id === r.competitor.athlete.id)) featuredAthletes.push(r.competitor.athlete)
      }
    }
  }
  return (
    <div>
      <section style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0A2540 0%, #0D3055 50%, #0A2540 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: "0 24px" }}>
        <svg style={{ position: "absolute", bottom: 0, left: 0, right: 0, opacity: 0.04 }} viewBox="0 0 1440 320" preserveAspectRatio="none"><path fill="#fff" d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,229.3C672,235,768,213,864,192C960,171,1056,149,1152,154.7C1248,160,1344,192,1392,208L1440,224L1440,320L0,320Z" /></svg>
        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <div className="anim-scale"><img src="https://liveheats.com/images/dbb2a21b-7566-4629-8ea5-4c08a0b2877b.webp" alt="BSA Logo" style={{ width: 100, height: 100, borderRadius: "50%", margin: "0 auto 32px", objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)" }} /></div>
          <h1 className="anim-fade-1" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(2rem, 5vw, 4rem)", color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.05, maxWidth: 800, margin: "0 auto" }}>BARBADOS SURFING<br />ASSOCIATION</h1>
          <p className="anim-fade-2" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(0.95rem, 2vw, 1.2rem)", color: "rgba(255,255,255,0.55)", maxWidth: 480, margin: "20px auto 0", lineHeight: 1.6 }}>The National Governing Body for Surfing in Barbados</p>
          <p className="anim-fade-3" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 24 }}>EST. 1995 &middot; ISA Member Federation</p>
        </div>
        <div className="anim-fade-4 anim-float" style={{ position: "absolute", bottom: 32, color: "rgba(255,255,255,0.25)" }}><ChevronDownIcon size={24} /></div>
      </section>
      <section style={{ backgroundColor: "#FAFAF8", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 48, textAlign: "center" }}>
            {[{ end: 250, suffix: "+", label: "Athletes" }, { end: totalEvents, suffix: "", label: "Sanctioned Events" }, { end: 29, suffix: "", label: "Championship Seasons" }, { end: 12, suffix: "", label: "Surf Breaks" }].map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 100}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(2rem, 4vw, 3rem)", color: "#1A1A1A" }}><CountUp end={stat.end} suffix={stat.suffix} /></div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(26,26,26,0.4)", marginTop: 8 }}>{stat.label}</div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
      {nextEvent && (
        <section style={{ backgroundColor: "#F2EDE4", padding: "96px 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <ScrollReveal>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>UPCOMING</div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem, 4vw, 3rem)", color: "#1A1A1A", lineHeight: 1.15, marginBottom: 24 }}>{nextEvent.name}</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start", marginBottom: 32 }}>
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "rgba(26,26,26,0.6)", marginBottom: 8 }}>{new Date(nextEvent.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
                  {nextEvent.location && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(26,26,26,0.45)" }}>{nextEvent.location.formattedAddress}</div>}
                </div>
                <div style={{ marginLeft: "auto" }}><CountdownTimer targetDate={nextEvent.date} /></div>
              </div>
              {nextEvent.eventDivisions.length > 0 && (<div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>{nextEvent.eventDivisions.map(d => (<span key={d.id} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "5px 12px", borderRadius: 20, backgroundColor: "rgba(26,26,26,0.06)", color: "rgba(26,26,26,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{d.division.name}</span>))}</div>)}
              <a href="https://liveheats.com/BarbadosSurfingAssociation" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "#fff", backgroundColor: "#1478B5", padding: "12px 28px", borderRadius: 6, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.05em" }}>Register Now <ArrowRightIcon size={16} /></a>
            </ScrollReveal>
          </div>
        </section>
      )}
      <section style={{ backgroundColor: "#0A2540", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>WHO WE ARE</div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem, 4vw, 3rem)", color: "#fff", lineHeight: 1.15, marginBottom: 24, maxWidth: 680 }}>Developing world-class surfing talent in the heart of the Caribbean</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", lineHeight: 1.9, color: "rgba(255,255,255,0.5)", maxWidth: 640, marginBottom: 64 }}>Founded in 1995, the Barbados Surfing Association is the recognised national governing body for the sport of surfing in Barbados and an affiliated member of the International Surfing Association. We organise national championship events, develop competitive surfers from grassroots to elite level, and represent Barbados at international competitions including the ISA World Surfing Games and Pan American Games.</p>
          </ScrollReveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 48 }} className="stagger">
            {[{ title: "COMPETE", desc: "Sanctioned championship events throughout the year, from groms to open divisions, providing a competitive pathway for all Barbadian surfers." }, { title: "DEVELOP", desc: "Coaching programmes, surf camps, and athlete development initiatives to nurture the next generation of Caribbean surfing talent." }, { title: "REPRESENT", desc: "Sending national teams to ISA World Championships, Pan American Games, and Caribbean Surfing Championships on the world stage." }].map(item => (
              <ScrollReveal key={item.title}><div style={{ borderTop: "2px solid #2BA5A0", paddingTop: 24 }}><h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 18, color: "#fff", marginBottom: 12 }}>{item.title}</h3><p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,0.45)" }}>{item.desc}</p></div></ScrollReveal>
            ))}
          </div>
        </div>
      </section>
      {podium.length > 0 && latestResults && (
        <section style={{ backgroundColor: "#FAFAF8", padding: "96px 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <ScrollReveal>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>LATEST RESULTS</div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem, 4vw, 3rem)", color: "#1A1A1A", lineHeight: 1.15, marginBottom: 8 }}>{latestResults.eventName}</h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(26,26,26,0.45)", marginBottom: 48 }}>{podiumDivision} &middot; {new Date(latestResults.eventDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
            </ScrollReveal>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: "clamp(16px, 4vw, 48px)", marginBottom: 48 }}>
              {[podium[1], podium[0], podium[2]].filter(Boolean).map((p, i) => { const heights = [140, 180, 110]; const imgSizes = [72, 88, 72]; return (
                <ScrollReveal key={p.name} delay={i * 120}><div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: imgSizes[i], height: imgSizes[i], borderRadius: "50%", backgroundColor: "#F2EDE4", overflow: "hidden", marginBottom: 12, border: i === 1 ? "3px solid #2BA5A0" : "2px solid rgba(26,26,26,0.08)" }}>{p.image ? <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(26,26,26,0.2)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: imgSizes[i] * 0.35 }}>{p.name.split(" ").map(n => n[0]).join("")}</div>}</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: "#1A1A1A", textAlign: "center", marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 13, color: "#2BA5A0" }}>{p.score.toFixed(2)}</div>
                  <div style={{ width: "clamp(60px, 12vw, 100px)", height: heights[i], marginTop: 12, borderRadius: "8px 8px 0 0", backgroundColor: i === 1 ? "#1478B5" : i === 0 ? "#2BA5A0" : "rgba(26,26,26,0.08)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 12 }}><span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: i < 2 ? "#fff" : "rgba(26,26,26,0.4)" }}>{p.place}</span></div>
                </div></ScrollReveal>
              ) })}
            </div>
            <div style={{ textAlign: "center" }}><Link href={`/events/${latestResults.event.id}`} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "#1478B5", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>View Full Results <ArrowRightIcon size={14} /></Link></div>
          </div>
        </section>
      )}
      {featuredAthletes.length > 0 && (
        <section style={{ backgroundColor: "#F2EDE4", padding: "96px 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <ScrollReveal><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>REPRESENTING BARBADOS</div><h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem, 4vw, 3rem)", color: "#1A1A1A", lineHeight: 1.15, marginBottom: 24 }}>Our Athletes</h2></ScrollReveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 32, marginTop: 16 }} className="stagger">
              {featuredAthletes.map(a => (<ScrollReveal key={a.id}><Link href={`/athletes/${a.id}`} style={{ textDecoration: "none", display: "block" }}><div style={{ backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease" }}><div style={{ aspectRatio: "1", backgroundColor: "#F2EDE4", overflow: "hidden" }}>{a.image ? <img src={a.image} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(26,26,26,0.15)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 48 }}>{a.name.split(" ").map(n => n[0]).join("")}</div>}</div><div style={{ padding: "16px 20px" }}><div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, color: "#1A1A1A" }}>{a.name}</div><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(26,26,26,0.4)", letterSpacing: "0.1em", marginTop: 4, textTransform: "uppercase" }}>Barbados</div></div></div></Link></ScrollReveal>))}
            </div>
          </div>
        </section>
      )}
      <section style={{ backgroundColor: "#FAFAF8", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <ScrollReveal><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>OUR WAVES</div><h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem, 4vw, 3rem)", color: "#1A1A1A", lineHeight: 1.15, marginBottom: 24 }}>Barbados Surf Breaks</h2></ScrollReveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginTop: 16 }} className="stagger">
            {[{ name: "Soup Bowl", coast: "East Coast, Bathsheba", desc: "World-renowned reef break offering powerful, hollow waves. Home to professional surfing competitions." }, { name: "South Point", coast: "South Coast", desc: "Consistent beach break ideal for all levels. Popular with locals and visitors alike." }, { name: "Freights Bay", coast: "South Coast", desc: "Quality reef break producing fast, barrelling waves on bigger swells." }, { name: "Tropicana", coast: "West Coast", desc: "Mellow point break on the platinum coast. Best during north swells." }].map(spot => (<ScrollReveal key={spot.name}><div style={{ backgroundColor: "#fff", borderRadius: 10, padding: 28, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}><h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 18, color: "#1A1A1A", marginBottom: 6 }}>{spot.name}</h3><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#2BA5A0", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>{spot.coast}</div><p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.75, color: "rgba(26,26,26,0.55)" }}>{spot.desc}</p></div></ScrollReveal>))}
          </div>
        </div>
      </section>
      <section style={{ backgroundColor: "#F2EDE4", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <ScrollReveal><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>JOIN US</div><h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem, 4vw, 3rem)", color: "#1A1A1A", lineHeight: 1.15, marginBottom: 24 }}>Get Involved</h2></ScrollReveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginTop: 16 }} className="stagger">
            {[{ icon: <TrophyIcon size={28} />, title: "Compete", desc: "Enter BSA-sanctioned events and compete for national titles.", link: "/events", linkText: "View Events" }, { icon: <UsersIcon size={28} />, title: "Membership", desc: "Become a registered member of the BSA.", link: "https://liveheats.com/BarbadosSurfingAssociation", linkText: "Register" }, { icon: <CompassIcon size={28} />, title: "Sponsor", desc: "Support the growth of surfing in Barbados.", link: "mailto:info@barbadossurfing.org", linkText: "Get in Touch" }].map(item => (<ScrollReveal key={item.title}><div style={{ backgroundColor: "#fff", borderRadius: 10, padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease" }}><div style={{ color: "#1478B5", marginBottom: 20 }}>{item.icon}</div><h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 20, color: "#1A1A1A", marginBottom: 12 }}>{item.title}</h3><p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.75, color: "rgba(26,26,26,0.55)", marginBottom: 20 }}>{item.desc}</p><Link href={item.link} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#1478B5", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>{item.linkText} <ArrowRightIcon size={14} /></Link></div></ScrollReveal>))}
          </div>
        </div>
      </section>
    </div>
  )
}
