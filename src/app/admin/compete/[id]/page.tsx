'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, Card, SectionLabel, FormField, Button, Modal, StatusDot, MetaText, EmptyState, inputStyle, selectStyle } from '@/components/admin/ui'
import { AthleteSearch } from '@/components/admin/AthleteSearch'

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
interface Registration {
  id: string; athlete_name: string; athlete_id: string | null; seed_rank: number | null
  status: string; payment_status: string; email: string | null; phone: string | null
  created_at: string
}
interface EventDivisionWithRegs extends EventDivision {
  registrations: Registration[]
}
interface CompEvent {
  id: string; name: string; location: string | null; event_date: string | null; status: string
  registration_open: boolean; registration_fee: number | null
  event_divisions: EventDivisionWithRegs[]
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
  const [athleteId, setAthleteId] = useState<string | null>(null)
  const [athleteJersey, setAthleteJersey] = useState('red')
  const [saving, setSaving] = useState(false)
  // Registration state
  const [regModal, setRegModal] = useState<EventDivisionWithRegs | null>(null)
  const [regAthleteName, setRegAthleteName] = useState('')
  const [regAthleteId, setRegAthleteId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'brackets' | 'registrations'>('brackets')
  const [seedingDiv, setSeedingDiv] = useState<string | null>(null)
  const [drawModal, setDrawModal] = useState<{ edId: string; divName: string } | null>(null)
  const [drawPerHeat, setDrawPerHeat] = useState(4)
  const [drawPreview, setDrawPreview] = useState<any>(null)
  const [drawLoading, setDrawLoading] = useState(false)
  const [walkUpModal, setWalkUpModal] = useState<EventDivisionWithRegs | null>(null)
  const [walkUpName, setWalkUpName] = useState('')
  const [walkUpId, setWalkUpId] = useState<string | null>(null)
  const [csvModal, setCsvModal] = useState<EventDivisionWithRegs | null>(null)
  const [csvText, setCsvText] = useState('')
  const [csvLoading, setCsvLoading] = useState(false)

  // Judge panel state
  const [judgePanel, setJudgePanel] = useState<{ edId: string; divName: string } | null>(null)
  const [allJudges, setAllJudges] = useState<{ id: string; name: string; pin: string; role: string }[]>([])
  const [panelAssignments, setPanelAssignments] = useState<{ judge_id: string; position: number; is_head_judge: boolean }[]>([])
  const [panelLoading, setPanelLoading] = useState(false)
  const [panelSaved, setPanelSaved] = useState(false)

  const load = async () => {
    const { data: ev } = await sb.from('comp_events').select(`
      id, name, location, event_date, status, registration_open, registration_fee,
      event_divisions:comp_event_divisions(
        id, division_id, max_athletes, waves_per_heat, ride_time_minutes, scoring_best_of, advances_per_heat,
        division:comp_divisions(id, name, short_name),
        rounds:comp_rounds(
          id, round_number, name, status,
          heats:comp_heats(
            id, heat_number, status, duration_minutes,
            athletes:comp_heat_athletes(id, athlete_name, jersey_color, seed_position, result_position)
          )
        ),
        registrations:comp_registrations(id, athlete_name, athlete_id, seed_rank, status, payment_status, email, phone, created_at)
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

    // Load judges for panel assignments
    const { data: jdgs } = await sb.from('comp_judges').select('id, name, pin, role').eq('active', true).order('name')
    setAllJudges(jdgs || [])

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
      athlete_id: athleteId || null,
      athlete_name: athleteName,
      jersey_color: athleteJersey,
      seed_position: existing + 1,
    })
    setSaving(false); setAthleteModal(null); setAthleteName(''); setAthleteId(null); setAthleteJersey('red'); load()
  }

  const handleCreateNewAthlete = async (name: string) => {
    // Create a new athlete in the registry and select them
    const { data, error } = await sb.from('athletes').insert({ name, nationality: 'Barbados' }).select('id, name, image_url, nationality, gender').single()
    if (data) {
      setAthleteName(data.name)
      setAthleteId(data.id)
    }
  }

  const addRegistration = async () => {
    if (!regModal || !regAthleteName) return
    setSaving(true)
    // Check if already registered
    const existing = regModal.registrations?.find(r => r.athlete_name.toLowerCase() === regAthleteName.toLowerCase())
    if (existing) {
      alert('This athlete is already registered for this division')
      setSaving(false)
      return
    }
    await sb.from('comp_registrations').insert({
      event_division_id: regModal.id,
      athlete_id: regAthleteId || null,
      athlete_name: regAthleteName,
      status: 'confirmed',
      payment_status: event?.registration_fee ? 'pending' : 'free',
    })
    setSaving(false); setRegModal(null); setRegAthleteName(''); setRegAthleteId(null); load()
  }

  const updateRegStatus = async (regId: string, status: string) => {
    await sb.from('comp_registrations').update({ status, updated_at: new Date().toISOString() }).eq('id', regId)
    load()
  }

  const removeRegistration = async (regId: string) => {
    if (!confirm('Remove this registration?')) return
    await sb.from('comp_registrations').delete().eq('id', regId)
    load()
  }

  const toggleRegistration = async () => {
    if (!event) return
    await sb.from('comp_events').update({ registration_open: !event.registration_open }).eq('id', id)
    load()
  }

  const autoSeed = async (edId: string) => {
    setSeedingDiv(edId)
    try {
      const res = await fetch('/api/compete/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_division_id: edId }),
      })
      const data = await res.json()
      if (data.error) alert(data.error)
      else setAdvanceMsg(data.message)
      setTimeout(() => setAdvanceMsg(null), 5000)
    } catch (e: any) { alert(e.message) }
    setSeedingDiv(null)
    load()
  }

  const previewDraw = async (edId: string) => {
    setDrawLoading(true)
    try {
      const res = await fetch('/api/compete/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_division_id: edId, athletes_per_heat: drawPerHeat, preview: true }),
      })
      const data = await res.json()
      if (data.error) { alert(data.error); setDrawLoading(false); return }
      setDrawPreview(data)
    } catch (e: any) { alert(e.message) }
    setDrawLoading(false)
  }

  const confirmDraw = async () => {
    if (!drawModal) return
    setDrawLoading(true)
    try {
      const res = await fetch('/api/compete/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_division_id: drawModal.edId, athletes_per_heat: drawPerHeat, preview: false }),
      })
      const data = await res.json()
      if (data.error) { alert(data.error); setDrawLoading(false); return }
      setAdvanceMsg(data.message)
      setTimeout(() => setAdvanceMsg(null), 5000)
      setDrawModal(null); setDrawPreview(null)
      setActiveTab('brackets')
    } catch (e: any) { alert(e.message) }
    setDrawLoading(false)
    load()
  }

  const updateSeedRank = async (regId: string, rank: number) => {
    await sb.from('comp_registrations').update({ seed_rank: rank, updated_at: new Date().toISOString() }).eq('id', regId)
    load()
  }

  const walkUpAdd = async (edId: string, athleteName: string, athleteId: string | null) => {
    // Find round 1 for this division
    const ed = event?.event_divisions.find(e => e.id === edId)
    if (!ed?.rounds?.length) return
    const r1 = ed.rounds.find(r => r.round_number === 1)
    if (!r1?.heats?.length) return

    // Find heat with fewest athletes
    const sorted = [...r1.heats].sort((a, b) => (a.athletes?.length || 0) - (b.athletes?.length || 0))
    const targetHeat = sorted[0]
    const jersey = JERSEY_COLORS[(targetHeat.athletes?.length || 0) % JERSEY_COLORS.length]

    await sb.from('comp_heat_athletes').insert({
      heat_id: targetHeat.id,
      athlete_id: athleteId || null,
      athlete_name: athleteName,
      jersey_color: jersey,
      seed_position: (targetHeat.athletes?.length || 0) + 1,
    })
    load()
  }

  const handleWalkUp = async () => {
    if (!walkUpModal || !walkUpName) return
    setSaving(true)
    await walkUpAdd(walkUpModal.id, walkUpName, walkUpId)
    setSaving(false); setWalkUpModal(null); setWalkUpName(''); setWalkUpId(null)
  }

  const handleCsvImport = async () => {
    if (!csvModal || !csvText) return
    setCsvLoading(true)
    try {
      const res = await fetch('/api/compete/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_division_id: csvModal.id, csv: csvText }),
      })
      const data = await res.json()
      if (data.error) alert(data.error)
      else { setAdvanceMsg(data.message); setTimeout(() => setAdvanceMsg(null), 5000) }
    } catch (e: any) { alert(e.message) }
    setCsvLoading(false); setCsvModal(null); setCsvText(''); load()
  }

  const openJudgePanel = async (edId: string, divName: string) => {
    setJudgePanel({ edId, divName })
    setPanelSaved(false)
    // Load existing assignments for first heat in this division
    const ed = event?.event_divisions.find(e => e.id === edId)
    if (ed?.rounds?.[0]?.heats?.[0]) {
      const res = await fetch(`/api/compete/judge-assignments?heat_id=${ed.rounds[0].heats[0].id}`)
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setPanelAssignments(data.map((d: any) => ({ judge_id: d.judge_id, position: d.position, is_head_judge: d.is_head_judge })))
      } else {
        setPanelAssignments([])
      }
    } else {
      setPanelAssignments([])
    }
  }

  const addJudgeToPanel = (judgeId: string) => {
    if (panelAssignments.find(p => p.judge_id === judgeId)) return
    const nextPos = panelAssignments.length + 1
    const judge = allJudges.find(j => j.id === judgeId)
    setPanelAssignments([...panelAssignments, {
      judge_id: judgeId,
      position: nextPos,
      is_head_judge: judge?.role === 'head_judge',
    }])
    setPanelSaved(false)
  }

  const removeJudgeFromPanel = (judgeId: string) => {
    const filtered = panelAssignments.filter(p => p.judge_id !== judgeId)
    // Reorder positions
    filtered.forEach((p, i) => p.position = i + 1)
    setPanelAssignments(filtered)
    setPanelSaved(false)
  }

  const toggleHeadJudge = (judgeId: string) => {
    setPanelAssignments(panelAssignments.map(p => ({
      ...p,
      is_head_judge: p.judge_id === judgeId ? !p.is_head_judge : p.is_head_judge,
    })))
    setPanelSaved(false)
  }

  const saveJudgePanel = async () => {
    if (!judgePanel) return
    setPanelLoading(true)
    try {
      const res = await fetch('/api/compete/judge-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_division_id: judgePanel.edId,
          judges: panelAssignments,
        }),
      })
      const data = await res.json()
      if (data.error) { alert(data.error) } else {
        setPanelSaved(true)
        setAdvanceMsg(`${panelAssignments.length} judges assigned to ${data.heats_updated} heats`)
        setTimeout(() => setAdvanceMsg(null), 5000)
      }
    } catch (e: any) { alert(e.message) }
    setPanelLoading(false)
  }

  const removeAthlete = async (haId: string) => {
    await sb.from('comp_heat_athletes').delete().eq('id', haId)
    load()
  }

  const updateEventStatus = async (status: string) => {
    await sb.from('comp_events').update({ status }).eq('id', id)

    // Calculate season points when event completes
    if (status === 'complete') {
      try {
        const res = await fetch('/api/compete/season-points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_id: id }),
        })
        const data = await res.json()
        if (data.message) { setAdvanceMsg(data.message); setTimeout(() => setAdvanceMsg(null), 5000) }
      } catch {}
    }

    load()
  }

  const deleteEvent = async () => {
    if (!confirm('Delete this event and ALL its data?')) return
    await sb.from('comp_events').delete().eq('id', id)
    router.push('/admin/compete')
  }

  const [advanceMsg, setAdvanceMsg] = useState<string | null>(null)

  const updateHeatStatus = async (heatId: string, status: string) => {
    const update: Record<string, unknown> = { status }
    if (status === 'live') {
      update.actual_start = new Date().toISOString()
      update.priority_established = false
      update.priority_riders = []
    }
    if (status === 'complete') update.actual_end = new Date().toISOString()
    await sb.from('comp_heats').update(update).eq('id', heatId)

    // Initialize priority when heat goes live
    if (status === 'live') {
      try {
        await fetch('/api/judge/priority', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start', heat_id: heatId }),
        })
      } catch {}
    }

    // Auto-advance when completing a heat
    if (status === 'complete') {
      try {
        const res = await fetch('/api/compete/advance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ heat_id: heatId }),
        })
        const data = await res.json()
        if (data.message) { setAdvanceMsg(data.message); setTimeout(() => setAdvanceMsg(null), 5000) }
      } catch {}
    }

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
        <Button variant="secondary" href={`/admin/compete/${id}/tabulation`}>Tabulation</Button>
        <Button variant="secondary" href={`/admin/compete/${id}/print`}>Print Heat Sheets</Button>
        {event.status === 'draft' && <Button variant="primary" onClick={() => updateEventStatus('active')}>Activate Event</Button>}
        {event.status === 'active' && <Button variant="secondary" onClick={() => updateEventStatus('complete')}>Mark Complete</Button>}
        <Button variant="danger" onClick={deleteEvent}>Delete</Button>
      </div>

      {/* Advance notification */}
      {advanceMsg && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--admin-radius)', background: 'rgba(43,165,160,0.08)', border: '1px solid rgba(43,165,160,0.2)', marginBottom: 20, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--admin-teal)' }}>
          {advanceMsg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--admin-border)', marginBottom: 24 }}>
        {(['brackets', 'registrations'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600,
            padding: '10px 20px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent',
            color: activeTab === t ? 'var(--admin-navy)' : 'var(--admin-text-muted)',
            borderBottom: activeTab === t ? '2px solid var(--admin-navy)' : '2px solid transparent',
            marginBottom: -1, transition: 'all 0.15s', textTransform: 'capitalize',
          }}>{t === 'brackets' ? `Brackets & Heats` : `Registrations (${event?.event_divisions?.reduce((s, ed) => s + (ed.registrations?.length || 0), 0) || 0})`}</button>
        ))}
      </div>

      {/* BRACKETS TAB */}
      {activeTab === 'brackets' && (<>
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
                  {ed.registrations?.length > 0 && (
                    <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, backgroundColor: 'rgba(43,165,160,0.08)', color: 'var(--admin-teal)', fontFamily: "'JetBrains Mono', monospace" }}>
                      {ed.registrations.filter(r => r.status === 'confirmed').length} registered
                    </span>
                  )}
                  <MetaText style={{ marginLeft: 12 }}>{ed.ride_time_minutes}min heats — Best {ed.scoring_best_of} waves — Top {ed.advances_per_heat} advance</MetaText>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(!ed.rounds || ed.rounds.length === 0) && (
                    <Button variant="primary" onClick={() => { setGenerateModal(ed); setNumAthletes(ed.registrations?.length || ed.max_athletes) }}>Generate Bracket</Button>
                  )}
                  {ed.rounds && ed.rounds.length > 0 && (
                    <>
                      <Button variant="secondary" onClick={() => openJudgePanel(ed.id, ed.division?.name || '')}>Assign Judges</Button>
                      <Button variant="secondary" onClick={() => { setWalkUpModal(ed); setWalkUpName(''); setWalkUpId(null) }}>Walk-Up Add</Button>
                    </>
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
                                <button onClick={() => {
                                  if (confirm('End this heat? Head judge will need to certify results.')) updateHeatStatus(heat.id, 'complete')
                                }} style={{ fontSize: 11, fontWeight: 500, color: 'var(--admin-warning)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 8 }}>
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

      </>)}

      {/* REGISTRATIONS TAB */}
      {activeTab === 'registrations' && (
        <div>
          {/* Registration controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--admin-navy)', margin: 0 }}>Registrations</h2>
              <StatusDot status={event.registration_open ? 'success' : 'muted'} label={event.registration_open ? 'Open' : 'Closed'} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" href={`/api/compete/export?event_id=${id}&type=registrations`}>📥 Export CSV</Button>
              <Button variant={event.registration_open ? 'danger' : 'primary'} onClick={toggleRegistration}>
                {event.registration_open ? 'Close Registration' : 'Open Registration'}
              </Button>
            </div>
          </div>

          {/* Per-division registration lists */}
          {(!event.event_divisions || event.event_divisions.length === 0) ? (
            <EmptyState message="Add divisions first before managing registrations" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {event.event_divisions.map(ed => {
                const regs = ed.registrations || []
                const confirmed = regs.filter(r => r.status === 'confirmed').length
                const pending = regs.filter(r => r.status === 'pending').length
                return (
                  <Card key={ed.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600, color: 'var(--admin-navy)' }}>{ed.division?.name}</span>
                        <MetaText>{confirmed} confirmed{pending > 0 ? ` · ${pending} pending` : ''} / {ed.max_athletes} max</MetaText>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button variant="secondary" onClick={() => autoSeed(ed.id)} disabled={seedingDiv === ed.id || regs.length === 0}>
                          {seedingDiv === ed.id ? 'Seeding...' : '🎯 Auto-Seed'}
                        </Button>
                        <Button variant="primary" onClick={() => { setDrawModal({ edId: ed.id, divName: ed.division?.name || '' }); setDrawPreview(null); setDrawPerHeat(4) }} disabled={regs.length === 0}>
                          🎲 Generate Draw
                        </Button>
                        <Button variant="secondary" onClick={() => { setCsvModal(ed); setCsvText('') }}>📎 CSV Import</Button>
                        <Button variant="secondary" onClick={() => { setRegModal(ed); setRegAthleteName(''); setRegAthleteId(null) }}>+ Register</Button>
                      </div>
                    </div>

                    {regs.length === 0 ? (
                      <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>No registrations yet</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Header */}
                        <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px 80px 100px 60px', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--admin-border)' }}>
                          <MetaText>Seed</MetaText>
                          <MetaText>Athlete</MetaText>
                          <MetaText>Status</MetaText>
                          <MetaText>Payment</MetaText>
                          <MetaText>Registered</MetaText>
                          <MetaText>{' '}</MetaText>
                        </div>
                        {regs.sort((a, b) => {
                          // Sort by seed rank first, then by creation date
                          if (a.seed_rank && b.seed_rank) return a.seed_rank - b.seed_rank
                          if (a.seed_rank) return -1
                          if (b.seed_rank) return 1
                          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                        }).map((reg, i) => (
                          <div key={reg.id} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px 80px 100px 60px', gap: 8, padding: '10px 12px', alignItems: 'center', borderBottom: '1px solid var(--admin-border-subtle)', background: i % 2 === 1 ? 'rgba(10,37,64,0.012)' : 'transparent' }}>
                            <input
                              type="number"
                              value={reg.seed_rank || ''}
                              onChange={e => updateSeedRank(reg.id, parseInt(e.target.value) || 0)}
                              min={1}
                              style={{ width: 40, padding: '2px 4px', fontSize: 12, border: '1px solid var(--admin-border)', borderRadius: 4, textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", color: reg.seed_rank ? 'var(--admin-teal)' : 'var(--admin-text-muted)', background: 'transparent' }}
                              placeholder="-"
                            />
                            <div>
                              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text)' }}>{reg.athlete_name}</span>
                              {reg.email && <span style={{ fontSize: 10, color: 'var(--admin-text-muted)', marginLeft: 8 }}>{reg.email}</span>}
                            </div>
                            <div>
                              <select
                                value={reg.status}
                                onChange={e => updateRegStatus(reg.id, e.target.value)}
                                style={{ fontSize: 11, padding: '3px 6px', border: '1px solid var(--admin-border)', borderRadius: 4, background: '#fff', color: reg.status === 'confirmed' ? 'var(--admin-success)' : reg.status === 'pending' ? 'var(--admin-warning)' : 'var(--admin-text-muted)', cursor: 'pointer' }}
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="waitlist">Waitlist</option>
                                <option value="withdrawn">Withdrawn</option>
                                <option value="dns">DNS</option>
                              </select>
                            </div>
                            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: reg.payment_status === 'paid' ? 'var(--admin-success)' : reg.payment_status === 'pending' ? 'var(--admin-warning)' : 'var(--admin-text-muted)' }}>
                              {reg.payment_status}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                              {new Date(reg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <button onClick={() => removeRegistration(reg.id)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', fontSize: 11, padding: '2px' }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Walk-Up Add Modal */}
      <Modal open={!!walkUpModal} onClose={() => setWalkUpModal(null)} title={`Walk-Up Add — ${walkUpModal?.division?.name || ''}`}>
        <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 16 }}>Athlete will be added to the least-full Round 1 heat with an auto-assigned jersey.</p>
        <FormField label="Athlete">
          <AthleteSearch
            value={walkUpName}
            onChange={(val) => { setWalkUpName(val); setWalkUpId(null) }}
            onSelect={(athlete) => { setWalkUpName(athlete.name); setWalkUpId(athlete.id) }}
            onCreateNew={(name) => { setWalkUpName(name); setWalkUpId(null) }}
            placeholder="Search athlete..."
            autoFocus
          />
        </FormField>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Button onClick={handleWalkUp} disabled={saving || !walkUpName}>{saving ? 'Adding...' : 'Add to Heat'}</Button>
          <Button variant="ghost" onClick={() => setWalkUpModal(null)}>Cancel</Button>
        </div>
      </Modal>

      {/* CSV Import Modal */}
      <Modal open={!!csvModal} onClose={() => setCsvModal(null)} title={`CSV Import — ${csvModal?.division?.name || ''}`}>
        <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 16 }}>
          Paste CSV with columns: Name, Email (optional), Phone (optional), Emergency Contact (optional). First row is the header.
        </p>
        <FormField label="CSV Data">
          <textarea
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            rows={8}
            placeholder={'Name,Email,Phone\nJohn Doe,john@email.com,+1234567890\nJane Smith,,'}
            style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, resize: 'vertical' }}
          />
        </FormField>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={handleCsvImport} disabled={csvLoading || !csvText}>{csvLoading ? 'Importing...' : 'Import'}</Button>
          <Button variant="ghost" onClick={() => setCsvModal(null)}>Cancel</Button>
        </div>
      </Modal>

      {/* Generate Draw Modal */}
      <Modal open={!!drawModal} onClose={() => { setDrawModal(null); setDrawPreview(null) }} title={`Generate Draw — ${drawModal?.divName || ''}`} width={640}>
        <FormField label="Athletes per Heat">
          <select value={drawPerHeat} onChange={e => { setDrawPerHeat(parseInt(e.target.value)); setDrawPreview(null) }} style={selectStyle}>
            <option value={2}>2 (Man on Man)</option>
            <option value={3}>3</option>
            <option value={4}>4 (Standard)</option>
            <option value={5}>5</option>
            <option value={6}>6</option>
          </select>
        </FormField>

        {!drawPreview && (
          <Button onClick={() => drawModal && previewDraw(drawModal.edId)} disabled={drawLoading}>
            {drawLoading ? 'Loading...' : 'Preview Draw'}
          </Button>
        )}

        {drawPreview && (
          <div>
            <SectionLabel>Draw Preview — {drawPreview.athletes} athletes</SectionLabel>

            {/* Rounds overview */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {drawPreview.rounds?.map((r: any) => (
                <span key={r.name} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, backgroundColor: 'rgba(10,37,64,0.04)', color: 'var(--admin-text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {r.name}: {r.heats} heat{r.heats !== 1 ? 's' : ''}
                </span>
              ))}
            </div>

            {/* Round 1 heats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
              {drawPreview.round1?.map((heat: any) => (
                <div key={heat.heat} style={{ border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius)', padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-navy)', marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>Heat {heat.heat}</div>
                  {heat.athletes.map((a: any) => (
                    <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: JERSEY_HEX[a.jersey] || '#94A3B8', border: a.jersey === 'white' ? '1px solid #CBD5E1' : 'none', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--admin-text)', flex: 1 }}>{a.name}</span>
                      <span style={{ fontSize: 10, color: 'var(--admin-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>#{a.seed}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={confirmDraw} disabled={drawLoading}>{drawLoading ? 'Generating...' : 'Confirm & Generate'}</Button>
              <Button variant="secondary" onClick={() => drawModal && previewDraw(drawModal.edId)} disabled={drawLoading}>Re-Shuffle</Button>
              <Button variant="ghost" onClick={() => { setDrawModal(null); setDrawPreview(null) }}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Register Athlete Modal */}
      <Modal open={!!regModal} onClose={() => { setRegModal(null); setRegAthleteName(''); setRegAthleteId(null) }} title={`Register Athlete — ${regModal?.division?.name || ''}`}>
        <FormField label="Athlete">
          <AthleteSearch
            value={regAthleteName}
            onChange={(val) => { setRegAthleteName(val); setRegAthleteId(null) }}
            onSelect={(athlete) => { setRegAthleteName(athlete.name); setRegAthleteId(athlete.id) }}
            onCreateNew={(name) => { setRegAthleteName(name); setRegAthleteId(null) }}
            placeholder="Search athlete..."
            autoFocus
          />
        </FormField>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Button onClick={addRegistration} disabled={saving || !regAthleteName}>{saving ? 'Registering...' : 'Register'}</Button>
          <Button variant="ghost" onClick={() => setRegModal(null)}>Cancel</Button>
        </div>
      </Modal>

      {/* Judge Panel Modal */}
      <Modal open={!!judgePanel} onClose={() => setJudgePanel(null)} title={`Judge Panel — ${judgePanel?.divName || ''}`} width={560}>
        <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 16 }}>
          Assign a judge panel for all heats in this division. Head judges observe and manage priority — they do not score.
        </p>

        {/* Current panel */}
        {panelAssignments.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <SectionLabel>Panel ({panelAssignments.length} judges)</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {panelAssignments.map(pa => {
                const judge = allJudges.find(j => j.id === pa.judge_id)
                return (
                  <div key={pa.judge_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius)', background: pa.is_head_judge ? 'rgba(43,165,160,0.04)' : '#fff' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: 'var(--admin-teal)', width: 24 }}>J{pa.position}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--admin-navy)' }}>{judge?.name || 'Unknown'}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--admin-text-muted)', letterSpacing: '0.1em' }}>PIN {judge?.pin}</span>
                    <button onClick={() => toggleHeadJudge(pa.judge_id)} style={{
                      fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 4, cursor: 'pointer', border: 'none',
                      background: pa.is_head_judge ? 'rgba(43,165,160,0.1)' : 'rgba(0,0,0,0.04)',
                      color: pa.is_head_judge ? 'var(--admin-teal)' : 'var(--admin-text-muted)',
                    }}>
                      {pa.is_head_judge ? 'HEAD' : 'Judge'}
                    </button>
                    <button onClick={() => removeJudgeFromPanel(pa.judge_id)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', fontSize: 14, padding: '2px 4px' }}>✕</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Available judges */}
        {(() => {
          const available = allJudges.filter(j => !panelAssignments.find(pa => pa.judge_id === j.id))
          if (available.length === 0) return null
          return (
            <div style={{ marginBottom: 16 }}>
              <SectionLabel>Available Judges</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {available.map(j => (
                  <button key={j.id} onClick={() => addJudgeToPanel(j.id)} style={{
                    padding: '6px 12px', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius)',
                    background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: 'var(--admin-text)',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{ color: 'var(--admin-teal)', fontWeight: 700 }}>+</span>
                    {j.name}
                    {j.role === 'head_judge' && <span style={{ fontSize: 9, color: 'var(--admin-teal)', fontWeight: 700 }}>HEAD</span>}
                  </button>
                ))}
              </div>
            </div>
          )
        })()}

        {allJudges.length === 0 && (
          <EmptyState message="No judges registered yet" action={{ label: 'Add Judges', onClick: () => window.location.href = '/admin/compete/judges' }} />
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Button onClick={saveJudgePanel} disabled={panelLoading || panelAssignments.length === 0}>
            {panelLoading ? 'Saving...' : panelSaved ? 'Saved!' : 'Assign to All Heats'}
          </Button>
          <Button variant="ghost" onClick={() => setJudgePanel(null)}>Close</Button>
        </div>
      </Modal>

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
      <Modal open={!!athleteModal} onClose={() => { setAthleteModal(null); setAthleteName(''); setAthleteId(null) }} title={`Add Athlete — Heat ${athleteModal?.heat_number || ''}`}>
        <FormField label="Athlete">
          <AthleteSearch
            value={athleteName}
            onChange={(val) => { setAthleteName(val); setAthleteId(null) }}
            onSelect={(athlete) => { setAthleteName(athlete.name); setAthleteId(athlete.id) }}
            onCreateNew={handleCreateNewAthlete}
            placeholder="Search by name..."
            autoFocus
          />
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
