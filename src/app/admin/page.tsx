import { requireAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard() {
  const admin = await requireAdmin()
  const supabase = await createClient()

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

  const stats = [
    { label: 'Articles', value: articleCount },
    { label: 'Active Sponsors', value: sponsorCount },
    { label: 'Champions', value: championCount },
    { label: 'Active Polls', value: activePollCount },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-[22px] font-semibold text-[#0A2540]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Dashboard
        </h1>
        <p className="text-[13px] text-[#0A2540]/40 mt-1">
          Welcome back, {admin.full_name || admin.email}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 mb-0">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="py-5"
            style={{
              borderRight: i < stats.length - 1 ? '1px solid rgba(10,37,64,0.06)' : 'none',
              paddingLeft: i > 0 ? '24px' : '0',
              paddingRight: '24px',
            }}
          >
            <p
              className="text-[32px] font-semibold text-[#0A2540] leading-none"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {stat.value}
            </p>
            <p
              className="text-[10px] uppercase tracking-[0.15em] text-[#0A2540]/30 mt-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="h-px bg-[#0A2540]/[0.06] my-6" />

      {/* Stream status + Quick actions */}
      <div className="grid md:grid-cols-2 gap-8 mb-0">
        <div>
          <h2
            className="text-[10px] uppercase tracking-[0.15em] text-[#0A2540]/30 mb-4"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Live Stream
          </h2>
          <div className="flex items-center gap-3">
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{
                backgroundColor: streamActive ? '#EF4444' : '#D1D5DB',
                boxShadow: streamActive ? '0 0 6px rgba(239,68,68,0.4)' : 'none',
              }}
            />
            <span
              className="text-[14px] font-medium"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                color: streamActive ? '#EF4444' : '#9CA3AF',
              }}
            >
              {streamActive ? 'LIVE' : 'Off'}
            </span>
            <Link
              href="/admin/stream"
              className="text-[12px] text-[#0A2540]/30 hover:text-[#0A2540]/60 ml-2 transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Manage
            </Link>
          </div>
        </div>

        <div>
          <h2
            className="text-[10px] uppercase tracking-[0.15em] text-[#0A2540]/30 mb-4"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Quick Actions
          </h2>
          <div className="flex gap-2">
            <Link
              href="/admin/articles/new"
              className="text-[12px] font-medium text-white px-4 py-2 transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#0A2540', borderRadius: '4px' }}
            >
              New Article
            </Link>
            <Link
              href="/admin/notifications"
              className="text-[12px] font-medium px-4 py-2 transition-colors hover:bg-[#0A2540]/[0.04]"
              style={{
                border: '1px solid rgba(10,37,64,0.12)',
                borderRadius: '4px',
                color: '#0A2540',
              }}
            >
              Send Notification
            </Link>
            <Link
              href="/admin/polls"
              className="text-[12px] font-medium px-4 py-2 transition-colors hover:bg-[#0A2540]/[0.04]"
              style={{
                border: '1px solid rgba(10,37,64,0.12)',
                borderRadius: '4px',
                color: '#0A2540',
              }}
            >
              Create Poll
            </Link>
          </div>
        </div>
      </div>

      <div className="h-px bg-[#0A2540]/[0.06] my-6" />

      {/* Recent Articles */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-[10px] uppercase tracking-[0.15em] text-[#0A2540]/30"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Recent Articles
          </h2>
          <Link
            href="/admin/articles"
            className="text-[11px] text-[#0A2540]/30 hover:text-[#0A2540]/60 transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            View all
          </Link>
        </div>

        {recentArticles.length === 0 ? (
          <p className="text-[13px] text-[#0A2540]/30">No articles yet.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th
                  className="text-left text-[9px] uppercase tracking-[0.2em] text-[#0A2540]/20 pb-2 font-medium"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Title
                </th>
                <th
                  className="text-left text-[9px] uppercase tracking-[0.2em] text-[#0A2540]/20 pb-2 font-medium hidden md:table-cell"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Date
                </th>
                <th
                  className="text-right text-[9px] uppercase tracking-[0.2em] text-[#0A2540]/20 pb-2 font-medium"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {recentArticles.map((a, i) => (
                <tr
                  key={a.id}
                  style={{
                    backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(10,37,64,0.015)',
                  }}
                >
                  <td className="py-2.5 pr-4">
                    <p className="text-[13px] text-[#0A2540]/80">{a.title}</p>
                  </td>
                  <td className="py-2.5 hidden md:table-cell">
                    <p className="text-[12px] text-[#0A2540]/30" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="py-2.5 text-right">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: a.published ? '#22C55E' : '#D1D5DB' }}
                      />
                      <span
                        className="text-[10px] uppercase tracking-[0.1em]"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          color: a.published ? '#22C55E' : '#9CA3AF',
                        }}
                      >
                        {a.published ? 'Published' : 'Draft'}
                      </span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
