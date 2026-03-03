'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Coach {
  id: string
  name: string
  bio: string | null
  photo_url: string | null
  specialties: string[]
  contact_email: string | null
  contact_phone: string | null
  website_url: string | null
  surflink_url: string | null
  bsa_certified: boolean
  active: boolean
  sort_order: number
}

const SPECIALTY_OPTIONS = ['beginner', 'intermediate', 'advanced', 'competition', 'kids', 'longboard', 'SUP', 'fitness']

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

export default function AdminCoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [specialties, setSpecialties] = useState<string[]>([])
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [surflinkUrl, setSurflinkUrl] = useState('')
  const [bsaCertified, setBsaCertified] = useState(false)
  const [active, setActive] = useState(true)
  const [sortOrder, setSortOrder] = useState(0)

  const fetchCoaches = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('coaches').select('*').order('sort_order').order('name')
    setCoaches(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchCoaches() }, [])

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setName(''); setBio(''); setPhotoUrl(''); setSpecialties([])
    setContactEmail(''); setContactPhone(''); setWebsiteUrl(''); setSurflinkUrl('')
    setBsaCertified(false); setActive(true); setSortOrder(0)
  }

  const handleEdit = (c: Coach) => {
    setEditingId(c.id); setName(c.name); setBio(c.bio || ''); setPhotoUrl(c.photo_url || '')
    setSpecialties(c.specialties || []); setContactEmail(c.contact_email || '')
    setContactPhone(c.contact_phone || ''); setWebsiteUrl(c.website_url || '')
    setSurflinkUrl(c.surflink_url || ''); setBsaCertified(c.bsa_certified)
    setActive(c.active); setSortOrder(c.sort_order); setShowForm(true)
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const data = {
      name, bio: bio || null, photo_url: photoUrl || null, specialties,
      contact_email: contactEmail || null, contact_phone: contactPhone || null,
      website_url: websiteUrl || null, surflink_url: surflinkUrl || null,
      bsa_certified: bsaCertified, active, sort_order: sortOrder,
    }
    if (editingId) {
      await supabase.from('coaches').update(data).eq('id', editingId)
    } else {
      await supabase.from('coaches').insert(data)
    }
    setSaving(false); resetForm(); fetchCoaches()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coach?')) return
    const supabase = createClient()
    await supabase.from('coaches').delete().eq('id', id)
    setCoaches(prev => prev.filter(c => c.id !== id))
  }

  const toggleSpecialty = (s: string) => {
    setSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const focusHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor = '#2BA5A0' }
  const blurHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor = 'rgba(10,37,64,0.12)' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Coaches</h1>
          <p className="text-[12px] text-[#0A2540]/30 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{coaches.length} coaches</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null) }}
          className="text-[12px] font-medium text-white px-4 py-2 transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#0A2540', borderRadius: '4px' }}>
          Add Coach
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-5" style={{ border: '1px solid rgba(10,37,64,0.06)', borderRadius: '4px', backgroundColor: '#fff' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label style={labelStyle}>Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
            <div>
              <label style={labelStyle}>Photo URL</label>
              <input type="url" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
          </div>

          <div className="mb-4">
            <label style={labelStyle}>Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
              style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties}
              onFocus={focusHandler} onBlur={blurHandler} />
          </div>

          <div className="mb-4">
            <label style={{ ...labelStyle, marginBottom: '8px' }}>Specialties</label>
            <div className="flex flex-wrap gap-1.5">
              {SPECIALTY_OPTIONS.map(s => (
                <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                  className="text-[11px] px-3 py-1 transition-colors"
                  style={{
                    backgroundColor: specialties.includes(s) ? '#0A2540' : 'transparent',
                    color: specialties.includes(s) ? '#fff' : 'rgba(10,37,64,0.35)',
                    borderRadius: '3px',
                    border: specialties.includes(s) ? 'none' : '1px solid rgba(10,37,64,0.1)',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
            <div>
              <label style={labelStyle}>Website</label>
              <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label style={labelStyle}>SurfLink URL</label>
              <input type="url" value={surflinkUrl} onChange={e => setSurflinkUrl(e.target.value)}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
            <div>
              <label style={labelStyle}>Sort Order</label>
              <input type="number" value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
          </div>

          <div className="flex items-center gap-6 mb-4">
            <label className="flex items-center gap-2 text-[13px] text-[#0A2540]/60 cursor-pointer">
              <input type="checkbox" checked={bsaCertified} onChange={e => setBsaCertified(e.target.checked)}
                style={{ accentColor: '#2BA5A0' }} />
              BSA Certified
            </label>
            <label className="flex items-center gap-2 text-[13px] text-[#0A2540]/60 cursor-pointer">
              <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)}
                style={{ accentColor: '#2BA5A0' }} />
              Active
            </label>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="text-[13px] font-medium text-white px-5 py-2 transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#0A2540', borderRadius: '4px' }}>
              {saving ? 'Saving...' : editingId ? 'Update Coach' : 'Add Coach'}
            </button>
            <button onClick={resetForm} className="text-[13px] text-[#0A2540]/30 hover:text-[#0A2540]/60 px-3 py-2 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-[13px] text-[#0A2540]/30">Loading...</p>
      ) : coaches.length === 0 ? (
        <p className="text-[13px] text-[#0A2540]/30 py-12 text-center">No coaches yet.</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(10,37,64,0.06)' }}>
              <th className="text-left pb-2.5 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(10,37,64,0.2)' }}>Coach</th>
              <th className="text-left pb-2.5 font-medium hidden md:table-cell" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(10,37,64,0.2)' }}>Specialties</th>
              <th className="text-left pb-2.5 font-medium hidden md:table-cell" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(10,37,64,0.2)' }}>Status</th>
              <th className="text-right pb-2.5 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(10,37,64,0.2)', width: '100px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coaches.map((c, i) => (
              <tr key={c.id} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(10,37,64,0.015)' }}>
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-3">
                    {c.photo_url ? (
                      <img src={c.photo_url} alt={c.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-medium text-[#0A2540]/30"
                        style={{ backgroundColor: 'rgba(10,37,64,0.04)' }}>
                        {c.name[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-[13px] font-medium text-[#0A2540]/80" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{c.name}</p>
                      {c.bsa_certified && (
                        <span className="text-[9px] uppercase tracking-[0.1em] text-[#2BA5A0]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          BSA Certified
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-2.5 pr-4 hidden md:table-cell">
                  <div className="flex gap-1 flex-wrap">
                    {c.specialties.map(s => (
                      <span key={s} className="text-[10px] text-[#0A2540]/30">{s}</span>
                    ))}
                    {c.specialties.length === 0 && <span className="text-[10px] text-[#0A2540]/15">--</span>}
                  </div>
                </td>
                <td className="py-2.5 pr-4 hidden md:table-cell">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.active ? '#22C55E' : '#D1D5DB' }} />
                    <span className="text-[10px] text-[#0A2540]/30" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {c.active ? 'Active' : 'Inactive'}
                    </span>
                  </span>
                </td>
                <td className="py-2.5 text-right">
                  <button onClick={() => handleEdit(c)} className="text-[12px] text-[#1478B5] hover:text-[#0A2540] transition-colors">Edit</button>
                  <span className="text-[#0A2540]/10 mx-1.5">|</span>
                  <button onClick={() => handleDelete(c.id)} className="text-[12px] text-[#DC2626]/50 hover:text-[#DC2626] transition-colors">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
