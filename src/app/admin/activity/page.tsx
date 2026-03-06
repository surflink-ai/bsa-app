'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, DataTable, MetaText, inputStyle, selectStyle } from '@/components/admin/ui'

interface AuditEntry {
  id: string; user_id: string | null; action: string
  entity_type: string | null; entity_id: string | null
  details: any; created_at: string
}

const ACTION_LABELS: Record<string, string> = {
  blast_sent: 'Sent WhatsApp blast',
  article_published: 'Published article',
  article_created: 'Created article',
  contact_imported: 'Imported contacts',
  contact_created: 'Added contact',
  contact_updated: 'Updated contact',
  settings_updated: 'Updated settings',
  stream_toggled: 'Toggled stream',
  login: 'Signed in',
}

const ACTION_COLORS: Record<string, string> = {
  blast_sent: '#2BA5A0',
  article_published: '#1478B5',
  contact_imported: '#6366F1',
  settings_updated: '#F59E0B',
  stream_toggled: '#EF4444',
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

  const actions = [...new Set(entries.map(e => e.action))]

  return (
    <>
      <PageHeader title="Activity Log" subtitle={`${entries.length} entries`} />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select style={{ ...selectStyle, maxWidth: 200 }} value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
          <option value="">All actions</option>
          {Object.entries(ACTION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={['Action', 'Details', 'Time']}
        rows={entries.map(e => [
          <div key="a" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              backgroundColor: ACTION_COLORS[e.action] || 'rgba(26,26,26,0.15)',
            }} />
            <span style={{ fontWeight: 500, fontSize: 13 }}>{ACTION_LABELS[e.action] || e.action}</span>
          </div>,
          <div key="d">
            {e.details?.title && <MetaText>{e.details.title}</MetaText>}
            {e.details?.sent !== undefined && <MetaText> · {e.details.sent}/{e.details.total} delivered</MetaText>}
            {e.entity_type && !e.details?.title && <MetaText>{e.entity_type} {e.entity_id}</MetaText>}
          </div>,
          <MetaText key="t">{timeAgo(e.created_at)}</MetaText>,
        ])}
        loading={loading}
        emptyMessage="No activity recorded yet."
      />
    </>
  )
}
