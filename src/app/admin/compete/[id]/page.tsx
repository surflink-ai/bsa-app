'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, Card, SectionLabel, FormField, Button, Modal, StatusDot, MetaText, EmptyState, inputStyle, selectStyle } from '@/components/admin/ui'

interface Division { id: string; name: string; short_name: string }
interface EventDivision {
  id: string; division_id: string; max_athletes: number
  waves_per_heat: number; ride_time_minutes: number; scoring_best_of: number; advances_per_heat: number
  division: Division
  rounds: Round[]
}
interface Round { id: string; round_number: number; name: string; status: string; heats: Heat[] }
interface Heat { id: string; heat_number: number; status: string; duration_minutes: number; athletes: HeatAthlete[] }
interface HeatAthlete { id: string; athlete_name: string; jersey_color: string | null; seed_position: number | null; result_position: number | null }
interface CompEvent {
  id: string; name: string; location: string | null; event_date: string | null; status: string
  event_divisions: EventDivision[]
}

const JERSEY_COLORS = ['red', 'blue', 'white', 'yellow', 'green', 'black', 'pink', 'orange']
const JERSEY_HEX: Record<string, string> = { red: '#DC2626', blue: '#2563EB', white: '#E2E8F0', yellow: '#EAB308', green: '#16A34A', black: '#1E293B', pink: '#EC4899', orange: '#EA580C' }

