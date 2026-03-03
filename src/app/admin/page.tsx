import { requireAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

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

  const articleCount = articlesRes.data?.length || 0
  const sponsorCount = sponsorsRes.count || 0
  const championCount = championsRes.count || 0
  const activePollCount = pollsRes.count || 0
  const streamActive = streamRes.data?.active || false
  const recentArticles = articlesRes.data || []

  const stats = [
    { label: 'Articles', value: articleCount },
    { label: 'Active Sponsors', value: sponsorCount },
    { label: 'Champions', value: championCount },
    { label: 'Active Polls', value: activePollCount },
  ]

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: '#0A2540', margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 6 }}>
          Welcome back, {admin.full_name || admin.email}
        </p>
      </div>

      {/* Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 0,
        background: '#fff',
        borderRadius: 6,
        border: '1px solid rgba(10,37,64,0.06)',
        marginBottom: 32,
      }}>
        {stats.map((stat, i) => (
          <div key={stat.label} style={{
            padding: '24px 28px',
            borderRight: i < stats.length - 1 ? '1px solid rgba(10,37,64,0.06)' : 'none',
          }}>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 32,
              fontWeight: 700,
              color: '#0A2540',
              lineHeight: 1,
            }}>
              {stat.value}
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              color: '#94A3B8',
              marginTop: 8,
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, marginBottom: 32 }}>
        {/* Recent Articles */}
        <div style={{ background: '#fff', borderRadius: 6, border: '1px solid rgba(10,37,64,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid rgba(10,37,64,0.06)' }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600, color: '#0A2540' }}>
              Recent Articles
            </span>
            <Link href="/admin/articles" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#2BA5A0', textDecoration: 'none' }}>
              View all
            </Link>
          </div>
          {recentArticles.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              No articles yet
            </div>
          ) : (
            <div>
              {recentArticles.map((a, i) => (
                <Link
                  key={a.id}
                  href={`/admin/articles/${a.id}/edit`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 24px',
                    borderBottom: i < recentArticles.length - 1 ? '1px solid rgba(10,37,64,0.04)' : 'none',
                    textDecoration: 'none',
                    transition: 'background 0.1s',
                    background: i % 2 === 1 ? 'rgba(10,37,64,0.015)' : 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(10,37,64,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 1 ? 'rgba(10,37,64,0.015)' : 'transparent'}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#0A2540', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {a.title}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#94A3B8', marginTop: 3, letterSpacing: '0.04em' }}>
                      {a.category?.replace(/-/g, ' ')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 16, flexShrink: 0 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#94A3B8' }}>
                      {new Date(a.published_at || a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase' as const,
                      color: a.published ? '#16A34A' : '#D97706',
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: a.published ? '#16A34A' : '#D97706' }} />
                      {a.published ? 'Live' : 'Draft'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Stream Status */}
          <div style={{ background: '#fff', borderRadius: 6, border: '1px solid rgba(10,37,64,0.06)', padding: '24px' }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              color: '#94A3B8',
              marginBottom: 14,
            }}>
              Live Stream
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: streamActive ? '#DC2626' : '#CBD5E1',
                boxShadow: streamActive ? '0 0 0 3px rgba(220,38,38,0.15)' : 'none',
              }} />
              <span style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 16,
                fontWeight: 600,
                color: streamActive ? '#DC2626' : '#94A3B8',
              }}>
                {streamActive ? 'Broadcasting' : 'Offline'}
              </span>
            </div>
            <Link href="/admin/stream" style={{
              display: 'inline-block',
              fontSize: 12,
              fontWeight: 500,
              color: '#2BA5A0',
              textDecoration: 'none',
            }}>
              Manage stream
            </Link>
          </div>

          {/* Quick Actions */}
          <div style={{ background: '#fff', borderRadius: 6, border: '1px solid rgba(10,37,64,0.06)', padding: '24px' }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              color: '#94A3B8',
              marginBottom: 16,
            }}>
              Quick Actions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'New Article', href: '/admin/articles/new', bg: '#0A2540' },
                { label: 'Send Notification', href: '/admin/notifications', bg: '#1478B5' },
                { label: 'Create Poll', href: '/admin/polls', bg: '#2BA5A0' },
              ].map(action => (
                <Link key={action.label} href={action.href} style={{
                  display: 'block',
                  padding: '11px 16px',
                  background: action.bg,
                  color: '#fff',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "'Space Grotesk', sans-serif",
                  textDecoration: 'none',
                  textAlign: 'center',
                  transition: 'opacity 0.15s',
                  letterSpacing: '0.01em',
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
