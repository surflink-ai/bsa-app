'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, DataTable, Modal, FormField, Button, StatusDot, MetaText, TextLink, ActionLinks, inputStyle } from '@/components/admin/ui'
import { logAudit } from '@/lib/audit'

interface Coach { id: string; name: string; bio: string | null; photo_url: string | null; specialties: string[] | null; contact_email: string | null; website_url: string | null; surflink_url: string | null; bsa_certified: boolean; active: boolean; sort_order: number }

export default function CoachesPage() {
  const [rows, setRows] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Coach | null>(null)
  const [form, setForm] = useState({ name: '', bio: '', photo_url: '', contact_email: '', website_url: '', surflink_url: '', bsa_certified: false, active: true, specialties: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => { const { data } = await createClient().from('coaches').select('*').order('sort_order'); setRows(data || []); setLoading(false) }
  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm({ name: '', bio: '', photo_url: '', contact_email: '', website_url: '', surflink_url: '', bsa_certified: false, active: true, specialties: '' }); setModal(true) }
  const openEdit = (r: Coach) => { setEditing(r); setForm({ name: r.name, bio: r.bio || '', photo_url: r.photo_url || '', contact_email: r.contact_email || '', website_url: r.website_url || '', surflink_url: r.surflink_url || '', bsa_certified: r.bsa_certified, active: r.active, specialties: (r.specialties || []).join(', ') }); setModal(true) }

  const save = async () => {
    setSaving(true)
    const data = { name: form.name, bio: form.bio || null, photo_url: form.photo_url || null, contact_email: form.contact_email || null, website_url: form.website_url || null, surflink_url: form.surflink_url || null, bsa_certified: form.bsa_certified, active: form.active, specialties: form.specialties.split(',').map(s => s.trim()).filter(Boolean) }
    const sb = createClient()
    if (editing) { await sb.from('coaches').update(data).eq('id', editing.id); logAudit(sb, 'Updated coach', 'coach', editing.id) }
    else { await sb.from('coaches').insert(data); logAudit(sb, 'Added coach', 'coach') }
    setSaving(false); setModal(false); load()
  }

  const del = async (id: string) => { if (!confirm('Delete?')) return; await createClient().from('coaches').delete().eq('id', id); load() }

  return (
    <div>
      <PageHeader title="Coaches" subtitle={`${rows.length} coach${rows.length !== 1 ? 'es' : ''}`} action={{ label: 'Add Coach', onClick: openNew }} />
      {loading ? <MetaText>Loading...</MetaText> : (
        <DataTable columns={[
          { key: 'name', label: 'Name', render: r => <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text)' }}>{r.name}</span> },
          { key: 'specialties', label: 'Specialties', render: r => <MetaText>{(r.specialties || []).join(', ') || '-'}</MetaText> },
          { key: 'certified', label: 'Certified', render: r => <StatusDot status={r.bsa_certified ? 'success' : 'muted'} label={r.bsa_certified ? 'Yes' : 'No'} /> },
          { key: 'status', label: 'Status', render: r => <StatusDot status={r.active ? 'success' : 'muted'} label={r.active ? 'Active' : 'Inactive'} /> },
          { key: 'actions', label: '', align: 'right', render: r => <ActionLinks><TextLink onClick={() => openEdit(r)}>Edit</TextLink><TextLink onClick={() => del(r.id)} color="var(--admin-danger)">Delete</TextLink></ActionLinks> },
        ]} rows={rows} />
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Coach' : 'Add Coach'} width={560}>
        <FormField label="Name"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} /></FormField>
        <FormField label="Bio"><textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></FormField>
        <FormField label="Specialties (comma separated)"><input value={form.specialties} onChange={e => setForm({ ...form, specialties: e.target.value })} style={inputStyle} placeholder="beginner, competition, kids" /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Email"><input type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} style={inputStyle} /></FormField>
          <FormField label="Photo URL"><input type="url" value={form.photo_url} onChange={e => setForm({ ...form, photo_url: e.target.value })} style={inputStyle} /></FormField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Website"><input type="url" value={form.website_url} onChange={e => setForm({ ...form, website_url: e.target.value })} style={inputStyle} /></FormField>
          <FormField label="SurfLink URL"><input type="url" value={form.surflink_url} onChange={e => setForm({ ...form, surflink_url: e.target.value })} style={inputStyle} /></FormField>
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}><input type="checkbox" checked={form.bsa_certified} onChange={e => setForm({ ...form, bsa_certified: e.target.checked })} /> BSA Certified</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active</label>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={save} disabled={saving || !form.name}>{saving ? 'Saving...' : editing ? 'Update' : 'Add'}</Button>
          <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  )
}
