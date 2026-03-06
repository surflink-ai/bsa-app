'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, DataTable, Button, StatusDot, MetaText, ActionLinks } from '@/components/admin/ui'

interface Athlete {
  id: string; name: string; image_url: string | null
  claim_status: string; verified: boolean
  bio: string | null; phone: string | null; email: string | null
  social_links: any; sponsor_names: string[]
}

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'danger'> = {
  claimed: 'success', pending: 'warning', rejected: 'danger', unclaimed: 'warning',
}

export default function AdminAthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'claimed' | 'unclaimed'>('all')
  const supabase = createClient()

  async function load() {
    setLoading(true)
    let q = supabase.from('athletes').select('id, name, image_url, claim_status, verified, bio, phone, email, social_links, sponsor_names').order('name')
    if (filter !== 'all') q = q.eq('claim_status', filter)
    const { data } = await q.limit(200)
    setAthletes(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  async function handleApprove(id: string) {
    await supabase.from('athletes').update({ claim_status: 'claimed', verified: true }).eq('id', id)
    load()
  }

  async function handleReject(id: string) {
    if (!confirm('Reject this claim? The athlete will be unlinked.')) return
    await supabase.from('athletes').update({ claim_status: 'rejected', claimed_by: null, verified: false }).eq('id', id)
    load()
  }

  async function handleToggleVerified(id: string, current: boolean) {
    await supabase.from('athletes').update({ verified: !current }).eq('id', id)
    load()
  }

  const pendingCount = athletes.filter(a => a.claim_status === 'pending').length

  return (
    <>
      <PageHeader
        title="Athlete Management"
        subtitle={`${athletes.length} athletes${pendingCount > 0 ? ` · ${pendingCount} pending claims` : ''}`}
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['all', 'pending', 'claimed', 'unclaimed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
            backgroundColor: filter === f ? '#0A2540' : 'rgba(10,37,64,0.04)',
            color: filter === f ? '#fff' : 'rgba(26,26,26,0.5)',
          }}>
            {f} {f === 'pending' && pendingCount > 0 ? `(${pendingCount})` : ''}
          </button>
        ))}
      </div>

      <DataTable
        columns={['Athlete', 'Status', 'Profile', 'Actions']}
        rows={athletes.map(a => [
          <div key="n" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
              backgroundColor: 'rgba(10,37,64,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: a.verified ? '2px solid #2BA5A0' : '2px solid transparent',
            }}>
              {a.image_url ? (
                <img src={a.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 12, color: 'rgba(26,26,26,0.15)', fontWeight: 700 }}>{a.name.split(' ').map(n => n[0]).join('')}</span>
              )}
            </div>
            <div>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{a.name}</span>
              {a.phone && <MetaText style={{ display: 'block', fontSize: 10 }}>{a.phone}</MetaText>}
            </div>
          </div>,
          <StatusDot key="s" status={STATUS_COLORS[a.claim_status] || 'warning'} label={a.claim_status} />,
          <div key="p">
            {a.bio ? <MetaText>Has bio</MetaText> : null}
            {(a.sponsor_names || []).length > 0 ? <MetaText> · {a.sponsor_names.length} sponsors</MetaText> : null}
            {Object.values(a.social_links || {}).some(v => v) ? <MetaText> · Social linked</MetaText> : null}
          </div>,
          <ActionLinks key="a" actions={[
            ...(a.claim_status === 'pending' ? [
              { label: 'Approve', onClick: () => handleApprove(a.id) },
              { label: 'Reject', onClick: () => handleReject(a.id), destructive: true },
            ] : []),
            ...(a.claim_status === 'claimed' ? [
              { label: a.verified ? 'Remove verified' : 'Verify', onClick: () => handleToggleVerified(a.id, a.verified) },
            ] : []),
          ]} />,
        ])}
        loading={loading}
        emptyMessage="No athletes found."
      />
    </>
  )
}
