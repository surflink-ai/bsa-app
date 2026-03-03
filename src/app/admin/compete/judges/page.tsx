'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, Card, DataTable, Button, Modal, FormField, StatusDot, ActionLinks, TextLink, inputStyle, selectStyle } from '@/components/admin/ui'

interface Judge { id: string; name: string; pin: string; role: string; active: boolean }

export default function JudgesPage() {
  const [judges, setJudges] = useState<Judge[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', pin: '', role: 'judge' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data } = await createClient().from('comp_judges').select('*').order('name')
    setJudges(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    setSaving(true)
    await createClient().from('comp_judges').insert({ name: form.name, pin: form.pin, role: form.role })
    setSaving(false); setModal(false); setForm({ name: '', pin: '', role: 'judge' }); load()
  }

  const toggleActive = async (j: Judge) => {
    await createClient().from('comp_judges').update({ active: !j.active }).eq('id', j.id)
    load()
  }

  const deleteJudge = async (id: string) => {
    if (!confirm('Remove this judge?')) return
    await createClient().from('comp_judges').delete().eq('id', id)
    load()
  }

  const generatePin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString()
    setForm({ ...form, pin })
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--admin-text-muted)', fontSize: 13 }}>Loading...</div>

  return (
    <div>
      <PageHeader title="Judges" subtitle={`${judges.length} registered`} action={{ label: 'Add Judge', onClick: () => { generatePin(); setModal(true) } }} backHref="/admin/compete" />

      <DataTable
        columns={[
          { key: 'name', label: 'Name', render: (j: Judge) => <span style={{ fontWeight: 500, color: 'var(--admin-navy)' }}>{j.name}</span> },
          { key: 'pin', label: 'PIN', render: (j: Judge) => <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, letterSpacing: '0.2em' }}>{j.pin}</span> },
          { key: 'role', label: 'Role', render: (j: Judge) => <StatusDot status={j.role === 'head_judge' ? 'success' : 'muted'} label={j.role.replace('_', ' ')} /> },
          { key: 'status', label: 'Active', render: (j: Judge) => <StatusDot status={j.active ? 'success' : 'muted'} label={j.active ? 'Active' : 'Inactive'} /> },
          { key: 'actions', label: '', render: (j: Judge) => (
            <ActionLinks>
              <TextLink onClick={() => toggleActive(j)}>{j.active ? 'Disable' : 'Enable'}</TextLink>
              <TextLink onClick={() => deleteJudge(j.id)} color="var(--admin-danger)">Delete</TextLink>
            </ActionLinks>
          ), align: 'right' },
        ]}
        rows={judges}
      />

      <Modal open={modal} onClose={() => setModal(false)} title="Add Judge">
        <FormField label="Name">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="Judge name" />
        </FormField>
        <FormField label="PIN (4-6 digits)">
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={form.pin} onChange={e => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })} style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 18, letterSpacing: '0.3em', textAlign: 'center' }} placeholder="0000" />
            <Button variant="secondary" onClick={generatePin}>Random</Button>
          </div>
        </FormField>
        <FormField label="Role">
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={selectStyle}>
            <option value="judge">Judge</option>
            <option value="head_judge">Head Judge</option>
          </select>
        </FormField>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Button onClick={create} disabled={saving || !form.name || form.pin.length < 4}>{saving ? 'Adding...' : 'Add Judge'}</Button>
          <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  )
}
