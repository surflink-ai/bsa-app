'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, Card, DataTable, StatusDot, Button, Modal, FormField, EmptyState, inputStyle, selectStyle } from '@/components/admin/ui'

interface CompEvent {
  id: string
  name: string
  location: string | null
  event_date: string | null
  end_date: string | null
  status: string
  season: { name: string } | null
  divisions: { count: number }[]
}

export default function CompetePage() {
  const router = useRouter()
  const [events, setEvents] = useState<CompEvent[]>([])
  const [seasons, setSeasons] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', location: '', event_date: '', end_date: '', season_id: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const sb = createClient()
    const { data } = await sb.from('comp_events').select('id, name, location, event_date, end_date, status, season:comp_seasons(name), divisions:comp_event_divisions(count)').order('event_date', { ascending: false })
    setEvents((data as unknown as CompEvent[]) || [])
    const { data: s } = await sb.from('comp_seasons').select('id, name').eq('active', true).order('year', { ascending: false })
    setSeasons(s || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    setSaving(true)
    const { data } = await createClient().from('comp_events').insert({
      name: form.name,
      location: form.location || null,
      event_date: form.event_date || null,
      end_date: form.end_date || null,
      season_id: form.season_id || null,
    }).select('id').single()
    setSaving(false)
    if (data) { setModal(false); router.push(`/admin/compete/${data.id}`) }
  }

  const statusMap: Record<string, 'success' | 'warning' | 'danger' | 'muted'> = {
    draft: 'muted', active: 'success', complete: 'warning', cancelled: 'danger'
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--admin-text-muted)', fontSize: 13 }}>Loading...</div>

  return (
    <div>
      <PageHeader title="Competitions" subtitle={`${events.length} event${events.length !== 1 ? 's' : ''}`} action={{ label: 'New Event', onClick: () => setModal(true) }} />

      {events.length === 0 ? (
        <EmptyState message="No competition events yet" action={{ label: 'Create First Event', onClick: () => setModal(true) }} />
      ) : (
        <DataTable
          columns={[
            { key: 'name', label: 'Event', render: (r: CompEvent) => <span style={{ fontWeight: 500, color: 'var(--admin-navy)' }}>{r.name}</span> },
            { key: 'date', label: 'Date', render: (r: CompEvent) => <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--admin-text-secondary)' }}>{r.event_date ? new Date(r.event_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span> },
            { key: 'location', label: 'Location', render: (r: CompEvent) => <span style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>{r.location || '—'}</span> },
            { key: 'divisions', label: 'Divisions', render: (r: CompEvent) => <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{r.divisions?.[0]?.count || 0}</span>, align: 'center' },
            { key: 'status', label: 'Status', render: (r: CompEvent) => <StatusDot status={statusMap[r.status] || 'muted'} label={r.status} /> },
          ]}
          rows={events}
          onRowClick={(r) => router.push(`/admin/compete/${r.id}`)}
        />
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="New Competition Event">
        <FormField label="Event Name">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="BSA SOTY Event #2" />
        </FormField>
        <FormField label="Location">
          <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={inputStyle} placeholder="Drill Hall, Hastings" />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Start Date">
            <input type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} style={inputStyle} />
          </FormField>
          <FormField label="End Date">
            <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} style={inputStyle} />
          </FormField>
        </div>
        {seasons.length > 0 && (
          <FormField label="Season">
            <select value={form.season_id} onChange={e => setForm({ ...form, season_id: e.target.value })} style={selectStyle}>
              <option value="">No season</option>
              {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Button onClick={create} disabled={saving || !form.name}>{saving ? 'Creating...' : 'Create Event'}</Button>
          <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  )
}
