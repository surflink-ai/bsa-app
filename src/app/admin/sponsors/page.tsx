'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SponsorForm } from '@/components/admin/SponsorForm'

interface Sponsor {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
  tier: 'platinum' | 'gold' | 'silver' | 'bronze' | 'supporter'
  sort_order: number
  active: boolean
}

export default function AdminSponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchSponsors = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('sponsors').select('*').order('tier').order('sort_order')
    setSponsors(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchSponsors() }, [])

  const handleCreate = async (data: Omit<Sponsor, 'id'>) => {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('sponsors').insert(data)
    setShowForm(false)
    setSaving(false)
    fetchSponsors()
  }

  const handleUpdate = async (data: Omit<Sponsor, 'id'>) => {
    if (!editingSponsor) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('sponsors').update(data).eq('id', editingSponsor.id)
    setEditingSponsor(null)
    setSaving(false)
    fetchSponsors()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sponsor?')) return
    const supabase = createClient()
    await supabase.from('sponsors').delete().eq('id', id)
    setSponsors(prev => prev.filter(s => s.id !== id))
  }

  const handleToggleActive = async (sponsor: Sponsor) => {
    const supabase = createClient()
    await supabase.from('sponsors').update({ active: !sponsor.active }).eq('id', sponsor.id)
    fetchSponsors()
  }

  const tierColors: Record<string, string> = { platinum: '#7C3AED', gold: '#CA8A04', silver: '#64748B', bronze: '#92400E', supporter: '#2BA5A0' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Sponsors</h1>
          <p className="text-[12px] text-[#0A2540]/30 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{sponsors.length} sponsors</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingSponsor(null) }}
          className="text-[12px] font-medium text-white px-4 py-2 transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#0A2540', borderRadius: '4px' }}>
          Add Sponsor
        </button>
      </div>

      {(showForm || editingSponsor) && (
        <div className="mb-6">
          <SponsorForm
            initial={editingSponsor ? { ...editingSponsor, logo_url: editingSponsor.logo_url ?? undefined, website_url: editingSponsor.website_url ?? undefined } : undefined}
            onSubmit={editingSponsor ? handleUpdate : handleCreate}
            onCancel={() => { setShowForm(false); setEditingSponsor(null) }}
            loading={saving}
          />
        </div>
      )}

      {loading ? (
        <p className="text-[13px] text-[#0A2540]/30">Loading...</p>
      ) : sponsors.length === 0 ? (
        <p className="text-[13px] text-[#0A2540]/30 py-12 text-center">No sponsors yet.</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(10,37,64,0.06)' }}>
              <th className="text-left pb-2.5 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(10,37,64,0.2)' }}>Sponsor</th>
              <th className="text-left pb-2.5 font-medium hidden md:table-cell" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(10,37,64,0.2)' }}>Tier</th>
              <th className="text-left pb-2.5 font-medium hidden md:table-cell" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(10,37,64,0.2)' }}>Status</th>
              <th className="text-right pb-2.5 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(10,37,64,0.2)', width: '100px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sponsors.map((s, i) => (
              <tr key={s.id} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(10,37,64,0.015)' }}>
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-3">
                    {s.logo_url && <img src={s.logo_url} alt="" className="w-6 h-6 object-contain flex-shrink-0" />}
                    <div>
                      <p className="text-[13px] font-medium text-[#0A2540]/70">{s.name}</p>
                      {s.website_url && <p className="text-[10px] text-[#0A2540]/20 truncate max-w-[200px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.website_url}</p>}
                    </div>
                  </div>
                </td>
                <td className="py-2.5 pr-4 hidden md:table-cell">
                  <span className="text-[10px] uppercase tracking-[0.1em] font-medium"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: tierColors[s.tier] || '#999' }}>
                    {s.tier}
                  </span>
                </td>
                <td className="py-2.5 pr-4 hidden md:table-cell">
                  <button onClick={() => handleToggleActive(s)} className="inline-flex items-center gap-1.5 cursor-pointer">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.active ? '#22C55E' : '#D1D5DB' }} />
                    <span className="text-[10px] uppercase tracking-[0.1em]" style={{ fontFamily: "'JetBrains Mono', monospace", color: s.active ? '#22C55E' : '#9CA3AF' }}>
                      {s.active ? 'Active' : 'Inactive'}
                    </span>
                  </button>
                </td>
                <td className="py-2.5 text-right">
                  <button onClick={() => setEditingSponsor(s)} className="text-[12px] text-[#1478B5] hover:text-[#0A2540] transition-colors">Edit</button>
                  <span className="text-[#0A2540]/10 mx-1.5">|</span>
                  <button onClick={() => handleDelete(s.id)} className="text-[12px] text-[#DC2626]/50 hover:text-[#DC2626] transition-colors">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
