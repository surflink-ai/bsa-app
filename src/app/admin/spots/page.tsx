'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, DataTable, Modal, FormField, Button, StatusDot, MetaText, TextLink, ActionLinks, inputStyle, selectStyle } from '@/components/admin/ui'
import { logAudit } from '@/lib/audit'

interface Spot { id: string; surfline_spot_id: string | null; name: string; coast: string; best_swell: string | null; best_size: string | null; offshore_wind: string | null; break_type: string | null; description: string | null; admin_note: string | null; priority: number; active: boolean }

export default function SpotsPage() {
  const [rows, setRows] = useState<Spot[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Spot | null>(null)
  const [form, setForm] = useState({ name: '', coast: 'East', surfline_spot_id: '', best_swell: '', best_size: '', offshore_wind: '', break_type: '', description: '', admin_note: '', priority: 2, active: true })
  const [saving, setSaving] = useState(false)

  const load = async () => { const { data } = await createClient().from('surf_spots').select('*').order('coast').order('priority').order('name'); setRows(data || []); setLoading(false) }
  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm({ name: '', coast: 'East', surfline_spot_id: '', best_swell: '', best_size: '', offshore_wind: '', break_type: '', description: '', admin_note: '', priority: 2, active: true }); setModal(true) }
  const openEdit = (r: Spot) => { setEditing(r); setForm({ name: r.name, coast: r.coast, surfline_spot_id: r.surfline_spot_id || '', best_swell: r.best_swell || '', best_size: r.best_size || '', offshore_wind: r.offshore_wind || '', break_type: r.break_type || '', description: r.description || '', admin_note: r.admin_note || '', priority: r.priority, active: r.active }); setModal(true) }

  const save = async () => {
    setSaving(true)
    const data = { name: form.name, coast: form.coast, surfline_spot_id: form.surfline_spot_id || null, best_swell: form.best_swell || null, best_size: form.best_size || null, offshore_wind: form.offshore_wind || null, break_type: form.break_type || null, description: form.description || null, admin_note: form.admin_note || null, priority: form.priority, active: form.active }
    const sb = createClient()
    if (editing) { await sb.from('surf_spots').update(data).eq('id', editing.id); logAudit(sb, 'Updated surf spot', 'surf_spot', editing.id) }
    else { await sb.from('surf_spots').insert(data); logAudit(sb, 'Added surf spot', 'surf_spot') }
    setSaving(false); setModal(false); load()
  }

  const del = async (id: string) => { if (!confirm('Delete?')) return; await createClient().from('surf_spots').delete().eq('id', id); load() }

  return (
    <div>
      <PageHeader title="Surf Spots" subtitle={`${rows.length} spot${rows.length !== 1 ? 's' : ''}`} action={{ label: 'Add Spot', onClick: openNew }} />
      {loading ? <MetaText>Loading...</MetaText> : (
        <DataTable columns={[
          { key: 'name', label: 'Name', render: r => <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text)' }}>{r.name}</span> },
          { key: 'coast', label: 'Coast', render: r => <span style={{ fontSize: 12, color: 'var(--admin-text-secondary)' }}>{r.coast}</span> },
          { key: 'type', label: 'Type', render: r => <MetaText>{r.break_type || '-'}</MetaText> },
          { key: 'priority', label: 'Priority', render: r => <MetaText>{r.priority}</MetaText> },
          { key: 'status', label: 'Status', render: r => <StatusDot status={r.active ? 'success' : 'muted'} label={r.active ? 'Active' : 'Inactive'} /> },
          { key: 'actions', label: '', align: 'right', render: r => <ActionLinks><TextLink onClick={() => openEdit(r)}>Edit</TextLink><TextLink onClick={() => del(r.id)} color="var(--admin-danger)">Delete</TextLink></ActionLinks> },
        ]} rows={rows} />
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Spot' : 'Add Spot'} width={600}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Name"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} /></FormField>
          <FormField label="Coast"><select value={form.coast} onChange={e => setForm({ ...form, coast: e.target.value })} style={selectStyle}><option>East</option><option>South</option><option>West</option></select></FormField>
        </div>
        <FormField label="Surfline Spot ID"><input value={form.surfline_spot_id} onChange={e => setForm({ ...form, surfline_spot_id: e.target.value })} style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <FormField label="Best Swell"><input value={form.best_swell} onChange={e => setForm({ ...form, best_swell: e.target.value })} style={inputStyle} placeholder="NE" /></FormField>
          <FormField label="Best Size"><input value={form.best_size} onChange={e => setForm({ ...form, best_size: e.target.value })} style={inputStyle} placeholder="4-8ft" /></FormField>
          <FormField label="Offshore Wind"><input value={form.offshore_wind} onChange={e => setForm({ ...form, offshore_wind: e.target.value })} style={inputStyle} placeholder="SW" /></FormField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Break Type"><input value={form.break_type} onChange={e => setForm({ ...form, break_type: e.target.value })} style={inputStyle} placeholder="Reef" /></FormField>
          <FormField label="Priority"><input type="number" value={form.priority} onChange={e => setForm({ ...form, priority: Number(e.target.value) })} style={inputStyle} /></FormField>
        </div>
        <FormField label="Description"><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} /></FormField>
        <FormField label="Admin Note (shown on conditions page)"><textarea value={form.admin_note} onChange={e => setForm({ ...form, admin_note: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} /></FormField>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', marginBottom: 20 }}><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={save} disabled={saving || !form.name}>{saving ? 'Saving...' : editing ? 'Update' : 'Add'}</Button>
          <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  )
}
