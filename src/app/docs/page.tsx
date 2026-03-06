import Link from 'next/link'

export const metadata = {
  title: 'Documentation — BSA',
  description: 'Documentation and resources for the Barbados Surfing Association.',
}

export default function DocsPage() {
  return (
    <div className="pb-20 md:pb-0" style={{ minHeight: '100vh', background: '#0A2540', padding: '140px 24px 80px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: 16 }}>RESOURCES</div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 42, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
          Documentation
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 48, lineHeight: 1.6 }}>
          Resources and information for the Barbados Surfing Association.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { href: '/events', title: 'Competition Events', desc: 'View upcoming and past BSA-sanctioned events, results, and division standings.' },
            { href: '/rankings', title: 'Rankings & Standings', desc: 'Current SOTY season rankings and historical series standings.' },
            { href: '/surf-report', title: 'Surf Report', desc: 'Real-time conditions across 21 Barbados surf spots, updated every 15 minutes.' },
            { href: '/athletes', title: 'Athlete Registry', desc: 'All registered BSA athletes with competition history and event appearances.' },
            { href: '/contact', title: 'Contact & Membership', desc: 'Get in touch about membership, sponsorship, coaching, or media inquiries.' },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12, padding: '24px 28px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{item.title}</h2>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{item.desc}</p>
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2BA5A0' }}>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
