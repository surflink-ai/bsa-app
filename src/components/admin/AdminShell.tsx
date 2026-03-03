'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { ReactNode } from 'react'

interface AdminUser { full_name?: string | null; email?: string; role?: string | null }

export function AdminShell({ admin, children }: { admin: AdminUser | null; children: ReactNode }) {
  const pathname = usePathname()
  if (pathname === '/admin/login') return <div style={{ fontFamily: "'DM Sans', sans-serif" }}>{children}</div>

  if (admin) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: 'var(--admin-bg)', minHeight: '100vh' }}>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar userName={admin.full_name || admin.email} userRole={admin.role || 'admin'} />
          <main className="admin-main">
            {children}
          </main>
        </div>
      </div>
    )
  }

  return <div style={{ fontFamily: "'DM Sans', sans-serif" }}>{children}</div>
}
