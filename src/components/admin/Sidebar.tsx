'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NavItem {
  label: string
  href: string
  section?: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Articles', href: '/admin/articles', section: 'Content' },
  { label: 'Photos', href: '/admin/photos', section: 'Content' },
  { label: 'Live Stream', href: '/admin/stream', section: 'Events' },
  { label: 'Polls', href: '/admin/polls', section: 'Events' },
  { label: 'Champions', href: '/admin/champions', section: 'People' },
  { label: 'Coaches', href: '/admin/coaches', section: 'People' },
  { label: 'Users', href: '/admin/users', section: 'People' },
  { label: 'Surf Spots', href: '/admin/spots', section: 'Data' },
  { label: 'Sponsors', href: '/admin/sponsors', section: 'Data' },
  { label: 'Notifications', href: '/admin/notifications', section: 'System' },
  { label: 'Settings', href: '/admin/settings', section: 'System' },
]

export function Sidebar({ userName, userRole }: { userName?: string; userRole?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  let lastSection = ''

  const navContent = (
    <>
      {/* Wordmark */}
      <div className="px-5 pt-6 pb-5">
        <Link href="/admin" className="block">
          <span
            className="text-[15px] font-semibold text-white tracking-[0.08em] uppercase"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            BSA
          </span>
          <span className="block text-[10px] text-white/30 tracking-[0.15em] uppercase mt-0.5"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Admin Panel
          </span>
        </Link>
      </div>

      <div className="h-px bg-white/[0.06] mx-4" />

      {/* Nav */}
      <nav className="flex-1 px-3 pt-4 pb-4 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const showSection = item.section && item.section !== lastSection
          if (item.section) lastSection = item.section
          const active = isActive(item.href)

          return (
            <div key={item.href}>
              {showSection && (
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 mt-5 mb-2 px-3"
                   style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {item.section}
                </p>
              )}
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block relative text-[13px] transition-colors"
                style={{
                  padding: '7px 12px 7px 14px',
                  color: active ? '#2BA5A0' : 'rgba(255,255,255,0.45)',
                  fontWeight: active ? 500 : 400,
                  borderLeft: active ? '2px solid #2BA5A0' : '2px solid transparent',
                  marginLeft: '2px',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')
                }}
              >
                {item.label}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* User + Sign Out */}
      <div className="border-t border-white/[0.06] px-5 py-4">
        {userName && (
          <div className="mb-3">
            <p className="text-[12px] text-white/60 truncate">{userName}</p>
            {userRole && (
              <p className="text-[10px] text-white/25 mt-0.5 capitalize"
                 style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {userRole.replace('_', ' ')}
              </p>
            )}
          </div>
        )}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSignOut}
            className="text-[11px] text-white/25 hover:text-white/50 transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Sign out
          </button>
          <Link
            href="/"
            className="text-[11px] text-white/25 hover:text-white/50 transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            View site
          </Link>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 w-8 h-8 flex items-center justify-center"
        style={{ backgroundColor: '#0A2540', color: '#fff', borderRadius: '4px' }}
      >
        <span className="text-[13px]">{mobileOpen ? '\u00D7' : '\u2261'}</span>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-30" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 flex flex-col transform transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
        style={{
          width: 220,
          backgroundColor: '#0A2540',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {navContent}
      </aside>
    </>
  )
}
