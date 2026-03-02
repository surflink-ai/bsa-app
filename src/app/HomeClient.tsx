"use client"
import Link from "next/link"
import type { BSAOrg, BSAEvent } from "@/lib/liveheats"
import { ScrollReveal } from "./components/ScrollReveal"
import { CountUp } from "./components/CountUp"
import { CountdownTimer } from "./components/CountdownTimer"
import { WaveDivider } from "./components/WaveDivider"
import { ChevronDownIcon, ArrowRightIcon, TrophyIcon, UsersIcon, CompassIcon } from "./components/Icons"
import { SurfConditionsBar } from "./components/SurfConditionsBar"
import { SponsorsSection } from "./components/SponsorsSection"
import { SocialFeed } from "./components/SocialFeed"

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

const ALL_SPOTS = [
  { name: "Soup Bowl", coast: "East Coast, Bathsheba", desc: "World-renowned reef break. Powerful, hollow waves that have hosted WSL QS events and multiple national championships since 2019." },
  { name: "South Point", coast: "South Coast", desc: "Premier point break delivering long, peeling walls on south swells. One of the island's most consistent competition venues." },
  { name: "Freights Bay", coast: "South Coast", desc: "Quality reef break producing fast, barrelling waves on bigger swells. A favourite among experienced local surfers." },
  { name: "Drill Hall", coast: "South Coast", desc: "Accessible reef break ideal for competition. Home to multiple SOTY Championship events and junior development programmes." },
  { name: "Parlour", coast: "East Coast", desc: "Technical east coast point break rewarding precision surfing and power. Consistent waves in the winter months." },
  { name: "Tropicana", coast: "West Coast", desc: "Sheltered west coast break that comes alive on north swells. Mellow conditions perfect for longboarding and progression." },
  { name: "Brandon's Beach", coast: "West Coast", desc: "Beach break offering fun, punchy peaks. Works on all tides and provides good waves for all ability levels." },
  { name: "Bathsheba", coast: "East Coast", desc: "The wider Bathsheba coastline offers multiple peaks beyond Soup Bowl, with powerful reef and point break options." },
]

const BOARD = [
  { name: "Christopher Clarke", title: "President", initials: "CC" },
  { name: "Coming Soon", title: "Vice President", initials: "VP" },
  { name: "Coming Soon", title: "Secretary", initials: "S" },
  { name: "Coming Soon", title: "Treasurer", initials: "T" },
]

