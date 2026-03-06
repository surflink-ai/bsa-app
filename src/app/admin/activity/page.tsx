'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, MetaText, selectStyle } from '@/components/admin/ui'

interface AuditEntry {
  id: string; action: string; entity_type: string | null
  details: any; created_at: string
}

const ACTION_LABELS: Record<string, string> = {
  blast_sent: 'Sent WhatsApp blast',
  article_published: 'Published article',
  article_created: 'Created article',
  contact_imported: 'Imported contacts',
  contact_created: 'Added contact',
  settings_updated: 'Updated settings',
  stream_toggled: 'Toggled stream',
}

const ACTION_COLORS: Record<string, string> = {
  blast_sent: '#2BA5A0', article_published: '#1478B5',
  contact_imported: '#6366F1', settings_updated: '#F59E0B', stream_toggled: '#EF4444',
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ActivityPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('')
  const supabase = createClient()

  async function load() {
    setLoading(true)
    let q = supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(100)
    if (actionFilter) q = q.eq('action', actionFilter)
    const { data } = await q
    setEntries(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [actionFilter])

  return (
    <>
      <PageHeader title="Activity Log" subtitle={`${entries.length} entries`} />
      <div style={{ marginBottom: 16 }}>
        <select style={{ ...selectStyle, maxWidth: 200 }} value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
          <option value="">All actions</option>
          {Object.entries(ACTION_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </div>

      {loading ? <MetaText>Loading...</MetaText> : entries.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'rgba(26,26,26,0.25)', fontSize: 13 }}>No activity recorded yet.</div>
      ) : (
        <div style={{ border: '1px solid rgba(10,37,64,0.06)', borderRadius: 12, overflow: 'hidden' }}>
          {entries.map((e, i) => (
            <div key={e.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px',
              borderBottom: i < entries.length - 1 ? '1px solid rgba(10,37,64,0.04)' : 'none',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, backgroundColor: ACTION_COLORS[e.action] || 'rgba(26,26,26,0.15)' }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 500, fontSize: 13, color: '#0A2540' }}>{ACTION_LABELS[e.action] || e.action}</span>
                {e.details?.title && <MetaText style={{ marginLeft: 8 }}>{e.details.title}</MetaText>}
                {e.details?.sent !== undefined && <MetaText style={{ marginLeft: 4 }}>· {e.details.sent}/{e.details.total} delivered</MetaText>}
              </div>
              <MetaText>{timeAgo(e.created_at)}</MetaText>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
