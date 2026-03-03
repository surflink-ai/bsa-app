'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, Card, Modal, FormField, Button, MetaText, TextLink, ActionLinks, inputStyle } from '@/components/admin/ui'

interface Photo { id: string; event_id: string; event_name: string | null; src: string; alt: string | null; credit: string | null; sort_order: number }

export default function PhotosPage() {
  const [rows, setRows] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ event_id: '', event_name: '', src: '', alt: '', credit: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => { const { data } = await createClient().from('event_photos').select('*').order('created_at', { ascending: false }); setRows(data || []); setLoading(false) }
  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    await createClient().from('event_photos').insert({ event_id: form.event_id, event_name: form.event_name || null, src: form.src, alt: form.alt || null, credit: form.credit || null })
    setSaving(false); setModal(false); setForm({ event_id: '', event_name: '', src: '', alt: '', credit: '' }); load()
  }

  const del = async (id: string) => { if (!confirm('Delete?')) return; await createClient().from('event_photos').delete().eq('id', id); load() }

  return (
    <div>
      <PageHeader title="Photos" subtitle={`${rows.length} photo${rows.length !== 1 ? 's' : ''}`} action={{ label: 'Add Photo', onClick: () => setModal(true) }} />
      {loading ? <MetaText>Loading...</MetaText> : rows.length === 0 ? (
        <Card><div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>No photos yet</div></Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {rows.map(p => (
            <Card key={p.id} padding={false} style={{ overflow: 'hidden' }}>
              <div style={{ aspectRatio: '4/3', background: '#F1F5F9', overflow: 'hidden' }}>
                <img src={p.src} alt={p.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => (e.currentTarget.style.display = 'none')} />
              </div>
              <div style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--admin-text)' }}>{p.event_name || p.event_id}</div>
                {p.credit && <MetaText style={{ display: 'block', marginTop: 2, fontSize: 10 }}>{p.credit}</MetaText>}
                <div style={{ marginTop: 8 }}><TextLink onClick={() => del(p.id)} color="var(--admin-danger)">Delete</TextLink></div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="Add Photo">
        <FormField label="Image URL"><input value={form.src} onChange={e => setForm({ ...form, src: e.target.value })} style={inputStyle} placeholder="https://..." /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Event ID"><input value={form.event_id} onChange={e => setForm({ ...form, event_id: e.target.value })} style={inputStyle} /></FormField>
          <FormField label="Event Name"><input value={form.event_name} onChange={e => setForm({ ...form, event_name: e.target.value })} style={inputStyle} /></FormField>
        </div>
        <FormField label="Alt Text"><input value={form.alt} onChange={e => setForm({ ...form, alt: e.target.value })} style={inputStyle} /></FormField>
        <FormField label="Credit"><input value={form.credit} onChange={e => setForm({ ...form, credit: e.target.value })} style={inputStyle} /></FormField>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Button onClick={save} disabled={saving || !form.src || !form.event_id}>{saving ? 'Saving...' : 'Add'}</Button>
          <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  )
}
