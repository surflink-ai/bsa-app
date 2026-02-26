import Link from 'next/link'
import { WaveIcon } from './Icons'

export default function Footer() {
  return (
    <footer style={{ background: '#0A2540', color: 'rgba(255,255,255,0.6)', paddingBottom: '5rem' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '4rem 2rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ color: '#2BA5A0' }}><WaveIcon size={24} /></div>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.125rem', color: '#fff' }}>Barbados Surfing Association</span>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', lineHeight: 1.7, maxWidth: '280px' }}>Governing body for competitive surfing in Barbados. Developing talent, building community, riding waves since 2009.</p>
          </div>
          <div>
            <h4 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: '1.25rem' }}>Navigate</h4>
            {[{ href: '/events', label: 'Events' }, { href: '/athletes', label: 'Athletes' }, { href: '/rankings', label: 'Rankings' }].map(l => (
              <Link key={l.href} href={l.href} style={{ display: 'block', marginBottom: '0.75rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem' }}>{l.label}</Link>
            ))}
          </div>
          <div>
            <h4 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: '1.25rem' }}>Connect</h4>
            <a href="https://www.instagram.com/barbadossurfing/" target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginBottom: '0.75rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem' }}>Instagram</a>
            <a href="https://www.facebook.com/BarbadosSurfingAssociation/" target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginBottom: '0.75rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem' }}>Facebook</a>
          </div>
          <div>
            <h4 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: '1.25rem' }}>Contact</h4>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', lineHeight: 1.7 }}>Barbados Surfing Association<br />Bridgetown, Barbados</p>
            <a href="mailto:info@barbadossurfing.org" style={{ color: '#1478B5', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', marginTop: '0.5rem', display: 'inline-block' }}>info@barbadossurfing.org</a>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '3rem', paddingTop: '2rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.8125rem', color: 'rgba(255,255,255,0.3)' }}>2025 Barbados Surfing Association. All rights reserved.</div>
      </div>
    </footer>
  )
}
