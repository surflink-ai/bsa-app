import { getAdminUser } from '@/lib/supabase/admin'
import { Sidebar } from '@/components/admin/Sidebar'
import { redirect } from 'next/navigation'

export const metadata = { title: 'BSA Admin' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Check if this is the login page — don't require auth
  // The layout wraps login too, so we handle it gracefully
  const admin = await getAdminUser()

  // If not authenticated, only allow the login page through
  // The individual pages handle their own auth redirects

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#F8F9FA]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {admin ? (
          <div className="flex min-h-screen">
            <Sidebar userName={admin.full_name || admin.email} />
            <main className="flex-1 md:ml-64 p-6 md:p-8">
              {children}
            </main>
          </div>
        ) : (
          <main className="min-h-screen">
            {children}
          </main>
        )}
      </body>
    </html>
  )
}
