'use client'

import { useState } from 'react'

interface PollCreatorProps {
  onSubmit: (data: { title: string; description: string; options: { id: string; label: string }[]; event_id: string; closes_at: string }) => void
  onCancel: () => void
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

export function PollCreator({ onSubmit, onCancel, loading }: PollCreatorProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState([{ id: crypto.randomUUID(), label: '' }, { id: crypto.randomUUID(), label: '' }])
  const [eventId, setEventId] = useState('')
  const [closesAt, setClosesAt] = useState('')

  const addOption = () => {
    setOptions(prev => [...prev, { id: crypto.randomUUID(), label: '' }])
  }

  const removeOption = (index: number) => {
    if (options.length <= 2) return
    setOptions(prev => prev.filter((_, i) => i !== index))
  }

  const updateOption = (index: number, label: string) => {
    setOptions(prev => prev.map((o, i) => i === index ? { ...o, label } : o))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ title, description, options: options.filter(o => o.label.trim()), event_id: eventId, closes_at: closesAt })
  }

  const focusHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor = '#2BA5A0' }
  const blurHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor = 'rgba(10,37,64,0.12)' }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4" style={{ border: '1px solid rgba(10,37,64,0.06)', borderRadius: '4px', backgroundColor: '#fff' }}>
      <div>
        <label style={labelStyle}>Poll Title</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
          style={inputStyle} onFocus={focusHandler} onBlur={blurHandler}
          placeholder="Who will win the Open Mens Final?" />
      </div>

      <div>
        <label style={labelStyle}>Description (optional)</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
          style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties}
          onFocus={focusHandler} onBlur={blurHandler} />
      </div>

      <div>
        <label style={{ ...labelStyle, marginBottom: '8px' }}>Options</label>
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={opt.id} className="flex gap-2">
              <input type="text" value={opt.label} onChange={e => updateOption(i, e.target.value)}
                style={{ ...inputStyle, flex: 1 }} onFocus={focusHandler} onBlur={blurHandler}
                placeholder={`Option ${i + 1}`} required />
              {options.length > 2 && (
                <button type="button" onClick={() => removeOption(i)}
                  className="text-[12px] text-[#DC2626]/50 hover:text-[#DC2626] px-2 transition-colors">
                  x
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addOption}
          className="mt-2 text-[12px] text-[#2BA5A0] hover:text-[#2BA5A0]/70 transition-colors">
          + Add Option
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Event ID (optional)</label>
          <input type="text" value={eventId} onChange={e => setEventId(e.target.value)}
            style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
        </div>
        <div>
          <label style={labelStyle}>Closes At (optional)</label>
          <input type="datetime-local" value={closesAt} onChange={e => setClosesAt(e.target.value)}
            style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={loading}
          className="text-[13px] font-medium text-white px-5 py-2 transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#0A2540', borderRadius: '4px' }}>
          {loading ? 'Creating...' : 'Create Poll'}
        </button>
        <button type="button" onClick={onCancel}
          className="text-[13px] text-[#0A2540]/30 hover:text-[#0A2540]/60 px-3 py-2 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}
