'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

/* ─── Jersey Colors ─── */
const JERSEY_HEX: Record<string, string> = {
  red: '#DC2626', blue: '#2563EB', white: '#E2E8F0', yellow: '#EAB308',
  green: '#16A34A', black: '#1E293B', pink: '#EC4899', orange: '#EA580C',
}

const ISA_CRITERIA = [
  { range: '0–1.9',  label: 'Poor',      color: '#DC2626' },
  { range: '2–3.9',  label: 'Fair',      color: '#EA580C' },
  { range: '4–5.9',  label: 'Average',   color: '#EAB308' },
  { range: '6–7.9',  label: 'Good',      color: '#2BA5A0' },
  { range: '8–9.9',  label: 'Excellent', color: '#2563EB' },
  { range: '10',     label: 'Perfect',   color: '#FFD700' },
]

/* ─── Types ─── */
interface Judge { id: string; name: string; role: string }
interface AthleteScore {
  heat_athlete_id: string; athlete_name: string; jersey_color: string | null
  wave_count: number; my_scores: { wave_number: number; score: number }[]
}
interface HeatInfo {
  id: string; heat_number: number; round_name: string; division_name: string
  status: string; priority_order: string[]; is_head_judge: boolean
  actual_start: string | null; duration_minutes: number
}

/* ─── Timer ─── */
function useTimer(start: string | null, dur: number, status: string) {
  const [rem, setRem] = useState(dur * 60)
  useEffect(() => {
    if (!start || status !== 'live') { setRem(dur * 60); return }
    const tick = () => setRem(Math.max(0, dur * 60 - Math.floor((Date.now() - new Date(start).getTime()) / 1000)))
    tick(); const i = setInterval(tick, 1000); return () => clearInterval(i)
  }, [start, dur, status])
  return { rem, fmt: `${Math.floor(rem / 60)}:${(rem % 60).toString().padStart(2, '0')}`, warn: rem <= 30, low: rem <= 300 && rem > 30 }
}

/* ─── Score Color ─── */
function scoreColor(s: number): string {
  if (s >= 8) return '#2563EB'
  if (s >= 6) return '#2BA5A0'
  if (s >= 4) return '#EAB308'
  if (s >= 2) return '#EA580C'
  return '#DC2626'
}

