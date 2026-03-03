'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Champion {
  id: string
  year: number
  division: string
  name: string
  image_url: string | null
}

export default function AdminChampionsPage() {
  const [champions, setChampions] = useState<Champion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear())
  const [division, setDivision] = useState('')
  const [name, setName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [filterYear, setFilterYear] = useState<number | null>(null)

  const fetchChampions = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('champions').select('*').order('year', { ascending: false }).order('division')
    setChampions(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchChampions() }, [])

  const years = [...new Set(champions.map(c => c.year))].sort((a, b) => b - a)

  const filteredChampions = filterYear ? champions.filter(c => c.year === filterYear) : champions

  const divisions = ['Open Mens', 'Open Womens', 'Pro Mens', 'Pro Womens', 'Pro Juniors', 'Under 18 Boys', 'Under 18 Girls', 'Under 16 Boys', 'Under 16 Girls', 'Under 14 Boys', 'Under 12', 'Grand Masters', 'Masters 40+', 'Masters 35+', 'Longboard Open']

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setYear(new Date().getFullYear())
    setDivision('')
    setName('')
    setImageUrl('')
  }

  const handleEdit = (c: Champion) => {
    setEditingId(c.id)
    setYear(c.year)
    setDivision(c.division)
    setName(c.name)
    setImageUrl(c.image_url || '')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!division || !name.trim()) return
    setSaving(true)
    const supabase = createClient()

    if (editingId) {
      await supabase.from('champions').update({ year, division, name, image_url: imageUrl || null }).eq('id', editingId)
    } else {
      await supabase.from('champions').insert({ year, division, name, image_url: imageUrl || null })
    }
    setSaving(false)
    resetForm()
    fetchChampions()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this champion record?')) return
    const supabase = createClient()
    await supabase.from('champions').delete().eq('id', id)
    setChampions(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Champions</h1>
          <p className="text-sm text-gray-400 mt-1">{champions.length} records</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null) }}
          className="bg-[#2BA5A0] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#2BA5A0]/90 transition-colors">
          + Add Champion
        </button>
      </div>

      {/* Year filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFilterYear(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!filterYear ? 'bg-[#0A2540] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
          All
        </button>
        {years.map(y => (
          <button key={y} onClick={() => setFilterYear(y)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterYear === y ? 'bg-[#0A2540] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {y}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-8 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Year</label>
              <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Division</label>
              <select value={division} onChange={e => setDivision(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]">
                <option value="">Select...</option>
                {divisions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Champion Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Image URL</label>
              <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="bg-[#2BA5A0] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#2BA5A0]/90 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : editingId ? 'Update' : 'Add Champion'}
            </button>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 px-4 py-2 text-sm transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : filteredChampions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
          <p className="text-gray-400 text-sm">No champion records found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Year</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Division</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Champion</th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredChampions.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{c.year}</td>
                  <td className="px-4 py-3 text-gray-600">{c.division}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {c.image_url && <img src={c.image_url} alt="" className="w-6 h-6 rounded-full object-cover" />}
                      <span className="text-gray-700">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => handleEdit(c)} className="text-[#1478B5] hover:text-[#0A2540] text-xs font-medium transition-colors">Edit</button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors">Delete</button>
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
