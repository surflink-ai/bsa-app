import Link from 'next/link'

const footerLinks = [
  {
    title: 'Competition',
    links: [
      { href: '/events', label: 'Events' },
      { href: '/rankings', label: 'Rankings' },
      { href: '/athletes', label: 'Athletes' },
      { href: '/stream', label: 'Live Stream' },
      { href: '/history', label: 'History' },
    ],
  },
  {
    title: 'Information',
    links: [
      { href: '/surf-report', label: 'Surf Report' },
      { href: '/juniors', label: 'Juniors Programme' },
      { href: '/news', label: 'News' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Connect',
    links: [
      { href: 'https://www.instagram.com/barbadossurfingassociation/', label: 'Instagram', external: true },
      { href: 'https://www.facebook.com/bsasurf/', label: 'Facebook', external: true },
      { href: 'mailto:admin@bsa.surf', label: 'Email', external: true },
    ],
  },
]

export function Footer() {
  return (
    <footer className="hidden md:block" style={{ backgroundColor: '#0A2540', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 32px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 40 }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <img src="/bsa-logo.webp" alt="BSA" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: '#fff' }}>BSA</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, maxWidth: 280 }}>
              The National Governing Body for Surfing in Barbados. ISA Member Federation since 1995.
            </p>

          </div>

          {/* Link columns */}
          {footerLinks.map(col => (
            <div key={col.title}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2BA5A0', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>{col.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(link => (
                  'external' in link ? (
                    <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none',
                    }}>{link.label}</a>
                  ) : (
                    <Link key={link.href} href={link.href} style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none',
                    }}>{link.label}</Link>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
            &copy; 2026 Barbados Surfing Association
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>
            EST. 1995 &middot; ISA Member Federation
          </span>
        </div>
      </div>
    </footer>
  )
}
