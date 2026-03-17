import Link from 'next/link'

export const metadata = {
  title: 'Documentation — BSA',
  description: 'Documentation and resources for the Barbados Surfing Association.',
}

const sections = [
  {
    label: 'COMPETITION',
    items: [
      { href: '/events', title: 'Competition Events', desc: 'Upcoming and past BSA-sanctioned events, dates, locations, and division listings.' },
      { href: '/rankings', title: 'Season Rankings', desc: 'Live SOTY points standings across all divisions, updated after each event.' },
      { href: '/results', title: 'Full Results', desc: 'Heat-by-heat breakdowns with individual wave scores, medal standings, and placements.' },
      { href: '/history', title: 'Hall of Champions', desc: 'Historical national champions across all divisions from 2022 to present.' },
    ],
  },
  {
    label: 'ATHLETES',
    items: [
      { href: '/athletes', title: 'Athlete Registry', desc: '129+ registered athletes with career stats, event appearances, head-to-head records, and shareable stat cards.' },
      { href: '/athlete/signup', title: 'Claim Your Profile', desc: 'Athletes can sign up, claim their profile, add bio, social links, sponsors, and manage their public page.' },
      { href: '/athlete/login', title: 'Athlete Portal Login', desc: 'Sign in to manage your claimed athlete profile, download stat cards, and share your results.' },
    ],
  },
  {
    label: 'LIVE',
    items: [
      { href: '/stream', title: 'Live Stream & VOD', desc: 'Watch live competition broadcasts with real-time score overlays. Event replays available when not live.' },
      { href: '/surf-report', title: 'Surf Report', desc: 'Real-time conditions across 21 Barbados surf spots from 7 data sources, updated every 15 minutes.' },
    ],
  },
  {
    label: 'INFORMATION',
    items: [
      { href: '/news', title: 'News & Articles', desc: 'Athlete spotlights, event recaps, announcements, and stories from the Barbados surf community.' },
      { href: '/juniors', title: 'Junior Development', desc: 'Coaching programmes, development pathway, schedules, and locations for junior surfers.' },
      { href: '/contact', title: 'Contact & Inquiries', desc: 'Get in touch about membership, sponsorship, coaching, media, or submit an inquiry via the contact form.' },
    ],
  },
  {
    label: 'ADMIN',
    items: [
      { href: '/admin', title: 'Admin Dashboard', desc: 'Committee login for managing articles, athletes, events, streaming, contacts, sponsors, and all platform settings.' },
      { href: '/admin/stream', title: 'Stream Management', desc: 'Control live broadcast source (YouTube/OBS/Cloudflare), VOD library, score overlay, and scheduling.' },
      { href: '/admin/compete', title: 'Competition Management', desc: 'HeatSync integration for ISA-compliant scoring, judge panels, and heat management. Coming soon.' },
      { href: '/admin/juniors', title: 'Junior Programmes', desc: 'Manage coaching programmes, schedules, locations, and age groups from the admin backend.' },
      { href: '/admin/blasts', title: 'WhatsApp Communications', desc: 'Template-based blast messaging to athletes, parents, and contacts with delivery tracking.' },
      { href: '/admin/inquiries', title: 'Inquiry Inbox', desc: 'View and manage submissions from the public contact form. Read, reply, and archive.' },
      { href: '/admin/activity', title: 'Activity Log', desc: 'Full audit trail of every admin action — who changed what, when, across the entire platform.' },
    ],
  },
]

export default function DocsPage() {
  return (
    <div className="pb-20 md:pb-0" style={{ minHeight: '100vh', background: '#0A2540', padding: '140px 24px 80px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: 16 }}>RESOURCES</div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 42, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
          Documentation
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 48, lineHeight: 1.6 }}>
          Everything the BSA platform offers — competition, athletes, streaming, coaching, communications, and administration.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {sections.map(section => (
            <div key={section.label}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600,
                letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)',
                marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                {section.label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {section.items.map(item => (
                  <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 12, padding: '20px 24px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{item.title}</h2>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
                      </div>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: '#2BA5A0', flexShrink: 0, marginLeft: 16 }}>→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
