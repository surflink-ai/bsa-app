'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV: { section?: string; label: string; href: string }[] = [
  { label: 'Dashboard', href: '/admin' },
  { section: 'Content', label: 'Articles', href: '/admin/articles' },
  { section: 'Content', label: 'Photos', href: '/admin/photos' },
  { section: 'Events', label: 'Competitions', href: '/admin/compete' },
  { section: 'Events', label: 'Judges', href: '/admin/compete/judges' },
  { section: 'Events', label: 'Live Stream', href: '/admin/stream' },
  { section: 'Events', label: 'Polls', href: '/admin/polls' },
  { section: 'Comms', label: 'WhatsApp Blasts', href: '/admin/blasts' },
  { section: 'Comms', label: 'Contacts', href: '/admin/contacts' },
  { section: 'People', label: 'Champions', href: '/admin/champions' },
  { section: 'People', label: 'Coaches', href: '/admin/coaches' },
  { section: 'People', label: 'Users', href: '/admin/users' },
  { section: 'Data', label: 'Surf Spots', href: '/admin/spots' },
  { section: 'Data', label: 'Sponsors', href: '/admin/sponsors' },
  { section: 'System', label: 'Activity Log', href: '/admin/activity' },
  { section: 'System', label: 'Notifications', href: '/admin/notifications' },
  { section: 'System', label: 'Settings', href: '/admin/settings' },
]

export function Sidebar({ userName, userRole }: { userName?: string; userRole?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const isActive = (href: string) => href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  let lastSection = ''

  const content = (
    <div style={{
      width: 'var(--admin-sidebar)',
      height: '100vh',
      position: 'fixed',
      top: 0, left: 0,
      background: 'var(--admin-navy)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 40,
    }}>
      {/* Brand */}
      <div style={{ padding: '28px 28px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/admin" style={{ textDecoration: 'none' }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '0.02em', lineHeight: 1.2 }}>BSA</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.15em', color: 'var(--admin-teal)', textTransform: 'uppercase', marginTop: 4 }}>Admin</div>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {NAV.map(item => {
          const showSection = item.section && item.section !== lastSection
          if (item.section) lastSection = item.section
          const active = isActive(item.href)
          return (
            <div key={item.href}>
              {showSection && (
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.2)', padding: '20px 28px 8px',
                }}>
                  {item.section}
                </div>
              )}
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  display: 'block', padding: '10px 28px', fontSize: 14, fontWeight: active ? 600 : 400,
                  color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                  textDecoration: 'none',
                  borderLeft: active ? '3px solid var(--admin-teal)' : '3px solid transparent',
                  background: active ? 'rgba(43,165,160,0.06)' : 'transparent',
                  transition: 'all 0.12s ease',
                }}
              >
                {item.label}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* User */}
      <div style={{ padding: '20px 28px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{userName || 'Admin'}</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
          {(userRole || 'admin').replace('_', ' ')}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
          <button onClick={handleSignOut} style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'DM Sans', sans-serif" }}>
            Sign out
          </button>
          <Link href="/" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>
            View site
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <button onClick={() => setOpen(!open)} className="md:!hidden" style={{
        position: 'fixed', top: 16, left: 16, zIndex: 50,
        background: 'var(--admin-navy)', color: '#fff', border: 'none',
        width: 40, height: 40, borderRadius: 8, cursor: 'pointer', fontSize: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {open ? '\u00D7' : '\u2261'}
      </button>
      {open && <div className="md:hidden" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 30 }} onClick={() => setOpen(false)} />}
      <div className="hidden md:block">{content}</div>
      {open && <div className="md:hidden">{content}</div>}
    </>
  )
}
