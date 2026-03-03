'use client'

import Link from 'next/link'
import { Card, CardHeader, StatusDot, MetaText, Button, SectionLabel } from './ui'

interface Article { id: string; title: string; published: boolean; category: string; published_at: string | null; created_at: string }

export function DashboardClient({ adminName, articles, stats, streamActive }: {
  adminName: string
  articles: Article[]
  stats: { articles: number; sponsors: number; champions: number; polls: number }
  streamActive: boolean
}) {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--admin-navy)', margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginTop: 6 }}>Welcome back, {adminName}</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Articles', value: stats.articles },
          { label: 'Active Sponsors', value: stats.sponsors },
          { label: 'Champions', value: stats.champions },
          { label: 'Active Polls', value: stats.polls },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 700, color: 'var(--admin-navy)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-text-muted)', marginTop: 10 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Recent Articles */}
        <Card padding={false}>
          <CardHeader title="Recent Articles" action={{ label: 'View all', href: '/admin/articles' }} />
          {articles.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>No articles yet</div>
          ) : (
            <div>
              {articles.map((a, i) => (
                <Link key={a.id} href={`/admin/articles/${a.id}/edit`} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '13px 24px',
                  borderBottom: i < articles.length - 1 ? '1px solid var(--admin-border-subtle)' : 'none',
                  textDecoration: 'none',
                  background: i % 2 === 1 ? 'rgba(10,37,64,0.012)' : 'transparent',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                    <MetaText style={{ fontSize: 10, marginTop: 2, display: 'block' }}>{a.category?.replace(/-/g, ' ')}</MetaText>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginLeft: 16, flexShrink: 0 }}>
                    <MetaText>{new Date(a.published_at || a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</MetaText>
                    <StatusDot status={a.published ? 'success' : 'warning'} label={a.published ? 'Live' : 'Draft'} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stream */}
          <Card>
            <SectionLabel>Live Stream</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%', display: 'inline-block',
                background: streamActive ? 'var(--admin-danger)' : '#CBD5E1',
                boxShadow: streamActive ? '0 0 0 3px rgba(220,38,38,0.12)' : 'none',
              }} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: streamActive ? 'var(--admin-danger)' : 'var(--admin-text-muted)' }}>
                {streamActive ? 'Broadcasting' : 'Offline'}
              </span>
            </div>
            <Link href="/admin/stream" style={{ fontSize: 12, fontWeight: 500, color: 'var(--admin-teal)', textDecoration: 'none' }}>Manage stream</Link>
          </Card>

          {/* Quick Actions */}
          <Card>
            <SectionLabel>Quick Actions</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button href="/admin/articles/new" variant="primary" style={{ width: '100%' }}>New Article</Button>
              <Button href="/admin/notifications" style={{ width: '100%', background: 'var(--admin-blue)', color: '#fff' }}>Send Notification</Button>
              <Button href="/admin/polls" style={{ width: '100%', background: 'var(--admin-teal)', color: '#fff' }}>Create Poll</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
