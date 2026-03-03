import { requireAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/admin/DashboardClient'

export default async function AdminDashboard() {
  const admin = await requireAdmin()
  const supabase = await createClient()

  const [articlesRes, sponsorsRes, championsRes, pollsRes, streamRes] = await Promise.all([
    supabase.from('articles').select('id, title, published, category, published_at, created_at').order('created_at', { ascending: false }).limit(8),
    supabase.from('sponsors').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('champions').select('id', { count: 'exact', head: true }),
    supabase.from('fan_polls').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('stream_config').select('active').limit(1).single(),
  ])

  return (
    <DashboardClient
      adminName={admin.full_name || admin.email || 'Admin'}
      articles={articlesRes.data || []}
      stats={{
        articles: articlesRes.data?.length || 0,
        sponsors: sponsorsRes.count || 0,
        champions: championsRes.count || 0,
        polls: pollsRes.count || 0,
      }}
      streamActive={streamRes.data?.active || false}
    />
  )
}
