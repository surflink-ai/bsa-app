'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV: { section?: string; label: string; href: string }[] = [
  { label: 'Dashboard', href: '/admin' },
  { section: 'Content', label: 'Articles', href: '/admin/articles' },
  { section: 'Content', label: 'Photos', href: '/admin/photos' },
  { section: 'Events', label: 'Live Stream', href: '/admin/stream' },
  { section: 'Events', label: 'Polls', href: '/admin/polls' },
  { section: 'People', label: 'Champions', href: '/admin/champions' },
  { section: 'People', label: 'Coaches', href: '/admin/coaches' },
  { section: 'People', label: 'Users', href: '/admin/users' },
  { section: 'Data', label: 'Surf Spots', href: '/admin/spots' },
  { section: 'Data', label: 'Sponsors', href: '/admin/sponsors' },
  { section: 'System', label: 'Notifications', href: '/admin/notifications' },
  { section: 'System', label: 'Settings', href: '/admin/settings' },
]

export function Sidebar({ userName, userRole }: { userName?: string; userRole?: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const isActive = (href: string) => href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
  let lastSection = ''

  const sidebar = (
    <div style={{
      width: 260,
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      background: '#0A2540',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 40,
    }}>
      {/* Header */}
      <div style={{ padding: '28px 28px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/admin" style={{ textDecoration: 'none' }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const }}>
            Admin Panel
          </div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 4, letterSpacing: '0.02em' }}>
            Barbados Surfing<br />Association
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        {NAV.map((item) => {
          const showSection = item.section && item.section !== lastSection
          if (item.section) lastSection = item.section
          const active = isActive(item.href)

          return (
            <div key={item.href}>
              {showSection && (
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase' as const,
                  color: 'rgba(255,255,255,0.2)',
                  padding: '20px 28px 8px',
                }}>
                  {item.section}
                </div>
              )}
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  display: 'block',
                  padding: '10px 28px',
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                  textDecoration: 'none',
                  borderLeft: active ? '3px solid #2BA5A0' : '3px solid transparent',
                  background: active ? 'rgba(43,165,160,0.08)' : 'transparent',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                {item.label}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '20px 28px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{userName || 'Admin'}</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginTop: 2 }}>
          {userRole || 'Admin'}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
          <form action="/admin/logout" method="POST" style={{ margin: 0 }}>
            <button type="submit" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'DM Sans', sans-serif" }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
              Sign out
            </button>
          </form>
          <Link href="/" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
            View site
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', top: 16, left: 16, zIndex: 50,
          background: '#0A2540', color: '#fff', border: 'none',
          width: 40, height: 40, borderRadius: 4, cursor: 'pointer',
          fontSize: 18, fontWeight: 700, display: 'none',
        }}
        className="md:!hidden !flex items-center justify-center"
      >
        {open ? '\u00D7' : '\u2261'}
      </button>

      {/* Mobile overlay */}
      {open && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 30 }} className="md:hidden" onClick={() => setOpen(false)} />}

      {/* Desktop sidebar always visible, mobile toggle */}
      <div className={`hidden md:block`}>{sidebar}</div>
      {open && <div className="md:hidden">{sidebar}</div>}
    </>
  )
}
