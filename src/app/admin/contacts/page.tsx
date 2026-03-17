'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, Modal, FormField, Button, StatusDot, MetaText, inputStyle, selectStyle } from '@/components/admin/ui'
import { logAudit } from '@/lib/audit'

interface Contact {
  id: string; name: string; phone: string | null; email: string | null
  type: string; division_ids: string[]; tags: string[]
  active: boolean; opted_out: boolean; notes: string | null
  created_at: string
}

const TYPES = ['athlete', 'parent', 'coach', 'sponsor', 'committee', 'other']
const DIVISIONS = [
  { id: '7747', name: 'Open Men' }, { id: '7746', name: 'Open Women' },
  { id: '7741', name: 'U18 Boys' }, { id: '7743', name: 'U18 Girls' },
  { id: '7740', name: 'U16 Boys' }, { id: '16171', name: 'U16 Girls' },
  { id: '7739', name: 'U14 Boys' }, { id: '16305', name: 'Longboard' },
  { id: '7744', name: 'Grand Masters' }, { id: '16304', name: 'Novis' },
]

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [filter, setFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [importing, setImporting] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', type: 'athlete', notes: '', tags: '' })

  const supabase = createClient()

  async function load() {
    setLoading(true)
    let q = supabase.from('contacts').select('*').order('name')
    if (typeFilter) q = q.eq('type', typeFilter)
    const { data } = await q
    setContacts(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [typeFilter])

  async function handleSave() {
    const payload = {
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      type: form.type,
      notes: form.notes || null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }

    if (editing) {
      await supabase.from('contacts').update(payload).eq('id', editing.id)
      logAudit(supabase, 'Updated contact', 'contact', editing.id)
    } else {
      await supabase.from('contacts').insert(payload)
      logAudit(supabase, 'Added contact', 'contact', undefined, { name: form.name })
    }
    setShowModal(false)
    setEditing(null)
    setForm({ name: '', phone: '', email: '', type: 'athlete', notes: '', tags: '' })
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this contact?')) return
    await supabase.from('contacts').update({ active: false }).eq('id', id)
    logAudit(supabase, 'Deactivated contact', 'contact', id)
    load()
  }

  async function handleImport() {
    setImporting(true)
    try {
      const res = await fetch('/api/contacts/import', { method: 'POST' })
      const data = await res.json()
      alert(`Imported ${data.imported} athletes. ${data.skipped} already existed.`)
      load()
    } catch (e: any) {
      alert('Import failed: ' + e.message)
    }
    setImporting(false)
  }

  function openEdit(c: Contact) {
    setEditing(c)
    setForm({ name: c.name, phone: c.phone || '', email: c.email || '', type: c.type, notes: c.notes || '', tags: (c.tags || []).join(', ') })
    setShowModal(true)
  }

  const filtered = contacts.filter(c =>
    c.active && (!filter || c.name.toLowerCase().includes(filter.toLowerCase()) || c.phone?.includes(filter) || c.email?.toLowerCase().includes(filter.toLowerCase()))
  )

  const withPhone = contacts.filter(c => c.active && c.phone).length
  const typeCounts = TYPES.reduce((acc, t) => { acc[t] = contacts.filter(c => c.active && c.type === t).length; return acc }, {} as Record<string, number>)

  return (
    <>
      <PageHeader
        title="Contacts"
        subtitle={`${contacts.filter(c => c.active).length} contacts · ${withPhone} with phone`}
        action={{ label: 'Add Contact', onClick: () => { setEditing(null); setForm({ name: '', phone: '', email: '', type: 'athlete', notes: '', tags: '' }); setShowModal(true) } }}
      />

      {/* Import button */}
      <div style={{ marginBottom: 16 }}>
        <button onClick={handleImport} disabled={importing} style={{
          padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(10,37,64,0.08)',
          backgroundColor: '#fff', cursor: importing ? 'wait' : 'pointer', fontSize: 12, fontWeight: 500, color: '#0A2540',
        }}>
          {importing ? 'Importing...' : 'Import Athletes from Database'}
        </button>
      </div>

      {/* Type filter pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setTypeFilter('')} style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, backgroundColor: !typeFilter ? '#0A2540' : 'rgba(10,37,64,0.04)', color: !typeFilter ? '#fff' : 'rgba(26,26,26,0.5)' }}>
          All ({contacts.filter(c => c.active).length})
        </button>
        {TYPES.map(t => typeCounts[t] > 0 && (
          <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, backgroundColor: typeFilter === t ? '#0A2540' : 'rgba(10,37,64,0.04)', color: typeFilter === t ? '#fff' : 'rgba(26,26,26,0.5)', textTransform: 'capitalize' }}>
            {t} ({typeCounts[t]})
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text" placeholder="Search contacts..." value={filter} onChange={e => setFilter(e.target.value)}
        style={{ ...inputStyle, marginBottom: 16, maxWidth: 400 }}
      />

      {loading ? <MetaText>Loading...</MetaText> : filtered.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'rgba(26,26,26,0.25)', fontSize: 13 }}>No contacts yet. Import athletes or add manually.</div>
      ) : (
        <div style={{ border: '1px solid rgba(10,37,64,0.06)', borderRadius: 12, overflow: 'hidden' }}>
          {filtered.map((c, i) => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px',
              borderBottom: i < filtered.length - 1 ? '1px solid rgba(10,37,64,0.04)' : 'none',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: '#0A2540' }}>{c.name}</span>
                {c.opted_out && <StatusDot status="danger" label="Opted out" />}
              </div>
              <MetaText style={{ width: 130, flexShrink: 0 }}>{c.phone || 'No phone'}</MetaText>
              <MetaText style={{ width: 160, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.email || '—'}</MetaText>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, backgroundColor: 'rgba(43,165,160,0.08)', color: '#2BA5A0', textTransform: 'capitalize', fontWeight: 500, flexShrink: 0 }}>{c.type}</span>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => openEdit(c)} style={{ fontSize: 12, color: '#1478B5', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Edit</button>
                <button onClick={() => handleDelete(c.id)} style={{ fontSize: 12, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal open={showModal} title={editing ? 'Edit Contact' : 'New Contact'} onClose={() => { setShowModal(false); setEditing(null) }}>
          <FormField label="Name">
            <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
          </FormField>
          <FormField label="Phone (WhatsApp)">
            <input style={inputStyle} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1246..." />
          </FormField>
          <FormField label="Email">
            <input style={inputStyle} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
          </FormField>
          <FormField label="Type">
            <select style={selectStyle} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Tags (comma separated)">
            <input style={inputStyle} value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="e.g. open-men, priority" />
          </FormField>
          <FormField label="Notes">
            <input style={inputStyle} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes..." />
          </FormField>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <Button onClick={handleSave}>{editing ? 'Save' : 'Add Contact'}</Button>
            <Button onClick={() => { setShowModal(false); setEditing(null) }} variant="secondary">Cancel</Button>
          </div>
        </Modal>
      )}
    </>
  )
}
