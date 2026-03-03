'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, Card, FormField, Button, SectionLabel, inputStyle } from '@/components/admin/ui'

export default function StreamPage() {
  const [active, setActive] = useState(false)
  const [streamUrl, setStreamUrl] = useState('')
  const [embedCode, setEmbedCode] = useState('')
  const [title, setTitle] = useState('')
  const [eventId, setEventId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    (async () => {
      const { data } = await createClient().from('stream_config').select('*').limit(1).single()
      if (data) { setActive(data.active); setStreamUrl(data.stream_url || ''); setEmbedCode(data.embed_code || ''); setTitle(data.title || ''); setEventId(data.event_id || '') }
      setLoading(false)
    })()
  }, [])

  const save = async () => {
    setSaving(true)
    const sb = createClient()
    const data = { active, stream_url: streamUrl || null, embed_code: embedCode || null, title: title || null, event_id: eventId || null }
    const { data: existing } = await sb.from('stream_config').select('id').limit(1).single()
    if (existing) await sb.from('stream_config').update(data).eq('id', existing.id)
    else await sb.from('stream_config').insert(data)
    setSaving(false)
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--admin-text-muted)', fontSize: 13 }}>Loading...</div>

  return (
    <div>
      <PageHeader title="Live Stream" subtitle={active ? 'Currently broadcasting' : 'Stream is offline'} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        <Card>
          <FormField label="Stream URL"><input value={streamUrl} onChange={e => setStreamUrl(e.target.value)} style={inputStyle} placeholder="https://youtube.com/..." /></FormField>
          <FormField label="Embed Code"><textarea value={embedCode} onChange={e => setEmbedCode(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} placeholder="<iframe..." /></FormField>
          <FormField label="Title"><input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="Live stream title..." /></FormField>
          <FormField label="Event ID"><input value={eventId} onChange={e => setEventId(e.target.value)} style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} placeholder="LiveHeats event ID" /></FormField>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card>
            <SectionLabel>Broadcast Status</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', display: 'inline-block', background: active ? 'var(--admin-danger)' : '#CBD5E1', boxShadow: active ? '0 0 0 4px rgba(220,38,38,0.12)' : 'none', transition: 'all 0.2s' }} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: active ? 'var(--admin-danger)' : 'var(--admin-text-muted)' }}>
                {active ? 'LIVE' : 'OFF'}
              </span>
            </div>
            <button onClick={() => setActive(!active)} style={{
              width: '100%', padding: '11px 0', borderRadius: 'var(--admin-radius)', border: 'none', fontSize: 13, fontWeight: 600,
              fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer', transition: 'all 0.15s',
              background: active ? 'var(--admin-danger)' : 'var(--admin-success)', color: '#fff',
            }}>
              {active ? 'Stop Broadcast' : 'Go Live'}
            </button>
          </Card>

          <Card>
            <Button onClick={save} disabled={saving} style={{ width: '100%' }}>{saving ? 'Saving...' : 'Save Settings'}</Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
