'use client'


import Link from 'next/link'
import { FadeIn, StaggerContainer, StaggerItem, ScaleCard } from './components/AnimatedSection'
import { CountUp } from './components/CountUp'
import { CountdownTimer } from './components/CountdownTimer'
import type { BSAEvent, BSAOrg, EventDivisionFull, SeriesInfo } from '@/lib/liveheats'

interface Props {
  org: BSAOrg & { events: BSAEvent[]; series: SeriesInfo[] }
  upcoming: BSAEvent[]
  past: BSAEvent[]
  latestEvent: { id: string; name: string; date: string; status: string; eventDivisions: EventDivisionFull[] } | null
  latestSeries: SeriesInfo | null
  featuredAthletes: { id: string; name: string; image: string | null }[]
}

const BOARD_MEMBERS = [
  { name: 'Christopher Clarke', title: 'President', initials: 'CC' },
  { name: 'Coming Soon', title: 'Vice President', initials: '?' },
  { name: 'Coming Soon', title: 'Secretary', initials: '?' },
  { name: 'Coming Soon', title: 'Treasurer', initials: '?' },
  { name: 'Coming Soon', title: 'Board Member', initials: '?' },
]

const SURF_SPOTS = [
  { name: 'Soup Bowl', coast: 'East Coast', description: "Bathsheba's world-famous reef break. Powerful, hollow waves hosting WSL events since 2019. The heart of Barbados surfing." },
  { name: 'Drill Hall', coast: 'South Coast', description: 'South coast reef break. Consistent, accessible waves perfect for competition. Home to multiple SOTY Championship events.' },
  { name: 'Parlour', coast: 'East Coast', description: 'East coast point break. Fast, technical waves that reward precision and power.' },
  { name: 'South Point', coast: 'South Coast', description: "Barbados' premier point break. Long, peeling walls when the south swell arrives." },
]

