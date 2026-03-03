'use client'

import { useState } from 'react'

interface SponsorFormData {
  name: string
  logo_url: string
  website_url: string
  tier: 'platinum' | 'gold' | 'silver' | 'bronze' | 'supporter'
  active: boolean
  sort_order: number
}

interface SponsorFormProps {
  initial?: Partial<SponsorFormData>
  onSubmit: (data: SponsorFormData) => void
  onCancel: () => void
  loading?: boolean
}

export function SponsorForm({ initial, onSubmit, onCancel, loading }: SponsorFormProps) {
  const [form, setForm] = useState<SponsorFormData>({
    name: initial?.name || '',
    logo_url: initial?.logo_url || '',
    website_url: initial?.website_url || '',
    tier: initial?.tier || 'supporter',
    active: initial?.active ?? true,
    sort_order: initial?.sort_order ?? 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <div>
        <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Name</label>
        <input
          type="text"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Logo URL</label>
        <input
          type="url"
          value={form.logo_url}
          onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]"
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Website URL</label>
        <input
          type="url"
          value={form.website_url}
          onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]"
          placeholder="https://..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Tier</label>
          <select
            value={form.tier}
            onChange={e => setForm(f => ({ ...f, tier: e.target.value as SponsorFormData['tier'] }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]"
          >
            <option value="platinum">Platinum</option>
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
            <option value="bronze">Bronze</option>
            <option value="supporter">Supporter</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Sort Order</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="sponsor-active"
          checked={form.active}
          onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
          className="rounded"
        />
        <label htmlFor="sponsor-active" className="text-sm text-gray-600">Active</label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#2BA5A0] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#2BA5A0]/90 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : 'Save Sponsor'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 px-4 py-2 text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
