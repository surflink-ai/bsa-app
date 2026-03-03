'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SurfSpot {
  id: string
  surfline_spot_id: string | null
  name: string
  coast: 'East' | 'South' | 'West'
  lat: number | null
  lon: number | null
  best_swell: string | null
  best_size: string | null
  offshore_wind: string | null
  break_type: string | null
  description: string | null
  admin_note: string | null
  priority: number
  active: boolean
}

export default function AdminSpotsPage() {
  const [spots, setSpots] = useState<SurfSpot[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [filterCoast, setFilterCoast] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [surflineId, setSurflineId] = useState('')
  const [coast, setCoast] = useState<'East' | 'South' | 'West'>('East')
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [bestSwell, setBestSwell] = useState('')
  const [bestSize, setBestSize] = useState('')
  const [offshoreWind, setOffshoreWind] = useState('')
  const [breakType, setBreakType] = useState('')
  const [description, setDescription] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [priority, setPriority] = useState(2)
  const [active, setActive] = useState(true)

  const fetchSpots = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('surf_spots').select('*').order('coast').order('priority').order('name')
    setSpots(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchSpots() }, [])

  const filteredSpots = filterCoast ? spots.filter(s => s.coast === filterCoast) : spots

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setName(''); setSurflineId(''); setCoast('East'); setLat(''); setLon('')
    setBestSwell(''); setBestSize(''); setOffshoreWind(''); setBreakType('')
    setDescription(''); setAdminNote(''); setPriority(2); setActive(true)
  }

  const handleEdit = (s: SurfSpot) => {
    setEditingId(s.id)
    setName(s.name); setSurflineId(s.surfline_spot_id || ''); setCoast(s.coast)
    setLat(s.lat?.toString() || ''); setLon(s.lon?.toString() || '')
    setBestSwell(s.best_swell || ''); setBestSize(s.best_size || '')
    setOffshoreWind(s.offshore_wind || ''); setBreakType(s.break_type || '')
    setDescription(s.description || ''); setAdminNote(s.admin_note || '')
    setPriority(s.priority); setActive(s.active)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const data = {
      name, surfline_spot_id: surflineId || null, coast,
      lat: lat ? parseFloat(lat) : null, lon: lon ? parseFloat(lon) : null,
      best_swell: bestSwell || null, best_size: bestSize || null,
      offshore_wind: offshoreWind || null, break_type: breakType || null,
      description: description || null, admin_note: adminNote || null,
      priority, active,
    }

    if (editingId) {
      await supabase.from('surf_spots').update(data).eq('id', editingId)
    } else {
      await supabase.from('surf_spots').insert(data)
    }
    setSaving(false)
    resetForm()
    fetchSpots()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this spot?')) return
    const supabase = createClient()
    await supabase.from('surf_spots').delete().eq('id', id)
    setSpots(prev => prev.filter(s => s.id !== id))
  }

  const coastColors: Record<string, string> = { East: '#2BA5A0', South: '#1478B5', West: '#8B5CF6' }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Surf Spots</h1>
          <p className="text-sm text-gray-400 mt-1">{spots.length} spots</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null) }}
          className="bg-[#2BA5A0] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#2BA5A0]/90 transition-colors">
          + Add Spot
        </button>
      </div>

      {/* Coast filter */}
      <div className="flex gap-2 mb-6">
        {[null, 'East', 'South', 'West'].map(c => (
          <button key={c || 'all'} onClick={() => setFilterCoast(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterCoast === c ? 'bg-[#0A2540] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>
            {c || 'All'}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Coast</label>
              <select value={coast} onChange={e => setCoast(e.target.value as 'East' | 'South' | 'West')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]">
                <option value="East">East</option>
                <option value="South">South</option>
                <option value="West">West</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Surfline ID</label>
              <input type="text" value={surflineId} onChange={e => setSurflineId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#2BA5A0]" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Latitude</label>
              <input type="text" value={lat} onChange={e => setLat(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Longitude</label>
              <input type="text" value={lon} onChange={e => setLon(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Best Swell</label>
              <input type="text" value={bestSwell} onChange={e => setBestSwell(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" placeholder="N-NE" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Best Size</label>
              <input type="text" value={bestSize} onChange={e => setBestSize(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" placeholder="3-6ft" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Offshore Wind</label>
              <input type="text" value={offshoreWind} onChange={e => setOffshoreWind(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" placeholder="W-SW" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Break Type</label>
              <select value={breakType} onChange={e => setBreakType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]">
                <option value="">Select...</option>
                <option value="reef">Reef</option>
                <option value="point">Point</option>
                <option value="beach">Beach</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Priority</label>
              <input type="number" value={priority} onChange={e => setPriority(parseInt(e.target.value) || 2)} min={1} max={5}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="rounded" />
                Active
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Admin Note (shown on conditions page)</label>
            <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]"
              placeholder="e.g. Rocks exposed at low tide — use caution" />
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="bg-[#2BA5A0] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#2BA5A0]/90 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : editingId ? 'Update Spot' : 'Add Spot'}
            </button>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 px-4 py-2 text-sm transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Spot</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400 hidden md:table-cell" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Coast</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400 hidden md:table-cell" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Type</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400 hidden md:table-cell" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Note</th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSpots.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-700">{s.name}</p>
                    {!s.active && <span className="text-[10px] text-gray-400">(inactive)</span>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: `${coastColors[s.coast]}15`, color: coastColors[s.coast] }}>
                      {s.coast}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{s.break_type || '—'}</td>
                  <td className="px-4 py-3 text-xs text-yellow-600 hidden md:table-cell">{s.admin_note || '—'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => handleEdit(s)} className="text-[#1478B5] hover:text-[#0A2540] text-xs font-medium transition-colors">Edit</button>
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
