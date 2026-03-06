'use client'
import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { MetaText } from '@/components/admin/ui'

interface Checkin {
  id: string; athlete_name: string; division: string | null
  qr_code: string; checked_in: boolean; checked_in_at: string | null
}

export default function EventCommandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params)
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const supabase = createClient()

  async function load() {
    const { data } = await supabase
      .from('event_checkins')
      .select('*')
      .eq('event_id', eventId)
      .order('athlete_name')
    setCheckins(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [eventId])

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase.channel(`checkins-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_checkins', filter: `event_id=eq.${eventId}` }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [eventId])

  async function generateQRs() {
    setGenerating(true)
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, generate: true }),
    })
    const data = await res.json()
    alert(`Generated ${data.generated} QR codes (${data.total} athletes total)`)
    load()
    setGenerating(false)
  }

  async function manualCheckIn(id: string) {
    await supabase.from('event_checkins').update({
      checked_in: true, checked_in_at: new Date().toISOString(),
    }).eq('id', id)
    load()
  }

  async function sendReminder(name: string, phone?: string) {
    if (!phone) { alert('No phone number for this athlete'); return }
    alert(`Would send WhatsApp to ${name} at ${phone} — wire up blast API`)
  }

  const total = checkins.length
  const checkedIn = checkins.filter(c => c.checked_in).length
  const missing = total - checkedIn
  const pct = total > 0 ? Math.round((checkedIn / total) * 100) : 0

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <Link href="/admin" style={{ fontSize: 11, color: 'rgba(26,26,26,0.3)', textDecoration: 'none', letterSpacing: '0.08em' }}>← ADMIN</Link>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: '#0A2540', margin: '8px 0 0' }}>Event Command Center</h1>
          <MetaText>Event ID: {eventId}</MetaText>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={generateQRs} disabled={generating} style={{
            padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(10,37,64,0.08)',
            backgroundColor: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#0A2540',
          }}>
            {generating ? 'Generating...' : 'Generate QR Codes'}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { value: total, label: 'Registered', color: '#0A2540' },
          { value: checkedIn, label: 'Checked In', color: '#10B981' },
          { value: missing, label: 'Missing', color: missing > 0 ? '#F59E0B' : '#10B981' },
          { value: `${pct}%`, label: 'Check-in Rate', color: '#2BA5A0' },
        ].map(s => (
          <div key={s.label} style={{
            padding: '20px', borderRadius: 14, backgroundColor: '#fff',
            border: '1px solid rgba(10,37,64,0.06)',
          }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'rgba(26,26,26,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <MetaText>Check-in Progress</MetaText>
          <MetaText>{checkedIn}/{total}</MetaText>
        </div>
        <div style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(10,37,64,0.06)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, backgroundColor: '#10B981', borderRadius: 4, transition: 'width 0.5s ease' }} />
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <Link href={`/admin/checkin?event=${eventId}`} style={{
          padding: '10px 20px', borderRadius: 8, backgroundColor: '#2BA5A0', color: '#fff',
          fontSize: 13, fontWeight: 600, textDecoration: 'none',
        }}>
          Open QR Scanner
        </Link>
        <button onClick={() => {
          const noShows = checkins.filter(c => !c.checked_in).map(c => c.athlete_name).join(', ')
          if (!noShows) { alert('Everyone is checked in!'); return }
          alert(`Missing athletes:\n${noShows}`)
        }} style={{
          padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(10,37,64,0.08)',
          backgroundColor: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#0A2540',
        }}>
          View No-Shows
        </button>
      </div>

      {/* Athlete list */}
      {loading ? <MetaText>Loading...</MetaText> : checkins.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'rgba(26,26,26,0.25)', fontSize: 13 }}>
          No registrations yet. Click &quot;Generate QR Codes&quot; to create check-in entries for all athletes.
        </div>
      ) : (
        <div style={{ border: '1px solid rgba(10,37,64,0.06)', borderRadius: 12, overflow: 'hidden' }}>
          {checkins.map((c, i) => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '10px 20px',
              borderBottom: i < checkins.length - 1 ? '1px solid rgba(10,37,64,0.04)' : 'none',
              backgroundColor: c.checked_in ? 'rgba(16,185,129,0.03)' : 'transparent',
            }}>
              {/* Status dot */}
              <div style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                backgroundColor: c.checked_in ? '#10B981' : 'rgba(26,26,26,0.1)',
              }} />
              {/* Name */}
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 500, fontSize: 13, color: '#0A2540' }}>{c.athlete_name}</span>
                {c.division && <MetaText style={{ marginLeft: 8 }}>{c.division}</MetaText>}
              </div>
              {/* Status */}
              {c.checked_in ? (
                <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 8, backgroundColor: 'rgba(16,185,129,0.08)', color: '#10B981', fontWeight: 600 }}>
                  ✓ {c.checked_in_at ? new Date(c.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Checked in'}
                </span>
              ) : (
                <button onClick={() => manualCheckIn(c.id)} style={{
                  fontSize: 11, padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(10,37,64,0.08)',
                  backgroundColor: '#fff', cursor: 'pointer', color: '#0A2540', fontWeight: 500,
                }}>
                  Check In
                </button>
              )}
              {/* QR code text */}
              <MetaText style={{ fontSize: 9, width: 100, flexShrink: 0, textAlign: 'right' }}>{c.qr_code}</MetaText>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
