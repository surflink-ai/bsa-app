'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, DataTable, Modal, FormField, Button, StatusDot, MetaText, TextLink, ActionLinks, inputStyle } from '@/components/admin/ui'
import { logAudit } from '@/lib/audit'

interface Poll { id: string; title: string; description: string | null; options: { label: string; id: string }[]; event_id: string | null; active: boolean; closes_at: string | null; created_at: string }

export default function PollsPage() {
  const [rows, setRows] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', event_id: '', options: ['', ''], closes_at: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => { const { data } = await createClient().from('fan_polls').select('*').order('created_at', { ascending: false }); setRows(data || []); setLoading(false) }
  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    const opts = form.options.filter(Boolean).map((label, i) => ({ label, id: `opt_${i}` }))
    await createClient().from('fan_polls').insert({ title: form.title, description: form.description || null, event_id: form.event_id || null, options: opts, active: true, closes_at: form.closes_at || null })
    setSaving(false); setModal(false); setForm({ title: '', description: '', event_id: '', options: ['', ''], closes_at: '' }); load()
  }

  const toggle = async (id: string, active: boolean) => { await createClient().from('fan_polls').update({ active: !active }).eq('id', id); load() }
  const del = async (id: string) => { if (!confirm('Delete?')) return; await createClient().from('fan_polls').delete().eq('id', id); load() }

  return (
    <div>
      <PageHeader title="Polls" subtitle={`${rows.length} poll${rows.length !== 1 ? 's' : ''}`} action={{ label: 'Create Poll', onClick: () => setModal(true) }} />
      {loading ? <MetaText>Loading...</MetaText> : (
        <DataTable columns={[
          { key: 'title', label: 'Title', render: r => <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text)' }}>{r.title}</span> },
          { key: 'options', label: 'Options', render: r => <MetaText>{r.options?.length || 0} options</MetaText> },
          { key: 'status', label: 'Status', render: r => <StatusDot status={r.active ? 'success' : 'muted'} label={r.active ? 'Active' : 'Closed'} /> },
          { key: 'date', label: 'Created', render: r => <MetaText>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</MetaText> },
          { key: 'actions', label: '', align: 'right', render: r => <ActionLinks><TextLink onClick={() => toggle(r.id, r.active)}>{r.active ? 'Close' : 'Reopen'}</TextLink><TextLink onClick={() => del(r.id)} color="var(--admin-danger)">Delete</TextLink></ActionLinks> },
        ]} rows={rows} />
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="Create Poll">
        <FormField label="Question"><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} placeholder="Best wave of the day?" /></FormField>
        <FormField label="Description"><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={inputStyle} /></FormField>
        <FormField label="Options">
          {form.options.map((opt, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={opt} onChange={e => { const o = [...form.options]; o[i] = e.target.value; setForm({ ...form, options: o }) }} style={inputStyle} placeholder={`Option ${i + 1}`} />
              {form.options.length > 2 && <button onClick={() => setForm({ ...form, options: form.options.filter((_, j) => j !== i) })} style={{ background: 'none', border: 'none', color: 'var(--admin-danger)', cursor: 'pointer', fontSize: 16, padding: '0 8px' }}>&times;</button>}
            </div>
          ))}
          <button onClick={() => setForm({ ...form, options: [...form.options, ''] })} style={{ fontSize: 12, color: 'var(--admin-teal)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}>+ Add option</button>
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Event ID (optional)"><input value={form.event_id} onChange={e => setForm({ ...form, event_id: e.target.value })} style={inputStyle} /></FormField>
          <FormField label="Closes At"><input type="datetime-local" value={form.closes_at} onChange={e => setForm({ ...form, closes_at: e.target.value })} style={inputStyle} /></FormField>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Button onClick={save} disabled={saving || !form.title || form.options.filter(Boolean).length < 2}>{saving ? 'Creating...' : 'Create Poll'}</Button>
          <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  )
}
