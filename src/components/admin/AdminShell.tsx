'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'

interface AdminUser {
  full_name?: string | null
  email?: string
  role?: string | null
}

export function AdminShell({ admin, children }: { admin: AdminUser | null; children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'

  // Login page — no sidebar, no wrapper
  if (isLoginPage) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {children}
      </div>
    )
  }

  // Authenticated admin — full layout
  if (admin) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: '#F7F8FA', minHeight: '100vh' }}>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar userName={admin.full_name || admin.email} userRole={admin.role || 'admin'} />
          <main className="md:ml-[260px] ml-0" style={{ flex: 1 }}>
            <div style={{ padding: '32px 40px', maxWidth: 1280, margin: '0 auto' }}>
              {children}
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Not authenticated, not login page — will redirect via requireAdmin()
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {children}
    </div>
  )
}
