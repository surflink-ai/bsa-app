import { getAdminUser } from '@/lib/supabase/admin'
import { Sidebar } from '@/components/admin/Sidebar'

export const metadata = { title: 'BSA Admin' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser()

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: '#F7F8FA', minHeight: '100vh' }}>
      {admin ? (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar userName={admin.full_name || admin.email} userRole={admin.role || 'admin'} />
          <main style={{ flex: 1, marginLeft: 260 }} className="md:ml-[260px] ml-0">
            <div style={{ padding: '32px 40px', maxWidth: 1280, margin: '0 auto' }}>
              {children}
            </div>
          </main>
        </div>
      ) : (
        <>{children}</>
      )}
    </div>
  )
}
