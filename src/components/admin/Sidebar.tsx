'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: string
  section?: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: '📊' },
  { label: 'Articles', href: '/admin/articles', icon: '📝', section: 'Content' },
  { label: 'Photos', href: '/admin/photos', icon: '📷', section: 'Content' },
  { label: 'Live Stream', href: '/admin/stream', icon: '📺', section: 'Events' },
  { label: 'Polls', href: '/admin/polls', icon: '📊', section: 'Events' },
  { label: 'Champions', href: '/admin/champions', icon: '🏆', section: 'People' },
  { label: 'Coaches', href: '/admin/coaches', icon: '🏄', section: 'People' },
  { label: 'Users', href: '/admin/users', icon: '👥', section: 'People' },
  { label: 'Spots', href: '/admin/spots', icon: '🌊', section: 'Surf' },
  { label: 'Sponsors', href: '/admin/sponsors', icon: '🤝', section: 'Sponsors' },
  { label: 'Notifications', href: '/admin/notifications', icon: '🔔', section: 'Notifications' },
  { label: 'Settings', href: '/admin/settings', icon: '⚙️', section: 'Settings' },
]

export function Sidebar({ userName }: { userName?: string }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  let lastSection = ''

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-[#0A2540] text-white p-2 rounded-lg shadow-lg"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#0A2540] text-white z-40 transform transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="p-6 border-b border-white/10">
          <Link href="/admin" className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            BSA Admin
          </Link>
          {userName && (
            <p className="text-xs text-white/40 mt-1">{userName}</p>
          )}
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          {NAV_ITEMS.map((item) => {
            const showSection = item.section && item.section !== lastSection
            if (item.section) lastSection = item.section

            return (
              <div key={item.href}>
                {showSection && (
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mt-4 mb-2 px-3"
                     style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {item.section}
                  </p>
                )}
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive(item.href)
                      ? 'bg-[#2BA5A0]/20 text-[#2BA5A0]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </div>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <Link href="/" className="text-xs text-white/30 hover:text-white/60 transition-colors">
            ← Back to Site
          </Link>
        </div>
      </aside>
    </>
  )
}
