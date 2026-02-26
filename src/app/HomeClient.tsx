'use client'
import Link from 'next/link'
import ScrollReveal from './components/ScrollReveal'
import CountUp from './components/CountUp'
import CountdownTimer from './components/CountdownTimer'
import { ChevronDownIcon, ArrowRightIcon, WaveIcon, TrophyIcon, UsersIcon, MapPinIcon, CompassIcon, BoardIcon, StarIcon } from './components/Icons'

interface Props {
  nextEvent: { name: string; date: string; location: string } | null
  latestResults: { eventName: string; podium: { place: number; name: string; total: number }[] } | null
  featuredAthletes: { id: string; name: string; image: string | null }[]
  totalEvents: number
  totalAthletes: number
  totalSeries: number
}

export default function HomeClient({ nextEvent, latestResults, featuredAthletes, totalEvents, totalAthletes, totalSeries }: Props) {
  return (
    <>
      <section style={{ minHeight: '100vh', background: 'linear-gradient(165deg, #0A2540 0%, #0d3156 50%, #0A2540 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden', padding: '2rem' }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px', background: 'linear-gradient(to top, #FAFAF8, transparent)', zIndex: 2 }} />
        <div style={{ position: 'absolute', top: '15%', right: '10%', opacity: 0.04, transform: 'rotate(-15deg)' }}><WaveIcon size={300} /></div>
        <div className="anim-scale" style={{ color: '#2BA5A0', marginBottom: '2rem' }}><WaveIcon size={56} /></div>
        <h1 className="anim-fade-1" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(2.5rem, 6vw, 5rem)', color: '#fff', lineHeight: 1.05, letterSpacing: '-0.03em', maxWidth: '800px' }}>Barbados Surfing Association</h1>
        <p className="anim-fade-2" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'rgba(255,255,255,0.5)', marginTop: '1.5rem', maxWidth: '520px', lineHeight: 1.7 }}>The governing body for competitive surfing in Barbados. Building champions, growing community.</p>
        <div className="anim-fade-3" style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/events" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 600, color: '#fff', background: '#1478B5', padding: '0.875rem 2rem', borderRadius: '6px', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.06em' }}>View Events</Link>
          <Link href="/rankings" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.875rem 2rem', borderRadius: '6px', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rankings</Link>
        </div>
        <div className="anim-fade-4 anim-float" style={{ position: 'absolute', bottom: '8%', color: 'rgba(255,255,255,0.3)', zIndex: 3 }}><ChevronDownIcon size={28} /></div>
      </section>

      <section style={{ padding: '6rem 2rem', background: '#FAFAF8' }}>
        <ScrollReveal>
          <div style={{ maxWidth: '80rem', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '3rem', textAlign: 'center' }}>
            {[{ val: totalEvents, suffix: '+', label: 'Events Hosted' }, { val: totalAthletes, suffix: '+', label: 'Registered Athletes' }, { val: totalSeries, suffix: '', label: 'Competition Series' }, { val: 15, suffix: '+', label: 'Years of Surfing' }].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', color: '#0A2540', lineHeight: 1 }}><CountUp end={s.val} suffix={s.suffix} /></div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(26,26,26,0.4)', marginTop: '0.75rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {nextEvent && (
        <section style={{ padding: '6rem 2rem', background: '#F2EDE4' }}>
          <ScrollReveal>
            <div style={{ maxWidth: '80rem', margin: '0 auto', textAlign: 'center' }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: '1rem' }}>Next Event</div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(1.875rem, 4vw, 3rem)', color: '#0A2540', marginBottom: '0.75rem' }}>{nextEvent.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'rgba(26,26,26,0.5)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', marginBottom: '2.5rem' }}><MapPinIcon size={16} /> {nextEvent.location}</div>
              <CountdownTimer target={nextEvent.date} />
              <div style={{ marginTop: '2.5rem' }}><Link href="/events" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 600, color: '#1478B5', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>View All Events <ArrowRightIcon size={16} /></Link></div>
            </div>
          </ScrollReveal>
        </section>
      )}

      <section style={{ padding: '6rem 2rem', background: '#0A2540' }}>
        <ScrollReveal>
          <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: '1rem' }}>About BSA</div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(1.875rem, 4vw, 3rem)', color: '#fff', marginBottom: '3rem', maxWidth: '600px' }}>Growing the surfing community across Barbados</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
              {[{ Icon: TrophyIcon, title: 'Competition', desc: 'Sanctioned events across all skill levels, from grassroots groms to elite open divisions.' }, { Icon: UsersIcon, title: 'Development', desc: 'Coaching programs, youth academies, and pathways to international representation.' }, { Icon: CompassIcon, title: 'Stewardship', desc: 'Protecting our coastline and surf breaks for future generations of Bajan surfers.' }].map(({ Icon, title, desc }) => (
                <div key={title} style={{ padding: '2rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ color: '#2BA5A0', marginBottom: '1rem' }}><Icon size={28} /></div>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '1.25rem', color: '#fff', marginBottom: '0.75rem' }}>{title}</h3>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', lineHeight: 1.75, color: 'rgba(255,255,255,0.5)' }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {latestResults && latestResults.podium.length >= 3 && (
        <section style={{ padding: '6rem 2rem', background: '#FAFAF8' }}>
          <ScrollReveal>
            <div style={{ maxWidth: '80rem', margin: '0 auto', textAlign: 'center' }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: '1rem' }}>Latest Results</div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(1.875rem, 4vw, 3rem)', color: '#0A2540', marginBottom: '0.5rem' }}>{latestResults.eventName}</h2>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1.5rem', marginTop: '3rem', flexWrap: 'wrap' }}>
                {[latestResults.podium[1], latestResults.podium[0], latestResults.podium[2]].filter(Boolean).map((p, i) => {
                  const heights = ['10rem', '13rem', '8rem']
                  const colors = ['#2BA5A0', '#1478B5', 'rgba(26,26,26,0.08)']
                  const textColors = ['#fff', '#fff', '#0A2540']
                  return (
                    <div key={p.place} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', fontWeight: 600, color: '#2BA5A0', marginBottom: '0.75rem' }}>{p.total.toFixed(2)} pts</div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: i === 1 ? '1.125rem' : '0.9375rem', color: '#0A2540', marginBottom: '0.75rem' }}>{p.name}</div>
                      <div style={{ width: '120px', height: heights[i], borderRadius: '8px 8px 0 0', background: colors[i], display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '1rem', color: textColors[i], fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.5rem' }}>{p.place}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </ScrollReveal>
        </section>
      )}

      {featuredAthletes.length > 0 && (
        <section style={{ padding: '6rem 2rem', background: '#F2EDE4' }}>
          <ScrollReveal>
            <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: '0.75rem' }}>Athletes</div>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(1.875rem, 4vw, 3rem)', color: '#0A2540' }}>Featured Competitors</h2>
                </div>
                <Link href="/athletes" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 600, color: '#1478B5', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>All Athletes <ArrowRightIcon size={16} /></Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
                {featuredAthletes.map(a => (
                  <Link key={a.id} href={`/athletes/${a.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', transition: 'transform 0.3s, box-shadow 0.3s' }}>
                      <div style={{ height: '200px', background: 'linear-gradient(135deg, #0A2540, #1478B5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {a.image ? <img src={a.image} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ color: 'rgba(255,255,255,0.2)' }}><BoardIcon size={48} /></div>}
                      </div>
                      <div style={{ padding: '1.25rem' }}><div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '1rem', color: '#0A2540' }}>{a.name}</div></div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </section>
      )}

      <section style={{ padding: '6rem 2rem', background: '#FAFAF8' }}>
        <ScrollReveal>
          <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: '0.75rem' }}>Surf Spots</div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(1.875rem, 4vw, 3rem)', color: '#0A2540', marginBottom: '3rem' }}>Where We Ride</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {[{ name: 'Soup Bowl, Bathsheba', desc: 'World-class reef break. Powerful barrels on the rugged east coast.' }, { name: 'Freights Bay', desc: 'Consistent right-hand point break. Competition venue of choice.' }, { name: 'South Point', desc: 'Fun beach break with multiple peaks. Great for all levels.' }, { name: 'Tropicana', desc: 'Sheltered south coast spot. Perfect for developing surfers.' }].map(spot => (
                <div key={spot.name} style={{ padding: '2rem', background: '#fff', borderRadius: '8px', border: '1px solid rgba(26,26,26,0.06)', transition: 'transform 0.3s, box-shadow 0.3s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ color: '#1478B5' }}><MapPinIcon size={18} /></div>
                    <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '1.0625rem', color: '#0A2540' }}>{spot.name}</h3>
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', lineHeight: 1.75, color: 'rgba(26,26,26,0.6)' }}>{spot.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      <section style={{ padding: '6rem 2rem', background: '#0A2540' }}>
        <ScrollReveal>
          <div style={{ maxWidth: '80rem', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: '0.75rem' }}>Get Involved</div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(1.875rem, 4vw, 3rem)', color: '#fff', marginBottom: '3rem' }}>Join the Movement</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', textAlign: 'left' }}>
              {[{ Icon: StarIcon, title: 'Compete', desc: 'Register for upcoming events through LiveHeats and represent Barbados.', link: 'https://liveheats.com/BarbadosSurfingAssociation' }, { Icon: UsersIcon, title: 'Volunteer', desc: 'Help run events as a judge, beach marshal, or support crew.', link: '' }, { Icon: WaveIcon, title: 'Support', desc: 'Sponsor our athletes and help grow competitive surfing in Barbados.', link: '' }].map(({ Icon, title, desc, link }) => (
                <div key={title} style={{ padding: '2rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ color: '#2BA5A0', marginBottom: '1rem' }}><Icon size={28} /></div>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '1.25rem', color: '#fff', marginBottom: '0.75rem' }}>{title}</h3>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9375rem', lineHeight: 1.75, color: 'rgba(255,255,255,0.5)', marginBottom: link ? '1rem' : '0' }}>{desc}</p>
                  {link && <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8125rem', fontWeight: 600, color: '#1478B5', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Register Now <ArrowRightIcon size={14} /></a>}
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>
    </>
  )
}
