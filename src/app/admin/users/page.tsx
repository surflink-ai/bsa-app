'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, DataTable, MetaText, StatusDot } from '@/components/admin/ui'

interface Profile { id: string; full_name: string | null; role: string | null; created_at: string }

export default function UsersPage() {
  const [rows, setRows] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data } = await createClient().from('profiles').select('*').order('created_at', { ascending: false })
      setRows(data || []); setLoading(false)
    })()
  }, [])

  return (
    <div>
      <PageHeader title="Users" subtitle={`${rows.length} admin user${rows.length !== 1 ? 's' : ''}`} />
      {loading ? <MetaText>Loading...</MetaText> : (
        <DataTable columns={[
          { key: 'name', label: 'Name', render: r => <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text)' }}>{r.full_name || 'Unnamed'}</span> },
          { key: 'role', label: 'Role', render: r => <StatusDot status={r.role === 'super_admin' ? 'success' : 'muted'} label={(r.role || 'editor').replace('_', ' ')} /> },
          { key: 'joined', label: 'Joined', render: r => <MetaText>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</MetaText> },
        ]} rows={rows} />
      )}
    </div>
  )
}
