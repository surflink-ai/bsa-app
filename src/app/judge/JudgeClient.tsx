'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

/* ─── Constants ─── */
const JERSEY: Record<string, { bg: string; text: string; ring: string }> = {
  red:    { bg: 'bg-red-600',    text: 'text-white',    ring: 'ring-red-600' },
  blue:   { bg: 'bg-blue-600',   text: 'text-white',    ring: 'ring-blue-600' },
  white:  { bg: 'bg-slate-200',  text: 'text-slate-900', ring: 'ring-slate-300' },
  yellow: { bg: 'bg-yellow-400', text: 'text-slate-900', ring: 'ring-yellow-400' },
  green:  { bg: 'bg-green-600',  text: 'text-white',    ring: 'ring-green-600' },
  black:  { bg: 'bg-slate-800',  text: 'text-white',    ring: 'ring-slate-700' },
  pink:   { bg: 'bg-pink-500',   text: 'text-white',    ring: 'ring-pink-500' },
  orange: { bg: 'bg-orange-500', text: 'text-white',    ring: 'ring-orange-500' },
}

const ISA_CRITERIA = [
  { range: '0–1.9',  label: 'Poor',      color: 'text-red-500',    desc: 'Minimal commitment, no completed maneuvers' },
  { range: '2–3.9',  label: 'Fair',      color: 'text-orange-500', desc: 'Minor maneuvers with limited execution' },
  { range: '4–5.9',  label: 'Average',   color: 'text-yellow-500', desc: 'Competent surfing, moderate variety' },
  { range: '6–7.9',  label: 'Good',      color: 'text-teal-500',   desc: 'Strong maneuvers — power, speed, flow' },
  { range: '8–9.9',  label: 'Excellent', color: 'text-blue-500',   desc: 'Exceptional and innovative, high risk' },
  { range: '10',     label: 'Perfect',   color: 'text-yellow-300', desc: 'Flawless, maximum commitment' },
]

const SCORE_PAD = [
  [0.5, 1.0, 1.5, 2.0, 2.5],
  [3.0, 3.5, 4.0, 4.5, 5.0],
  [5.5, 6.0, 6.5, 7.0, 7.5],
  [8.0, 8.5, 9.0, 9.5, 10.0],
]

/* ─── Types ─── */
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
  actual_start: string | null
  duration_minutes: number
}

/* ─── Timer Hook ─── */
function useHeatTimer(startTime: string | null, durationMin: number, status: string) {
  const [remaining, setRemaining] = useState(durationMin * 60)
  useEffect(() => {
    if (!startTime || status !== 'live') { setRemaining(durationMin * 60); return }
    const tick = () => {
      const elapsed = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)
      setRemaining(Math.max(0, durationMin * 60 - elapsed))
    }
    tick()
    const i = setInterval(tick, 1000)
    return () => clearInterval(i)
  }, [startTime, durationMin, status])
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  return { remaining, formatted: `${mins}:${secs.toString().padStart(2, '0')}`, warning: remaining <= 30, low: remaining <= 300 && remaining > 30 }
}

