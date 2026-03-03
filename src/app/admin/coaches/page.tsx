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
    setName('')
    setBio('')
    setPhotoUrl('')
    setSpecialties([])
    setContactEmail('')
    setContactPhone('')
    setWebsiteUrl('')
    setSurflinkUrl('')
    setBsaCertified(false)
    setActive(true)
    setSortOrder(0)
  }

  const handleEdit = (c: Coach) => {
    setEditingId(c.id)
    setName(c.name)
    setBio(c.bio || '')
    setPhotoUrl(c.photo_url || '')
    setSpecialties(c.specialties || [])
    setContactEmail(c.contact_email || '')
    setContactPhone(c.contact_phone || '')
    setWebsiteUrl(c.website_url || '')
    setSurflinkUrl(c.surflink_url || '')
    setBsaCertified(c.bsa_certified)
    setActive(c.active)
    setSortOrder(c.sort_order)
    setShowForm(true)
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
    setSaving(false)
    resetForm()
    fetchCoaches()
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Coaches</h1>
          <p className="text-sm text-gray-400 mt-1">{coaches.length} coaches</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null) }}
          className="bg-[#2BA5A0] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#2BA5A0]/90 transition-colors">
          + Add Coach
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Photo URL</label>
              <input type="url" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Specialties</label>
            <div className="flex flex-wrap gap-2">
              {SPECIALTY_OPTIONS.map(s => (
                <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    specialties.includes(s) ? 'bg-[#2BA5A0] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>{s}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Email</label>
              <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Phone</label>
              <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Website</label>
              <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>SurfLink URL</label>
              <input type="url" value={surflinkUrl} onChange={e => setSurflinkUrl(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Sort Order</label>
              <input type="number" value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={bsaCertified} onChange={e => setBsaCertified(e.target.checked)} className="rounded" />
              BSA Certified
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="rounded" />
              Active
            </label>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="bg-[#2BA5A0] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#2BA5A0]/90 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : editingId ? 'Update Coach' : 'Add Coach'}
            </button>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 px-4 py-2 text-sm transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : coaches.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
          <p className="text-gray-400 text-sm">No coaches yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {coaches.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
              {c.photo_url ? (
                <img src={c.photo_url} alt={c.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl shrink-0">🏄</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-700" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{c.name}</p>
                  {c.bsa_certified && <span className="text-[10px] bg-[#2BA5A0]/10 text-[#2BA5A0] px-2 py-0.5 rounded-full font-medium">BSA Certified</span>}
                  {!c.active && <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Inactive</span>}
                </div>
                {c.specialties.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {c.specialties.map(s => (
                      <span key={s} className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleEdit(c)} className="text-[#1478B5] hover:text-[#0A2540] text-xs font-medium transition-colors">Edit</button>
                <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
