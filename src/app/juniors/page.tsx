import { ScrollReveal } from '../components/ScrollReveal'
import { WaveDivider } from '../components/WaveDivider'

const PROGRAMMES = [
  {
    title: "Grom Development",
    age: "Under 10",
    desc: "Introduction to surfing fundamentals, ocean safety, and board handling. Designed to build confidence and a love for the ocean in young surfers.",
    schedule: "Saturdays, 8:00–10:00 AM",
    location: "Drill Hall Beach",
  },
  {
    title: "Junior Competitive",
    age: "Under 14 & Under 16",
    desc: "Structured coaching for competitive surfers. Focus on contest strategy, manoeuvre progression, heat tactics, and physical conditioning.",
    schedule: "Tuesdays & Thursdays, 3:30–5:30 PM",
    location: "Soup Bowl / Drill Hall",
  },
  {
    title: "Elite Junior Squad",
    age: "Under 18",
    desc: "Advanced programme for BSA-ranked juniors targeting national team selection and international competition. Includes video analysis, strength & conditioning, and mental performance coaching.",
    schedule: "Mon, Wed, Fri, 4:00–6:00 PM",
    location: "Soup Bowl",
  },
  {
    title: "Summer Surf Camp",
    age: "All Ages",
    desc: "Annual week-long surf camp during summer holidays. Open to all abilities — beginners welcome. Certified instructors, equipment provided, and heaps of fun.",
    schedule: "July / August (dates TBA)",
    location: "Various Locations",
  },
]

const PATHWAY = [
  { stage: "Learn", desc: "Ocean safety, pop-up technique, wave selection", num: "01" },
  { stage: "Compete", desc: "Enter local BSA junior events, build experience", num: "02" },
  { stage: "Develop", desc: "Join coaching squads, video analysis, fitness", num: "03" },
  { stage: "Represent", desc: "National team selection, ISA World Juniors", num: "04" },
]

export default function JuniorsPage() {
  return (
    <div className="pb-20 md:pb-0">
      {/* HERO */}
      <section style={{ backgroundColor: "#0A2540", paddingTop: "8rem", paddingBottom: "4rem", padding: "8rem 24px 4rem" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <ScrollReveal>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: "1rem" }}>Next Generation</p>
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "clamp(2rem,5vw,3.5rem)", color: "#fff", marginBottom: "1rem", maxWidth: 700 }}>Junior Development</h1>
            <p style={{ fontSize: "1.1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.5)", maxWidth: 600 }}>
              Building the next generation of Barbadian surf talent through structured coaching, competition pathways, and international exposure.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* PATHWAY */}
      <WaveDivider color="#FFFFFF" bg="#0A2540" />
      <section style={{ backgroundColor: "#FFFFFF", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>THE PATHWAY</div>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem,4vw,2.5rem)", color: "#0A2540", marginBottom: 48 }}>From Beach to World Stage</h2>
          </ScrollReveal>
          <div className="grid-responsive-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
            {PATHWAY.map((step, i) => (
              <ScrollReveal key={step.stage} delay={i * 100}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 32, fontWeight: 700, color: "rgba(10,37,64,0.08)", marginBottom: 8, lineHeight: 1 }}>{step.num}</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#2BA5A0", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>Step {i + 1}</div>
                  <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 18, color: "#0A2540", marginBottom: 8 }}>{step.stage}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(26,26,26,0.5)" }}>{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAMMES */}
      <WaveDivider color="#0A2540" bg="#FFFFFF" />
      <section style={{ backgroundColor: "#0A2540", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <ScrollReveal>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>PROGRAMMES</div>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem,4vw,2.5rem)", color: "#fff", marginBottom: 48 }}>Coaching & Training</h2>
          </ScrollReveal>
          <div className="grid-responsive-4" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
            {PROGRAMMES.map((prog, i) => (
              <ScrollReveal key={prog.title} delay={i * 80}>
                <div style={{ backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "28px 24px", height: "100%", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 17, color: "#fff" }}>{prog.title}</h3>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, padding: "3px 10px", borderRadius: 20, backgroundColor: "rgba(43,165,160,0.15)", color: "#2BA5A0" }}>{prog.age}</span>
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.45)", marginBottom: 16, flex: 1 }}>{prog.desc}</p>
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{prog.schedule}</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{prog.location}</div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <WaveDivider color="#FFFFFF" bg="#0A2540" />
      <section style={{ backgroundColor: "#FFFFFF", padding: "80px 24px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <ScrollReveal>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem,4vw,2.5rem)", color: "#0A2540", marginBottom: 16 }}>Ready to Start?</h2>
            <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "rgba(26,26,26,0.5)", marginBottom: 32 }}>
              Whether your child is a complete beginner or an aspiring competitor, the BSA has a programme for them. Contact us to learn more or register for the next intake.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/contact" style={{ fontSize: 14, fontWeight: 600, color: "#fff", backgroundColor: "#1478B5", padding: "12px 28px", borderRadius: 6, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.05em" }}>Register</a>
              <a href="mailto:barbadossurfingassociation@gmail.com" style={{ fontSize: 14, fontWeight: 600, color: "#1478B5", backgroundColor: "transparent", padding: "12px 28px", borderRadius: 6, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.05em", border: "1px solid rgba(20,120,181,0.2)" }}>Contact Us</a>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
