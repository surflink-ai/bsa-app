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

const inputStyle = {
  border: '1px solid rgba(10,37,64,0.12)',
  borderRadius: '4px',
  padding: '9px 12px',
  fontSize: '13px',
  color: '#0A2540',
  width: '100%',
  outline: 'none',
}

const labelStyle = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '10px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.15em',
  color: 'rgba(10,37,64,0.35)',
  display: 'block',
  marginBottom: '6px',
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

  const focusHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor = '#2BA5A0' }
  const blurHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor = 'rgba(10,37,64,0.12)' }

  return (
    <div className="max-w-[600px] space-y-6">
      {/* Stream status toggle */}
      <div className="flex items-center justify-between py-4" style={{ borderBottom: '1px solid rgba(10,37,64,0.06)' }}>
        <div className="flex items-center gap-3">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{
              backgroundColor: active ? '#EF4444' : '#D1D5DB',
              boxShadow: active ? '0 0 8px rgba(239,68,68,0.35)' : 'none',
            }}
          />
          <div>
            <p
              className="text-[16px] font-semibold"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                color: active ? '#EF4444' : '#9CA3AF',
              }}
            >
              {active ? 'STREAM IS LIVE' : 'Stream Off'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActive(!active)}
          className="text-[11px] font-medium px-4 py-1.5 transition-colors"
          style={{
            border: '1px solid rgba(10,37,64,0.12)',
            borderRadius: '4px',
            color: active ? '#DC2626' : '#0A2540',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {active ? 'Turn Off' : 'Go Live'}
        </button>
      </div>

      {/* Config fields */}
      <div className="space-y-4">
        <div>
          <label style={labelStyle}>Stream Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            style={inputStyle} onFocus={focusHandler} onBlur={blurHandler}
            placeholder="BSA SOTY #1 Live from Drill Hall" />
        </div>

        <div>
          <label style={labelStyle}>Stream URL (YouTube/Vimeo)</label>
          <input type="url" value={streamUrl} onChange={e => setStreamUrl(e.target.value)}
            style={inputStyle} onFocus={focusHandler} onBlur={blurHandler}
            placeholder="https://youtube.com/watch?v=..." />
        </div>

        <div>
          <label style={labelStyle}>Embed Code (optional)</label>
          <textarea value={embedCode} onChange={e => setEmbedCode(e.target.value)} rows={3}
            style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', resize: 'vertical' } as React.CSSProperties}
            onFocus={focusHandler} onBlur={blurHandler}
            placeholder="<iframe ...>" />
        </div>

        <div>
          <label style={labelStyle}>Event ID (optional)</label>
          <input type="text" value={eventId} onChange={e => setEventId(e.target.value)}
            style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
        </div>

        {/* Preview */}
        {(streamUrl || embedCode) && (
          <div className="p-4" style={{ backgroundColor: 'rgba(10,37,64,0.015)', borderRadius: '4px' }}>
            <p style={{ ...labelStyle, marginBottom: '8px' }}>Preview</p>
            {embedCode ? (
              <div dangerouslySetInnerHTML={{ __html: embedCode }} className="aspect-video overflow-hidden" style={{ borderRadius: '4px' }} />
            ) : streamUrl ? (
              <div className="aspect-video flex items-center justify-center" style={{ backgroundColor: 'rgba(10,37,64,0.04)', borderRadius: '4px' }}>
                <p className="text-[12px] text-[#0A2540]/25" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{streamUrl}</p>
              </div>
            ) : null}
          </div>
        )}

        <button onClick={handleSave} disabled={loading}
          className="text-[13px] font-medium text-white px-5 py-2.5 transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#0A2540', borderRadius: '4px' }}>
          {loading ? 'Saving...' : 'Save Stream Config'}
        </button>
      </div>
    </div>
  )
}
