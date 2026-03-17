'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, Card, MetaText, StatusDot } from '@/components/admin/ui'

interface Submission {
  id: string; name: string; email: string; subject: string | null
  message: string; category: string; read: boolean; archived: boolean; created_at: string
}

const categoryLabels: Record<string, string> = {
  general: 'General', compete: 'Competition', sponsor: 'Sponsorship',
  coaching: 'Coaching', membership: 'Membership', media: 'Media', juniors: 'Juniors',
}

export default function AdminInquiriesPage() {
  const [items, setItems] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Submission | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const supabase = createClient()

  async function load() {
    let q = supabase.from('contact_submissions').select('*').order('created_at', { ascending: false }).limit(100)
    if (!showArchived) q = q.eq('archived', false)
    const { data } = await q
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [showArchived])

  async function markRead(id: string) {
    await supabase.from('contact_submissions').update({ read: true }).eq('id', id)
    load()
  }

  async function archive(id: string) {
    await supabase.from('contact_submissions').update({ archived: true }).eq('id', id)
    setSelected(null)
    load()
  }

  const unreadCount = items.filter(i => !i.read).length

  return (
    <div>
      <PageHeader title="Inquiries" subtitle={`${items.length} submissions${unreadCount > 0 ? ` · ${unreadCount} unread` : ''}`} />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--admin-text-muted)', cursor: 'pointer' }}>
          <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
          Show archived
        </label>
      </div>

      {loading ? <MetaText>Loading...</MetaText> : items.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(26,26,26,0.25)', fontSize: 13 }}>No inquiries yet. They'll appear here when visitors use the contact form.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
          <div style={{ border: '1px solid var(--admin-border)', borderRadius: 12, overflow: 'hidden' }}>
            {items.map((item, i) => (
              <button key={item.id} onClick={() => { setSelected(item); if (!item.read) markRead(item.id) }} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', width: '100%',
                borderBottom: i < items.length - 1 ? '1px solid rgba(10,37,64,0.04)' : 'none',
                background: selected?.id === item.id ? 'rgba(43,165,160,0.04)' : 'transparent',
                cursor: 'pointer', textAlign: 'left', border: 'none',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.read ? 'transparent' : '#2BA5A0', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: item.read ? 400 : 600, color: '#0A2540', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(26,26,26,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.subject || item.message.substring(0, 60)}</div>
                </div>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, backgroundColor: 'rgba(43,165,160,0.08)', color: '#2BA5A0', whiteSpace: 'nowrap' }}>{categoryLabels[item.category] || item.category}</span>
                <MetaText style={{ whiteSpace: 'nowrap' }}>{new Date(item.created_at).toLocaleDateString()}</MetaText>
              </button>
            ))}
          </div>

          {selected && (
            <Card style={{ padding: 24, position: 'sticky', top: 16, alignSelf: 'start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: '#0A2540', marginBottom: 4 }}>{selected.name}</h3>
                  <a href={`mailto:${selected.email}`} style={{ fontSize: 13, color: '#2BA5A0', textDecoration: 'none' }}>{selected.email}</a>
                </div>
                <button onClick={() => archive(selected.id)} style={{ fontSize: 12, color: 'rgba(26,26,26,0.35)', background: 'none', border: '1px solid rgba(10,37,64,0.08)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}>Archive</button>
              </div>
              {selected.subject && <div style={{ fontWeight: 600, fontSize: 14, color: '#0A2540', marginBottom: 8 }}>{selected.subject}</div>}
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, backgroundColor: 'rgba(43,165,160,0.08)', color: '#2BA5A0', display: 'inline-block', marginBottom: 16 }}>{categoryLabels[selected.category] || selected.category}</span>
              <p style={{ fontSize: 14, color: 'rgba(26,26,26,0.6)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selected.message}</p>
              <MetaText style={{ marginTop: 16, display: 'block' }}>{new Date(selected.created_at).toLocaleString()}</MetaText>
              <a href={`mailto:${selected.email}?subject=Re: ${selected.subject || 'Your inquiry to BSA'}`} style={{
                display: 'inline-block', marginTop: 16, padding: '8px 20px', borderRadius: 6,
                backgroundColor: '#2BA5A0', color: '#fff', fontSize: 13, fontWeight: 600,
                textDecoration: 'none',
              }}>Reply via Email</a>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
