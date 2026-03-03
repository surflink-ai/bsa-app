'use client'

import { useState } from 'react'

interface PollCreatorProps {
  onSubmit: (data: { title: string; description: string; options: { id: string; label: string }[]; event_id: string; closes_at: string }) => void
  onCancel: () => void
  loading?: boolean
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <div>
        <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Poll Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]"
          placeholder="Who will win the Open Mens Final?"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Description (optional)</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Options</label>
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={opt.id} className="flex gap-2">
              <input
                type="text"
                value={opt.label}
                onChange={e => updateOption(i, e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]"
                placeholder={`Option ${i + 1}`}
                required
              />
              {options.length > 2 && (
                <button type="button" onClick={() => removeOption(i)} className="text-red-400 hover:text-red-600 px-2 text-sm">✕</button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addOption} className="mt-2 text-[#2BA5A0] hover:text-[#2BA5A0]/80 text-sm font-medium">+ Add Option</button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Event ID (optional)</label>
          <input
            type="text"
            value={eventId}
            onChange={e => setEventId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Closes At (optional)</label>
          <input
            type="datetime-local"
            value={closesAt}
            onChange={e => setClosesAt(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="bg-[#2BA5A0] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#2BA5A0]/90 disabled:opacity-50 transition-colors">
          {loading ? 'Creating...' : 'Create Poll'}
        </button>
        <button type="button" onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 px-4 py-2 text-sm transition-colors">Cancel</button>
      </div>
    </form>
  )
}