export function HomeClient({ org, upcomingEvents, pastEvents, latestResults }: Props) {
  const nextEvent = upcomingEvents[0] || null
  const totalEvents = org.events.length

  // Find ALL divisions with results for podium display
  const allDivisionResults: { divName: string; podium: { place: number; name: string; score: number; image: string | null }[] }[] = []
  if (latestResults) {
    for (const div of latestResults.event.eventDivisions) {
      if (div.ranking && div.ranking.length >= 3) {
        allDivisionResults.push({
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

  // Show ONLY Open Mens and Open Womens
  const openMens = allDivisionResults.find(d => d.divName.toLowerCase().includes("open") && d.divName.toLowerCase().includes("men") && !d.divName.toLowerCase().includes("women"))
  const openWomens = allDivisionResults.find(d => d.divName.toLowerCase().includes("open") && d.divName.toLowerCase().includes("women"))
  const displayDivisions = [openMens, openWomens].filter((d): d is NonNullable<typeof d> => !!d)

  const featuredAthletes: { id: string; name: string; image: string | null }[] = []
  if (latestResults) {
    for (const div of latestResults.event.eventDivisions) {
      for (const r of div.ranking || []) {
        if (featuredAthletes.length >= 8) break
        if (r.competitor.athlete.image && !featuredAthletes.find(a => a.id === r.competitor.athlete.id))
          featuredAthletes.push(r.competitor.athlete)
      }
    }
  }

  const cardStyle = { backgroundColor: "#fff", borderRadius: 12, padding: "clamp(20px, 3vw, 32px)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", height: "100%", display: "flex" as const, flexDirection: "column" as const }

  const PodiumBlock = ({ data, divName }: { data: typeof displayDivisions[0]["podium"]; divName: string }) => {
    const order = [data[1], data[0], data[2]].filter(Boolean)
    const sizes = [{ img: 72, bar: 120, ring: "2px solid rgba(26,26,26,0.08)" }, { img: 96, bar: 160, ring: "3px solid #2BA5A0" }, { img: 72, bar: 90, ring: "2px solid rgba(26,26,26,0.08)" }]
    return (
      <div>
        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 16, color: "#0A2540", textAlign: "center", marginBottom: 32 }}>{divName}</h3>
        <div className="podium-row" style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: "clamp(12px, 3vw, 32px)" }}>
          {order.map((p, i) => (
            <div key={p.name} className="podium-item" style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "clamp(80px, 18vw, 130px)" }}>
              <div className={i === 1 ? "podium-img-lg" : "podium-img-sm"} style={{ width: sizes[i].img, height: sizes[i].img, borderRadius: "50%", backgroundColor: "#F2EDE4", overflow: "hidden", marginBottom: 10, border: sizes[i].ring }}>
                {p.image ? <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(10,37,64,0.2)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: sizes[i].img * 0.3 }}>{p.name.split(" ").map((n: string) => n[0]).join("")}</div>}
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, color: "#0A2540", textAlign: "center", lineHeight: 1.3, marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 12, color: "#2BA5A0" }}>{p.score.toFixed(2)}</div>
              <div className={i === 1 ? "podium-bar-2" : i === 0 ? "podium-bar-1" : "podium-bar-3"} style={{ width: "100%", height: sizes[i].bar, marginTop: 10, borderRadius: "8px 8px 0 0", backgroundColor: i === 1 ? "#1478B5" : i === 0 ? "#2BA5A0" : "rgba(10,37,64,0.06)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 10 }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, color: i < 2 ? "#fff" : "rgba(10,37,64,0.35)" }}>{p.place}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="pb-20 md:pb-0">
      {/* HERO */}
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
      <WaveDivider color="#FAFAF8" bg="#0A2540" />
      <section style={{ backgroundColor: "#FAFAF8", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, textAlign: "center" }} className="stagger grid-responsive-4">
            {[{ end: 250, suffix: "+", label: "Athletes" }, { end: totalEvents, suffix: "", label: "Sanctioned Events" }, { end: org.series.length || 6, suffix: "", label: "SOTY Seasons" }, { end: ALL_SPOTS.length, suffix: "", label: "Competition Breaks" }].map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 100}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(2rem, 4vw, 3rem)", color: "#0A2540" }}><CountUp end={stat.end} suffix={stat.suffix} /></div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(26,26,26,0.4)", marginTop: 8 }}>{stat.label}</div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* NEXT EVENT — navy */}
      {nextEvent && (<>
        <WaveDivider color="#0A2540" bg="#FAFAF8" />
        <section style={{ backgroundColor: "#0A2540", padding: "80px 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <ScrollReveal>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>UPCOMING</div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem, 4vw, 3rem)", color: "#fff", lineHeight: 1.15, marginBottom: 24 }}>{nextEvent.name}</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start", marginBottom: 32 }}>
                <div>
                  <div style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>{new Date(nextEvent.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
                  {nextEvent.location && <div style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>{nextEvent.location.formattedAddress}</div>}
                </div>
              </div>
              <div style={{ marginBottom: 32 }}><CountdownTimer targetDate={nextEvent.date} /></div>
              {nextEvent.eventDivisions.length > 0 && (<div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>{nextEvent.eventDivisions.map(d => (<span key={d.id} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "5px 12px", borderRadius: 20, backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{d.division.name}</span>))}</div>)}
              <a href="https://liveheats.com/BarbadosSurfingAssociation" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "#fff", backgroundColor: "#1478B5", padding: "12px 28px", borderRadius: 6, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.05em" }}>Register Now <ArrowRightIcon size={16} /></a>
            </ScrollReveal>
          </div>
        </section>
      </>)}

      {/* ABOUT — white */}
      <WaveDivider color="#FAFAF8" bg={nextEvent ? "#0A2540" : "#FAFAF8"} />
      <section style={{ backgroundColor: "#FAFAF8", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>WHO WE ARE</div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem, 4vw, 3rem)", color: "#0A2540", lineHeight: 1.15, marginBottom: 24, maxWidth: 680 }}>Developing world-class surfing talent in the heart of the Caribbean</h2>
            <p style={{ fontSize: "1rem", lineHeight: 1.9, color: "rgba(26,26,26,0.55)", maxWidth: 640, marginBottom: 64 }}>Founded in 1995, the Barbados Surfing Association is the recognised national governing body for the sport of surfing in Barbados and an affiliated member of the International Surfing Association. We organise national championship events, develop competitive surfers from grassroots to elite level, and represent Barbados at international competitions including the ISA World Surfing Games and Pan American Games.</p>
          </ScrollReveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }} className="stagger grid-responsive-3">
            {[{ title: "COMPETE", desc: "Sanctioned championship events throughout the year, from groms to open divisions, providing a competitive pathway for all Barbadian surfers." }, { title: "DEVELOP", desc: "Coaching programmes, surf camps, and athlete development initiatives to nurture the next generation of Caribbean surfing talent." }, { title: "REPRESENT", desc: "Sending national teams to ISA World Championships, Pan American Games, and Caribbean Surfing Championships on the world stage." }].map(item => (
              <ScrollReveal key={item.title}><div style={{ borderTop: "2px solid #2BA5A0", paddingTop: 24 }}><h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 16, color: "#0A2540", marginBottom: 12, letterSpacing: "0.08em" }}>{item.title}</h3><p style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(26,26,26,0.5)" }}>{item.desc}</p></div></ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* BOARD — navy */}
      <WaveDivider color="#0A2540" bg="#FAFAF8" />
      <section style={{ backgroundColor: "#0A2540", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>LEADERSHIP</div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem, 4vw, 2.5rem)", color: "#fff", marginBottom: 48 }}>Board of Directors</h2>
          </ScrollReveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, textAlign: "center" }} className="stagger grid-responsive-4">
            {BOARD.map((m, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: "rgba(255,255,255,0.25)", fontSize: 18 }}>{m.initials}</span>
                </div>
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, color: "#fff" }}>{m.name}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{m.title}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* RESULTS — white */}
      {displayDivisions.length > 0 && latestResults && (<>
        <WaveDivider color="#FAFAF8" bg="#0A2540" />
        <section style={{ backgroundColor: "#FAFAF8", padding: "80px 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <ScrollReveal>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>LATEST RESULTS</div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem, 4vw, 3rem)", color: "#0A2540", lineHeight: 1.15, marginBottom: 8 }}>{latestResults.eventName}</h2>
              <p style={{ fontSize: 14, color: "rgba(26,26,26,0.4)", marginBottom: 48 }}>{new Date(latestResults.eventDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
            </ScrollReveal>
            <div className="grid-responsive-2" style={{ display: "grid", gridTemplateColumns: displayDivisions.length > 1 ? "repeat(2, 1fr)" : "1fr", gap: 48, marginBottom: 48 }}>
              {displayDivisions.map(d => (
                <ScrollReveal key={d.divName}><PodiumBlock data={d.podium} divName={d.divName} /></ScrollReveal>
              ))}
            </div>
            <div style={{ textAlign: "center" }}><Link href={`/events/${latestResults.event.id}`} style={{ fontSize: 14, fontWeight: 600, color: "#1478B5", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>View Full Results <ArrowRightIcon size={14} /></Link></div>
          </div>
        </section>
      </>)}

      {/* ATHLETES — navy */}
      {featuredAthletes.length > 0 && (<>
        <WaveDivider color="#0A2540" bg="#FAFAF8" />
        <section style={{ backgroundColor: "#0A2540", padding: "80px 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <ScrollReveal><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>REPRESENTING BARBADOS</div><h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem, 4vw, 3rem)", color: "#fff", lineHeight: 1.15, marginBottom: 48 }}>Our Athletes</h2></ScrollReveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }} className="stagger grid-responsive-4">
              {featuredAthletes.slice(0, 8).map(a => (<ScrollReveal key={a.id}><Link href={`/athletes/${a.id}`} style={{ textDecoration: "none", display: "block" }}><div style={{ backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, overflow: "hidden", height: "100%" }}><div style={{ aspectRatio: "1", backgroundColor: "rgba(255,255,255,0.04)", overflow: "hidden" }}>{a.image ? <img src={a.image} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.1)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 48 }}>{a.name.split(" ").map((n: string) => n[0]).join("")}</div>}</div><div style={{ padding: "14px 16px" }}><div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: "#fff" }}>{a.name}</div><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", marginTop: 4, textTransform: "uppercase" }}>Barbados</div></div></div></Link></ScrollReveal>))}
            </div>
            <div style={{ textAlign: "center", marginTop: 32 }}><Link href="/athletes" style={{ fontSize: 14, fontWeight: 600, color: "#2BA5A0", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>View All Athletes <ArrowRightIcon size={14} /></Link></div>
          </div>
        </section>
      </>)}

      {/* SURF SPOTS — white */}
      <WaveDivider color="#FAFAF8" bg="#0A2540" />
      <section style={{ backgroundColor: "#FAFAF8", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <ScrollReveal><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>OUR WAVES</div><h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem, 4vw, 3rem)", color: "#0A2540", lineHeight: 1.15, marginBottom: 48 }}>Competition Breaks</h2></ScrollReveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }} className="stagger grid-responsive-spots">
            {ALL_SPOTS.map(spot => (<ScrollReveal key={spot.name}><div style={{...cardStyle}}><h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 17, color: "#0A2540", marginBottom: 6 }}>{spot.name}</h3><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#2BA5A0", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>{spot.coast}</div><p style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(26,26,26,0.55)", flex: 1 }}>{spot.desc}</p></div></ScrollReveal>))}
          </div>
        </div>
      </section>

      {/* SPONSORS — white */}
      <WaveDivider color="#FAFAF8" bg="#FAFAF8" />
      <section style={{ backgroundColor: "#FAFAF8", padding: "80px 24px" }}>
        <ScrollReveal><SponsorsSection /></ScrollReveal>
      </section>

      {/* GET INVOLVED — navy */}
      <WaveDivider color="#0A2540" bg="#FAFAF8" />
      <section style={{ backgroundColor: "#0A2540", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <ScrollReveal><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>JOIN US</div><h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem, 4vw, 3rem)", color: "#fff", lineHeight: 1.15, marginBottom: 48 }}>Get Involved</h2></ScrollReveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }} className="stagger grid-responsive-3">
            {[{ icon: <TrophyIcon size={28} />, title: "Compete", desc: "Enter BSA-sanctioned championship events and compete for national titles across all divisions.", link: "/events", linkText: "View Events" }, { icon: <UsersIcon size={28} />, title: "Membership", desc: "Register as a BSA member and gain access to competition entry, coaching, and national team selection.", link: "https://liveheats.com/BarbadosSurfingAssociation", linkText: "Register" }, { icon: <CompassIcon size={28} />, title: "Sponsor", desc: "Partner with the BSA to support the growth of competitive surfing in Barbados and the Caribbean.", link: "mailto:barbadossurfingassociation@gmail.com", linkText: "Get in Touch" }].map(item => (<ScrollReveal key={item.title}><div style={{ backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 32, height: "100%", display: "flex", flexDirection: "column" }}><div style={{ color: "#2BA5A0", marginBottom: 20 }}>{item.icon}</div><h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 20, color: "#fff", marginBottom: 12 }}>{item.title}</h3><p style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(255,255,255,0.45)", marginBottom: 20, flex: 1 }}>{item.desc}</p><Link href={item.link} style={{ fontSize: 13, fontWeight: 600, color: "#2BA5A0", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>{item.linkText} <ArrowRightIcon size={14} /></Link></div></ScrollReveal>))}
          </div>
        </div>
      </section>

      {/* SOCIAL FEED — white */}
      <WaveDivider color="#FAFAF8" bg="#0A2540" />
      <section style={{ backgroundColor: "#FAFAF8", padding: "80px 24px" }}>
        <ScrollReveal><SocialFeed /></ScrollReveal>
      </section>
    </div>
  )
}
