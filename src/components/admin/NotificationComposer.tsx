'use client'

import { useState } from 'react'

interface NotificationComposerProps {
  onSend: (data: { title: string; body: string; type: string }) => void
  loading?: boolean
  templates?: { label: string; title: string; body: string; type: string }[]
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

  return (
    <div className="space-y-4">
      {templates.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Quick Templates</p>
          <div className="flex flex-wrap gap-2">
            {templates.map((t, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleTemplate(t)}
                className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSend} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Body</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            required
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]"
          >
            <option value="announcement">Announcement</option>
            <option value="event">Event</option>
            <option value="heat">Heat</option>
            <option value="conditions">Conditions</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* Preview */}
        {(title || body) && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Preview</p>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
              <p className="font-semibold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title || 'Notification Title'}</p>
              <p className="text-xs text-gray-500 mt-1">{body || 'Notification body text...'}</p>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="bg-[#2BA5A0] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#2BA5A0]/90 disabled:opacity-50 transition-colors">
          {loading ? 'Sending...' : 'Send Notification'}
        </button>
      </form>
    </div>
  )
}