export function HomeClient({ org, upcoming, past, latestEvent, latestSeries, featuredAthletes }: Props) {
  const nextEvent = upcoming[0] || null

  const openMensDivision = latestEvent?.eventDivisions.find(d => d.division.name.toLowerCase().includes('open') && d.division.name.toLowerCase().includes('men'))
  const topThree = openMensDivision?.ranking?.slice(0, 3) || []

  const totalAthletes = new Set<string>()
  if (latestEvent) {
    for (const div of latestEvent.eventDivisions) {
      for (const r of div.ranking || []) {
        totalAthletes.add(r.competitor.athlete.id)
      }
    }
  }

  return (
    <div className="pb-16 md:pb-0">
      {/* HERO */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(to bottom, #0A2540, #0d2f4f, #0a1f35)' }}
      >
        <div className="wave-pattern absolute inset-0 opacity-30" />
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="hero-scale">
            <img
              src="https://liveheats.com/images/dbb2a21b-7566-4629-8ea5-4c08a0b2877b.webp"
              alt="BSA Logo"
              className="mx-auto mb-8 rounded-full"
            />
          </div>
          <h1
            className="hero-fade-1 font-heading font-bold text-4xl md:text-7xl lg:text-8xl tracking-tight leading-none mb-6"
            style={{ color: '#ffffff' }}
          >
            BARBADOS SURFING<br />ASSOCIATION
          </h1>
          <p
            className="hero-fade-2 text-lg md:text-xl mb-4"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            The National Governing Body for Surfing in Barbados
          </p>
          <p
            className="hero-fade-3 text-sm font-mono tracking-widest"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            EST. 1995 — ISA MEMBER FEDERATION
          </p>
          <div className="hero-fade-4 mt-16">
            <div
              className="hero-bounce text-2xl"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              ↓
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-20 md:py-28" style={{ backgroundColor: '#FAFAF8' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: Math.max(totalAthletes.size, 250), suffix: '+', label: 'Athletes' },
              { value: org.events.length, suffix: '', label: 'Sanctioned Events' },
              { value: org.series.length, suffix: '', label: 'Championship Seasons' },
              { value: 10, suffix: '', label: 'Surf Breaks' },
            ].map((stat, i) => (
              <StaggerItem key={i}>
                <div className="font-heading font-bold text-5xl md:text-6xl mb-2" style={{ color: '#0A2540' }}>
                  <CountUp end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm font-medium uppercase tracking-wider" style={{ color: 'rgba(26,26,26,0.5)' }}>{stat.label}</div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* NEXT EVENT */}
      {nextEvent && (
        <section className="py-20 md:py-28" style={{ backgroundColor: '#F2EDE4' }}>
          <div className="max-w-7xl mx-auto px-6 md:px-8 text-center">
            <FadeIn>
              <p className="font-mono text-xs uppercase tracking-[0.2em] mb-4" style={{ color: '#D4944A' }}>Next Event</p>
              <h2 className="font-heading font-bold text-3xl md:text-5xl lg:text-6xl mb-6" style={{ color: '#0A2540' }}>{nextEvent.name}</h2>
              <p className="text-lg mb-8" style={{ color: 'rgba(26,26,26,0.5)' }}>
                {new Date(nextEvent.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                {' • Barbados'}
              </p>
            </FadeIn>
            <FadeIn delay={0.2}>
              <CountdownTimer targetDate={nextEvent.date} />
            </FadeIn>
            {nextEvent.eventDivisions.length > 0 && (
              <FadeIn delay={0.3}>
                <div className="flex flex-wrap justify-center gap-3 mt-8 mb-8">
                  {nextEvent.eventDivisions.map(div => (
                    <span key={div.id} className="text-xs font-medium px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.8)', color: 'rgba(26,26,26,0.7)' }}>
                      {div.division.name}
                    </span>
                  ))}
                </div>
              </FadeIn>
            )}
            <FadeIn delay={0.4}>
              <a
                href="https://www.liveheats.com/organisations/BarbadosSurfingAssociation"
                target="_blank"
                rel="noopener"
                className="inline-block font-semibold px-8 py-4 rounded-full text-lg transition-colors hover:opacity-80"
                style={{ backgroundColor: '#1478B5', color: '#ffffff' }}
              >
                Register Now
              </a>
            </FadeIn>
          </div>
        </section>
      )}

      {/* ABOUT BSA */}
      <section id="about" className="py-20 md:py-28" style={{ backgroundColor: '#0A2540', color: '#ffffff' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <FadeIn>
            <p className="font-mono text-xs uppercase tracking-[0.2em] mb-4" style={{ color: '#2BA5A0' }}>Who We Are</p>
            <p className="text-xl md:text-2xl lg:text-3xl leading-relaxed max-w-4xl mb-16" style={{ color: 'rgba(255,255,255,0.8)' }}>
              The Barbados Surfing Association is the National Governing Body for all forms of surfing in Barbados. As a proud member of the International Surfing Association (ISA) and the Barbados Olympic Association, we are dedicated to developing competitive surfing at every level — from grassroots junior programs to international championship representation.
            </p>
          </FadeIn>
          <StaggerContainer className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'COMPETE', text: 'Organizing national championships, the annual Surfer of the Year series, and hosting WSL qualifying events at world-class breaks' },
              { title: 'DEVELOP', text: 'Nurturing young talent through junior programs, coaching certifications, and pathways to international competition' },
              { title: 'REPRESENT', text: 'Proudly representing Barbados at the ISA World Surfing Games, Pan American Games, and on the world stage' },
            ].map((pillar) => (
              <StaggerItem key={pillar.title}>
                <div className="border-t pt-6" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                  <h3 className="font-heading font-bold text-lg mb-3" style={{ color: '#2BA5A0' }}>{pillar.title}</h3>
                  <p className="leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{pillar.text}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* BOARD OF DIRECTORS */}
      <section className="py-20 md:py-28" style={{ backgroundColor: '#FAFAF8' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <FadeIn>
            <p className="font-mono text-xs uppercase tracking-[0.2em] mb-4" style={{ color: '#D4944A' }}>Leadership</p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-12" style={{ color: '#0A2540' }}>Board of Directors</h2>
          </FadeIn>
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {BOARD_MEMBERS.map((member, i) => (
              <StaggerItem key={i} className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F2EDE4' }}>
                  <span className="font-heading font-bold text-xl" style={{ color: 'rgba(10,37,64,0.4)' }}>{member.initials}</span>
                </div>
                <p className="font-heading font-semibold text-sm" style={{ color: '#0A2540' }}>{member.name}</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(26,26,26,0.4)' }}>{member.title}</p>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* LATEST RESULTS */}
      {latestEvent && topThree.length >= 3 && (
        <section className="py-20 md:py-28" style={{ backgroundColor: '#ffffff' }}>
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <FadeIn>
              <p className="font-mono text-xs uppercase tracking-[0.2em] mb-4" style={{ color: '#D4944A' }}>Latest Results</p>
              <h2 className="font-heading font-bold text-3xl md:text-4xl mb-2" style={{ color: '#0A2540' }}>{latestEvent.name}</h2>
              <p className="text-sm mb-12" style={{ color: 'rgba(26,26,26,0.4)' }}>Open Mens — Top 3</p>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="flex items-end justify-center gap-4 md:gap-8 mb-12">
                {/* 2nd place */}
                <div className="text-center" style={{ order: 1 }}>
                  <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-3 rounded-full overflow-hidden" style={{ backgroundColor: '#F2EDE4' }}>
                    {topThree[1]?.competitor.athlete.image ? (
                      <img src={topThree[1].competitor.athlete.image} alt={topThree[1].competitor.athlete.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-heading text-xl" style={{ color: 'rgba(10,37,64,0.3)' }}>2</div>
                    )}
                  </div>
                  <p className="font-heading font-semibold text-sm" style={{ color: '#0A2540' }}>{topThree[1]?.competitor.athlete.name}</p>
                  <p className="font-mono text-xs" style={{ color: 'rgba(26,26,26,0.4)' }}>{topThree[1]?.total?.toFixed(2)} pts</p>
                  <div className="w-20 md:w-28 h-20 md:h-24 mx-auto mt-3 rounded-t-lg flex items-center justify-center" style={{ backgroundColor: '#F2EDE4' }}>
                    <span className="font-heading font-bold text-2xl" style={{ color: 'rgba(10,37,64,0.3)' }}>2</span>
                  </div>
                </div>

                {/* 1st place */}
                <div className="text-center" style={{ order: 2 }}>
                  <div className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-3 rounded-full overflow-hidden ring-4" style={{ backgroundColor: '#F2EDE4', boxShadow: '0 0 0 4px #D4944A' }}>
                    {topThree[0]?.competitor.athlete.image ? (
                      <img src={topThree[0].competitor.athlete.image} alt={topThree[0].competitor.athlete.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-heading text-2xl" style={{ color: 'rgba(10,37,64,0.3)' }}>1</div>
                    )}
                  </div>
                  <p className="font-heading font-bold" style={{ color: '#0A2540' }}>{topThree[0]?.competitor.athlete.name}</p>
                  <p className="font-mono text-sm" style={{ color: '#D4944A' }}>{topThree[0]?.total?.toFixed(2)} pts</p>
                  <div className="w-24 md:w-32 h-28 md:h-32 mx-auto mt-3 rounded-t-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(212,148,74,0.2)' }}>
                    <span className="font-heading font-bold text-3xl" style={{ color: '#D4944A' }}>1</span>
                  </div>
                </div>

                {/* 3rd place */}
                <div className="text-center" style={{ order: 3 }}>
                  <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-3 rounded-full overflow-hidden" style={{ backgroundColor: '#F2EDE4' }}>
                    {topThree[2]?.competitor.athlete.image ? (
                      <img src={topThree[2].competitor.athlete.image} alt={topThree[2].competitor.athlete.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-heading text-xl" style={{ color: 'rgba(10,37,64,0.3)' }}>3</div>
                    )}
                  </div>
                  <p className="font-heading font-semibold text-sm" style={{ color: '#0A2540' }}>{topThree[2]?.competitor.athlete.name}</p>
                  <p className="font-mono text-xs" style={{ color: 'rgba(26,26,26,0.4)' }}>{topThree[2]?.total?.toFixed(2)} pts</p>
                  <div className="w-20 md:w-28 h-16 md:h-20 mx-auto mt-3 rounded-t-lg flex items-center justify-center" style={{ backgroundColor: '#F2EDE4' }}>
                    <span className="font-heading font-bold text-2xl" style={{ color: 'rgba(10,37,64,0.3)' }}>3</span>
                  </div>
                </div>
              </div>
            </FadeIn>

            <div className="text-center">
              <Link href={`/events/${latestEvent.id}`} className="font-medium transition-colors hover:opacity-70" style={{ color: '#1478B5' }}>
                View All Results →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* SOTY STANDINGS PREVIEW */}
      {latestSeries && (
        <section className="py-20 md:py-28" style={{ backgroundColor: '#0A2540', color: '#ffffff' }}>
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <FadeIn>
              <p className="font-mono text-xs uppercase tracking-[0.2em] mb-4" style={{ color: '#2BA5A0' }}>Rankings</p>
              <h2 className="font-heading font-bold text-3xl md:text-4xl mb-12">
                Surfer of the Year {new Date().getFullYear()}
              </h2>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>View the full championship standings on the rankings page.</p>
              <Link href="/rankings" className="font-medium transition-colors hover:opacity-70" style={{ color: '#2BA5A0' }}>
                View Full Rankings →
              </Link>
            </FadeIn>
          </div>
        </section>
      )}

      {/* FEATURED ATHLETES */}
      {featuredAthletes.length > 0 && (
        <section className="py-20 md:py-28" style={{ backgroundColor: '#FAFAF8' }}>
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <FadeIn>
              <p className="font-mono text-xs uppercase tracking-[0.2em] mb-4" style={{ color: '#D4944A' }}>Representing Barbados</p>
              <h2 className="font-heading font-bold text-3xl md:text-4xl mb-12" style={{ color: '#0A2540' }}>Featured Athletes</h2>
            </FadeIn>
            <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featuredAthletes.map((athlete) => (
                <StaggerItem key={athlete.id}>
                  <ScaleCard>
                    <Link href={`/athletes/${athlete.id}`} className="block">
                      <div className="aspect-square rounded-2xl overflow-hidden mb-4" style={{ backgroundColor: '#F2EDE4' }}>
                        {athlete.image ? (
                          <img src={athlete.image} alt={athlete.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-heading text-4xl" style={{ color: 'rgba(10,37,64,0.2)' }}>
                            {athlete.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <h3 className="font-heading font-semibold" style={{ color: '#0A2540' }}>{athlete.name}</h3>
                      <p className="text-sm" style={{ color: 'rgba(26,26,26,0.4)' }}>Barbados</p>
                    </Link>
                  </ScaleCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* SURF SPOTS */}
      <section className="py-20 md:py-28" style={{ backgroundColor: '#F2EDE4' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <FadeIn>
            <p className="font-mono text-xs uppercase tracking-[0.2em] mb-4" style={{ color: '#D4944A' }}>Our Waves</p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-12" style={{ color: '#0A2540' }}>Surf Breaks</h2>
          </FadeIn>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SURF_SPOTS.map((spot) => (
              <StaggerItem key={spot.name}>
                <div className="rounded-2xl p-8 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-heading font-bold text-xl" style={{ color: '#0A2540' }}>{spot.name}</h3>
                    <span className="text-xs font-mono uppercase" style={{ color: 'rgba(26,26,26,0.3)' }}>{spot.coast}</span>
                  </div>
                  <p className="leading-relaxed" style={{ color: 'rgba(26,26,26,0.6)' }}>{spot.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* GET INVOLVED */}
      <section className="py-20 md:py-28" style={{ backgroundColor: '#FAFAF8' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <FadeIn>
            <p className="font-mono text-xs uppercase tracking-[0.2em] mb-4 text-center" style={{ color: '#D4944A' }}>Join Us</p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-12 text-center" style={{ color: '#0A2540' }}>Get Involved</h2>
          </FadeIn>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'COMPETE', text: 'Join the SOTY Championship series. Open to all Barbadian surfers.', link: '/events', linkText: 'View Events →' },
              { title: 'MEMBERSHIP', text: 'Become a BSA member and represent Barbados.', link: '/profile', linkText: 'Learn More →' },
              { title: 'SPONSOR', text: 'Support the development of surfing in Barbados.', link: 'mailto:barbadossurfingassociation@gmail.com', linkText: 'Contact Us →' },
            ].map((card) => (
              <StaggerItem key={card.title}>
                <ScaleCard>
                  <div className="rounded-2xl p-8 shadow-sm h-full flex flex-col" style={{ backgroundColor: '#ffffff' }}>
                    <h3 className="font-heading font-bold text-lg mb-3" style={{ color: '#0A2540' }}>{card.title}</h3>
                    <p className="leading-relaxed mb-6 flex-1" style={{ color: 'rgba(26,26,26,0.6)' }}>{card.text}</p>
                    <Link href={card.link} className="font-medium text-sm transition-colors hover:opacity-70" style={{ color: '#1478B5' }}>
                      {card.linkText}
                    </Link>
                  </div>
                </ScaleCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </div>
  )
}
