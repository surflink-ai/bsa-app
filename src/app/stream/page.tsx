import { Metadata } from 'next'
import { ScrollReveal } from '../components/ScrollReveal'
import { WaveDivider } from '../components/WaveDivider'

export const metadata: Metadata = {
  title: 'BSA Live — Barbados Surfing Association',
  description: 'Watch live surf competitions from the Barbados Surfing Association.',
}

const SCHEDULE_2026 = [
  { num: 1, date: 'March 14', location: 'Drill Hall', status: 'next' },
  { num: 2, date: 'April 11', location: 'South Point', status: 'upcoming' },
  { num: 3, date: 'May 9', location: 'Long Beach', status: 'upcoming' },
  { num: 4, date: 'September 26', location: 'Parlour', status: 'upcoming' },
  { num: 5, date: 'Nov 27–29', location: 'Soup Bowl', status: 'upcoming', special: 'Independence Pro & Nationals' },
]

const FEATURES = [
  { title: 'Live Scoring', desc: 'Real-time score overlays as judges submit. See totals, needs, and wave-by-wave breakdowns.' },
  { title: 'Priority Tracking', desc: 'Watch priority position change with every wave. Know who has right of way at all times.' },
  { title: 'Multi-Camera', desc: 'Competition coverage from multiple angles with commentary and instant replays.' },
]

export default function StreamPage() {
  return (
    <div className="pb-20 md:pb-0">
      {/* Hero — navy */}
      <section style={{ backgroundColor: '#0A2540', padding: '120px 24px 64px', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: 16 }}>BSA LIVE</div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#fff', marginBottom: 12 }}>
              Live Competition Stream
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 40, lineHeight: 1.6 }}>
              Watch BSA competitions live with real-time scoring overlays, priority tracking, and instant replay.
            </p>

            {/* Stream embed placeholder */}
            <div style={{
              aspectRatio: '16/9', maxWidth: 720, margin: '0 auto',
              borderRadius: 16, overflow: 'hidden',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <div style={{ width: 0, height: 0, borderLeft: '14px solid rgba(255,255,255,0.3)', borderTop: '8px solid transparent', borderBottom: '8px solid transparent', marginLeft: 4 }} />
                </div>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                  Stream goes live during competition days
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Features — white */}
      <WaveDivider color="#FFFFFF" bg="#0A2540" />
      <section style={{ backgroundColor: '#FFFFFF', padding: '64px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: 16 }}>WHAT YOU GET</div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: '#0A2540', marginBottom: 32 }}>Competition Coverage</h2>
          </ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="grid-responsive-3">
            {FEATURES.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 80}>
                <div style={{ background: 'rgba(10,37,64,0.02)', border: '1px solid rgba(10,37,64,0.06)', borderRadius: 12, padding: 24, height: '100%' }}>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, color: '#0A2540', marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(10,37,64,0.5)', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule — navy */}
      <WaveDivider color="#0A2540" bg="#FFFFFF" />
      <section style={{ backgroundColor: '#0A2540', padding: '64px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: 20 }}>
              2026 BROADCAST SCHEDULE
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {SCHEDULE_2026.map((event, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: i < SCHEDULE_2026.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <div style={{ width: 32, textAlign: 'center' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: event.status === 'next' ? '#2BA5A0' : 'rgba(255,255,255,0.2)', fontWeight: 700 }}>#{event.num}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: event.status === 'next' ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                      {event.special || `SOTY Event #${event.num}`}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                      {event.date} &middot; {event.location}
                    </div>
                  </div>
                  {event.status === 'next' && (
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, padding: '3px 8px', borderRadius: 10, backgroundColor: '#2BA5A0', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Next</span>
                  )}
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
