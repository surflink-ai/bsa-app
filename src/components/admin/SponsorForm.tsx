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

  const focusHandler = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = '#2BA5A0' }
  const blurHandler = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = 'rgba(10,37,64,0.12)' }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4" style={{ border: '1px solid rgba(10,37,64,0.06)', borderRadius: '4px', backgroundColor: '#fff' }}>
      <div>
        <label style={labelStyle}>Name</label>
        <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
          style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
      </div>

      <div>
        <label style={labelStyle}>Logo URL</label>
        <input type="url" value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
          style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} placeholder="https://..." />
      </div>

      <div>
        <label style={labelStyle}>Website URL</label>
        <input type="url" value={form.website_url} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))}
          style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} placeholder="https://..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Tier</label>
          <select value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value as SponsorFormData['tier'] }))}
            style={inputStyle} onFocus={focusHandler} onBlur={blurHandler}>
            <option value="platinum">Platinum</option>
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
            <option value="bronze">Bronze</option>
            <option value="supporter">Supporter</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Sort Order</label>
          <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
            style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="sponsor-active" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
          style={{ accentColor: '#2BA5A0' }} />
        <label htmlFor="sponsor-active" className="text-[13px] text-[#0A2540]/60 cursor-pointer">Active</label>
      </div>

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={loading}
          className="text-[13px] font-medium text-white px-5 py-2 transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#0A2540', borderRadius: '4px' }}>
          {loading ? 'Saving...' : 'Save Sponsor'}
        </button>
        <button type="button" onClick={onCancel}
          className="text-[13px] text-[#0A2540]/30 hover:text-[#0A2540]/60 px-3 py-2 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}
