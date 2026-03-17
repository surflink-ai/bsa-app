import { createClient } from '@/lib/supabase/server'
import { ScrollReveal } from '../components/ScrollReveal'
import { WaveDivider } from '../components/WaveDivider'

export const revalidate = 300

const PATHWAY = [
  { stage: "Learn", desc: "Ocean safety, pop-up technique, wave selection", num: "01" },
  { stage: "Compete", desc: "Enter local BSA junior events, build experience", num: "02" },
  { stage: "Develop", desc: "Join coaching squads, video analysis, fitness", num: "03" },
  { stage: "Represent", desc: "National team selection, ISA World Juniors", num: "04" },
]

export default async function JuniorsPage() {
  const supabase = await createClient()
  const { data: programmes } = await supabase
    .from('junior_programmes')
    .select('*')
    .eq('active', true)
    .order('sort_order')
    .order('title')

  const progs = programmes || []

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
            {progs.map((prog, i) => (
              <ScrollReveal key={prog.id} delay={i * 80}>
                <div style={{ backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "28px 24px", height: "100%", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 17, color: "#fff" }}>{prog.title}</h3>
                    {prog.age_group && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, padding: "3px 10px", borderRadius: 20, backgroundColor: "rgba(43,165,160,0.15)", color: "#2BA5A0" }}>{prog.age_group}</span>}
                  </div>
                  {prog.description && <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.45)", marginBottom: 16, flex: 1 }}>{prog.description}</p>}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                    {prog.schedule && <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{prog.schedule}</div>}
                    {prog.location && <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{prog.location}</div>}
                    {prog.coach_name && <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Coach: {prog.coach_name}</div>}
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
            <span style={{ display: "inline-block", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 600, padding: "6px 16px", borderRadius: 100, backgroundColor: "rgba(43,165,160,0.1)", color: "#2BA5A0", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 20 }}>Coming Soon</span>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem,4vw,2.5rem)", color: "#0A2540", marginBottom: 16 }}>Junior Programme Launching Soon</h2>
            <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "rgba(26,26,26,0.5)", marginBottom: 32 }}>
              We're building structured coaching pathways, competition programmes, and development squads for Barbados' next generation of surfers. Get in touch to register your interest.
            </p>
            <a href="mailto:admin@bsa.surf?subject=Junior%20Programme%20Interest" style={{ fontSize: 14, fontWeight: 600, color: "#fff", backgroundColor: "#1478B5", padding: "12px 28px", borderRadius: 6, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.05em" }}>Register Interest</a>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
