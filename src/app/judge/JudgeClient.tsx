'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const JERSEY_HEX: Record<string, string> = { red: '#DC2626', blue: '#2563EB', white: '#E2E8F0', yellow: '#EAB308', green: '#16A34A', black: '#1E293B', pink: '#EC4899', orange: '#EA580C' }

const ISA_CRITERIA = [
  { range: '0.0–1.9', label: 'Poor', color: '#DC2626', desc: 'Minimal commitment and/or no completed maneuvers' },
  { range: '2.0–3.9', label: 'Fair', color: '#EA580C', desc: 'Some minor maneuvers with limited execution' },
  { range: '4.0–5.9', label: 'Average', color: '#EAB308', desc: 'Competent surfing with moderate variety' },
  { range: '6.0–7.9', label: 'Good', color: '#2BA5A0', desc: 'Strong maneuvers with power, speed and flow' },
  { range: '8.0–9.9', label: 'Excellent', color: '#2563EB', desc: 'Exceptional and innovative surfing, high risk' },
  { range: '10.0', label: 'Perfect', color: '#FFD700', desc: 'Flawless execution with maximum commitment' },
]

interface Judge { id: string; name: string; role: string }
interface AthleteScore {
  heat_athlete_id: string
  athlete_name: string
  jersey_color: string | null
  wave_count: number
  my_scores: { wave_number: number; score: number }[]
}
interface HeatInfo {
  id: string
  heat_number: number
  round_name: string
  division_name: string
  status: string
  priority_order: string[]
  is_head_judge: boolean
}

