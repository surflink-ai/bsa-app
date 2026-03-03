'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StreamToggle } from '@/components/admin/StreamToggle'

export default function AdminStreamPage() {
  const [config, setConfig] = useState<{
    id: string
    active: boolean
    stream_url: string | null
    embed_code: string | null
    title: string | null
    event_id: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchConfig = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('stream_config').select('*').limit(1).single()
      setConfig(data)
      setLoading(false)
    }
    fetchConfig()
  }, [])

  const handleSave = async (data: { active: boolean; stream_url: string; embed_code: string; title: string; event_id: string }) => {
    if (!config) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('stream_config').update({
      active: data.active,
      stream_url: data.stream_url || null,
      embed_code: data.embed_code || null,
      title: data.title || null,
      event_id: data.event_id || null,
      updated_at: new Date().toISOString(),
    }).eq('id', config.id)
    setConfig(prev => prev ? { ...prev, ...data } : prev)
    setSaving(false)
    alert('Stream config saved!')
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Live Stream</h1>
        <p className="text-[12px] text-[#0A2540]/30 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Control the live stream banner on the homepage</p>
      </div>

      {loading ? (
        <p className="text-[13px] text-[#0A2540]/30">Loading...</p>
      ) : config ? (
        <StreamToggle
          initialActive={config.active}
          streamUrl={config.stream_url || ''}
          embedCode={config.embed_code || ''}
          title={config.title || ''}
          eventId={config.event_id || ''}
          onSave={handleSave}
          loading={saving}
        />
      ) : (
        <p className="text-[13px] text-[#0A2540]/30">No stream configuration found. Please run the database migrations.</p>
      )}
    </div>
  )
}
