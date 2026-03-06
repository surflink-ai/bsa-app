'use client'

import Link from 'next/link'
import { Card, CardHeader, StatusDot, MetaText, SectionLabel } from './ui'

interface Article { id: string; title: string; published: boolean; category: string; published_at: string | null; created_at: string }
interface Blast { id: string; title: string; recipient_count: number; status: string; sent_at: string | null; created_at: string }
interface AuditEntry { id: string; action: string; entity_type: string | null; details: any; created_at: string }

const ACTION_LABELS: Record<string, string> = {
  blast_sent: 'Sent WhatsApp blast',
  article_published: 'Published article',
  article_created: 'Created article',
  contact_imported: 'Imported contacts',
  settings_updated: 'Updated settings',
  stream_toggled: 'Toggled stream',
}

function QuickAction({ href, label, sublabel, color }: { href: string; label: string; sublabel: string; color: string }) {
  return (
    <Link href={href} style={{
      display: 'flex', flexDirection: 'column', padding: '18px 20px', borderRadius: 14,
      backgroundColor: `${color}08`, border: `1px solid ${color}15`,
      textDecoration: 'none', transition: 'all 0.15s',
    }}>
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color }}>{label}</span>
      <span style={{ fontSize: 11, color: 'rgba(26,26,26,0.35)', marginTop: 4 }}>{sublabel}</span>
    </Link>
  )
}

function StatCard({ value, label, sub, accent }: { value: number | string; label: string; sub?: string; accent?: string }) {
  return (
    <div style={{
      padding: '20px', borderRadius: 14,
      backgroundColor: '#fff', border: '1px solid rgba(10,37,64,0.06)',
      position: 'relative', overflow: 'hidden',
    }}>
      {accent && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: accent }} />}
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, color: accent || '#0A2540', lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.35)', marginTop: 8 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'rgba(26,26,26,0.25)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function DashboardV2({ adminName, articles, stats, streamActive, recentBlasts, auditLog }: {
  adminName: string
  articles: Article[]
  stats: { athletes: number; contacts: number; contactsWithPhone: number; sponsors: number; blastsSent: number; messagesSent: number }
  streamActive: boolean
  recentBlasts: Blast[]
  auditLog: AuditEntry[]
}) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: '#0A2540', margin: 0 }}>
          {greeting}, {adminName.split(' ')[0]}
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(26,26,26,0.35)', marginTop: 6 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        <QuickAction href="/admin/blasts" label="New Blast" sublabel="Send WhatsApp message" color="#2BA5A0" />
        <QuickAction href="/admin/articles/new" label="New Article" sublabel="Write and publish" color="#1478B5" />
        <QuickAction href="/admin/contacts" label="Contacts" sublabel={`${stats.contactsWithPhone} with WhatsApp`} color="#6366F1" />
        <QuickAction href="/admin/stream" label={streamActive ? 'Stream LIVE' : 'Go Live'} sublabel={streamActive ? 'Broadcasting now' : 'Start live stream'} color={streamActive ? '#EF4444' : '#0A2540'} />
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 28 }}>
        <StatCard value={stats.athletes} label="Athletes" accent="#0A2540" />
        <StatCard value={stats.contacts} label="Contacts" sub={`${stats.contactsWithPhone} reachable`} accent="#2BA5A0" />
        <StatCard value={stats.blastsSent} label="Blasts Sent" accent="#1478B5" />
        <StatCard value={stats.messagesSent} label="Messages" sub="WhatsApp delivered" accent="#6366F1" />
        <StatCard value={stats.sponsors} label="Sponsors" accent="#F59E0B" />
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 320px', gap: 16 }}>
        {/* Recent Articles */}
        <Card padding={false}>
          <CardHeader title="Recent Articles" action={{ label: 'View all', href: '/admin/articles' }} />
          {articles.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center', color: 'rgba(26,26,26,0.25)', fontSize: 13 }}>No articles yet</div>
          ) : (
            <div>
              {articles.map((a, i) => (
                <Link key={a.id} href={`/admin/articles/${a.id}/edit`} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 20px',
                  borderBottom: i < articles.length - 1 ? '1px solid rgba(10,37,64,0.04)' : 'none',
                  textDecoration: 'none',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#0A2540', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                    <MetaText style={{ fontSize: 10, marginTop: 2, display: 'block' }}>{a.category?.replace(/-/g, ' ')}</MetaText>
                  </div>
                  <StatusDot status={a.published ? 'success' : 'warning'} label={a.published ? 'Live' : 'Draft'} />
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Blasts */}
        <Card padding={false}>
          <CardHeader title="Recent Blasts" action={{ label: 'View all', href: '/admin/blasts' }} />
          {recentBlasts.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center', color: 'rgba(26,26,26,0.25)', fontSize: 13 }}>
              No blasts sent yet
              <div style={{ marginTop: 8 }}>
                <Link href="/admin/blasts" style={{ fontSize: 12, color: '#2BA5A0', textDecoration: 'none', fontWeight: 500 }}>Send your first blast</Link>
              </div>
            </div>
          ) : (
            <div>
              {recentBlasts.map((b, i) => (
                <div key={b.id} style={{
                  padding: '12px 20px',
                  borderBottom: i < recentBlasts.length - 1 ? '1px solid rgba(10,37,64,0.04)' : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#0A2540' }}>{b.title}</span>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 8, fontWeight: 600, textTransform: 'capitalize',
                      backgroundColor: b.status === 'sent' ? 'rgba(16,185,129,0.08)' : 'rgba(59,130,246,0.08)',
                      color: b.status === 'sent' ? '#10B981' : '#3B82F6',
                    }}>{b.status}</span>
                  </div>
                  <MetaText style={{ marginTop: 4, display: 'flex', gap: 12 }}>
                    <span>{b.recipient_count} recipients</span>
                    <span>{b.sent_at ? timeAgo(b.sent_at) : timeAgo(b.created_at)}</span>
                  </MetaText>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Activity Feed */}
        <Card padding={false}>
          <CardHeader title="Activity" />
          {auditLog.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'rgba(26,26,26,0.25)', fontSize: 13 }}>
              No recent activity
            </div>
          ) : (
            <div>
              {auditLog.map((entry, i) => (
                <div key={entry.id} style={{
                  padding: '10px 20px',
                  borderBottom: i < auditLog.length - 1 ? '1px solid rgba(10,37,64,0.04)' : 'none',
                }}>
                  <div style={{ fontSize: 12, color: '#0A2540', fontWeight: 500 }}>
                    {ACTION_LABELS[entry.action] || entry.action}
                  </div>
                  {entry.details?.title && (
                    <MetaText style={{ display: 'block', marginTop: 2, fontSize: 10 }}>{entry.details.title}</MetaText>
                  )}
                  {entry.details?.sent !== undefined && (
                    <MetaText style={{ display: 'block', marginTop: 2, fontSize: 10 }}>
                      {entry.details.sent}/{entry.details.total} delivered
                    </MetaText>
                  )}
                  <MetaText style={{ display: 'block', marginTop: 2, fontSize: 10 }}>{timeAgo(entry.created_at)}</MetaText>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