export function JudgeClient() {
  const [judge, setJudge] = useState<Judge | null>(null)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [heat, setHeat] = useState<HeatInfo | null>(null)
  const [athletes, setAthletes] = useState<AthleteScore[]>([])
  const [heats, setHeats] = useState<{ id: string; label: string }[]>([])
  const [selectedHeatId, setSelectedHeatId] = useState<string | null>(null)
  const [selectedAthlete, setSelectedAthlete] = useState<string | null>(null)
  const [scoreValue, setScoreValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [lastScore, setLastScore] = useState<string | null>(null)
  const [showCriteria, setShowCriteria] = useState(false)
  const [confirmScore, setConfirmScore] = useState<{ athleteId: string; wave: number; score: number } | null>(null)

  const sb = createClient()

  // PIN login
  const login = async () => {
    setPinError('')
    const res = await fetch('/api/judge/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    const data = await res.json()
    if (data.judge) {
      setJudge(data.judge)
      localStorage.setItem('bsa_judge', JSON.stringify(data.judge))
    } else {
      setPinError('Invalid PIN')
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem('bsa_judge')
    if (saved) setJudge(JSON.parse(saved))
  }, [])

  // Load live heats (only those this judge is assigned to)
  const loadHeats = useCallback(async () => {
    if (!judge) return

    // Get heats this judge is assigned to
    const { data: assignments } = await sb
      .from('comp_heat_judges')
      .select('heat_id, is_head_judge')
      .eq('judge_id', judge.id)

    if (!assignments || assignments.length === 0) {
      setHeats([])
      return
    }

    const heatIds = assignments.map(a => a.heat_id)
    const headJudgeHeats = new Set(assignments.filter(a => a.is_head_judge).map(a => a.heat_id))

    const { data } = await sb
      .from('comp_heats')
      .select(`
        id, heat_number, status,
        round:comp_rounds(name, event_division:comp_event_divisions(division:comp_divisions(name)))
      `)
      .in('id', heatIds)
      .eq('status', 'live')

    if (data && data.length > 0) {
      const heatList = data.map((h: Record<string, unknown>) => {
        const round = h.round as unknown as Record<string, unknown>
        const ed = round?.event_division as unknown as Record<string, unknown>
        const div = ed?.division as unknown as Record<string, string>
        return {
          id: h.id as string,
          label: `${div?.name || ''} — ${round?.name || ''} — Heat ${h.heat_number}`,
          is_head_judge: headJudgeHeats.has(h.id as string),
        }
      })
      setHeats(heatList)
      if (!selectedHeatId && heatList.length > 0) setSelectedHeatId(heatList[0].id)
    } else {
      setHeats([])
    }
  }, [judge, selectedHeatId])

  useEffect(() => {
    if (judge) { loadHeats(); const i = setInterval(loadHeats, 10000); return () => clearInterval(i) }
  }, [judge, loadHeats])

  // Load heat data (blind — only my scores)
  const loadHeatData = useCallback(async () => {
    if (!selectedHeatId || !judge) return

    // Get my scores only (blind judging)
    const res = await fetch(`/api/judge/score-v2?judge_id=${judge.id}&heat_id=${selectedHeatId}`)
    const data = await res.json()
    if (Array.isArray(data)) setAthletes(data)

    // Get heat info
    const { data: h } = await sb
      .from('comp_heats')
      .select(`
        id, heat_number, status, priority_order,
        round:comp_rounds(name, event_division:comp_event_divisions(division:comp_divisions(name)))
      `)
      .eq('id', selectedHeatId)
      .single()

    if (h) {
      const round = h.round as unknown as Record<string, unknown>
      const ed = round?.event_division as unknown as Record<string, unknown>
      const div = ed?.division as unknown as Record<string, string>

      // Check if head judge
      const { data: assignment } = await sb
        .from('comp_heat_judges')
        .select('is_head_judge')
        .eq('heat_id', selectedHeatId)
        .eq('judge_id', judge.id)
        .single()

      setHeat({
        id: h.id as string,
        heat_number: h.heat_number as number,
        round_name: (round?.name as string) || '',
        division_name: div?.name || '',
        status: h.status as string,
        priority_order: (h.priority_order as string[]) || [],
        is_head_judge: assignment?.is_head_judge || false,
      })
    }
  }, [selectedHeatId, judge])

  useEffect(() => { loadHeatData() }, [selectedHeatId, loadHeatData])

  // Realtime: refresh when new scores come in (only my own will show)
  useEffect(() => {
    if (!selectedHeatId) return
    const channel = sb.channel(`judge-${selectedHeatId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comp_judge_scores' }, () => { loadHeatData() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comp_heat_athletes' }, () => { loadHeatData() })
      .subscribe()
    return () => { sb.removeChannel(channel) }
  }, [selectedHeatId, loadHeatData])

  // Submit score (with confirmation step)
  const initiateScore = (athleteId: string, wave: number, score: number) => {
    setConfirmScore({ athleteId, wave, score })
  }

  const submitScore = async () => {
    if (!confirmScore || !judge) return
    setSubmitting(true)
    const res = await fetch('/api/judge/score-v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        judge_id: judge.id,
        heat_athlete_id: confirmScore.athleteId,
        wave_number: confirmScore.wave,
        score: confirmScore.score,
      }),
    })
    const data = await res.json()
    setSubmitting(false)
    setConfirmScore(null)
    setScoreValue('')
    setSelectedAthlete(null)

    if (data.success) {
      setLastScore(`${confirmScore.score.toFixed(1)} submitted`)
      setTimeout(() => setLastScore(null), 2000)
    } else {
      setLastScore(`Error: ${data.error}`)
      setTimeout(() => setLastScore(null), 4000)
    }
    loadHeatData()
  }

  const logout = () => { setJudge(null); localStorage.removeItem('bsa_judge') }

  // Get priority position for an athlete
  const getPriorityPosition = (athleteId: string): number => {
    if (!heat?.priority_order) return 0
    return heat.priority_order.indexOf(athleteId) + 1
  }

  // ─── PIN Screen ───
  if (!judge) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A2540', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 340, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 4 }}>BSA</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 40 }}>Judge Login</div>
          <input
            type="tel" inputMode="numeric" value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter PIN"
            style={{
              width: '100%', padding: '18px', fontSize: 28, textAlign: 'center',
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.3em',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, color: '#fff', outline: 'none', boxSizing: 'border-box',
            }}
            onKeyDown={e => { if (e.key === 'Enter' && pin.length >= 4) login() }}
          />
          {pinError && <div style={{ color: '#DC2626', fontSize: 13, marginTop: 12 }}>{pinError}</div>}
          <button onClick={login} disabled={pin.length < 4} style={{
            width: '100%', padding: 16, marginTop: 20, borderRadius: 12,
            background: pin.length >= 4 ? '#2BA5A0' : 'rgba(255,255,255,0.06)',
            color: '#fff', border: 'none', fontSize: 16, fontWeight: 600,
            fontFamily: "'Space Grotesk', sans-serif", cursor: pin.length >= 4 ? 'pointer' : 'default',
            opacity: pin.length >= 4 ? 1 : 0.4,
          }}>Enter</button>
        </div>
      </div>
    )
  }

  // ─── No Live Heats ───
  if (heats.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A2540', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, color: '#fff' }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No Live Heats</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>Waiting for a heat to go live...</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Logged in as {judge.name} ({judge.role})</div>
        <button onClick={logout} style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Sign out</button>
      </div>
    )
  }

  // ─── Scoring Interface (BLIND) ───
  return (
    <div style={{ minHeight: '100vh', background: '#0A2540', color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700 }}>BSA</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.3)', marginLeft: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {judge.name} · {judge.role === 'head_judge' ? 'Head Judge' : 'Judge'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setShowCriteria(true)} style={{ fontSize: 10, color: '#2BA5A0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>ISA Scale</button>
          <button onClick={logout} style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>Exit</button>
        </div>
      </div>

      {/* Heat selector */}
      {heats.length > 1 && (
        <div style={{ padding: '8px 16px', display: 'flex', gap: 8, overflowX: 'auto' }}>
          {heats.map(h => (
            <button key={h.id} onClick={() => setSelectedHeatId(h.id)} style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
              fontFamily: "'Space Grotesk', sans-serif",
              background: selectedHeatId === h.id ? 'rgba(43,165,160,0.2)' : 'rgba(255,255,255,0.04)',
              border: selectedHeatId === h.id ? '1px solid rgba(43,165,160,0.4)' : '1px solid rgba(255,255,255,0.06)',
              color: selectedHeatId === h.id ? '#2BA5A0' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
            }}>{h.label}</button>
          ))}
        </div>
      )}

      {/* Heat info + blind notice */}
      {heat && (
        <div style={{ padding: '12px 16px 4px' }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700 }}>
            Heat {heat.heat_number}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>
            {heat.division_name} — {heat.round_name}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.15)', marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Blind judging · Your scores only
          </div>
        </div>
      )}

      {/* Score confirmation toast */}
      {lastScore && (
        <div style={{
          margin: '8px 16px', padding: '10px 16px', borderRadius: 8,
          background: lastScore.startsWith('Error') ? 'rgba(220,38,38,0.15)' : 'rgba(43,165,160,0.15)',
          border: `1px solid ${lastScore.startsWith('Error') ? 'rgba(220,38,38,0.3)' : 'rgba(43,165,160,0.3)'}`,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
          color: lastScore.startsWith('Error') ? '#EF4444' : '#2BA5A0', textAlign: 'center',
        }}>{lastScore}</div>
      )}

      {/* Athletes — BLIND: no totals, no positions, no other judge scores */}
      {athletes.map(athlete => {
        const isSelected = selectedAthlete === athlete.heat_athlete_id
        const nextWave = athlete.my_scores.length > 0
          ? Math.max(...athlete.my_scores.map(s => s.wave_number)) + 1
          : 1
        const priorityPos = getPriorityPosition(athlete.heat_athlete_id)

        return (
          <div key={athlete.heat_athlete_id} style={{ margin: '8px 16px', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <button
              onClick={() => { setSelectedAthlete(isSelected ? null : athlete.heat_athlete_id); setScoreValue('') }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                background: isSelected ? 'rgba(43,165,160,0.08)' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                borderBottom: isSelected ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
            >
              {/* Priority indicator */}
              {priorityPos > 0 && (
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                  padding: '2px 6px', borderRadius: 4,
                  background: priorityPos === 1 ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.04)',
                  color: priorityPos === 1 ? '#FFD700' : 'rgba(255,255,255,0.2)',
                  fontWeight: 700, letterSpacing: '0.05em',
                }}>P{priorityPos}</span>
              )}

              {/* Jersey */}
              {athlete.jersey_color && (
                <span style={{
                  width: 16, height: 16, borderRadius: 4,
                  background: JERSEY_HEX[athlete.jersey_color] || '#94A3B8',
                  border: athlete.jersey_color === 'white' ? '1px solid rgba(255,255,255,0.3)' : 'none',
                  flexShrink: 0,
                }} />
              )}

              {/* Name */}
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#fff' }}>
                {athlete.athlete_name}
              </span>

              {/* My score count (not totals — blind) */}
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                color: 'rgba(255,255,255,0.25)',
              }}>
                {athlete.my_scores.length} wave{athlete.my_scores.length !== 1 ? 's' : ''}
              </span>
            </button>

            {/* Expanded: my scores only + score input */}
            {isSelected && (
              <div style={{ padding: '12px 16px 16px' }}>
                {/* My previous scores for this athlete */}
                {athlete.my_scores.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                    {athlete.my_scores.map(s => (
                      <div key={s.wave_number} style={{
                        padding: '6px 12px', borderRadius: 6, textAlign: 'center',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                      }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>W{s.wave_number}</div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                          {s.score.toFixed(1)}
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 7, color: 'rgba(255,255,255,0.15)', marginTop: 2 }}>LOCKED</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Score input */}
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 8, letterSpacing: '0.06em' }}>
                  WAVE {nextWave}
                </div>

                {/* Quick score buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 10 }}>
                  {[0.5, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 9.5, 10.0].map(s => (
                    <button key={s} onClick={() => setScoreValue(s.toFixed(1))} style={{
                      padding: '14px 0', borderRadius: 8, border: 'none',
                      background: scoreValue === s.toFixed(1) ? 'rgba(43,165,160,0.2)' : 'rgba(255,255,255,0.04)',
                      color: scoreValue === s.toFixed(1) ? '#2BA5A0' : 'rgba(255,255,255,0.5)',
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600,
                      cursor: 'pointer',
                    }}>{s.toFixed(1)}</button>
                  ))}
                </div>

                {/* Custom input + submit */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="number" inputMode="decimal" step="0.1" min="0" max="10"
                    value={scoreValue} onChange={e => setScoreValue(e.target.value)}
                    placeholder="0.0"
                    style={{
                      flex: 1, padding: '14px', fontSize: 24, textAlign: 'center',
                      fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 10, color: '#fff', outline: 'none', boxSizing: 'border-box',
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && scoreValue) {
                        const val = parseFloat(scoreValue)
                        if (val >= 0 && val <= 10) initiateScore(athlete.heat_athlete_id, nextWave, val)
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const val = parseFloat(scoreValue)
                      if (val >= 0 && val <= 10) initiateScore(athlete.heat_athlete_id, nextWave, val)
                    }}
                    disabled={!scoreValue || parseFloat(scoreValue) < 0 || parseFloat(scoreValue) > 10}
                    style={{
                      padding: '14px 28px', borderRadius: 10, border: 'none',
                      background: scoreValue && parseFloat(scoreValue) >= 0 && parseFloat(scoreValue) <= 10 ? '#2BA5A0' : 'rgba(255,255,255,0.06)',
                      color: '#fff', fontSize: 16, fontWeight: 700,
                      fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer',
                    }}
                  >Submit</button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* If head judge, show link to head judge panel */}
      {heat?.is_head_judge && (
        <div style={{ margin: '16px 16px 0', padding: '12px 16px', borderRadius: 8, background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', textAlign: 'center' }}>
          <a href={`/judge/head?heat_id=${heat.id}`} style={{ color: '#FFD700', fontSize: 13, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", textDecoration: 'none' }}>
            Open Head Judge Panel →
          </a>
        </div>
      )}

      {/* Score Confirmation Modal */}
      {confirmScore && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 100,
        }} onClick={() => setConfirmScore(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#0A2540', borderRadius: 16, padding: 32, maxWidth: 320, width: '100%',
            border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center',
          }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              Confirm Score
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 48, fontWeight: 700, color: '#2BA5A0', marginBottom: 4 }}>
              {confirmScore.score.toFixed(1)}
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
              Wave {confirmScore.wave}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.2)', marginBottom: 24, letterSpacing: '0.06em' }}>
              Score will be locked after submission
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmScore(null)} style={{
                flex: 1, padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 600,
                fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={submitScore} disabled={submitting} style={{
                flex: 1, padding: 14, borderRadius: 10, border: 'none',
                background: '#2BA5A0', color: '#fff', fontSize: 14, fontWeight: 600,
                fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer',
                opacity: submitting ? 0.5 : 1,
              }}>{submitting ? '...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ISA Criteria Reference Slide-up */}
      {showCriteria && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'flex-end', justifyContent: 'center', zIndex: 100,
        }} onClick={() => setShowCriteria(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#0A2540', borderRadius: '16px 16px 0 0', padding: '24px 20px 40px',
            width: '100%', maxWidth: 480, border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: '#fff' }}>ISA Judging Scale</span>
              <button onClick={() => setShowCriteria(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            {ISA_CRITERIA.map(c => (
              <div key={c.range} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: c.color, width: 60, textAlign: 'center' }}>{c.range}</span>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: c.color }}>{c.label}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{c.desc}</div>
                </div>
              </div>
            ))}
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.15)', textAlign: 'center', marginTop: 16, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Commitment · Difficulty · Variety · Speed · Power · Flow
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
