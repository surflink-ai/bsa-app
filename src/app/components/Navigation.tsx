'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { HomeIcon, CalendarIcon, UsersIcon, TrophyIcon, MenuIcon, XIcon, WaveIcon } from './Icons'

const links = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/athletes', label: 'Athletes' },
  { href: '/rankings', label: 'Rankings' },
]

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', h, { passive: true })
    h()
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <>
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: scrolled ? 'rgba(10, 37, 64, 0.97)' : 'transparent', backdropFilter: scrolled ? 'blur(12px)' : 'none', transition: 'background 0.4s', borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4.5rem' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div style={{ color: '#2BA5A0' }}><WaveIcon size={28} /></div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.25rem', color: '#fff', letterSpacing: '-0.02em' }}>BSA</span>
          </Link>
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: '2.5rem' }}>
            {links.map(l => <Link key={l.href} href={l.href} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l.label}</Link>)}
            <a href="https://liveheats.com/BarbadosSurfingAssociation" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8125rem', fontWeight: 600, color: '#fff', background: '#1478B5', padding: '0.5rem 1.25rem', borderRadius: '6px', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Register</a>
          </div>
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.5rem' }}>{mobileOpen ? <XIcon /> : <MenuIcon />}</button>
        </div>
        {mobileOpen && (
          <div className="md:hidden" style={{ background: 'rgba(10, 37, 64, 0.98)', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '1rem 2rem 1.5rem' }}>
            {links.map(l => <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} style={{ display: 'block', padding: '0.75rem 0', color: 'rgba(255,255,255,0.8)', fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{l.label}</Link>)}
          </div>
        )}
      </nav>
      <div className="md:hidden" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(10, 37, 64, 0.98)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '64px', paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
        {[{ href: '/', label: 'Home', Icon: HomeIcon }, { href: '/events', label: 'Events', Icon: CalendarIcon }, { href: '/athletes', label: 'Athletes', Icon: UsersIcon }, { href: '/rankings', label: 'Rankings', Icon: TrophyIcon }].map(({ href, label, Icon }) => (
          <Link key={href} href={href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '0.625rem', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em' }}><Icon size={20} />{label}</Link>
        ))}
      </div>
    </>
  )
}