/* ─── Component ─── */
export function JudgeClient() {
  const [judge, setJudge] = useState<Judge | null>(null)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [heat, setHeat] = useState<HeatInfo | null>(null)
  const [athletes, setAthletes] = useState<AthleteScore[]>([])
  const [heats, setHeats] = useState<{ id: string; label: string }[]>([])
  const [selectedHeatId, setSelectedHeatId] = useState<string | null>(null)
  const [activeAthlete, setActiveAthlete] = useState<string | null>(null)
  const [scoreValue, setScoreValue] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [showCriteria, setShowCriteria] = useState(false)
  const [confirmScore, setConfirmScore] = useState<{ athleteId: string; name: string; jersey: string | null; wave: number; score: number } | null>(null)

  const sb = createClient()
  const timer = useHeatTimer(heat?.actual_start || null, heat?.duration_minutes || 20, heat?.status || 'pending')

  /* ─── Auth ─── */
  const login = async () => {
    setPinError('')
    const res = await fetch('/api/judge/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) })
    const data = await res.json()
    if (data.judge) { setJudge(data.judge); localStorage.setItem('bsa_judge', JSON.stringify(data.judge)) }
    else setPinError('Invalid PIN')
  }
  const logout = () => { setJudge(null); localStorage.removeItem('bsa_judge') }

  useEffect(() => { const s = localStorage.getItem('bsa_judge'); if (s) setJudge(JSON.parse(s)) }, [])

  /* ─── Load Heats ─── */
  const loadHeats = useCallback(async () => {
    if (!judge) return
    const { data: assignments } = await sb.from('comp_heat_judges').select('heat_id, is_head_judge').eq('judge_id', judge.id)
    if (!assignments?.length) { setHeats([]); return }
    const heatIds = assignments.map(a => a.heat_id)
    const { data } = await sb.from('comp_heats').select('id, heat_number, status, round:comp_rounds(name, event_division:comp_event_divisions(division:comp_divisions(name)))').in('id', heatIds).eq('status', 'live')
    if (data?.length) {
      const list = data.map((h: any) => ({ id: h.id, label: `${h.round?.event_division?.division?.name || ''} — ${h.round?.name || ''} — Heat ${h.heat_number}` }))
      setHeats(list)
      if (!selectedHeatId && list.length) setSelectedHeatId(list[0].id)
    } else setHeats([])
  }, [judge, selectedHeatId])

  useEffect(() => { if (judge) { loadHeats(); const i = setInterval(loadHeats, 10000); return () => clearInterval(i) } }, [judge, loadHeats])

  /* ─── Load Heat Data ─── */
  const loadHeatData = useCallback(async () => {
    if (!selectedHeatId || !judge) return
    const res = await fetch(`/api/judge/score-v2?judge_id=${judge.id}&heat_id=${selectedHeatId}`)
    const data = await res.json()
    if (Array.isArray(data)) setAthletes(data)

    const { data: h } = await sb.from('comp_heats').select('id, heat_number, status, priority_order, actual_start, duration_minutes, round:comp_rounds(name, event_division:comp_event_divisions(division:comp_divisions(name)))').eq('id', selectedHeatId).single()
    if (h) {
      const { data: asgn } = await sb.from('comp_heat_judges').select('is_head_judge').eq('heat_id', selectedHeatId).eq('judge_id', judge.id).single()
      setHeat({
        id: h.id, heat_number: h.heat_number as number, status: h.status as string,
        priority_order: (h.priority_order as string[]) || [],
        is_head_judge: asgn?.is_head_judge || false,
        actual_start: h.actual_start as string | null,
        duration_minutes: (h.duration_minutes as number) || 20,
        round_name: (h.round as any)?.name || '', division_name: (h.round as any)?.event_division?.division?.name || '',
      })
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

  /* ─── Submit Score ─── */
  const submitScore = async () => {
    if (!confirmScore || !judge) return
    setSubmitting(true)
    const res = await fetch('/api/judge/score-v2', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ judge_id: judge.id, heat_athlete_id: confirmScore.athleteId, wave_number: confirmScore.wave, score: confirmScore.score }),
    })
    const data = await res.json()
    setSubmitting(false)
    setConfirmScore(null)
    setScoreValue(null)
    setActiveAthlete(null)
    if (data.success) { showToast(`${confirmScore.score.toFixed(1)} locked`, true) }
    else showToast(data.error || 'Error', false)
    loadHeatData()
  }

  const showToast = (msg: string, ok: boolean) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2500) }

  const getPriority = (id: string) => heat?.priority_order ? heat.priority_order.indexOf(id) + 1 : 0

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  /* PIN SCREEN                               */
  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  if (!judge) return (
    <div className="min-h-dvh bg-[#0A2540] flex items-center justify-center p-6">
      <div className="w-full max-w-xs text-center">
        <div className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>BSA</div>
        <div className="text-[10px] tracking-[0.2em] text-white/20 uppercase mt-1 mb-10 font-mono">Competition Judge</div>

        <div className="relative">
          <input
            type="tel" inputMode="numeric" value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={e => { if (e.key === 'Enter' && pin.length >= 4) login() }}
            placeholder="• • • •"
            className="w-full text-center text-3xl tracking-[0.4em] font-mono font-bold bg-white/[0.04] border border-white/10 rounded-2xl py-5 px-4 text-white placeholder:text-white/15 outline-none focus:border-teal-500/50 transition-colors"
          />
        </div>
        {pinError && <div className="text-red-500 text-sm mt-3 font-medium">{pinError}</div>}

        <button onClick={login} disabled={pin.length < 4}
          className="w-full mt-5 py-4 rounded-2xl text-base font-semibold transition-all duration-200 disabled:opacity-30 disabled:cursor-default bg-teal-600 hover:bg-teal-500 text-white cursor-pointer"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Enter
        </button>
      </div>
    </div>
  )

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  /* NO LIVE HEATS                            */
  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  if (!heats.length) return (
    <div className="min-h-dvh bg-[#0A2540] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
        <span className="text-xl">🌊</span>
      </div>
      <div className="text-lg font-semibold text-white/80" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>No Live Heats</div>
      <div className="text-sm text-white/30 mt-1">Waiting for a heat to go live…</div>
      <div className="text-xs text-white/15 mt-8 font-mono">{judge.name} · {judge.role === 'head_judge' ? 'Head Judge' : 'Judge'}</div>
      <button onClick={logout} className="text-xs text-white/20 mt-3 underline cursor-pointer bg-transparent border-none">Sign out</button>
    </div>
  )

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  /* SCORING INTERFACE                        */
  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  return (
    <div className="min-h-dvh bg-[#0A2540] text-white select-none">

      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-30 bg-[#0A2540]/95 backdrop-blur-sm border-b border-white/[0.06]">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: heat info */}
          <div className="flex items-center gap-3">
            <span className="text-base font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Heat {heat?.heat_number}
            </span>
            <span className="text-[10px] text-white/25 font-mono tracking-wide">
              {heat?.division_name} · {heat?.round_name}
            </span>
          </div>

          {/* Center: timer */}
          <div className={`font-mono text-2xl font-bold tracking-wider ${timer.warning ? 'text-red-500 animate-pulse' : timer.low ? 'text-yellow-400' : 'text-white/90'}`}>
            {timer.formatted}
          </div>

          {/* Right: judge info + actions */}
          <div className="flex items-center gap-4">
            <button onClick={() => setShowCriteria(true)} className="text-[10px] font-mono tracking-wide text-teal-500 hover:text-teal-400 cursor-pointer bg-transparent border-none uppercase">
              ISA Scale
            </button>
            <span className="text-[10px] text-white/20 font-mono">{judge.name}</span>
            <button onClick={logout} className="text-[10px] text-white/15 hover:text-white/30 cursor-pointer bg-transparent border-none">Exit</button>
          </div>
        </div>

        {/* Heat selector (if multiple) */}
        {heats.length > 1 && (
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
            {heats.map(h => (
              <button key={h.id} onClick={() => setSelectedHeatId(h.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border ${
                  selectedHeatId === h.id
                    ? 'bg-teal-500/15 border-teal-500/30 text-teal-400'
                    : 'bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/60'
                }`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{h.label}</button>
            ))}
          </div>
        )}

        {/* Blind notice */}
        <div className="px-4 pb-2">
          <div className="text-[9px] font-mono text-white/10 tracking-widest uppercase">Blind judging · Your scores only</div>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl text-sm font-semibold font-mono shadow-lg transition-all ${
          toast.ok ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>{toast.msg}</div>
      )}

      {/* ── Athlete Grid (4 columns on iPad, stacked on phone) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 min-h-0">
        {athletes.map(athlete => {
          const j = JERSEY[athlete.jersey_color || ''] || JERSEY.white
          const p = getPriority(athlete.heat_athlete_id)
          const isActive = activeAthlete === athlete.heat_athlete_id
          const nextWave = athlete.my_scores.length ? Math.max(...athlete.my_scores.map(s => s.wave_number)) + 1 : 1

          return (
            <div key={athlete.heat_athlete_id}
              className={`border-b border-r border-white/[0.04] flex flex-col transition-colors ${isActive ? 'bg-white/[0.03]' : ''}`}>

              {/* Jersey color bar */}
              <div className={`h-1.5 ${j.bg}`} />

              {/* Athlete header — tap to select */}
              <button
                onClick={() => { setActiveAthlete(isActive ? null : athlete.heat_athlete_id); setScoreValue(null) }}
                className="w-full text-left px-4 pt-4 pb-3 cursor-pointer bg-transparent border-none">

                <div className="flex items-center gap-2 mb-1">
                  {/* Priority badge */}
                  {p > 0 && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      p === 1 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/[0.06] text-white/25'
                    }`}>P{p}</span>
                  )}
                  {/* Jersey pill */}
                  <span className={`w-4 h-4 rounded ${j.bg} ${athlete.jersey_color === 'white' ? 'ring-1 ring-inset ring-white/30' : ''}`} />
                </div>

                <div className="text-base font-semibold text-white tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {athlete.athlete_name}
                </div>

                <div className="text-[10px] font-mono text-white/20 mt-1">
                  {athlete.my_scores.length} wave{athlete.my_scores.length !== 1 ? 's' : ''} scored
                </div>
              </button>

              {/* Wave scores (always visible) */}
              <div className="px-4 pb-3 flex gap-1.5 flex-wrap">
                {athlete.my_scores.map(s => (
                  <div key={s.wave_number} className="bg-white/[0.04] rounded-lg px-2.5 py-1.5 text-center min-w-[42px]">
                    <div className="text-[8px] font-mono text-white/20">W{s.wave_number}</div>
                    <div className="text-sm font-mono font-bold text-white/50">{s.score.toFixed(1)}</div>
                  </div>
                ))}
              </div>

              {/* Score pad (when active) */}
              {isActive && (
                <div className="px-3 pb-4 mt-auto">
                  <div className="text-[9px] font-mono text-white/20 tracking-wider uppercase mb-2 px-1">
                    Wave {nextWave}
                  </div>

                  {/* Score numpad */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {SCORE_PAD.flat().map(s => (
                      <button key={s} onClick={() => setScoreValue(s)}
                        className={`py-3 rounded-xl text-base font-mono font-bold transition-all cursor-pointer border-none ${
                          scoreValue === s
                            ? 'bg-teal-500/25 text-teal-400 ring-1 ring-teal-500/40'
                            : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] active:bg-white/[0.12]'
                        }`}>
                        {s.toFixed(1)}
                      </button>
                    ))}
                  </div>

                  {/* Submit */}
                  <button
                    onClick={() => {
                      if (scoreValue !== null) setConfirmScore({ athleteId: athlete.heat_athlete_id, name: athlete.athlete_name, jersey: athlete.jersey_color, wave: nextWave, score: scoreValue })
                    }}
                    disabled={scoreValue === null}
                    className="w-full mt-3 py-4 rounded-xl text-lg font-bold transition-all cursor-pointer border-none disabled:opacity-20 disabled:cursor-default bg-teal-600 hover:bg-teal-500 active:bg-teal-400 text-white"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {scoreValue !== null ? `Submit ${scoreValue.toFixed(1)}` : 'Select Score'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Head judge link */}
      {heat?.is_head_judge && (
        <div className="mx-4 mt-4 mb-6">
          <a href={`/judge/head?heat_id=${heat.id}`}
            className="block text-center py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-semibold no-underline"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Open Head Judge Panel →
          </a>
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {confirmScore && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50" onClick={() => setConfirmScore(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-[#0B2D4A] rounded-3xl p-8 max-w-xs w-full text-center border border-white/10">
            {/* Jersey bar */}
            <div className={`h-1 rounded-full mx-auto w-16 mb-6 ${JERSEY[confirmScore.jersey || '']?.bg || 'bg-slate-500'}`} />

            <div className="text-[10px] font-mono text-white/25 tracking-widest uppercase mb-2">Confirm Score</div>
            <div className="text-6xl font-mono font-bold text-teal-400 mb-1">{confirmScore.score.toFixed(1)}</div>
            <div className="text-sm text-white/40 mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {confirmScore.name} · Wave {confirmScore.wave}
            </div>
            <div className="text-[9px] font-mono text-white/15 mb-8 tracking-wide">Score locks after submission</div>

            <div className="flex gap-3">
              <button onClick={() => setConfirmScore(null)}
                className="flex-1 py-3.5 rounded-xl border border-white/10 bg-transparent text-white/40 text-sm font-semibold cursor-pointer hover:bg-white/[0.04]"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Cancel</button>
              <button onClick={submitScore} disabled={submitting}
                className="flex-1 py-3.5 rounded-xl border-none bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold cursor-pointer disabled:opacity-50"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{submitting ? '…' : 'Lock Score'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ISA Scale Slide-up ── */}
      {showCriteria && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50" onClick={() => setShowCriteria(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-[#0B2D4A] rounded-t-3xl p-6 pb-10 w-full max-w-lg border-t border-white/10">
            <div className="flex justify-between items-center mb-5">
              <span className="text-base font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>ISA Judging Scale</span>
              <button onClick={() => setShowCriteria(false)} className="text-white/30 text-lg cursor-pointer bg-transparent border-none hover:text-white/50">✕</button>
            </div>
            <div className="space-y-1">
              {ISA_CRITERIA.map(c => (
                <div key={c.range} className="flex items-center gap-4 py-2.5 border-b border-white/[0.04]">
                  <span className={`font-mono text-sm font-bold w-14 text-center ${c.color}`}>{c.range}</span>
                  <div>
                    <div className={`text-sm font-semibold ${c.color}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{c.label}</div>
                    <div className="text-[11px] text-white/30">{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[9px] font-mono text-white/10 text-center mt-5 tracking-widest uppercase">
              Commitment · Difficulty · Variety · Speed · Power · Flow
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
