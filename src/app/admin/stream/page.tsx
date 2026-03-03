'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, Card, FormField, Button, SectionLabel, MetaText, inputStyle } from '@/components/admin/ui'

export default function StreamPage() {
  const [active, setActive] = useState(false)
  const [title, setTitle] = useState('')
  const [eventId, setEventId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [obsInfo, setObsInfo] = useState<{ rtmpsUrl: string; streamKey: string; srtUrl: string; srtStreamId: string } | null>(null)
  const [streamLive, setStreamLive] = useState(false)

  useEffect(() => {
    (async () => {
      const { data } = await createClient().from('stream_config').select('*').limit(1).single()
      if (data) { setActive(data.active); setTitle(data.title || ''); setEventId(data.event_id || '') }
      setLoading(false)
    })()
    // Fetch OBS info
    fetch('/api/stream/status').then(r => r.json()).then(d => setStreamLive(d.live)).catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true)
    const sb = createClient()
    const data = { active, title: title || null, event_id: eventId || null }
    const { data: existing } = await sb.from('stream_config').select('id').limit(1).single()
    if (existing) await sb.from('stream_config').update(data).eq('id', existing.id)
    else await sb.from('stream_config').insert(data)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--admin-text-muted)', fontSize: 13 }}>Loading...</div>

  return (
    <div>
      <PageHeader title="Live Stream" subtitle={active ? 'Stream page is active' : 'Stream page is offline'} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Main config */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card>
            <SectionLabel>Broadcast Settings</SectionLabel>
            <FormField label="Event Title (shown on stream page)">
              <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="BSA SOTY Event #1 — Drill Hall" />
            </FormField>
            <FormField label="LiveHeats Event ID (for live scores)">
              <input value={eventId} onChange={e => setEventId(e.target.value)} style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} placeholder="e.g. 385619" />
            </FormField>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
              {saved && <span style={{ fontSize: 12, color: 'var(--admin-success)', fontWeight: 500 }}>Saved</span>}
            </div>
          </Card>

          <Card>
            <SectionLabel>OBS Configuration</SectionLabel>
            <p style={{ fontSize: 13, color: 'var(--admin-text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
              Use these settings in OBS Studio under Settings &gt; Stream. Select "Custom" as the service.
            </p>
            <FormField label="Server">
              <div style={{ ...inputStyle, background: 'rgba(10,37,64,0.03)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, userSelect: 'all' }}>
                rtmps://live.cloudflare.com:443/live/
              </div>
            </FormField>
            <FormField label="Stream Key">
              <div style={{ ...inputStyle, background: 'rgba(10,37,64,0.03)', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, userSelect: 'all', wordBreak: 'break-all' }}>
                {process.env.NEXT_PUBLIC_CF_STREAM_KEY || '14c4614d72207909654df327973d1ffbkbd5f3d8e049d2f8cf0653da83f6d5fae'}
              </div>
            </FormField>
            <MetaText style={{ display: 'block', marginTop: 8 }}>
              Stream page: <a href="https://bsa.surf/stream" target="_blank" rel="noopener" style={{ color: 'var(--admin-teal)' }}>bsa.surf/stream</a>
            </MetaText>
          </Card>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card>
            <SectionLabel>Stream Page Status</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{
                width: 14, height: 14, borderRadius: '50%', display: 'inline-block',
                background: active ? 'var(--admin-success)' : '#CBD5E1',
                boxShadow: active ? '0 0 0 4px rgba(22,163,74,0.12)' : 'none',
              }} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: active ? 'var(--admin-success)' : 'var(--admin-text-muted)' }}>
                {active ? 'PAGE ON' : 'PAGE OFF'}
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
              {active ? 'The stream page is visible to visitors. Toggle off to hide it.' : 'Stream page is hidden from visitors.'}
            </p>
            <button onClick={() => setActive(!active)} style={{
              width: '100%', padding: '11px 0', borderRadius: 'var(--admin-radius)', border: 'none', fontSize: 13, fontWeight: 600,
              fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer',
              background: active ? 'var(--admin-danger)' : 'var(--admin-success)', color: '#fff',
            }}>
              {active ? 'Hide Stream Page' : 'Show Stream Page'}
            </button>
          </Card>

          <Card>
            <SectionLabel>Broadcast Status</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%', display: 'inline-block',
                background: streamLive ? '#DC2626' : '#CBD5E1',
                boxShadow: streamLive ? '0 0 0 3px rgba(220,38,38,0.15)' : 'none',
                animation: streamLive ? 'pulse 1.5s ease-in-out infinite' : 'none',
              }} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: streamLive ? '#DC2626' : 'var(--admin-text-muted)' }}>
                {streamLive ? 'LIVE — Receiving video' : 'No signal'}
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', lineHeight: 1.5, marginTop: 12 }}>
              {streamLive ? 'OBS is connected and broadcasting.' : 'Start OBS and hit "Start Streaming" to go live.'}
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
