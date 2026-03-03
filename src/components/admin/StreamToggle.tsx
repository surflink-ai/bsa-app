'use client'

import { useState } from 'react'

interface StreamToggleProps {
  initialActive: boolean
  streamUrl: string
  embedCode: string
  title: string
  eventId: string
  onSave: (data: { active: boolean; stream_url: string; embed_code: string; title: string; event_id: string }) => void
  loading?: boolean
}

export function StreamToggle({ initialActive, streamUrl: initUrl, embedCode: initEmbed, title: initTitle, eventId: initEvent, onSave, loading }: StreamToggleProps) {
  const [active, setActive] = useState(initialActive)
  const [streamUrl, setStreamUrl] = useState(initUrl)
  const [embedCode, setEmbedCode] = useState(initEmbed)
  const [title, setTitle] = useState(initTitle)
  const [eventId, setEventId] = useState(initEvent)

  const handleSave = () => {
    onSave({ active, stream_url: streamUrl, embed_code: embedCode, title, event_id: eventId })
  }

  return (
    <div className="space-y-6">
      {/* Big toggle */}
      <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm text-center">
        <button
          type="button"
          onClick={() => setActive(!active)}
          className={`w-32 h-32 rounded-full text-5xl font-bold transition-all duration-300 shadow-lg ${
            active
              ? 'bg-red-500 text-white shadow-red-500/30 animate-pulse'
              : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
          }`}
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {active ? '🔴' : '⬤'}
        </button>
        <p className="mt-4 text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: active ? '#ef4444' : '#9ca3af' }}>
          {active ? 'STREAM IS LIVE' : 'Stream Off'}
        </p>
      </div>

      {/* Config */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Stream Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]"
            placeholder="BSA SOTY #1 Live from Drill Hall"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Stream URL (YouTube/Vimeo)</label>
          <input
            type="url"
            value={streamUrl}
            onChange={e => setStreamUrl(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]"
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Embed Code (optional)</label>
          <textarea
            value={embedCode}
            onChange={e => setEmbedCode(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#2BA5A0]"
            rows={3}
            placeholder="<iframe ...>"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Event ID (optional)</label>
          <input
            type="text"
            value={eventId}
            onChange={e => setEventId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]"
          />
        </div>

        {/* Preview */}
        {(streamUrl || embedCode) && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Preview</p>
            {embedCode ? (
              <div dangerouslySetInnerHTML={{ __html: embedCode }} className="aspect-video rounded-lg overflow-hidden" />
            ) : streamUrl ? (
              <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-sm text-gray-400">Stream: {streamUrl}</p>
              </div>
            ) : null}
          </div>
        )}

        <button onClick={handleSave} disabled={loading}
          className="bg-[#2BA5A0] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#2BA5A0]/90 disabled:opacity-50 transition-colors">
          {loading ? 'Saving...' : 'Save Stream Config'}
        </button>
      </div>
    </div>
  )
}
