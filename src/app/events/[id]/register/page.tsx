'use client'
import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Division { id: string; name: string }
interface EventDivision { id: string; division: Division; max_athletes: number }
interface CompEvent {
  id: string; name: string; location: string | null; event_date: string | null
  registration_open: boolean; registration_fee: number | null; registration_notes: string | null
  event_divisions: EventDivision[]
}

export default function RegisterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const sb = createClient()

  const [event, setEvent] = useState<CompEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDiv, setSelectedDiv] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [emergency, setEmergency] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [regCounts, setRegCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    (async () => {
      const { data: ev } = await sb.from('comp_events').select(`
        id, name, location, event_date, registration_open, registration_fee, registration_notes,
        event_divisions:comp_event_divisions(
          id, max_athletes,
          division:comp_divisions(id, name)
        )
      `).eq('id', id).single()
      if (ev) setEvent(ev as unknown as CompEvent)

      // Get registration counts per division
      if (ev?.event_divisions) {
        const counts: Record<string, number> = {}
        for (const ed of ev.event_divisions as any[]) {
          const { count } = await sb.from('comp_registrations').select('id', { count: 'exact', head: true }).eq('event_division_id', ed.id).in('status', ['confirmed', 'pending', 'registered'])
          counts[ed.id] = count || 0
        }
        setRegCounts(counts)
      }
      setLoading(false)
    })()
  }, [])

  const submit = async () => {
    if (!name || !selectedDiv) { setError('Name and division are required'); return }
    setSubmitting(true); setError('')

    // Check for duplicate
    const { data: existing } = await sb.from('comp_registrations')
      .select('id')
      .eq('event_division_id', selectedDiv)
      .ilike('athlete_name', name)
      .single()

    if (existing) {
      setError('You are already registered for this division')
      setSubmitting(false)
      return
    }

    // Check capacity
    const ed = event?.event_divisions.find(d => d.id === selectedDiv)
    if (ed && regCounts[selectedDiv] >= ed.max_athletes) {
      setError('This division is full')
      setSubmitting(false)
      return
    }

    // Search for existing athlete
    let athleteId: string | null = null
    const searchRes = await fetch(`/api/athletes/search?q=${encodeURIComponent(name)}&limit=1`)
    const matches = await searchRes.json()
    if (Array.isArray(matches) && matches.length > 0 && matches[0].name.toLowerCase() === name.toLowerCase()) {
      athleteId = matches[0].id
    }

    const { error: insertErr } = await sb.from('comp_registrations').insert({
      event_division_id: selectedDiv,
      athlete_id: athleteId,
      athlete_name: name,
      email: email || null,
      phone: phone || null,
      emergency_contact: emergency || null,
      status: 'pending',
      payment_status: event?.registration_fee ? 'pending' : 'free',
    })

    if (insertErr) {
      setError(insertErr.message)
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setSubmitting(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A2540', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>Loading...</span>
    </div>
  )

  if (!event) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A2540', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 18 }}>Event not found</span>
      <Link href="/events" style={{ color: '#2BA5A0', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, textDecoration: 'none' }}>← Back to events</Link>
    </div>
  )

  if (!event.registration_open) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A2540', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
      <span style={{ color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700 }}>{event.name}</span>
      <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 16 }}>Registration is currently closed</span>
      <Link href={`/events/${id}`} style={{ color: '#2BA5A0', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, textDecoration: 'none', marginTop: 8 }}>← Back to event</Link>
    </div>
  )

  if (success) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A2540', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(43,165,160,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 28 }}>✓</span>
      </div>
      <span style={{ color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700 }}>Registration Submitted!</span>
      <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, textAlign: 'center', maxWidth: 400 }}>
        Your registration for {event.name} is pending confirmation. You&apos;ll be notified when it&apos;s confirmed.
      </span>
      <Link href={`/events/${id}`} style={{ color: '#2BA5A0', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, textDecoration: 'none', marginTop: 16 }}>← Back to event</Link>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A2540', padding: '120px 24px 80px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        {/* Header */}
        <Link href={`/events/${id}`} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', display: 'block', marginBottom: 20, letterSpacing: '0.08em' }}>← BACK TO EVENT</Link>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 28, color: '#fff', marginBottom: 4 }}>Register</h1>
        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
          {event.name} — {event.location || ''} {event.event_date ? `· ${new Date(event.event_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}
        </p>
        {event.registration_fee && event.registration_fee > 0 && (
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2BA5A0', marginBottom: 4 }}>
            Entry Fee: ${event.registration_fee.toFixed(2)} BBD
          </p>
        )}
        {event.registration_notes && (
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 0 }}>{event.registration_notes}</p>
        )}

        {/* Form */}
        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Division */}
          <div>
            <label style={labelStyle}>Division *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {event.event_divisions.map(ed => {
                const count = regCounts[ed.id] || 0
                const full = count >= ed.max_athletes
                const selected = selectedDiv === ed.id
                return (
                  <button
                    key={ed.id}
                    onClick={() => !full && setSelectedDiv(ed.id)}
                    disabled={full}
                    style={{
                      padding: '10px 16px', borderRadius: 8, border: selected ? '2px solid #2BA5A0' : '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: selected ? 'rgba(43,165,160,0.1)' : 'rgba(255,255,255,0.03)',
                      color: full ? 'rgba(255,255,255,0.2)' : selected ? '#2BA5A0' : 'rgba(255,255,255,0.6)',
                      fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600,
                      cursor: full ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {ed.division?.name}
                    <span style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: full ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.25)', marginTop: 2 }}>
                      {full ? 'FULL' : `${count}/${ed.max_athletes} spots`}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Name */}
          <div>
            <label style={labelStyle}>Full Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="First Last" style={fieldStyle} />
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" style={fieldStyle} />
          </div>

          {/* Phone */}
          <div>
            <label style={labelStyle}>Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (246) ..." style={fieldStyle} />
          </div>

          {/* Emergency Contact */}
          <div>
            <label style={labelStyle}>Emergency Contact</label>
            <input value={emergency} onChange={e => setEmergency(e.target.value)} placeholder="Name & phone number" style={fieldStyle} />
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', color: '#EF4444', fontSize: 13, fontFamily: "'Space Grotesk', sans-serif" }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={submit}
            disabled={submitting || !name || !selectedDiv}
            style={{
              padding: '14px 24px', borderRadius: 8, border: 'none',
              backgroundColor: submitting || !name || !selectedDiv ? 'rgba(43,165,160,0.3)' : '#2BA5A0',
              color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600,
              cursor: submitting || !name || !selectedDiv ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s', marginTop: 8,
            }}
          >
            {submitting ? 'Submitting...' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block' as const,
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  fontWeight: 500 as const,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: 'rgba(255,255,255,0.35)',
  marginBottom: 8,
}

const fieldStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
  backgroundColor: 'rgba(255,255,255,0.04)',
  color: '#fff',
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box' as const,
  transition: 'border-color 0.15s',
}
