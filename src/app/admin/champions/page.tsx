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

  const focusHandler = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = '#2BA5A0' }
  const blurHandler = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = 'rgba(10,37,64,0.12)' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Champions
          </h1>
          <p className="text-[12px] text-[#0A2540]/30 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {champions.length} records
          </p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null) }}
          className="text-[12px] font-medium text-white px-4 py-2 transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#0A2540', borderRadius: '4px' }}>
          Add Champion
        </button>
      </div>

      {/* Year filter */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        <button onClick={() => setFilterYear(null)}
          className="text-[11px] px-3 py-1 transition-colors"
          style={{
            backgroundColor: !filterYear ? '#0A2540' : 'transparent',
            color: !filterYear ? '#fff' : 'rgba(10,37,64,0.3)',
            borderRadius: '3px',
            border: !filterYear ? 'none' : '1px solid rgba(10,37,64,0.08)',
          }}>
          All
        </button>
        {years.map(y => (
          <button key={y} onClick={() => setFilterYear(y)}
            className="text-[11px] px-3 py-1 transition-colors"
            style={{
              backgroundColor: filterYear === y ? '#0A2540' : 'transparent',
              color: filterYear === y ? '#fff' : 'rgba(10,37,64,0.3)',
              borderRadius: '3px',
              border: filterYear === y ? 'none' : '1px solid rgba(10,37,64,0.08)',
            }}>
            {y}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="mb-6 p-5" style={{ border: '1px solid rgba(10,37,64,0.06)', borderRadius: '4px', backgroundColor: '#fff' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label style={labelStyle}>Year</label>
              <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
            <div>
              <label style={labelStyle}>Division</label>
              <select value={division} onChange={e => setDivision(e.target.value)}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler}>
                <option value="">Select...</option>
                {divisions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Champion Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
            <div>
              <label style={labelStyle}>Image URL</label>
              <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="text-[13px] font-medium text-white px-5 py-2 transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#0A2540', borderRadius: '4px' }}>
              {saving ? 'Saving...' : editingId ? 'Update' : 'Add Champion'}
            </button>
            <button onClick={resetForm} className="text-[13px] text-[#0A2540]/30 hover:text-[#0A2540]/60 px-3 py-2 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-[13px] text-[#0A2540]/30">Loading...</p>
      ) : filteredChampions.length === 0 ? (
        <p className="text-[13px] text-[#0A2540]/30 py-12 text-center">No champion records found.</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(10,37,64,0.06)' }}>
              {['Year', 'Division', 'Champion', 'Actions'].map((h, i) => (
                <th key={h} className={`text-${i === 3 ? 'right' : 'left'} pb-2.5 font-medium`}
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(10,37,64,0.2)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredChampions.map((c, i) => (
              <tr key={c.id} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(10,37,64,0.015)' }}>
                <td className="py-2.5 pr-4">
                  <span className="text-[14px] font-semibold text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{c.year}</span>
                </td>
                <td className="py-2.5 pr-4 text-[13px] text-[#0A2540]/50">{c.division}</td>
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    {c.image_url && <img src={c.image_url} alt="" className="w-5 h-5 rounded-full object-cover" />}
                    <span className="text-[13px] text-[#0A2540]/70">{c.name}</span>
                  </div>
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
