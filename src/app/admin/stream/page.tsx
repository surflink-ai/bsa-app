'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, Card, FormField, Button, SectionLabel, MetaText, Modal, TextLink, ActionLinks, inputStyle } from '@/components/admin/ui'

interface StreamVideo { id: string; title: string; url: string; source: string; thumbnail_url: string | null; sort_order: number; active: boolean }

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m?.[1] || null
}

export default function StreamPage() {
  const [active, setActive] = useState(false)
  const [title, setTitle] = useState('')
  const [eventId, setEventId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [streamLive, setStreamLive] = useState(false)

  // Video library
  const [videos, setVideos] = useState<StreamVideo[]>([])
  const [videoModal, setVideoModal] = useState(false)
  const [videoForm, setVideoForm] = useState({ title: '', url: '', thumbnail_url: '' })
  const [videoSaving, setVideoSaving] = useState(false)

  const loadConfig = async () => {
    const { data } = await createClient().from('stream_config').select('*').limit(1).single()
    if (data) { setActive(data.active); setTitle(data.title || ''); setEventId(data.event_id || '') }
    setLoading(false)
  }

  const loadVideos = async () => {
    const { data } = await createClient().from('stream_videos').select('*').order('sort_order').order('created_at', { ascending: false })
    setVideos(data || [])
  }

  useEffect(() => {
    loadConfig()
    loadVideos()
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

  const addVideo = async () => {
    setVideoSaving(true)
    const ytId = extractYouTubeId(videoForm.url)
    const thumb = videoForm.thumbnail_url || (ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null)
    await createClient().from('stream_videos').insert({
      title: videoForm.title,
      url: videoForm.url,
      source: ytId ? 'youtube' : 'cloudflare',
      thumbnail_url: thumb,
      active: true,
    })
    setVideoSaving(false); setVideoModal(false); setVideoForm({ title: '', url: '', thumbnail_url: '' }); loadVideos()
  }

  const toggleVideo = async (id: string, active: boolean) => {
    await createClient().from('stream_videos').update({ active: !active }).eq('id', id)
    loadVideos()
  }

  const deleteVideo = async (id: string) => {
    if (!confirm('Remove this video?')) return
    await createClient().from('stream_videos').delete().eq('id', id)
    loadVideos()
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--admin-text-muted)', fontSize: 13 }}>Loading...</div>

  return (
    <div>
      <PageHeader title="Live Stream" subtitle={active ? 'Stream page is active' : 'Stream page is offline'} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, marginBottom: 32 }}>
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
              <div style={{ ...inputStyle, background: 'rgba(10,37,64,0.03)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, userSelect: 'all' as const }}>
                rtmps://live.cloudflare.com:443/live/
              </div>
            </FormField>
            <FormField label="Stream Key">
              <div style={{ ...inputStyle, background: 'rgba(10,37,64,0.03)', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, userSelect: 'all' as const, wordBreak: 'break-all' as const }}>
                14c4614d72207909654df327973d1ffbkbd5f3d8e049d2f8cf0653da83f6d5fae
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
              }} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: streamLive ? '#DC2626' : 'var(--admin-text-muted)' }}>
                {streamLive ? 'LIVE' : 'No signal'}
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', lineHeight: 1.5, marginTop: 8 }}>
              {streamLive ? 'OBS is connected and broadcasting.' : 'Start OBS and hit "Start Streaming" to go live.'}
            </p>
          </Card>
        </div>
      </div>

      {/* Video Library */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--admin-navy)', margin: 0 }}>Video Library</h2>
          <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
            These videos play on the stream page when not live. Add YouTube links or Cloudflare Stream URLs.
          </p>
        </div>
        <Button onClick={() => setVideoModal(true)}>Add Video</Button>
      </div>

      {videos.length === 0 ? (
        <Card>
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>
            No videos yet. Add YouTube links to show content when not broadcasting.
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {videos.map(v => {
            const ytId = extractYouTubeId(v.url)
            const thumb = v.thumbnail_url || (ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null)
            return (
              <Card key={v.id} padding={false} style={{ overflow: 'hidden', opacity: v.active ? 1 : 0.5 }}>
                <div style={{ aspectRatio: '16/9', background: '#F1F5F9', overflow: 'hidden', position: 'relative' }}>
                  {thumb && <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => (e.currentTarget.style.display = 'none')} />}
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                    background: v.source === 'youtube' ? 'rgba(220,38,38,0.9)' : 'rgba(43,165,160,0.9)',
                    color: '#fff', padding: '3px 8px', borderRadius: 4,
                  }}>
                    {v.source}
                  </div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text)', marginBottom: 2 }}>{v.title}</div>
                  <MetaText style={{ fontSize: 10, wordBreak: 'break-all' as const, display: 'block', marginBottom: 10 }}>{v.url}</MetaText>
                  <ActionLinks>
                    <TextLink onClick={() => toggleVideo(v.id, v.active)}>{v.active ? 'Hide' : 'Show'}</TextLink>
                    <TextLink onClick={() => deleteVideo(v.id)} color="var(--admin-danger)">Delete</TextLink>
                  </ActionLinks>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Video Modal */}
      <Modal open={videoModal} onClose={() => setVideoModal(false)} title="Add Video">
        <FormField label="Title">
          <input value={videoForm.title} onChange={e => setVideoForm({ ...videoForm, title: e.target.value })} style={inputStyle} placeholder="Event highlights, athlete profile..." />
        </FormField>
        <FormField label="Video URL">
          <input value={videoForm.url} onChange={e => setVideoForm({ ...videoForm, url: e.target.value })} style={inputStyle} placeholder="https://youtube.com/watch?v=... or Cloudflare Stream URL" />
        </FormField>
        {videoForm.url && extractYouTubeId(videoForm.url) && (
          <div style={{ marginBottom: 16, borderRadius: 8, overflow: 'hidden', background: '#000' }}>
            <div style={{ aspectRatio: '16/9' }}>
              <iframe
                src={`https://www.youtube.com/embed/${extractYouTubeId(videoForm.url)}`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                allowFullScreen
              />
            </div>
          </div>
        )}
        <FormField label="Thumbnail URL (auto-generated for YouTube)">
          <input value={videoForm.thumbnail_url} onChange={e => setVideoForm({ ...videoForm, thumbnail_url: e.target.value })} style={inputStyle} placeholder="Optional — leave blank for YouTube auto-thumb" />
        </FormField>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Button onClick={addVideo} disabled={videoSaving || !videoForm.title || !videoForm.url}>{videoSaving ? 'Adding...' : 'Add Video'}</Button>
          <Button variant="ghost" onClick={() => setVideoModal(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  )
}
