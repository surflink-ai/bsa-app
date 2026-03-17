'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, Card, Modal, FormField, Button, StatusDot, MetaText, inputStyle, selectStyle } from '@/components/admin/ui'

interface Programme {
  id: string; title: string; age_group: string | null; description: string | null
  schedule: string | null; location: string | null; coach_name: string | null
  active: boolean; sort_order: number; category: string
}

const CATEGORIES = [
  { value: 'development', label: 'Development' },
  { value: 'coaching', label: 'Coaching' },
  { value: 'elite', label: 'Elite' },
  { value: 'camp', label: 'Camp' },
]

export default function AdminJuniorsPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Programme | null>(null)
  const [form, setForm] = useState({ title: '', age_group: '', description: '', schedule: '', location: '', coach_name: '', category: 'coaching', active: true, sort_order: 0 })
  const supabase = createClient()

  async function load() {
    const { data } = await supabase.from('junior_programmes').select('*').order('sort_order').order('title')
    setProgrammes(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditing(null)
    setForm({ title: '', age_group: '', description: '', schedule: '', location: '', coach_name: '', category: 'coaching', active: true, sort_order: programmes.length })
    setShowModal(true)
  }

  function openEdit(p: Programme) {
    setEditing(p)
    setForm({ title: p.title, age_group: p.age_group || '', description: p.description || '', schedule: p.schedule || '', location: p.location || '', coach_name: p.coach_name || '', category: p.category, active: p.active, sort_order: p.sort_order })
    setShowModal(true)
  }

  async function save() {
    const data = { title: form.title, age_group: form.age_group || null, description: form.description || null, schedule: form.schedule || null, location: form.location || null, coach_name: form.coach_name || null, category: form.category, active: form.active, sort_order: form.sort_order, updated_at: new Date().toISOString() }
    if (editing) {
      await supabase.from('junior_programmes').update(data).eq('id', editing.id)
    } else {
      await supabase.from('junior_programmes').insert(data)
    }
    setShowModal(false)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this programme?')) return
    await supabase.from('junior_programmes').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <PageHeader title="Junior Programmes" subtitle={`${programmes.length} programmes`} />
      <div style={{ marginBottom: 16 }}>
        <Button onClick={openNew}>Add Programme</Button>
      </div>

      {loading ? <MetaText>Loading...</MetaText> : programmes.length === 0 ? (
        <MetaText>No programmes yet.</MetaText>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {programmes.map(p => (
            <Card key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#0A2540' }}>{p.title}</span>
                  <StatusDot status={p.active ? 'success' : 'danger'} label={p.active ? 'Active' : 'Inactive'} />
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, backgroundColor: 'rgba(43,165,160,0.08)', color: '#2BA5A0', fontWeight: 500 }}>{p.category}</span>
                </div>
                <MetaText>{p.age_group}{p.schedule ? ` · ${p.schedule}` : ''}{p.location ? ` · ${p.location}` : ''}</MetaText>
                {p.coach_name && <MetaText>Coach: {p.coach_name}</MetaText>}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => openEdit(p)} style={{ fontSize: 12, color: '#1478B5', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                <button onClick={() => remove(p.id)} style={{ fontSize: 12, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <Modal open={showModal} title={editing ? 'Edit Programme' : 'New Programme'} onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FormField label="Title">
              <input style={inputStyle} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Grom Development" />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Age Group">
                <input style={inputStyle} value={form.age_group} onChange={e => setForm({ ...form, age_group: e.target.value })} placeholder="Under 10" />
              </FormField>
              <FormField label="Category">
                <select style={selectStyle} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </FormField>
            </div>
            <FormField label="Description">
              <textarea style={{ ...inputStyle, minHeight: 80 }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Schedule">
                <input style={inputStyle} value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} placeholder="Saturdays, 8:00–10:00 AM" />
              </FormField>
              <FormField label="Location">
                <input style={inputStyle} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Drill Hall Beach" />
              </FormField>
            </div>
            <FormField label="Coach Name">
              <input style={inputStyle} value={form.coach_name} onChange={e => setForm({ ...form, coach_name: e.target.value })} placeholder="Optional" />
            </FormField>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
              <span style={{ fontSize: 13 }}>Active</span>
            </label>
            <Button onClick={save}>{editing ? 'Save Changes' : 'Create Programme'}</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
