'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
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

  // Get Open Mens division from latest event for podium
  const openMensDivision = latestEvent?.eventDivisions.find(d => d.division.name.toLowerCase().includes('open') && d.division.name.toLowerCase().includes('men'))
  const topThree = openMensDivision?.ranking?.slice(0, 3) || []

  // Collect unique athlete count
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
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-navy via-[#0d2f4f] to-[#0a1f35] overflow-hidden">
        <div className="wave-pattern absolute inset-0 opacity-30" />
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <Image
              src="https://liveheats.com/images/dbb2a21b-7566-4629-8ea5-4c08a0b2877b.webp"
              alt="BSA Logo"
              width={120}
              height={120}
              className="mx-auto mb-8 rounded-full"
              priority
            />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-heading font-bold text-white text-4xl md:text-7xl lg:text-8xl tracking-tight leading-none mb-6"
          >
            BARBADOS SURFING<br />ASSOCIATION
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-white/60 text-lg md:text-xl mb-4"
          >
            The National Governing Body for Surfing in Barbados
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-white/30 text-sm font-mono tracking-widest"
          >
            EST. 1995 — ISA MEMBER FEDERATION
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="mt-16"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-white/30 text-2xl"
            >
              ↓
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-20 md:py-28 bg-warm-white">
        <div className="max-w-6xl mx-auto px-6">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: Math.max(totalAthletes.size, 250), suffix: '+', label: 'Athletes' },
              { value: org.events.length, suffix: '', label: 'Sanctioned Events' },
              { value: org.series.length, suffix: '', label: 'Championship Seasons' },
              { value: 10, suffix: '', label: 'Surf Breaks' },
            ].map((stat, i) => (
              <StaggerItem key={i}>
                <div className="font-heading font-bold text-5xl md:text-6xl text-navy mb-2">
                  <CountUp end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-dark/50 text-sm font-medium uppercase tracking-wider">{stat.label}</div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* NEXT EVENT */}
      {nextEvent && (
        <section className="py-20 md:py-28 bg-sand">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <FadeIn>
              <p className="text-amber font-mono text-xs uppercase tracking-[0.2em] mb-4">Next Event</p>
              <h2 className="font-heading font-bold text-3xl md:text-5xl lg:text-6xl text-navy mb-6">{nextEvent.name}</h2>
              <p className="text-dark/50 text-lg mb-8">
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
                    <span key={div.id} className="bg-white/80 text-dark/70 text-xs font-medium px-4 py-2 rounded-full">
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
                className="inline-block bg-ocean hover:bg-ocean/80 text-white font-semibold px-8 py-4 rounded-full text-lg transition-colors"
              >
                Register Now
              </a>
            </FadeIn>
          </div>
        </section>
      )}

      {/* ABOUT BSA */}
      <section id="about" className="py-20 md:py-28 bg-navy text-white">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn>
            <p className="text-teal font-mono text-xs uppercase tracking-[0.2em] mb-4">Who We Are</p>
            <p className="text-xl md:text-2xl lg:text-3xl leading-relaxed text-white/80 max-w-4xl mb-16">
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
                <div className="border-t border-white/20 pt-6">
                  <h3 className="font-heading font-bold text-lg text-teal mb-3">{pillar.title}</h3>
                  <p className="text-white/50 leading-relaxed">{pillar.text}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* BOARD OF DIRECTORS */}
      <section className="py-20 md:py-28 bg-warm-white">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn>
            <p className="text-amber font-mono text-xs uppercase tracking-[0.2em] mb-4">Leadership</p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-navy mb-12">Board of Directors</h2>
          </FadeIn>
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {BOARD_MEMBERS.map((member, i) => (
              <StaggerItem key={i} className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-sand flex items-center justify-center">
                  <span className="font-heading font-bold text-navy/40 text-xl">{member.initials}</span>
                </div>
                <p className="font-heading font-semibold text-sm text-navy">{member.name}</p>
                <p className="text-dark/40 text-xs mt-1">{member.title}</p>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* LATEST RESULTS */}
      {latestEvent && topThree.length >= 3 && (
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <FadeIn>
              <p className="text-amber font-mono text-xs uppercase tracking-[0.2em] mb-4">Latest Results</p>
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-navy mb-2">{latestEvent.name}</h2>
              <p className="text-dark/40 text-sm mb-12">Open Mens — Top 3</p>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="flex items-end justify-center gap-4 md:gap-8 mb-12">
                {/* 2nd place */}
                <div className="text-center podium-2">
                  <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-3 rounded-full bg-sand overflow-hidden">
                    {topThree[1]?.competitor.athlete.image ? (
                      <Image src={topThree[1].competitor.athlete.image} alt={topThree[1].competitor.athlete.name} width={96} height={96} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-navy/30 font-heading text-xl">2</div>
                    )}
                  </div>
                  <p className="font-heading font-semibold text-sm text-navy">{topThree[1]?.competitor.athlete.name}</p>
                  <p className="font-mono text-xs text-dark/40">{topThree[1]?.total?.toFixed(2)} pts</p>
                  <div className="bg-sand w-20 md:w-28 h-20 md:h-24 mx-auto mt-3 rounded-t-lg flex items-center justify-center">
                    <span className="font-heading font-bold text-2xl text-navy/30">2</span>
                  </div>
                </div>

                {/* 1st place */}
                <div className="text-center podium-1">
                  <div className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-3 rounded-full bg-sand overflow-hidden ring-4 ring-amber">
                    {topThree[0]?.competitor.athlete.image ? (
                      <Image src={topThree[0].competitor.athlete.image} alt={topThree[0].competitor.athlete.name} width={128} height={128} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-navy/30 font-heading text-2xl">1</div>
                    )}
                  </div>
                  <p className="font-heading font-bold text-navy">{topThree[0]?.competitor.athlete.name}</p>
                  <p className="font-mono text-sm text-amber">{topThree[0]?.total?.toFixed(2)} pts</p>
                  <div className="bg-amber/20 w-24 md:w-32 h-28 md:h-32 mx-auto mt-3 rounded-t-lg flex items-center justify-center">
                    <span className="font-heading font-bold text-3xl text-amber">1</span>
                  </div>
                </div>

                {/* 3rd place */}
                <div className="text-center podium-3">
                  <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-3 rounded-full bg-sand overflow-hidden">
                    {topThree[2]?.competitor.athlete.image ? (
                      <Image src={topThree[2].competitor.athlete.image} alt={topThree[2].competitor.athlete.name} width={96} height={96} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-navy/30 font-heading text-xl">3</div>
                    )}
                  </div>
                  <p className="font-heading font-semibold text-sm text-navy">{topThree[2]?.competitor.athlete.name}</p>
                  <p className="font-mono text-xs text-dark/40">{topThree[2]?.total?.toFixed(2)} pts</p>
                  <div className="bg-sand w-20 md:w-28 h-16 md:h-20 mx-auto mt-3 rounded-t-lg flex items-center justify-center">
                    <span className="font-heading font-bold text-2xl text-navy/30">3</span>
                  </div>
                </div>
              </div>
            </FadeIn>

            <div className="text-center">
              <Link href={`/events/${latestEvent.id}`} className="text-ocean hover:text-ocean/70 font-medium transition-colors">
                View All Results →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* SOTY STANDINGS PREVIEW - skipping if no series data since we need event details */}
      {latestSeries && (
        <section className="py-20 md:py-28 bg-navy text-white">
          <div className="max-w-4xl mx-auto px-6">
            <FadeIn>
              <p className="text-teal font-mono text-xs uppercase tracking-[0.2em] mb-4">Rankings</p>
              <h2 className="font-heading font-bold text-3xl md:text-4xl mb-12">
                Surfer of the Year {new Date().getFullYear()}
              </h2>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="text-white/50 mb-8">View the full championship standings on the rankings page.</p>
              <Link href="/rankings" className="text-teal hover:text-teal/70 font-medium transition-colors">
                View Full Rankings →
              </Link>
            </FadeIn>
          </div>
        </section>
      )}

      {/* FEATURED ATHLETES */}
      {featuredAthletes.length > 0 && (
        <section className="py-20 md:py-28 bg-warm-white">
          <div className="max-w-6xl mx-auto px-6">
            <FadeIn>
              <p className="text-amber font-mono text-xs uppercase tracking-[0.2em] mb-4">Representing Barbados</p>
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-navy mb-12">Featured Athletes</h2>
            </FadeIn>
            <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featuredAthletes.map((athlete) => (
                <StaggerItem key={athlete.id}>
                  <ScaleCard>
                    <Link href={`/athletes/${athlete.id}`} className="block">
                      <div className="aspect-square rounded-2xl bg-sand overflow-hidden mb-4">
                        {athlete.image ? (
                          <Image src={athlete.image} alt={athlete.name} width={400} height={400} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-navy/20 font-heading text-4xl">
                            {athlete.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <h3 className="font-heading font-semibold text-navy">{athlete.name}</h3>
                      <p className="text-dark/40 text-sm">Barbados</p>
                    </Link>
                  </ScaleCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* SURF SPOTS */}
      <section className="py-20 md:py-28 bg-sand">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn>
            <p className="text-amber font-mono text-xs uppercase tracking-[0.2em] mb-4">Our Waves</p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-navy mb-12">Surf Breaks</h2>
          </FadeIn>
          <StaggerContainer className="grid md:grid-cols-2 gap-6">
            {SURF_SPOTS.map((spot) => (
              <StaggerItem key={spot.name}>
                <div className="bg-white rounded-2xl p-8 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-heading font-bold text-xl text-navy">{spot.name}</h3>
                    <span className="text-xs font-mono text-dark/30 uppercase">{spot.coast}</span>
                  </div>
                  <p className="text-dark/60 leading-relaxed">{spot.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* GET INVOLVED */}
      <section className="py-20 md:py-28 bg-warm-white">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn>
            <p className="text-amber font-mono text-xs uppercase tracking-[0.2em] mb-4 text-center">Join Us</p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-navy mb-12 text-center">Get Involved</h2>
          </FadeIn>
          <StaggerContainer className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'COMPETE', text: 'Join the SOTY Championship series. Open to all Barbadian surfers.', link: '/events', linkText: 'View Events →' },
              { title: 'MEMBERSHIP', text: 'Become a BSA member and represent Barbados.', link: '/profile', linkText: 'Learn More →' },
              { title: 'SPONSOR', text: 'Support the development of surfing in Barbados.', link: 'mailto:barbadossurfingassociation@gmail.com', linkText: 'Contact Us →' },
            ].map((card) => (
              <StaggerItem key={card.title}>
                <ScaleCard>
                  <div className="bg-white rounded-2xl p-8 shadow-sm h-full flex flex-col">
                    <h3 className="font-heading font-bold text-lg text-navy mb-3">{card.title}</h3>
                    <p className="text-dark/60 leading-relaxed mb-6 flex-1">{card.text}</p>
                    <Link href={card.link} className="text-ocean hover:text-ocean/70 font-medium text-sm transition-colors">
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