export function JudgeClient() {
  const [judge, setJudge] = useState<Judge | null>(null)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [heat, setHeat] = useState<HeatInfo | null>(null)
  const [athletes, setAthletes] = useState<AthleteScore[]>([])
  const [heats, setHeats] = useState<{ id: string; label: string }[]>([])
  const [selectedHeatId, setSelectedHeatId] = useState<string | null>(null)
  const [scoring, setScoring] = useState<{ athleteId: string; name: string; jersey: string | null; wave: number } | null>(null)
  const [scoreValue, setScoreValue] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [showScale, setShowScale] = useState(false)

  const sb = createClient()
  const timer = useTimer(heat?.actual_start || null, heat?.duration_minutes || 20, heat?.status || 'pending')

  /* ─── Auth ─── */
  const login = async () => {
    setPinError('')
    const res = await fetch('/api/judge/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) })
    const d = await res.json()
    if (d.judge) { setJudge(d.judge); localStorage.setItem('bsa_judge', JSON.stringify(d.judge)) }
    else setPinError('Invalid PIN')
  }
  const logout = () => { setJudge(null); localStorage.removeItem('bsa_judge') }
  useEffect(() => { const s = localStorage.getItem('bsa_judge'); if (s) setJudge(JSON.parse(s)) }, [])

  /* ─── Load Heats ─── */
  const loadHeats = useCallback(async () => {
    if (!judge) return
    const { data: asgn } = await sb.from('comp_heat_judges').select('heat_id, is_head_judge').eq('judge_id', judge.id)
    if (!asgn?.length) { setHeats([]); return }
    const { data } = await sb.from('comp_heats').select('id, heat_number, status, round:comp_rounds(name, event_division:comp_event_divisions(division:comp_divisions(name)))').in('id', asgn.map(a => a.heat_id)).eq('status', 'live')
    if (data?.length) {
      const list = data.map((h: any) => ({ id: h.id, label: `Heat ${h.heat_number} — ${h.round?.event_division?.division?.name || ''}` }))
      setHeats(list)
      if (!selectedHeatId) setSelectedHeatId(list[0].id)
    } else setHeats([])
  }, [judge, selectedHeatId])
  useEffect(() => { if (judge) { loadHeats(); const i = setInterval(loadHeats, 10000); return () => clearInterval(i) } }, [judge, loadHeats])

  /* ─── Load Heat Data ─── */
  const loadHeatData = useCallback(async () => {
    if (!selectedHeatId || !judge) return
    const res = await fetch(`/api/judge/score-v2?judge_id=${judge.id}&heat_id=${selectedHeatId}`)
    const d = await res.json()
    if (Array.isArray(d)) setAthletes(d)
    const { data: h } = await sb.from('comp_heats').select('id, heat_number, status, priority_order, actual_start, duration_minutes, round:comp_rounds(name, event_division:comp_event_divisions(division:comp_divisions(name)))').eq('id', selectedHeatId).single()
    if (h) {
      const { data: a } = await sb.from('comp_heat_judges').select('is_head_judge').eq('heat_id', selectedHeatId).eq('judge_id', judge.id).single()
      setHeat({ id: h.id, heat_number: h.heat_number as number, status: h.status as string, priority_order: (h.priority_order as string[]) || [], is_head_judge: a?.is_head_judge || false, actual_start: h.actual_start as string | null, duration_minutes: (h.duration_minutes as number) || 20, round_name: (h.round as any)?.name || '', division_name: (h.round as any)?.event_division?.division?.name || '' })
    }
  }, [selectedHeatId, judge])
  useEffect(() => { loadHeatData() }, [selectedHeatId, loadHeatData])

  /* ─── Realtime ─── */
  useEffect(() => {
    if (!selectedHeatId) return
    const ch = sb.channel(`judge-${selectedHeatId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comp_judge_scores' }, () => loadHeatData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comp_heat_athletes' }, () => loadHeatData())
      .subscribe()
    return () => { sb.removeChannel(ch) }
  }, [selectedHeatId, loadHeatData])

  /* ─── Submit ─── */
  const submitScore = async () => {
    if (!scoring || scoreValue === null || !judge) return
    setSubmitting(true)
    const res = await fetch('/api/judge/score-v2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ judge_id: judge.id, heat_athlete_id: scoring.athleteId, wave_number: scoring.wave, score: scoreValue }) })
    const d = await res.json()
    setSubmitting(false)
    if (d.success) { showMsg(`${scoreValue.toFixed(1)} locked ✓`, true); setScoring(null); setScoreValue(null) }
    else showMsg(d.error || 'Error', false)
    loadHeatData()
  }
  const showMsg = (msg: string, ok: boolean) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2500) }
  const getPriority = (id: string) => heat?.priority_order ? heat.priority_order.indexOf(id) + 1 : 0

  /* ━━━ PIN LOGIN ━━━ */
  if (!judge) return (
    <div style={{ minHeight: '100dvh', background: '#0A2540', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', width: 320, padding: 24 }}>
        <div style={{ fontSize: 40, fontWeight: 800, color: '#fff', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>BSA</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.15em', marginBottom: 48 }}>COMPETITION JUDGE</div>
        <input type="tel" inputMode="numeric" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} onKeyDown={e => { if (e.key === 'Enter' && pin.length >= 4) login() }} placeholder="• • • •"
          style={{ width: '100%', textAlign: 'center', fontSize: 36, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.4em', fontWeight: 700, padding: '20px 16px', background: 'rgba(255,255,255,0.04)', border: '2px solid rgba(255,255,255,0.08)', borderRadius: 16, color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
        {pinError && <div style={{ color: '#EF4444', fontSize: 14, marginTop: 12, fontWeight: 500 }}>{pinError}</div>}
        <button onClick={login} disabled={pin.length < 4}
          style={{ width: '100%', marginTop: 20, padding: '18px 0', borderRadius: 16, border: 'none', background: pin.length >= 4 ? '#2BA5A0' : 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', cursor: pin.length >= 4 ? 'pointer' : 'default', opacity: pin.length >= 4 ? 1 : 0.3, transition: 'all 0.2s' }}>
          Enter
        </button>
      </div>
    </div>
  )

  /* ━━━ NO LIVE HEATS ━━━ */
  if (!heats.length) return (
    <div style={{ minHeight: '100dvh', background: '#0A2540', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', textAlign: 'center', padding: 32 }}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.15 }}>🌊</div>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', marginBottom: 8 }}>No Live Heats</div>
      <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.3)' }}>Waiting for a heat to go live…</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.15)', marginTop: 40, fontFamily: 'JetBrains Mono, monospace' }}>{judge.name} · {judge.role === 'head_judge' ? 'Head Judge' : 'Judge'}</div>
      <button onClick={logout} style={{ fontSize: 13, color: 'rgba(255,255,255,0.15)', marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Sign out</button>
    </div>
  )

  /* ━━━ MAIN SCORING INTERFACE ━━━ */
  return (
    <div style={{ minHeight: '100dvh', background: '#0A2540', color: '#fff', fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif' }}>Heat {heat?.heat_number}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono, monospace' }}>{heat?.division_name} · {heat?.round_name}</span>
        </div>

        {/* Timer */}
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 32, fontWeight: 800, letterSpacing: '0.05em', color: timer.warn ? '#EF4444' : timer.low ? '#EAB308' : 'rgba(255,255,255,0.9)' }}>
          {timer.fmt}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => setShowScale(!showScale)} style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#2BA5A0', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.05em' }}>ISA SCALE</button>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', fontFamily: 'JetBrains Mono, monospace' }}>{judge.name}</span>
          <button onClick={logout} style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)', background: 'none', border: 'none', cursor: 'pointer' }}>Exit</button>
        </div>
      </div>

      {/* ── ISA Scale (inline toggle) ── */}
      {showScale && (
        <div style={{ padding: '8px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {ISA_CRITERIA.map(c => (
            <span key={c.range} style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
              <span style={{ color: c.color, fontWeight: 700 }}>{c.range}</span>
              <span style={{ color: 'rgba(255,255,255,0.2)', marginLeft: 4 }}>{c.label}</span>
            </span>
          ))}
        </div>
      )}

      {/* ── Blind notice ── */}
      <div style={{ padding: '6px 20px', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.08)', letterSpacing: '0.1em' }}>BLIND JUDGING · YOUR SCORES ONLY</div>

      {/* ── Athlete Cards — ALWAYS VISIBLE, fill the screen ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${athletes.length || 4}, 1fr)`, gap: 0 }}>
        {athletes.map(athlete => {
          const jerseyHex = JERSEY_HEX[athlete.jersey_color || ''] || '#94A3B8'
          const priority = getPriority(athlete.heat_athlete_id)
          const nextWave = athlete.my_scores.length ? Math.max(...athlete.my_scores.map(s => s.wave_number)) + 1 : 1
          const isScoring = scoring?.athleteId === athlete.heat_athlete_id

          return (
            <div key={athlete.heat_athlete_id} style={{ borderRight: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', position: 'relative' }}>

              {/* Jersey color bar — thick */}
              <div style={{ height: 6, background: jerseyHex }} />

              {/* Athlete info */}
              <div style={{ padding: '16px 16px 8px' }}>
                {/* Priority + Jersey */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {priority > 0 && (
                    <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: priority === 1 ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.04)', color: priority === 1 ? '#FFD700' : 'rgba(255,255,255,0.2)' }}>P{priority}</span>
                  )}
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: jerseyHex, border: athlete.jersey_color === 'white' ? '1px solid rgba(255,255,255,0.3)' : 'none' }} />
                </div>

                {/* Name — LARGE */}
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                  {athlete.athlete_name}
                </div>
              </div>

              {/* Previous scores */}
              <div style={{ padding: '0 16px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {athlete.my_scores.map(s => (
                  <div key={s.wave_number} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.15)' }}>W{s.wave_number}</div>
                    <div style={{ fontSize: 18, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: scoreColor(s.score) }}>{s.score.toFixed(1)}</div>
                  </div>
                ))}
                {athlete.my_scores.length === 0 && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.1)', fontFamily: 'JetBrains Mono, monospace' }}>No waves scored</div>
                )}
              </div>

              {/* Score button — ALWAYS VISIBLE */}
              <div style={{ padding: '0 12px 12px', marginTop: 'auto' }}>
                <button onClick={() => { setScoring({ athleteId: athlete.heat_athlete_id, name: athlete.athlete_name, jersey: athlete.jersey_color, wave: nextWave }); setScoreValue(null) }}
                  style={{ width: '100%', padding: '16px 0', borderRadius: 12, border: `2px solid ${jerseyHex}40`, background: `${jerseyHex}10`, color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', cursor: 'pointer', transition: 'all 0.15s' }}>
                  Score Wave {nextWave}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Head judge link */}
      {heat?.is_head_judge && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', flexShrink: 0 }}>
          <a href={`/judge/head?heat_id=${heat.id}`} style={{ color: '#FFD700', fontSize: 14, fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif', textDecoration: 'none' }}>
            Open Head Judge Panel →
          </a>
        </div>
      )}

      {/* ━━━ SCORING DRAWER (slides up when scoring) ━━━ */}
      {scoring && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }}
          onClick={() => { setScoring(null); setScoreValue(null) }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: '#0B2D4A', borderRadius: '24px 24px 0 0', padding: '24px 24px 40px', borderTop: `4px solid ${JERSEY_HEX[scoring.jersey || ''] || '#94A3B8'}` }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>{scoring.name}</div>
                <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>WAVE {scoring.wave}</div>
              </div>
              <button onClick={() => { setScoring(null); setScoreValue(null) }} style={{ fontSize: 24, color: 'rgba(255,255,255,0.2)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Score preview */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 72, fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: scoreValue !== null ? scoreColor(scoreValue) : 'rgba(255,255,255,0.06)', transition: 'color 0.15s' }}>
                {scoreValue !== null ? scoreValue.toFixed(1) : '—.—'}
              </div>
            </div>

            {/* Score pad — 5 columns, 4 rows, BIG buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16 }}>
              {[0.5,1.0,1.5,2.0,2.5,3.0,3.5,4.0,4.5,5.0,5.5,6.0,6.5,7.0,7.5,8.0,8.5,9.0,9.5,10.0].map(s => (
                <button key={s} onClick={() => setScoreValue(s)}
                  style={{ padding: '18px 0', borderRadius: 12, border: scoreValue === s ? `2px solid ${scoreColor(s)}` : '2px solid transparent', background: scoreValue === s ? `${scoreColor(s)}20` : 'rgba(255,255,255,0.04)', color: scoreValue === s ? scoreColor(s) : 'rgba(255,255,255,0.5)', fontSize: 20, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, cursor: 'pointer', transition: 'all 0.1s' }}>
                  {s.toFixed(1)}
                </button>
              ))}
            </div>

            {/* Submit */}
            <button onClick={submitScore} disabled={scoreValue === null || submitting}
              style={{ width: '100%', padding: '20px 0', borderRadius: 16, border: 'none', background: scoreValue !== null ? '#2BA5A0' : 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 20, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', cursor: scoreValue !== null ? 'pointer' : 'default', opacity: scoreValue !== null ? 1 : 0.2, transition: 'all 0.2s' }}>
              {submitting ? 'Submitting…' : scoreValue !== null ? `Lock ${scoreValue.toFixed(1)}` : 'Select a Score'}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 200, padding: '12px 24px', borderRadius: 12, fontSize: 15, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', background: toast.ok ? 'rgba(43,165,160,0.9)' : 'rgba(220,38,38,0.9)', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
