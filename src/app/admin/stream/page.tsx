'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, Card, FormField, Button, SectionLabel, MetaText, inputStyle, selectStyle } from '@/components/admin/ui'

interface VODEntry { id: string; title: string; youtube_id: string; date: string; thumbnail?: string }
interface StreamConfig {
  id: string; active: boolean; stream_url: string | null; embed_code: string | null
  title: string | null; source_type: string; youtube_video_id: string | null
  vod_enabled: boolean; vod_playlist: VODEntry[]; overlay_enabled: boolean
  overlay_url: string | null; scheduled_time: string | null; scheduled_title: string | null
  score_source: string | null; updated_at: string
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|live\/))([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

export default function AdminStreamPage() {
  const [config, setConfig] = useState<StreamConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [vodForm, setVodForm] = useState({ title: '', youtube_id: '', date: '' })
  const [showVodForm, setShowVodForm] = useState(false)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('stream_config').select('*').limit(1).single()
    if (data) setConfig(data as StreamConfig)
    setLoading(false)
  }

  async function save() {
    if (!config) return
    setSaving(true)
    const { id, updated_at, ...rest } = config
    await supabase.from('stream_config').update({ ...rest, updated_at: new Date().toISOString() }).eq('id', id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function toggleLive() {
    if (!config) return
    const newActive = !config.active
    setConfig({ ...config, active: newActive })
    await supabase.from('stream_config').update({ active: newActive, updated_at: new Date().toISOString() }).eq('id', config.id)
  }

  function updateConfig(patch: Partial<StreamConfig>) {
    if (!config) return
    setConfig({ ...config, ...patch })
  }

  function addVOD() {
    if (!config || !vodForm.youtube_id) return
    const ytId = extractYouTubeId(vodForm.youtube_id) || vodForm.youtube_id
    const entry: VODEntry = {
      id: crypto.randomUUID(),
      title: vodForm.title || `Event Recording`,
      youtube_id: ytId,
      date: vodForm.date || new Date().toISOString().split('T')[0],
      thumbnail: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
    }
    const playlist = [...(config.vod_playlist || []), entry]
    updateConfig({ vod_playlist: playlist })
    setVodForm({ title: '', youtube_id: '', date: '' })
    setShowVodForm(false)
  }

  function removeVOD(id: string) {
    if (!config) return
    updateConfig({ vod_playlist: (config.vod_playlist || []).filter(v => v.id !== id) })
  }

  if (loading) return <div style={{ padding: 32 }}>Loading...</div>
  if (!config) return <div style={{ padding: 32 }}>No stream config found.</div>

  const isLive = config.active
  const overlayUrl = config.overlay_url || `https://bsa.surf/api/stream/scores`

  return (
    <div>
      <PageHeader title="Live Stream" subtitle="Manage broadcast source, VOD library, and score overlay" />

      {/* Live Toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px', marginBottom: 24, borderRadius: 12,
        backgroundColor: isLive ? 'rgba(239,68,68,0.06)' : 'rgba(43,165,160,0.04)',
        border: `1px solid ${isLive ? 'rgba(239,68,68,0.2)' : 'rgba(43,165,160,0.15)'}`,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 12, height: 12, borderRadius: '50%',
              backgroundColor: isLive ? '#EF4444' : '#6B7280',
              boxShadow: isLive ? '0 0 0 3px rgba(239,68,68,0.2)' : 'none',
              animation: isLive ? 'pulse 2s infinite' : 'none',
            }} />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--admin-text)' }}>
              {isLive ? 'BROADCASTING LIVE' : 'Stream Offline'}
            </span>
          </div>
          {isLive && config.title && (
            <MetaText style={{ marginTop: 4 }}>{config.title}</MetaText>
          )}
        </div>
        <button
          onClick={toggleLive}
          style={{
            padding: '12px 28px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600,
            backgroundColor: isLive ? '#EF4444' : '#2BA5A0',
            color: '#fff', transition: 'all 0.2s',
          }}
        >
          {isLive ? 'Go Offline' : 'Go Live'}
        </button>
      </div>

      {/* Stream Source */}
      <Card style={{ marginBottom: 24 }}>
        <SectionLabel>Stream Source</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <FormField label="Source Type">
            <select style={selectStyle} value={config.source_type || 'youtube'} onChange={e => updateConfig({ source_type: e.target.value })}>
              <option value="youtube">YouTube Live</option>
              <option value="obs">OBS / RTMP</option>
              <option value="cloudflare">Cloudflare Stream</option>
              <option value="custom">Custom Embed</option>
            </select>
          </FormField>
          <FormField label="Stream Title">
            <input style={inputStyle} value={config.title || ''} onChange={e => updateConfig({ title: e.target.value })} placeholder="BSA Live — SOTY Event #2" />
          </FormField>
        </div>

        {config.source_type === 'youtube' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="YouTube Video/Stream URL">
              <input style={inputStyle} value={config.stream_url || ''} onChange={e => {
                const url = e.target.value
                const ytId = extractYouTubeId(url)
                updateConfig({ stream_url: url, youtube_video_id: ytId, embed_code: ytId ? `https://www.youtube.com/embed/${ytId}?autoplay=1` : null })
              }} placeholder="https://youtube.com/live/..." />
            </FormField>
            <FormField label="YouTube Video ID (auto-detected)">
              <input style={{ ...inputStyle, backgroundColor: 'rgba(0,0,0,0.02)' }} value={config.youtube_video_id || ''} readOnly />
            </FormField>
          </div>
        )}

        {config.source_type === 'obs' && (
          <div>
            <FormField label="RTMP Stream URL">
              <input style={inputStyle} value={config.stream_url || ''} onChange={e => updateConfig({ stream_url: e.target.value })} placeholder="rtmp://..." />
            </FormField>
            <FormField label="HLS Playback URL">
              <input style={inputStyle} value={config.embed_code || ''} onChange={e => updateConfig({ embed_code: e.target.value })} placeholder="https://...m3u8" />
            </FormField>
          </div>
        )}

        {config.source_type === 'cloudflare' && (
          <FormField label="Cloudflare Stream Embed URL">
            <input style={inputStyle} value={config.stream_url || ''} onChange={e => updateConfig({ stream_url: e.target.value, embed_code: e.target.value })} placeholder="https://customer-....cloudflarestream.com/..." />
          </FormField>
        )}

        {config.source_type === 'custom' && (
          <FormField label="Custom Embed Code (HTML)">
            <textarea style={{ ...inputStyle, minHeight: 100, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} value={config.embed_code || ''} onChange={e => updateConfig({ embed_code: e.target.value })} placeholder="<iframe ...>" />
          </FormField>
        )}
      </Card>

      {/* Score Overlay */}
      <Card style={{ marginBottom: 24 }}>
        <SectionLabel>Score Overlay</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={config.overlay_enabled || false} onChange={e => updateConfig({ overlay_enabled: e.target.checked })} />
            <span style={{ fontSize: 14, color: 'var(--admin-text)' }}>Enable score overlay on stream</span>
          </label>
        </div>
        {config.overlay_enabled && (
          <>
            <FormField label="Overlay URL (for OBS Browser Source)">
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={{ ...inputStyle, flex: 1, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} value={overlayUrl} readOnly />
                <button onClick={() => { navigator.clipboard?.writeText(overlayUrl) }} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--admin-border)', background: 'none', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}>Copy</button>
              </div>
            </FormField>
            <MetaText>Add this URL as a Browser Source in OBS (1920×1080, transparent background). Scores update in real-time during heats.</MetaText>
          </>
        )}
      </Card>

      {/* Schedule */}
      <Card style={{ marginBottom: 24 }}>
        <SectionLabel>Upcoming Stream</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Scheduled Date & Time">
            <input type="datetime-local" style={inputStyle} value={config.scheduled_time ? new Date(config.scheduled_time).toISOString().slice(0, 16) : ''} onChange={e => updateConfig({ scheduled_time: e.target.value ? new Date(e.target.value).toISOString() : null })} />
          </FormField>
          <FormField label="Scheduled Stream Title">
            <input style={inputStyle} value={config.scheduled_title || ''} onChange={e => updateConfig({ scheduled_title: e.target.value })} placeholder="SOTY Event #2 — South Point" />
          </FormField>
        </div>
        <MetaText style={{ marginTop: 8 }}>When not live, the public stream page shows this upcoming event with a countdown.</MetaText>
      </Card>

      {/* VOD Library */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <SectionLabel>Event Video Library</SectionLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={config.vod_enabled || false} onChange={e => updateConfig({ vod_enabled: e.target.checked })} />
              <span style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>Show when offline</span>
            </label>
            <button onClick={() => setShowVodForm(true)} style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid var(--admin-teal)', background: 'none', color: 'var(--admin-teal)', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Add Video</button>
          </div>
        </div>

        {showVodForm && (
          <div style={{ padding: 16, marginBottom: 16, borderRadius: 8, border: '1px solid var(--admin-border)', backgroundColor: 'rgba(0,0,0,0.01)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <FormField label="Title">
                <input style={inputStyle} value={vodForm.title} onChange={e => setVodForm({ ...vodForm, title: e.target.value })} placeholder="SOTY Event #1 — Drill Hall" />
              </FormField>
              <FormField label="YouTube URL or ID">
                <input style={inputStyle} value={vodForm.youtube_id} onChange={e => setVodForm({ ...vodForm, youtube_id: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
              </FormField>
              <FormField label="Date">
                <input type="date" style={inputStyle} value={vodForm.date} onChange={e => setVodForm({ ...vodForm, date: e.target.value })} />
              </FormField>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={addVOD}>Add to Library</Button>
              <button onClick={() => setShowVodForm(false)} style={{ padding: '8px 16px', border: '1px solid var(--admin-border)', borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        )}

        {(config.vod_playlist || []).length === 0 ? (
          <MetaText>No videos in library. Add past event recordings to show when stream is offline.</MetaText>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {(config.vod_playlist || []).map(vod => (
              <div key={vod.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--admin-border)' }}>
                {vod.thumbnail && (
                  <img src={vod.thumbnail} alt="" style={{ width: 80, height: 45, borderRadius: 4, objectFit: 'cover' }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--admin-text)' }}>{vod.title}</div>
                  <MetaText>{vod.date} · {vod.youtube_id}</MetaText>
                </div>
                <a href={`https://youtube.com/watch?v=${vod.youtube_id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--admin-teal)', textDecoration: 'none' }}>View</a>
                <button onClick={() => removeVOD(vod.id)} style={{ fontSize: 12, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Save */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
        </Button>
        <MetaText>Last updated: {new Date(config.updated_at).toLocaleString()}</MetaText>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
