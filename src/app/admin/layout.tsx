import { getAdminUser } from '@/lib/supabase/admin'
import { AdminShell } from '@/components/admin/AdminShell'

export const metadata = { title: 'BSA Admin' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser()

  return (
    <AdminShell admin={admin}>
      {children}
    </AdminShell>
  )
}