const ROUND_NAMES: Record<number, string> = { 1: 'Round 1', 2: 'Round 2', 3: 'Round 3', 4: 'Quarterfinals', 5: 'Semifinals', 6: 'Final' }
function getRoundName(num: number, total: number): string {
  if (num === total) return 'Final'
  if (num === total - 1) return 'Semifinals'
  if (num === total - 2) return 'Quarterfinals'
  return `Round ${num}`
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const sb = createClient()

  const [event, setEvent] = useState<CompEvent | null>(null)
  const [allDivisions, setAllDivisions] = useState<Division[]>([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [addDivModal, setAddDivModal] = useState(false)
  const [selectedDivId, setSelectedDivId] = useState('')
  const [generateModal, setGenerateModal] = useState<EventDivision | null>(null)
  const [numAthletes, setNumAthletes] = useState(16)
  const [athletesPerHeat, setAthletesPerHeat] = useState(4)
  const [athleteModal, setAthleteModal] = useState<Heat | null>(null)
  const [athleteName, setAthleteName] = useState('')
  const [athleteJersey, setAthleteJersey] = useState('red')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data: ev } = await sb.from('comp_events').select(`
      id, name, location, event_date, status,
      event_divisions:comp_event_divisions(
        id, division_id, max_athletes, waves_per_heat, ride_time_minutes, scoring_best_of, advances_per_heat,
        division:comp_divisions(id, name, short_name),
        rounds:comp_rounds(
          id, round_number, name, status,
          heats:comp_heats(
            id, heat_number, status, duration_minutes,
            athletes:comp_heat_athletes(id, athlete_name, jersey_color, seed_position, result_position)
          )
        )
      )
    `).eq('id', id).single()

    if (ev) {
      // Sort rounds and heats
      const evTyped = ev as unknown as CompEvent
      evTyped.event_divisions?.forEach(ed => {
        ed.rounds?.sort((a, b) => a.round_number - b.round_number)
        ed.rounds?.forEach(r => r.heats?.sort((a, b) => a.heat_number - b.heat_number))
      })
      setEvent(evTyped)
    }

    const { data: divs } = await sb.from('comp_divisions').select('id, name, short_name').eq('active', true).order('sort_order')
    setAllDivisions(divs || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const addDivision = async () => {
    if (!selectedDivId) return
    setSaving(true)
    await sb.from('comp_event_divisions').insert({ event_id: id, division_id: selectedDivId })
    setSaving(false); setAddDivModal(false); setSelectedDivId(''); load()
  }

  const removeDivision = async (edId: string) => {
    if (!confirm('Remove this division and all its rounds/heats?')) return
    await sb.from('comp_event_divisions').delete().eq('id', edId)
    load()
  }

  const generateRounds = async (ed: EventDivision) => {
    setSaving(true)
    // Calculate bracket: how many rounds needed
    let remaining = numAthletes
    const rounds: { name: string; heatCount: number }[] = []
    let roundNum = 1

    while (remaining > athletesPerHeat) {
      const heatsNeeded = Math.ceil(remaining / athletesPerHeat)
      rounds.push({ name: `Round ${roundNum}`, heatCount: heatsNeeded })
      remaining = heatsNeeded * ed.advances_per_heat
      roundNum++
    }
    // Final
    rounds.push({ name: 'Final', heatCount: 1 })

    // Rename rounds properly
    const totalRounds = rounds.length
    rounds.forEach((r, i) => { r.name = getRoundName(i + 1, totalRounds) })

    // Insert rounds and heats
    for (let i = 0; i < rounds.length; i++) {
      const { data: round } = await sb.from('comp_rounds').insert({
        event_division_id: ed.id,
        round_number: i + 1,
        name: rounds[i].name,
      }).select('id').single()

      if (round) {
        const heats = Array.from({ length: rounds[i].heatCount }, (_, j) => ({
          round_id: round.id,
          heat_number: j + 1,
          duration_minutes: ed.ride_time_minutes,
        }))
        await sb.from('comp_heats').insert(heats)
      }
    }

    setSaving(false); setGenerateModal(null); load()
  }

  const addAthleteToHeat = async () => {
    if (!athleteModal || !athleteName) return
    setSaving(true)
    const existing = athleteModal.athletes?.length || 0
    await sb.from('comp_heat_athletes').insert({
      heat_id: athleteModal.id,
      athlete_name: athleteName,
      jersey_color: athleteJersey,
      seed_position: existing + 1,
    })
    setSaving(false); setAthleteModal(null); setAthleteName(''); setAthleteJersey('red'); load()
  }

  const removeAthlete = async (haId: string) => {
    await sb.from('comp_heat_athletes').delete().eq('id', haId)
    load()
  }

  const updateEventStatus = async (status: string) => {
    await sb.from('comp_events').update({ status }).eq('id', id)
    load()
  }

  const deleteEvent = async () => {
    if (!confirm('Delete this event and ALL its data?')) return
    await sb.from('comp_events').delete().eq('id', id)
    router.push('/admin/compete')
  }

  const updateHeatStatus = async (heatId: string, status: string) => {
    await sb.from('comp_heats').update({ status }).eq('id', heatId)
    load()
  }

  const statusMap: Record<string, 'success' | 'warning' | 'danger' | 'muted'> = {
    draft: 'muted', active: 'success', complete: 'warning', cancelled: 'danger',
    pending: 'muted', live: 'success',
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--admin-text-muted)', fontSize: 13 }}>Loading...</div>
  if (!event) return <div style={{ padding: 40, color: 'var(--admin-text-muted)', fontSize: 13 }}>Event not found</div>

  const usedDivIds = event.event_divisions?.map(ed => ed.division_id) || []
  const availableDivs = allDivisions.filter(d => !usedDivIds.includes(d.id))

  return (
    <div>
      <PageHeader title={event.name} subtitle={`${event.location || 'No location'} — ${event.event_date ? new Date(event.event_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No date'}`} backHref="/admin/compete" />

      {/* Status + Actions */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 32 }}>
        <StatusDot status={statusMap[event.status] || 'muted'} label={event.status} />
        <div style={{ flex: 1 }} />
        {event.status === 'draft' && <Button variant="primary" onClick={() => updateEventStatus('active')}>Activate Event</Button>}
        {event.status === 'active' && <Button variant="secondary" onClick={() => updateEventStatus('complete')}>Mark Complete</Button>}
        <Button variant="danger" onClick={deleteEvent}>Delete</Button>
      </div>

      {/* Divisions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--admin-navy)', margin: 0 }}>Divisions</h2>
        {availableDivs.length > 0 && <Button variant="secondary" onClick={() => setAddDivModal(true)}>Add Division</Button>}
      </div>

      {(!event.event_divisions || event.event_divisions.length === 0) ? (
        <EmptyState message="No divisions added yet" action={{ label: 'Add Division', onClick: () => setAddDivModal(true) }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {event.event_divisions.map(ed => (
            <Card key={ed.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600, color: 'var(--admin-navy)' }}>{ed.division?.name}</span>
                  <MetaText style={{ marginLeft: 12 }}>{ed.ride_time_minutes}min heats — Best {ed.scoring_best_of} waves — Top {ed.advances_per_heat} advance</MetaText>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(!ed.rounds || ed.rounds.length === 0) && (
                    <Button variant="primary" onClick={() => { setGenerateModal(ed); setNumAthletes(ed.max_athletes) }}>Generate Bracket</Button>
                  )}
                  <Button variant="danger" onClick={() => removeDivision(ed.id)}>Remove</Button>
                </div>
              </div>

              {/* Rounds */}
              {ed.rounds && ed.rounds.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {ed.rounds.map(round => (
                    <div key={round.id} style={{ background: 'rgba(10,37,64,0.015)', borderRadius: 'var(--admin-radius)', border: '1px solid var(--admin-border-subtle)', padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600, color: 'var(--admin-navy)' }}>{round.name}</span>
                        <StatusDot status={statusMap[round.status] || 'muted'} label={round.status} />
                        <MetaText>{round.heats?.length || 0} heat{(round.heats?.length || 0) !== 1 ? 's' : ''}</MetaText>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                        {round.heats?.map(heat => (
                          <div key={heat.id} style={{
                            background: '#fff', borderRadius: 'var(--admin-radius)', border: '1px solid var(--admin-border)',
                            padding: 14,
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--admin-navy)' }}>
                                Heat {heat.heat_number}
                              </span>
                              <StatusDot status={statusMap[heat.status] || 'muted'} label={heat.status} />
                            </div>

                            {/* Athletes in heat */}
                            {heat.athletes && heat.athletes.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                                {heat.athletes.map(a => (
                                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                                    {a.jersey_color && (
                                      <span style={{
                                        width: 10, height: 10, borderRadius: 2, display: 'inline-block',
                                        background: JERSEY_HEX[a.jersey_color] || '#94A3B8',
                                        border: a.jersey_color === 'white' ? '1px solid #CBD5E1' : 'none',
                                      }} />
                                    )}
                                    <span style={{ flex: 1, color: 'var(--admin-text)' }}>{a.athlete_name}</span>
                                    <button onClick={() => removeAthlete(a.id)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', fontSize: 11, padding: '2px' }}>x</button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginBottom: 10 }}>No athletes assigned</div>
                            )}

                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => { setAthleteModal(heat); setAthleteJersey(JERSEY_COLORS[heat.athletes?.length || 0] || 'red') }} style={{
                                fontSize: 11, fontWeight: 500, color: 'var(--admin-teal)', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                              }}>
                                + Add Athlete
                              </button>
                              {heat.status === 'pending' && (
                                <button onClick={() => updateHeatStatus(heat.id, 'live')} style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-success)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 8 }}>
                                  Start
                                </button>
                              )}
                              {heat.status === 'live' && (
                                <button onClick={() => updateHeatStatus(heat.id, 'complete')} style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-warning)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 8 }}>
                                  End
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add Division Modal */}
      <Modal open={addDivModal} onClose={() => setAddDivModal(false)} title="Add Division">
        <FormField label="Division">
          <select value={selectedDivId} onChange={e => setSelectedDivId(e.target.value)} style={selectStyle}>
            <option value="">Select division...</option>
            {availableDivs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </FormField>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={addDivision} disabled={saving || !selectedDivId}>{saving ? 'Adding...' : 'Add'}</Button>
          <Button variant="ghost" onClick={() => setAddDivModal(false)}>Cancel</Button>
        </div>
      </Modal>

      {/* Generate Bracket Modal */}
      <Modal open={!!generateModal} onClose={() => setGenerateModal(null)} title={`Generate Bracket — ${generateModal?.division?.name || ''}`}>
        <FormField label="Number of Athletes">
          <input type="number" value={numAthletes} onChange={e => setNumAthletes(parseInt(e.target.value) || 4)} min={2} max={64} style={inputStyle} />
        </FormField>
        <FormField label="Athletes per Heat">
          <select value={athletesPerHeat} onChange={e => setAthletesPerHeat(parseInt(e.target.value))} style={selectStyle}>
            <option value={2}>2 (Man on Man)</option>
            <option value={3}>3</option>
            <option value={4}>4 (Standard)</option>
            <option value={5}>5</option>
            <option value={6}>6</option>
          </select>
        </FormField>
        {generateModal && (
          <div style={{ marginBottom: 16, padding: 12, background: 'rgba(10,37,64,0.03)', borderRadius: 'var(--admin-radius)' }}>
            <SectionLabel>Preview</SectionLabel>
            {(() => {
              let remaining = numAthletes
              const preview: string[] = []
              let rn = 1
              while (remaining > athletesPerHeat) {
                const heats = Math.ceil(remaining / athletesPerHeat)
                preview.push(`${heats} heats`)
                remaining = heats * generateModal.advances_per_heat
                rn++
              }
              preview.push('1 heat')
              const total = preview.length
              return preview.map((p, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--admin-text-secondary)', marginBottom: 4 }}>
                  {getRoundName(i + 1, total)}: {p}
                </div>
              ))
            })()}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={() => generateModal && generateRounds(generateModal)} disabled={saving}>{saving ? 'Generating...' : 'Generate'}</Button>
          <Button variant="ghost" onClick={() => setGenerateModal(null)}>Cancel</Button>
        </div>
      </Modal>

      {/* Add Athlete Modal */}
      <Modal open={!!athleteModal} onClose={() => setAthleteModal(null)} title={`Add Athlete — Heat ${athleteModal?.heat_number || ''}`}>
        <FormField label="Athlete Name">
          <input value={athleteName} onChange={e => setAthleteName(e.target.value)} style={inputStyle} placeholder="First Last" />
        </FormField>
        <FormField label="Jersey Color">
          <div style={{ display: 'flex', gap: 8 }}>
            {JERSEY_COLORS.map(c => (
              <button key={c} onClick={() => setAthleteJersey(c)} style={{
                width: 32, height: 32, borderRadius: 'var(--admin-radius)',
                background: JERSEY_HEX[c],
                border: athleteJersey === c ? '3px solid var(--admin-navy)' : c === 'white' ? '1px solid #CBD5E1' : '1px solid transparent',
                cursor: 'pointer',
              }} />
            ))}
          </div>
        </FormField>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Button onClick={addAthleteToHeat} disabled={saving || !athleteName}>{saving ? 'Adding...' : 'Add Athlete'}</Button>
          <Button variant="ghost" onClick={() => setAthleteModal(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  )
}
