import { requireAdmin } from '@/lib/supabase/admin'
import { DashboardCard } from '@/components/admin/DashboardCard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard() {
  const admin = await requireAdmin()
  const supabase = await createClient()

  // Fetch counts
  const [articlesRes, sponsorsRes, championsRes, pollsRes, streamRes] = await Promise.all([
    supabase.from('articles').select('id, title, published, created_at', { count: 'exact' }),
    supabase.from('sponsors').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('champions').select('id', { count: 'exact', head: true }),
    supabase.from('fan_polls').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('stream_config').select('active').limit(1).single(),
  ])

  const articleCount = articlesRes.count || 0
  const sponsorCount = sponsorsRes.count || 0
  const championCount = championsRes.count || 0
  const activePollCount = pollsRes.count || 0
  const streamActive = streamRes.data?.active || false
  const recentArticles = (articlesRes.data || []).slice(0, 5)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Dashboard
        </h1>
        <p className="text-sm text-gray-400 mt-1">Welcome back, {admin.full_name || admin.email}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <DashboardCard title="Articles" value={articleCount} icon="📝" />
        <DashboardCard title="Sponsors" value={sponsorCount} subtitle="Active" icon="🤝" />
        <DashboardCard title="Champions" value={championCount} icon="🏆" />
        <DashboardCard title="Active Polls" value={activePollCount} icon="📊" />
      </div>

      {/* Stream Status + Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Live Stream
          </h2>
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${streamActive ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
            <span className="text-lg font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: streamActive ? '#ef4444' : '#9ca3af' }}>
              {streamActive ? 'LIVE' : 'Off'}
            </span>
          </div>
          <Link href="/admin/stream" className="inline-block mt-3 text-sm text-[#2BA5A0] hover:underline">
            Manage Stream →
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/articles/new"
              className="bg-[#2BA5A0] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2BA5A0]/90 transition-colors">
              New Article
            </Link>
            <Link href="/admin/notifications"
              className="bg-[#0A2540] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0A2540]/90 transition-colors">
              Send Notification
            </Link>
            <Link href="/admin/polls"
              className="bg-[#1478B5] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1478B5]/90 transition-colors">
              Create Poll
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Articles */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Recent Articles
        </h2>
        {recentArticles.length === 0 ? (
          <p className="text-gray-400 text-sm">No articles yet.</p>
        ) : (
          <div className="space-y-3">
            {recentArticles.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-700">{a.title}</p>
                  <p className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  a.published ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                }`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {a.published ? 'Published' : 'Draft'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
