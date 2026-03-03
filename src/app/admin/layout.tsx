import { getAdminUser } from '@/lib/supabase/admin'
import { Sidebar } from '@/components/admin/Sidebar'

export const metadata = { title: 'BSA Admin' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser()

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: '#F7F8FA', minHeight: '100vh' }}>
      {admin ? (
        <div className="flex min-h-screen">
          <Sidebar userName={admin.full_name || admin.email} userRole={admin.role || 'admin'} />
          <main className="flex-1 md:ml-[220px]">
            <div className="max-w-[1200px] mx-auto px-5 py-6 md:px-8 md:py-8">
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
