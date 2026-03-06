'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, DataTable, Modal, FormField, Button, StatusDot, MetaText, ActionLinks, inputStyle, selectStyle } from '@/components/admin/ui'

interface Blast {
  id: string; title: string; body: string; status: string
  recipient_count: number; scheduled_at: string | null
  sent_at: string | null; created_at: string; error_message: string | null
}

interface Template {
  id: string; name: string; body: string; category: string; variables: string[]
}

interface Contact {
  id: string; name: string; phone: string | null; type: string; tags: string[]
}

const AUDIENCE_TYPES = [
  { value: 'all', label: 'All Contacts' },
  { value: 'athlete', label: 'Athletes Only' },
  { value: 'parent', label: 'Parents Only' },
  { value: 'committee', label: 'Committee Only' },
  { value: 'custom', label: 'Custom Selection' },
]

const STATUS_COLORS: Record<string, string> = {
  draft: '#6B7280', scheduled: '#F59E0B', sending: '#3B82F6', sent: '#10B981', failed: '#EF4444', cancelled: '#9CA3AF',
}

export default function BlastsPage() {
  const [blasts, setBlasts] = useState<Blast[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showComposer, setShowComposer] = useState(false)
  const [showDetail, setShowDetail] = useState<Blast | null>(null)
  const [sending, setSending] = useState(false)

  // Composer state
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState('all')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [preview, setPreview] = useState(false)

  const supabase = createClient()

  async function load() {
    setLoading(true)
    const [blastsRes, templatesRes, contactsRes] = await Promise.all([
      supabase.from('blast_messages').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('blast_templates').select('*').eq('active', true).order('name'),
      supabase.from('contacts').select('id, name, phone, type, tags').eq('active', true).eq('opted_out', false).not('phone', 'is', null).order('name'),
    ])
    setBlasts(blastsRes.data || [])
    setTemplates(templatesRes.data || [])
    setContacts(contactsRes.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function applyTemplate(t: Template) {
    setTitle(t.name)
    setBody(t.body)
  }

  function getAudienceFilter() {
    if (audience === 'all') return {}
    if (audience === 'custom') return { custom_ids: selectedContacts }
    return { types: [audience] }
  }

  function getRecipientCount() {
    if (audience === 'all') return contacts.length
    if (audience === 'custom') return selectedContacts.length
    return contacts.filter(c => c.type === audience).length
  }

  async function handleSend(sendNow: boolean) {
    if (!title || !body) { alert('Title and message body required'); return }
    const count = getRecipientCount()
    if (count === 0) { alert('No recipients with phone numbers'); return }

    if (sendNow && !confirm(`Send WhatsApp message to ${count} recipients now?`)) return

    setSending(true)
    try {
      const res = await fetch('/api/blasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, body,
          audience_filter: getAudienceFilter(),
          send_now: sendNow,
        }),
      })
      const data = await res.json()
      if (data.error) { alert(data.error); return }
      
      setShowComposer(false)
      setTitle(''); setBody(''); setAudience('all'); setSelectedContacts([])
      load()
      alert(sendNow ? `Sending to ${data.recipient_count} recipients...` : 'Blast saved as draft')
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
    setSending(false)
  }

  async function handleResend(blastId: string) {
    if (!confirm('Resend to failed recipients?')) return
    const res = await fetch('/api/blasts/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blast_id: blastId }),
    })
    const data = await res.json()
    alert(`Sent: ${data.sent}, Failed: ${data.failed}`)
    load()
  }

  const sentCount = blasts.filter(b => b.status === 'sent').length
  const totalRecipients = blasts.reduce((sum, b) => sum + (b.recipient_count || 0), 0)

  return (
    <>
      <PageHeader
        title="WhatsApp Blasts"
        subtitle={`${blasts.length} blasts · ${totalRecipients} messages sent`}
        actions={
          <Button onClick={() => { setShowComposer(true); setTitle(''); setBody(''); setAudience('all') }}>
            New Blast
          </Button>
        }
      />

      {/* Quick stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Contacts', value: contacts.length, color: '#0A2540' },
          { label: 'Blasts Sent', value: sentCount, color: '#10B981' },
          { label: 'Messages', value: totalRecipients, color: '#2BA5A0' },
        ].map(s => (
          <div key={s.label} style={{ padding: '12px 20px', borderRadius: 12, backgroundColor: 'rgba(10,37,64,0.02)', border: '1px solid rgba(10,37,64,0.06)' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'rgba(26,26,26,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <DataTable
        columns={['Title', 'Recipients', 'Status', 'Sent', '']}
        rows={blasts.map(b => [
          <div key="t">
            <span style={{ fontWeight: 600 }}>{b.title}</span>
            <MetaText style={{ display: 'block', marginTop: 2 }}>{b.body.substring(0, 60)}...</MetaText>
          </div>,
          <MetaText key="r">{b.recipient_count}</MetaText>,
          <span key="s" style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, backgroundColor: `${STATUS_COLORS[b.status]}15`, color: STATUS_COLORS[b.status], fontWeight: 600, textTransform: 'capitalize' }}>{b.status}</span>,
          <MetaText key="d">{b.sent_at ? new Date(b.sent_at).toLocaleString() : '—'}</MetaText>,
          <ActionLinks key="a" actions={[
            ...(b.status === 'draft' ? [{ label: 'Send Now', onClick: () => handleResend(b.id) }] : []),
            ...(b.error_message ? [{ label: 'Retry Failed', onClick: () => handleResend(b.id) }] : []),
          ]} />,
        ])}
        loading={loading}
        emptyMessage="No blasts yet. Create your first WhatsApp blast!"
      />

      {/* COMPOSER MODAL */}
      {showComposer && (
        <Modal title="Compose WhatsApp Blast" onClose={() => setShowComposer(false)} wide>
          {/* Templates */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(26,26,26,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Quick Templates</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {templates.map(t => (
                <button key={t.id} onClick={() => applyTemplate(t)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(10,37,64,0.08)', backgroundColor: '#fff', cursor: 'pointer', fontSize: 12, color: '#0A2540', fontWeight: 500 }}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <FormField label="Blast Title (internal)">
            <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. March 14 Event Reminder" />
          </FormField>

          <FormField label="Message">
            <textarea
              style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Hey {{name}}! Your message here..."
            />
            <MetaText style={{ marginTop: 4 }}>
              Use {'{{name}}'} to personalize with first name · {body.length} chars
            </MetaText>
          </FormField>

          <FormField label="Audience">
            <select style={selectStyle} value={audience} onChange={e => setAudience(e.target.value)}>
              {AUDIENCE_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </FormField>

          {audience === 'custom' && (
            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid rgba(10,37,64,0.08)', borderRadius: 8, padding: 8, marginBottom: 12 }}>
              {contacts.map(c => (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', cursor: 'pointer', borderRadius: 4 }}>
                  <input
                    type="checkbox"
                    checked={selectedContacts.includes(c.id)}
                    onChange={e => {
                      if (e.target.checked) setSelectedContacts([...selectedContacts, c.id])
                      else setSelectedContacts(selectedContacts.filter(id => id !== c.id))
                    }}
                  />
                  <span style={{ fontSize: 13 }}>{c.name}</span>
                  <MetaText>{c.phone}</MetaText>
                </label>
              ))}
            </div>
          )}

          {/* Preview */}
          <div style={{ padding: 16, borderRadius: 12, backgroundColor: '#DCF8C6', marginBottom: 16, maxWidth: 320 }}>
            <div style={{ fontSize: 13, color: '#111', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
              {body.replace(/\{\{name\}\}/g, 'Josh') || 'Your message preview...'}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.3)', textAlign: 'right', marginTop: 4 }}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button onClick={() => handleSend(true)} disabled={sending || !title || !body}>
              {sending ? 'Sending...' : `Send Now to ${getRecipientCount()} recipients`}
            </Button>
            <Button onClick={() => handleSend(false)} variant="secondary" disabled={sending}>
              Save as Draft
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}
