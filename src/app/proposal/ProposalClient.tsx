'use client'

import { useState, useEffect } from 'react'
import ScrollReveal from '../components/ScrollReveal'
import { WaveDivider } from '../components/WaveDivider'

export default function ProposalClient() {
  const [currentSection, setCurrentSection] = useState(0)

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => { document.documentElement.style.scrollBehavior = 'auto' }
  }, [])

  const scrollToNext = () => {
    document.getElementById('platform-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  const featureCards = [
    { image: '/proposal/homepage-desktop.jpg', title: 'Professional Website', description: 'Fully branded, mobile-optimized, custom domain. The digital home of your surf organization.' },
    { image: '/proposal/surf-report-desktop.jpg', title: 'Multi-Source Surf Forecast', description: 'Cross-referenced data from up to 7 sources. Surfline, WindGuru, NOAA buoys, tides — updated every 15 minutes.' },
    { image: '/proposal/results-desktop.jpg', title: 'Competition Results', description: 'Full heat-by-heat breakdowns with individual wave scores. Medal standings across all divisions.' },
    { image: '/proposal/athletes-desktop.jpg', title: 'Athlete Profiles', description: 'Complete athlete registry with competition stats, career tracking, rivalry data, and shareable stat cards.' },
    { image: '/proposal/rankings-desktop.jpg', title: 'Season Rankings', description: 'Automatic points calculation across all divisions. Configurable series and historical data.' },
    { image: '/proposal/events-desktop.jpg', title: 'Event Management', description: 'Full event calendar, registration integration, division listings, and live results.' },
    { image: '/proposal/event-detail-desktop.jpg', title: 'Live Stream + VOD Library', description: 'Multi-source livestream (YouTube, OBS, Cloudflare). Score overlay. Event replay library when not live.' },
    { image: '/proposal/athlete-detail-desktop.jpg', title: 'Stats, Sharing + Athlete Portal', description: 'Athletes claim profiles, add socials and sponsors. Deep stats with head-to-head records and downloadable stat cards.' },
  ]

  const mobileImages = ['/proposal/homepage-mobile.jpg', '/proposal/surf-report-mobile.jpg', '/proposal/results-mobile.jpg']

  const techCards = [
    { title: 'Real-Time Database', description: 'PostgreSQL with real-time subscriptions. Athlete stats, wave scores, and rankings update instantly.' },
    { title: 'Multi-Source Surf Engine', description: 'Up to 7 data feeds cross-referenced: Surfline, WindGuru, NOAA GFS, Open-Meteo, buoys, tides, sunrise/sunset.' },
    { title: 'Automated Pipeline', description: 'Data refreshed every 15 minutes. Zero manual intervention. Always current.' },
    { title: 'LiveHeats Integration', description: 'Competition results synced directly. Athlete stats auto-calculated. Registrations linked.' },
    { title: 'ISA Scoring System', description: 'International Surfing Association compliant. Best 2 of N waves, drop high/low. Full judge panel support.' },
    { title: 'Global CDN', description: 'Edge network delivery. Sub-second page loads worldwide. 99%+ uptime.' },
    { title: 'Daily Backups', description: 'Automated database backups. Your data is safe and recoverable.' },
    { title: 'WhatsApp Communications', description: 'Blast messaging to athletes, parents, and contacts. Template-based, audience-filtered, delivery-tracked.' },
    { title: 'Full Audit Trail', description: 'Every admin action logged. Who changed what, when. Complete accountability.' },
    { title: 'White-Label Ready', description: 'Your brand, your domain, your colors. Powered by Tradewind infrastructure behind the scenes.' },
  ]

  const includedFeatures = [
    'Branded website with custom domain',
    'Competition results and rankings',
    'Athlete profiles and claim system',
    'Live stream management and VOD',
    'Surf forecast engine',
    'News and articles CMS',
    'Junior programme management',
    'WhatsApp communications',
    'Contact form and inquiry inbox',
    'Event check-in scanner',
    'Full admin dashboard (21 pages)',
    'Continuous updates and new features',
    'Security patches and monitoring',
    'Committee email setup',
    'Priority support',
  ]

  const onboardingSteps = [
    { title: 'Subscription Confirmed', description: 'Choose your plan and confirm your subscription. Founding partners receive a locked rate.' },
    { title: 'Branding + Configuration', description: 'We configure your instance with your logo, colors, domain, divisions, and surf spots.' },
    { title: 'Data Import', description: 'Athletes imported from LiveHeats. Historical results synced. Content migrated.' },
    { title: 'Email Setup', description: 'Google Workspace configured for committee members with your custom domain.' },
    { title: 'Training + Handover', description: 'Full admin training for your committee. Documentation provided. Platform goes live.' },
    { title: 'Ongoing Partnership', description: 'Every feature we build for any organization on the platform, you get too. Continuous improvement.' },
  ]

  const Dot = () => <div style={{ width: 8, height: 8, background: '#2BA5A0', borderRadius: '50%', marginRight: '1rem', flexShrink: 0 }} />

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      {/* SECTION 1 - HERO */}
      <section style={{ background: '#0A2540', color: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem', position: 'relative' }}>
        <ScrollReveal>
          <div style={{ marginBottom: '3rem' }}>
            <img src="/bsa-logo.webp" alt="BSA Logo" style={{ width: 120, height: 120, marginBottom: '2rem' }} />
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '4rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '0.02em' }}>BSA.SURF</h1>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: '#2BA5A0', textTransform: 'uppercase', letterSpacing: '0.2em', margin: '0 0 2rem 0' }}>Powered by Tradewind</p>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.8rem', fontWeight: 400, margin: '0 0 2rem 0', opacity: 0.9 }}>Platform Subscription Proposal</h2>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1.1rem', margin: '0 0 0.5rem 0', opacity: 0.8 }}>Prepared for the Barbados Surfing Association</p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1rem', margin: '0 0 3rem 0', opacity: 0.7 }}>By Tradewind — March 2026</p>
            <div style={{ background: 'rgba(43,165,160,0.2)', border: '1px solid #2BA5A0', padding: '1rem 2rem', borderRadius: 8, display: 'inline-block' }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', margin: 0, color: '#2BA5A0' }}>BSA is invited as a Founding Partner on the Tradewind platform</p>
            </div>
          </div>
        </ScrollReveal>
        <button onClick={scrollToNext} style={{ position: 'absolute', bottom: '2rem', background: 'none', border: 'none', cursor: 'pointer', animation: 'bounce 2s infinite' }}>
          <div style={{ width: 0, height: 0, borderLeft: '20px solid transparent', borderRight: '20px solid transparent', borderTop: '20px solid #FFFFFF', opacity: 0.6 }} />
        </button>
      </section>

      <WaveDivider />

      {/* SECTION 2 - WHAT IS TRADEWIND */}
      <section id="platform-section" style={{ background: '#FFFFFF', color: '#0A2540', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', color: '#2BA5A0', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem 0' }}>THE PLATFORM</p>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '3rem', fontWeight: 700, margin: '0 0 1.5rem 0' }}>The Digital Platform For Surf Organizations</h2>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1.15rem', opacity: 0.75, maxWidth: 700, margin: '0 auto', lineHeight: 1.7 }}>
                Tradewind is a subscription platform purpose-built for surf federations, national bodies, and surf clubs. Everything your organization needs — website, athlete management, competition results, live streaming, communications, and administration — in one managed service.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', maxWidth: 800, margin: '0 auto' }} className="grid-responsive-3">
              {[
                { num: '20+', label: 'Admin Pages' },
                { num: '16', label: 'Public Pages' },
                { num: '11', label: 'Data Systems' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', padding: '1.5rem', background: '#F9FAFB', borderRadius: 12, border: '1px solid #E5E7EB' }}>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '2rem', fontWeight: 700, color: '#0A2540' }}>{s.num}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <WaveDivider />

      {/* SECTION 3 - FEATURES */}
      <section style={{ background: '#0A2540', color: '#FFFFFF', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', color: '#2BA5A0', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem 0' }}>FEATURES</p>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '3rem', fontWeight: 700, margin: 0 }}>Everything Your Federation Needs</h2>
            </div>
          </ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
            {featureCards.map((f, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ height: 280, overflow: 'hidden' }}>
                    <img src={f.image} alt={f.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.3rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: '#fff' }}>{f.title}</h3>
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1rem', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>{f.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider />

      {/* SECTION 4 - MOBILE */}
      <section style={{ background: '#FFFFFF', color: '#0A2540', padding: '6rem 2rem', textAlign: 'center' }}>
        <ScrollReveal>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', color: '#2BA5A0', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem 0' }}>MOBILE FIRST</p>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '3rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Native-Feel Experience</h2>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1.2rem', opacity: 0.7, maxWidth: 500, margin: '0 auto 3rem auto' }}>Designed for how people actually browse — on their phones.</p>
        </ScrollReveal>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {mobileImages.map((img, i) => (
            <ScrollReveal key={i} delay={i * 200}>
              <div style={{ transform: `rotate(${(i - 1) * 3}deg)` }}>
                <img src={img} alt={`Mobile ${i + 1}`} style={{ width: 260, height: 'auto', borderRadius: 20, border: '4px solid #2BA5A0', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }} />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <WaveDivider />

      {/* SECTION 5 - INFRASTRUCTURE */}
      <section style={{ background: '#0A2540', color: '#FFFFFF', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', color: '#2BA5A0', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem 0' }}>UNDER THE HOOD</p>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '3rem', fontWeight: 700, margin: 0 }}>Enterprise-Grade Infrastructure</h2>
            </div>
          </ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {techCards.map((c, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.5rem' }}>
                  <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: '#2BA5A0' }}>{c.title}</h3>
                  <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>{c.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider />

      {/* SECTION 6 - MARKET VALUE */}
      <section style={{ background: '#FFFFFF', color: '#0A2540', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', color: '#2BA5A0', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem 0' }}>MARKET COMPARISON</p>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '3rem', fontWeight: 700, margin: 0 }}>What This Would Normally Cost</h2>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div style={{ background: '#0A2540', borderRadius: 12, padding: '2rem', marginBottom: '3rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
                    {['Solution', 'Build Cost', 'Ongoing'].map(h => (
                      <th key={h} style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1rem', fontWeight: 600, textAlign: h === 'Solution' ? 'left' : 'right', padding: '1rem 0', color: '#fff' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Custom agency build', 'USD 10,000+', 'USD 200-500/mo'],
                    ['Agency maintenance only', '—', 'USD 200-500/mo'],
                    ['WordPress + plugins', 'USD 2,000-5,000', 'USD 50-100/mo'],
                    ['Squarespace / Wix', '—', 'USD 30-50/mo'],
                  ].map(([sol, build, ongoing], i) => (
                    <tr key={i} style={{ borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                      <td style={{ fontFamily: 'DM Sans, sans-serif', padding: '1rem 0', color: '#fff' }}>{sol}</td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', padding: '1rem 0', textAlign: 'right', color: build === '—' ? '#6B7280' : '#fff' }}>{build}</td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', padding: '1rem 0', textAlign: 'right', color: '#fff' }}>{ongoing}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2.5rem', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem', color: '#6B7280', textDecoration: 'line-through', margin: '0 0 0.25rem 0' }}>USD 10,000+ build</p>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem', color: '#6B7280', textDecoration: 'line-through', margin: 0 }}>USD 300/mo maintenance</p>
              </div>
              <div style={{ fontSize: '2rem', color: '#2BA5A0' }}>→</div>
              <div style={{ background: '#2BA5A0', padding: '2rem 3rem', borderRadius: 12, textAlign: 'center', color: '#fff' }}>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 0.5rem 0', opacity: 0.8 }}>Tradewind Pro</p>
                <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '2rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>USD 0 build cost</p>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem', margin: 0, opacity: 0.9 }}>from USD 150/mo subscription</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <WaveDivider />

      {/* SECTION 7 - PRICING */}
      <section style={{ background: '#0A2540', color: '#FFFFFF', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', color: '#2BA5A0', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem 0' }}>SUBSCRIPTION PLANS</p>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '3rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Choose Your Plan</h2>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1.1rem', opacity: 0.7, maxWidth: 500, margin: '0 auto' }}>No build costs. No lock-in. Every plan includes hosting, maintenance, and continuous updates.</p>
            </div>
          </ScrollReveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }} className="grid-responsive-3">
            {[
              { name: 'Starter', price: '150', sub: 'per month', features: ['Branded website + custom domain', 'Athlete registry (up to 100)', 'Competition results sync', 'Season rankings', 'News & articles CMS', 'Contact form + inbox', 'Admin dashboard', 'Email support'], highlight: false },
              { name: 'Pro', price: '350', sub: 'per month', badge: 'Recommended for BSA', features: ['Everything in Starter', 'Unlimited athletes', 'Surf forecast engine', 'Live stream + VOD library', 'WhatsApp communications', 'Athlete portal + claims', 'Junior programme management', 'Score overlays', 'Event check-in scanner', 'Priority support'], highlight: true },
              { name: 'Elite', price: '750', sub: 'per month', features: ['Everything in Pro', 'HeatSync competition mgmt', 'ISA judge panel system', 'Apple Watch integration', 'AI judge co-pilot', 'Custom feature dev (2hrs/mo)', 'Dedicated account manager'], highlight: false },
            ].map((plan, i) => (
              <ScrollReveal key={plan.name} delay={i * 150}>
                <div style={{
                  background: plan.highlight ? 'rgba(43,165,160,0.08)' : 'rgba(255,255,255,0.03)',
                  border: plan.highlight ? '2px solid #2BA5A0' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16, padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column',
                  position: 'relative',
                }}>
                  {plan.badge && (
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#2BA5A0', color: '#fff', padding: '4px 16px', borderRadius: 20, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{plan.badge}</div>
                  )}
                  <div style={{ textAlign: 'center', marginBottom: '1.5rem', paddingTop: plan.badge ? 8 : 0 }}>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#2BA5A0', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 0.5rem 0' }}>{plan.name}</p>
                    <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '2.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 400, opacity: 0.6 }}>USD </span>{plan.price}
                    </p>
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0.25rem 0 0 0' }}>{plan.sub}</p>
                  </div>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 0 1.5rem 0' }} />
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
                        <span style={{ color: '#2BA5A0', fontSize: 14, lineHeight: 1.4, flexShrink: 0 }}>+</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={400}>
            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Pay annually and get 2 months free. Setup fees: Starter $250 / Pro $500 / Elite $1,500.</p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <WaveDivider />

      {/* SECTION 8 - BSA FOUNDING PARTNER */}
      <section style={{ background: '#FFFFFF', color: '#0A2540', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', color: '#2BA5A0', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem 0' }}>FOR BSA</p>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '3rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Founding Partner Offer</h2>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1.15rem', opacity: 0.7, maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
                As the first organization on the Tradewind platform, the BSA receives a permanently locked founding rate and input into the product roadmap. Every feature we build for any federation, you get too.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div style={{ maxWidth: 500, margin: '0 auto 3rem auto', border: '2px solid #2BA5A0', borderRadius: 16, padding: '2.5rem', textAlign: 'center', background: 'rgba(43,165,160,0.02)' }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#2BA5A0', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 0.5rem 0' }}>BSA Founding Rate — Pro Tier</p>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '3.5rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: '#0A2540' }}>BDS$ 5,000</p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1rem', color: '#6B7280', margin: '0 0 1.5rem 0' }}>per year — locked rate for founding partners</p>
              <div style={{ height: 1, background: '#E5E7EB', margin: '0 0 1.5rem 0' }} />
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
                Full Pro tier features. Standard Pro rate is USD $350/mo ($4,200/yr).
                BSA founding rate: BDS$ 5,000/yr — a permanent discount, locked as long as the subscription is active.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.5rem', fontWeight: 600, textAlign: 'center', margin: '0 0 1.5rem 0', color: '#0A2540' }}>What's Included</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.5rem 2rem' }}>
              {includedFeatures.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', padding: '0.4rem 0', fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem', color: '#374151' }}>
                  <Dot />{f}
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <WaveDivider />

      {/* SECTION 9 - HOW IT WORKS */}
      <section style={{ background: '#0A2540', color: '#FFFFFF', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', color: '#2BA5A0', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem 0' }}>HOW IT WORKS</p>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '3rem', fontWeight: 700, margin: 0 }}>Managed Platform, Not a Project</h2>
            </div>
          </ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {[
              { title: 'Tradewind Manages', description: 'Infrastructure, hosting, maintenance, security, data pipelines, feature development, and platform updates.' },
              { title: 'Your Organization Provides', description: 'Event schedules, news content, committee decisions, and feedback. You run the sport — we run the tech.' },
              { title: 'Continuous Improvement', description: 'Every feature built for any organization on the platform benefits all subscribers. The platform only gets better.' },
            ].map((c, i) => (
              <ScrollReveal key={i} delay={i * 200}>
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(43,165,160,0.25)', borderRadius: 12, padding: '2rem', textAlign: 'center' }}>
                  <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.4rem', fontWeight: 600, margin: '0 0 0.75rem 0', color: '#2BA5A0' }}>{c.title}</h3>
                  <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1rem', color: '#fff', margin: 0, lineHeight: 1.6, opacity: 0.85 }}>{c.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider />

      {/* SECTION 10 - ONBOARDING */}
      <section style={{ background: '#FFFFFF', color: '#0A2540', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', color: '#2BA5A0', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1rem 0' }}>GETTING STARTED</p>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '3rem', fontWeight: 700, margin: 0 }}>What Happens Next</h2>
            </div>
          </ScrollReveal>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '2rem', top: 0, bottom: 0, width: 2, background: '#E5E7EB' }} />
            {onboardingSteps.map((step, i) => (
              <ScrollReveal key={i} delay={i * 150}>
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '2.5rem', position: 'relative' }}>
                  <div style={{ width: '4rem', height: '4rem', background: '#2BA5A0', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.2rem', fontWeight: 700, marginRight: '2rem', flexShrink: 0, position: 'relative', zIndex: 1 }}>{i + 1}</div>
                  <div style={{ flex: 1, paddingTop: '0.5rem' }}>
                    <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.3rem', fontWeight: 600, margin: '0 0 0.4rem 0', color: '#0A2540' }}>{step.title}</h3>
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>{step.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider />

      {/* SECTION 11 - CTA */}
      <section style={{ background: '#0A2540', color: '#FFFFFF', padding: '6rem 2rem', textAlign: 'center' }}>
        <ScrollReveal>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '3rem', fontWeight: 700, margin: '0 0 1.5rem 0' }}>Ready to Get Started?</h2>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1.15rem', margin: '0 0 2.5rem 0', opacity: 0.85, lineHeight: 1.6 }}>
              Join as a founding partner on the Tradewind platform. Your organization deserves professional digital infrastructure.
            </p>
            <div style={{ background: 'rgba(43,165,160,0.1)', border: '2px solid #2BA5A0', borderRadius: 12, padding: '2rem', marginBottom: '2.5rem' }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.2rem', margin: '0 0 0.75rem 0', color: '#2BA5A0' }}>paew82@gmail.com</p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1rem', margin: '0 0 0.25rem 0', opacity: 0.8 }}>Tradewind — Barbados</p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', margin: 0, opacity: 0.6 }}>Prepared March 2026</p>
            </div>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', opacity: 0.5, fontStyle: 'italic' }}>This proposal is confidential and intended for the Barbados Surfing Association committee.</p>
          </div>
        </ScrollReveal>
      </section>

      <style jsx>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  )
}
