'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, Card, DataTable, FormField, Button, MetaText, SectionLabel, inputStyle, selectStyle } from '@/components/admin/ui'
import { logAudit } from '@/lib/audit'

interface Notification { id: string; title: string; body: string; type: string; sent_at: string }

export default function NotificationsPage() {
  const [rows, setRows] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState('announcement')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const load = async () => { const { data } = await createClient().from('notifications').select('*').order('sent_at', { ascending: false }).limit(20); setRows(data || []); setLoading(false) }
  useEffect(() => { load() }, [])

  const send = async () => {
    setSending(true)
    await createClient().from('notifications').insert({ title, body, type })
    setSending(false); setSent(true); setTitle(''); setBody(''); setTimeout(() => setSent(false), 3000); load()
  }

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Send push notifications to subscribers" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <Card>
          <SectionLabel>Compose</SectionLabel>
          <FormField label="Title"><input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="Notification title..." /></FormField>
          <FormField label="Message"><textarea value={body} onChange={e => setBody(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Notification body..." /></FormField>
          <FormField label="Type">
            <select value={type} onChange={e => setType(e.target.value)} style={selectStyle}>
              <option value="announcement">Announcement</option>
              <option value="event">Event</option>
              <option value="heat">Heat Alert</option>
              <option value="conditions">Conditions</option>
              <option value="custom">Custom</option>
            </select>
          </FormField>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button onClick={send} disabled={sending || !title || !body}>{sending ? 'Sending...' : 'Send Notification'}</Button>
            {sent && <span style={{ fontSize: 12, color: 'var(--admin-success)', fontWeight: 500 }}>Sent</span>}
          </div>
        </Card>

        <div>
          <SectionLabel>Recent Notifications</SectionLabel>
          {loading ? <MetaText>Loading...</MetaText> : (
            <DataTable columns={[
              { key: 'title', label: 'Title', render: r => <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text)' }}>{r.title}</span> },
              { key: 'type', label: 'Type', render: r => <span style={{ fontSize: 12, color: 'var(--admin-text-secondary)', textTransform: 'capitalize' }}>{r.type}</span> },
              { key: 'date', label: 'Sent', render: r => <MetaText>{new Date(r.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</MetaText> },
            ]} rows={rows} />
          )}
        </div>
      </div>
    </div>
  )
}
