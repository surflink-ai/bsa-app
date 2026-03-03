'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, DataTable, Modal, FormField, Button, StatusDot, MetaText, TextLink, ActionLinks, inputStyle, selectStyle } from '@/components/admin/ui'

interface Sponsor { id: string; name: string; logo_url: string | null; website_url: string | null; tier: string; sort_order: number; active: boolean }

const TIERS = ['platinum', 'gold', 'silver', 'bronze', 'supporter']

export default function SponsorsPage() {
  const [rows, setRows] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Sponsor | null>(null)
  const [form, setForm] = useState({ name: '', logo_url: '', website_url: '', tier: 'silver', active: true, sort_order: 0 })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const sb = createClient()
    const { data } = await sb.from('sponsors').select('*').order('tier').order('sort_order')
    setRows(data || []); setLoading(false)
  }
  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm({ name: '', logo_url: '', website_url: '', tier: 'silver', active: true, sort_order: 0 }); setModal(true) }
  const openEdit = (r: Sponsor) => { setEditing(r); setForm({ name: r.name, logo_url: r.logo_url || '', website_url: r.website_url || '', tier: r.tier, active: r.active, sort_order: r.sort_order }); setModal(true) }

  const save = async () => {
    setSaving(true); const sb = createClient()
    const data = { name: form.name, logo_url: form.logo_url || null, website_url: form.website_url || null, tier: form.tier, active: form.active, sort_order: form.sort_order }
    if (editing) await sb.from('sponsors').update(data).eq('id', editing.id)
    else await sb.from('sponsors').insert(data)
    setSaving(false); setModal(false); load()
  }

  const del = async (id: string) => { if (!confirm('Delete this sponsor?')) return; await createClient().from('sponsors').delete().eq('id', id); load() }

  return (
    <div>
      <PageHeader title="Sponsors" subtitle={`${rows.length} sponsor${rows.length !== 1 ? 's' : ''}`} action={{ label: 'Add Sponsor', onClick: openNew }} />
      {loading ? <MetaText>Loading...</MetaText> : (
        <DataTable columns={[
          { key: 'name', label: 'Name', render: r => <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text)' }}>{r.name}</span> },
          { key: 'tier', label: 'Tier', render: r => <span style={{ fontSize: 12, color: 'var(--admin-text-secondary)', textTransform: 'capitalize' }}>{r.tier}</span> },
          { key: 'status', label: 'Status', render: r => <StatusDot status={r.active ? 'success' : 'muted'} label={r.active ? 'Active' : 'Inactive'} /> },
          { key: 'actions', label: '', align: 'right', render: r => <ActionLinks><TextLink onClick={() => openEdit(r)}>Edit</TextLink><TextLink onClick={() => del(r.id)} color="var(--admin-danger)">Delete</TextLink></ActionLinks> },
        ]} rows={rows} />
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Sponsor' : 'Add Sponsor'}>
        <FormField label="Name"><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} /></FormField>
        <FormField label="Logo URL"><input type="url" value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} style={inputStyle} placeholder="https://..." /></FormField>
        <FormField label="Website"><input type="url" value={form.website_url} onChange={e => setForm({ ...form, website_url: e.target.value })} style={inputStyle} placeholder="https://..." /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Tier">
            <select value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value })} style={selectStyle}>
              {TIERS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </FormField>
          <FormField label="Sort Order"><input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} style={inputStyle} /></FormField>
        </div>
        <FormField label="Active">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active
          </label>
        </FormField>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Button onClick={save} disabled={saving || !form.name}>{saving ? 'Saving...' : editing ? 'Update' : 'Add'}</Button>
          <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  )
}
