'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, DataTable, Modal, FormField, Button, MetaText, TextLink, ActionLinks, inputStyle, selectStyle } from '@/components/admin/ui'
import { logAudit } from '@/lib/audit'

interface Champion { id: string; year: number; division: string; name: string; image_url: string | null }

export default function ChampionsPage() {
  const [rows, setRows] = useState<Champion[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Champion | null>(null)
  const [form, setForm] = useState({ year: new Date().getFullYear(), division: '', name: '', image_url: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const sb = createClient()
    const { data } = await sb.from('champions').select('*').order('year', { ascending: false }).order('division')
    setRows(data || []); setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm({ year: new Date().getFullYear(), division: '', name: '', image_url: '' }); setModal(true) }
  const openEdit = (r: Champion) => { setEditing(r); setForm({ year: r.year, division: r.division, name: r.name, image_url: r.image_url || '' }); setModal(true) }

  const save = async () => {
    setSaving(true)
    const sb = createClient()
    if (editing) {
      logAudit(sb, 'Updated champion', 'champion', editing.id); await sb.from('champions').update({ year: form.year, division: form.division, name: form.name, image_url: form.image_url || null }).eq('id', editing.id)
    } else {
      await sb.from('champions').insert({ year: form.year, division: form.division, name: form.name, image_url: form.image_url || null }); logAudit(sb, 'Added champion', 'champion', undefined, { name: form.name })
    }
    setSaving(false); setModal(false); load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this champion record?')) return
    const sb = createClient()
    await sb.from('champions').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <PageHeader title="Champions" subtitle={`${rows.length} records`} action={{ label: 'Add Champion', onClick: openNew }} />

      {loading ? <MetaText>Loading...</MetaText> : (
        <DataTable
          columns={[
            { key: 'year', label: 'Year', width: '80px', render: r => <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: 'var(--admin-navy)' }}>{r.year}</span> },
            { key: 'division', label: 'Division', render: r => <span style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>{r.division}</span> },
            { key: 'name', label: 'Name', render: r => <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text)' }}>{r.name}</span> },
            { key: 'actions', label: '', align: 'right', render: r => <ActionLinks><TextLink onClick={() => openEdit(r)}>Edit</TextLink><TextLink onClick={() => del(r.id)} color="var(--admin-danger)">Delete</TextLink></ActionLinks> },
          ]}
          rows={rows}
        />
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Champion' : 'Add Champion'}>
        <FormField label="Year">
          <input type="number" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} style={inputStyle} />
        </FormField>
        <FormField label="Division">
          <select value={form.division} onChange={e => setForm({ ...form, division: e.target.value })} style={selectStyle}>
            <option value="">Select division...</option>
            <option value="Open Men">Open Men</option>
            <option value="Open Women">Open Women</option>
            <option value="Junior Men">Junior Men</option>
            <option value="Junior Women">Junior Women</option>
            <option value="Boys U16">Boys U16</option>
            <option value="Girls U16">Girls U16</option>
            <option value="Boys U14">Boys U14</option>
            <option value="Boys U12">Boys U12</option>
            <option value="Longboard Men">Longboard Men</option>
            <option value="Longboard Women">Longboard Women</option>
            <option value="Masters">Masters</option>
            <option value="Bodyboard Men">Bodyboard Men</option>
          </select>
        </FormField>
        <FormField label="Name">
          <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
        </FormField>
        <FormField label="Image URL">
          <input type="url" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} style={inputStyle} placeholder="https://..." />
        </FormField>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Button onClick={save} disabled={saving || !form.division || !form.name}>{saving ? 'Saving...' : editing ? 'Update' : 'Add'}</Button>
          <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  )
}
