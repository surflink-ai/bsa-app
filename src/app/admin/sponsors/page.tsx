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

  const tierColors: Record<string, string> = { platinum: '#8B5CF6', gold: '#eab308', silver: '#94a3b8', bronze: '#b45309', supporter: '#2BA5A0' }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Sponsors</h1>
          <p className="text-sm text-gray-400 mt-1">{sponsors.length} sponsors</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingSponsor(null) }}
          className="bg-[#2BA5A0] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#2BA5A0]/90 transition-colors">
          + Add Sponsor
        </button>
      </div>

      {(showForm || editingSponsor) && (
        <div className="mb-8">
          <SponsorForm
            initial={editingSponsor ? { ...editingSponsor, logo_url: editingSponsor.logo_url ?? undefined, website_url: editingSponsor.website_url ?? undefined } : undefined}
            onSubmit={editingSponsor ? handleUpdate : handleCreate}
            onCancel={() => { setShowForm(false); setEditingSponsor(null) }}
            loading={saving}
          />
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : sponsors.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
          <p className="text-gray-400 text-sm">No sponsors yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Sponsor</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400 hidden md:table-cell" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Tier</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400 hidden md:table-cell" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Status</th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sponsors.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {s.logo_url && <img src={s.logo_url} alt="" className="w-8 h-8 object-contain rounded" />}
                      <div>
                        <p className="font-medium text-gray-700">{s.name}</p>
                        {s.website_url && <p className="text-xs text-gray-400 truncate max-w-[200px]">{s.website_url}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: `${tierColors[s.tier]}15`, color: tierColors[s.tier] }}>
                      {s.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <button onClick={() => handleToggleActive(s)}
                      className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full cursor-pointer ${
                        s.active ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'
                      }`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {s.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => setEditingSponsor(s)} className="text-[#1478B5] hover:text-[#0A2540] text-xs font-medium transition-colors">Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
