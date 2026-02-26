'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/#about', label: 'About' },
  { href: '/events', label: 'Events' },
  { href: '/athletes', label: 'Athletes' },
  { href: '/rankings', label: 'Rankings' },
]

const MOBILE_TABS = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/events', label: 'Events', icon: '🏆' },
  { href: '/athletes', label: 'Athletes', icon: '🏄' },
  { href: '/rankings', label: 'Rankings', icon: '📊' },
  { href: '/profile', label: 'More', icon: '☰' },
]

export function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === '/'

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Desktop Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 hidden md:block"
        style={{
          backgroundColor: scrolled || !isHome ? 'rgba(10,37,64,0.95)' : 'transparent',
          backdropFilter: scrolled || !isHome ? 'blur(12px)' : 'none',
          boxShadow: scrolled || !isHome ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="https://liveheats.com/images/dbb2a21b-7566-4629-8ea5-4c08a0b2877b.webp"
              alt="BSA Logo"
              className="rounded-full"
            />
            <span className="font-heading font-bold text-sm tracking-wide" style={{ color: '#ffffff' }}>BSA</span>
          </Link>

          <div className="flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors hover:text-white"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="https://www.liveheats.com/organisations/BarbadosSurfingAssociation"
              target="_blank"
              className="text-sm font-semibold px-5 py-2 rounded-full transition-colors hover:opacity-80"
              style={{ backgroundColor: '#1478B5', color: '#ffffff' }}
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-bottom" style={{ backgroundColor: '#ffffff', borderTop: '1px solid rgba(26,26,26,0.1)' }}>
        <div className="flex items-center justify-around h-16">
          {MOBILE_TABS.map(tab => {
            const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center gap-0.5 text-xs font-medium transition-colors"
                style={{ color: isActive ? '#1478B5' : 'rgba(26,26,26,0.4)' }}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
