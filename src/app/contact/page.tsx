import { Metadata } from 'next'
import Link from 'next/link'
import { WaveDivider } from '../components/WaveDivider'

export const metadata: Metadata = {
  title: 'Contact — Barbados Surfing Association',
  description: 'Get in touch with the Barbados Surfing Association. Membership, sponsorship, events, and general inquiries.',
}

export default function ContactPage() {
  return (
    <div className="pb-20 md:pb-0">
      {/* Hero */}
      <section style={{ backgroundColor: '#0A2540', padding: '140px 24px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: 16 }}>CONTACT</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#fff', marginBottom: 12 }}>Get in Touch</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', maxWidth: 500, lineHeight: 1.6 }}>
            Whether you want to compete, sponsor, coach, or volunteer — we want to hear from you.
          </p>
        </div>
      </section>

      <WaveDivider color="#FFFFFF" bg="#0A2540" />

      {/* Content */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }} className="grid-responsive-2">
            {/* Left — Contact methods */}
            <div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 24, color: '#0A2540', marginBottom: 32 }}>Reach Us</h2>
              
              {[
                { label: 'EMAIL', value: 'admin@bsa.surf', href: 'mailto:admin@bsa.surf' },
                { label: 'INSTAGRAM', value: '@barbadossurfingassociation', href: 'https://www.instagram.com/barbadossurfingassociation/' },
                { label: 'FACEBOOK', value: 'BSA Surf', href: 'https://www.facebook.com/bsasurf/' },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: 28 }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2BA5A0', letterSpacing: '0.15em', marginBottom: 8 }}>{item.label}</div>
                  <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" style={{
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 500,
                    color: '#0A2540', textDecoration: 'none', borderBottom: '1px solid rgba(10,37,64,0.1)',
                    paddingBottom: 2,
                  }}>{item.value}</a>
                </div>
              ))}

              <div style={{ marginTop: 48 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2BA5A0', letterSpacing: '0.15em', marginBottom: 12 }}>AFFILIATED WITH</div>
                <p style={{ fontSize: 14, color: 'rgba(26,26,26,0.5)', lineHeight: 1.7 }}>
                  International Surfing Association (ISA)<br />
                  Pan American Surf Association<br />
                  Caribbean Surfing Association
                </p>
              </div>
            </div>

            {/* Right — Inquiry types */}
            <div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 24, color: '#0A2540', marginBottom: 32 }}>How Can We Help?</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { title: 'Compete', desc: 'Register for upcoming BSA-sanctioned events and get on the competitive pathway. All skill levels welcome from groms to open division.', link: '/events', linkText: 'View Events' },
                  { title: 'Sponsorship', desc: 'Partner with the BSA to reach the Barbados surf community. Event naming rights, athlete sponsorship, and brand visibility opportunities.', link: 'mailto:admin@bsa.surf?subject=Sponsorship%20Inquiry', linkText: 'Email Us' },
                  { title: 'Coaching', desc: 'Interested in coaching with the BSA or getting your athletes into our development programme? We work with coaches at all levels.', link: 'mailto:admin@bsa.surf?subject=Coaching%20Inquiry', linkText: 'Email Us' },
                  { title: 'Membership', desc: 'Become a BSA member to receive event discounts, voting rights at the AGM, and eligibility for national team selection.', link: 'mailto:admin@bsa.surf?subject=Membership%20Inquiry', linkText: 'Email Us' },
                  { title: 'Media', desc: 'Press inquiries, photo/video usage requests, and interview requests for BSA athletes or events.', link: 'mailto:admin@bsa.surf?subject=Media%20Inquiry', linkText: 'Email Us' },
                ].map(item => (
                  <div key={item.title} style={{ borderLeft: '2px solid #2BA5A0', paddingLeft: 20, paddingBottom: 4 }}>
                    <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 16, color: '#0A2540', marginBottom: 6 }}>{item.title}</h3>
                    <p style={{ fontSize: 13, color: 'rgba(26,26,26,0.5)', lineHeight: 1.6, marginBottom: 8 }}>{item.desc}</p>
                    <a href={item.link} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#1478B5', textDecoration: 'none', fontWeight: 600 }}>{item.linkText} →</a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
