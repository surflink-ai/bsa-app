'use client'

import Link from 'next/link'

interface Article {
  id: string
  title: string
  published: boolean
  category: string
  published_at: string | null
  created_at: string
}

interface DashboardProps {
  adminName: string
  articles: Article[]
  stats: { articles: number; sponsors: number; champions: number; polls: number }
  streamActive: boolean
}

export function DashboardClient({ adminName, articles, stats, streamActive }: DashboardProps) {
  const statItems = [
    { label: 'Articles', value: stats.articles },
    { label: 'Active Sponsors', value: stats.sponsors },
    { label: 'Champions', value: stats.champions },
    { label: 'Active Polls', value: stats.polls },
  ]

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: '#0A2540', margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 6 }}>
          Welcome back, {adminName}
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
        {statItems.map((stat, i) => (
          <div key={stat.label} style={{
            padding: '24px 28px',
            borderRight: i < statItems.length - 1 ? '1px solid rgba(10,37,64,0.06)' : 'none',
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
              textTransform: 'uppercase',
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
            <Link href="/admin/articles" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#2BA5A0', textDecoration: 'none' }}>
              View all
            </Link>
          </div>
          {articles.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              No articles yet
            </div>
          ) : (
            <div>
              {articles.map((a, i) => (
                <Link
                  key={a.id}
                  href={`/admin/articles/${a.id}/edit`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 24px',
                    borderBottom: i < articles.length - 1 ? '1px solid rgba(10,37,64,0.04)' : 'none',
                    textDecoration: 'none',
                    background: i % 2 === 1 ? 'rgba(10,37,64,0.015)' : 'transparent',
                  }}
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
                      textTransform: 'uppercase',
                      color: a.published ? '#16A34A' : '#D97706',
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: a.published ? '#16A34A' : '#D97706', display: 'inline-block' }} />
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
          <div style={{ background: '#fff', borderRadius: 6, border: '1px solid rgba(10,37,64,0.06)', padding: 24 }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
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
                display: 'inline-block',
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
            <Link href="/admin/stream" style={{ fontSize: 12, fontWeight: 500, color: '#2BA5A0', textDecoration: 'none' }}>
              Manage stream
            </Link>
          </div>

          {/* Quick Actions */}
          <div style={{ background: '#fff', borderRadius: 6, border: '1px solid rgba(10,37,64,0.06)', padding: 24 }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
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
                  letterSpacing: '0.01em',
                }}>
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
