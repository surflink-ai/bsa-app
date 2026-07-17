import { headers } from 'next/headers'
import { getAdminUser, requireAdmin } from '@/lib/supabase/admin'
import { AdminShell } from '@/components/admin/AdminShell'

export const metadata = { title: 'BSA Admin' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get('x-pathname') || ''
  const isLogin = pathname === '/admin/login' || pathname.endsWith('/admin/login')

  // The login page must render without an admin session. Every other admin
  // route requires a verified admin — redirects to /admin/login otherwise.
  const admin = isLogin ? await getAdminUser() : await requireAdmin()

  return (
    <AdminShell admin={admin}>
      {children}
    </AdminShell>
  )
}
