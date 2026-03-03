'use client'

import { useState } from 'react'

interface NotificationComposerProps {
  onSend: (data: { title: string; body: string; type: string }) => void
  loading?: boolean
  templates?: { label: string; title: string; body: string; type: string }[]
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

export function NotificationComposer({ onSend, loading, templates = [] }: NotificationComposerProps) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState('announcement')

  const handleTemplate = (template: { title: string; body: string; type: string }) => {
    setTitle(template.title)
    setBody(template.body)
    setType(template.type)
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    onSend({ title, body, type })
    setTitle('')
    setBody('')
  }

  const focusHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.target.style.borderColor = '#2BA5A0' }
  const blurHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.target.style.borderColor = 'rgba(10,37,64,0.12)' }

  return (
    <div className="space-y-4">
      {templates.length > 0 && (
        <div>
          <p style={{ ...labelStyle, marginBottom: '8px' }}>Quick Templates</p>
          <div className="flex flex-wrap gap-1.5">
            {templates.map((t, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleTemplate(t)}
                className="text-[11px] px-3 py-1 transition-colors hover:bg-[#0A2540]/[0.04]"
                style={{
                  border: '1px solid rgba(10,37,64,0.08)',
                  borderRadius: '3px',
                  color: 'rgba(10,37,64,0.45)',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSend} className="p-5 space-y-4" style={{ border: '1px solid rgba(10,37,64,0.06)', borderRadius: '4px', backgroundColor: '#fff' }}>
        <div>
          <label style={labelStyle}>Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
            style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
        </div>

        <div>
          <label style={labelStyle}>Body</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} required rows={3}
            style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties}
            onFocus={focusHandler} onBlur={blurHandler} />
        </div>

        <div>
          <label style={labelStyle}>Type</label>
          <select value={type} onChange={e => setType(e.target.value)}
            style={inputStyle} onFocus={focusHandler} onBlur={blurHandler}>
            <option value="announcement">Announcement</option>
            <option value="event">Event</option>
            <option value="heat">Heat</option>
            <option value="conditions">Conditions</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* Preview */}
        {(title || body) && (
          <div className="p-4" style={{ backgroundColor: 'rgba(10,37,64,0.015)', borderRadius: '4px' }}>
            <p style={{ ...labelStyle, marginBottom: '8px' }}>Preview</p>
            <div className="p-3" style={{ backgroundColor: '#fff', border: '1px solid rgba(10,37,64,0.06)', borderRadius: '4px' }}>
              <p className="text-[13px] font-medium text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {title || 'Notification Title'}
              </p>
              <p className="text-[12px] text-[#0A2540]/40 mt-1">{body || 'Notification body text...'}</p>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="text-[13px] font-medium text-white px-5 py-2 transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#0A2540', borderRadius: '4px' }}>
          {loading ? 'Sending...' : 'Send Notification'}
        </button>
      </form>
    </div>
  )
}
