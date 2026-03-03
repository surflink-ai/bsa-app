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
    setShowForm(false); setEditingId(null); setName(''); setSurflineId(''); setCoast('East')
    setLat(''); setLon(''); setBestSwell(''); setBestSize(''); setOffshoreWind('')
    setBreakType(''); setDescription(''); setAdminNote(''); setPriority(2); setActive(true)
  }

  const handleEdit = (s: SurfSpot) => {
    setEditingId(s.id); setName(s.name); setSurflineId(s.surfline_spot_id || ''); setCoast(s.coast)
    setLat(s.lat?.toString() || ''); setLon(s.lon?.toString() || '')
    setBestSwell(s.best_swell || ''); setBestSize(s.best_size || '')
    setOffshoreWind(s.offshore_wind || ''); setBreakType(s.break_type || '')
    setDescription(s.description || ''); setAdminNote(s.admin_note || '')
    setPriority(s.priority); setActive(s.active); setShowForm(true)
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
    setSaving(false); resetForm(); fetchSpots()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this spot?')) return
    const supabase = createClient()
    await supabase.from('surf_spots').delete().eq('id', id)
    setSpots(prev => prev.filter(s => s.id !== id))
  }

  const coastColors: Record<string, string> = { East: '#2BA5A0', South: '#1478B5', West: '#7C3AED' }

  const focusHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.target.style.borderColor = '#2BA5A0' }
  const blurHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.target.style.borderColor = 'rgba(10,37,64,0.12)' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Surf Spots</h1>
          <p className="text-[12px] text-[#0A2540]/30 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{spots.length} spots</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null) }}
          className="text-[12px] font-medium text-white px-4 py-2 transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#0A2540', borderRadius: '4px' }}>
          Add Spot
        </button>
      </div>

      {/* Coast filter */}
      <div className="flex gap-1.5 mb-5">
        {[null, 'East', 'South', 'West'].map(c => (
          <button key={c || 'all'} onClick={() => setFilterCoast(c)}
            className="text-[11px] px-3 py-1 transition-colors"
            style={{
              backgroundColor: filterCoast === c ? '#0A2540' : 'transparent',
              color: filterCoast === c ? '#fff' : 'rgba(10,37,64,0.3)',
              borderRadius: '3px',
              border: filterCoast === c ? 'none' : '1px solid rgba(10,37,64,0.08)',
            }}>
            {c || 'All'}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="mb-6 p-5" style={{ border: '1px solid rgba(10,37,64,0.06)', borderRadius: '4px', backgroundColor: '#fff' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label style={labelStyle}>Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
            <div>
              <label style={labelStyle}>Coast</label>
              <select value={coast} onChange={e => setCoast(e.target.value as 'East' | 'South' | 'West')}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler}>
                <option value="East">East</option>
                <option value="South">South</option>
                <option value="West">West</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Surfline ID</label>
              <input type="text" value={surflineId} onChange={e => setSurflineId(e.target.value)}
                style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}
                onFocus={focusHandler} onBlur={blurHandler} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label style={labelStyle}>Latitude</label>
              <input type="text" value={lat} onChange={e => setLat(e.target.value)}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
            <div>
              <label style={labelStyle}>Longitude</label>
              <input type="text" value={lon} onChange={e => setLon(e.target.value)}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
            <div>
              <label style={labelStyle}>Best Swell</label>
              <input type="text" value={bestSwell} onChange={e => setBestSwell(e.target.value)}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} placeholder="N-NE" />
            </div>
            <div>
              <label style={labelStyle}>Best Size</label>
              <input type="text" value={bestSize} onChange={e => setBestSize(e.target.value)}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} placeholder="3-6ft" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label style={labelStyle}>Offshore Wind</label>
              <input type="text" value={offshoreWind} onChange={e => setOffshoreWind(e.target.value)}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} placeholder="W-SW" />
            </div>
            <div>
              <label style={labelStyle}>Break Type</label>
              <select value={breakType} onChange={e => setBreakType(e.target.value)}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler}>
                <option value="">Select...</option>
                <option value="reef">Reef</option>
                <option value="point">Point</option>
                <option value="beach">Beach</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <input type="number" value={priority} onChange={e => setPriority(parseInt(e.target.value) || 2)} min={1} max={5}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-[13px] text-[#0A2540]/60 cursor-pointer">
                <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} style={{ accentColor: '#2BA5A0' }} />
                Active
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label style={labelStyle}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties} onFocus={focusHandler} onBlur={blurHandler} />
          </div>

          <div className="mb-4">
            <label style={labelStyle}>Admin Note (shown on conditions page)</label>
            <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={2}
              style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties} onFocus={focusHandler} onBlur={blurHandler}
              placeholder="e.g. Rocks exposed at low tide — use caution" />
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="text-[13px] font-medium text-white px-5 py-2 transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#0A2540', borderRadius: '4px' }}>
              {saving ? 'Saving...' : editingId ? 'Update Spot' : 'Add Spot'}
            </button>
            <button onClick={resetForm} className="text-[13px] text-[#0A2540]/30 hover:text-[#0A2540]/60 px-3 py-2 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-[13px] text-[#0A2540]/30">Loading...</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(10,37,64,0.06)' }}>
              <th className="text-left pb-2.5 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(10,37,64,0.2)' }}>Spot</th>
              <th className="text-left pb-2.5 font-medium hidden md:table-cell" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(10,37,64,0.2)' }}>Coast</th>
              <th className="text-left pb-2.5 font-medium hidden md:table-cell" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(10,37,64,0.2)' }}>Type</th>
              <th className="text-left pb-2.5 font-medium hidden md:table-cell" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(10,37,64,0.2)' }}>Note</th>
              <th className="text-right pb-2.5 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(10,37,64,0.2)', width: '100px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSpots.map((s, i) => (
              <tr key={s.id} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(10,37,64,0.015)' }}>
                <td className="py-2.5 pr-4">
                  <span className="text-[13px] text-[#0A2540]/70">{s.name}</span>
                  {!s.active && <span className="text-[10px] text-[#0A2540]/20 ml-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>inactive</span>}
                </td>
                <td className="py-2.5 pr-4 hidden md:table-cell">
                  <span className="text-[10px] uppercase tracking-[0.1em] font-medium"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: coastColors[s.coast] || '#999' }}>
                    {s.coast}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-[12px] text-[#0A2540]/35 hidden md:table-cell">{s.break_type || '--'}</td>
                <td className="py-2.5 pr-4 text-[11px] text-[#CA8A04] hidden md:table-cell truncate max-w-[200px]">{s.admin_note || '--'}</td>
                <td className="py-2.5 text-right">
                  <button onClick={() => handleEdit(s)} className="text-[12px] text-[#1478B5] hover:text-[#0A2540] transition-colors">Edit</button>
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
