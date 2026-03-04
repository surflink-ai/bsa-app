'use client'

import { useState, useEffect, useCallback, CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'

/* ─── Design Tokens ─── */
const DARK = {
  bg: '#06111F', bgCard: '#0A1929', bgCell: '#0D2137', bgCellHover: '#112A45',
  bgCellBest: 'rgba(43,165,160,0.08)', border: 'rgba(255,255,255,0.04)',
  borderCell: 'rgba(255,255,255,0.06)', text: '#F1F5F9',
  textSec: 'rgba(255,255,255,0.35)', textMuted: 'rgba(255,255,255,0.12)',
  teal: '#2BA5A0', tealGlow: 'rgba(43,165,160,0.15)', gold: '#FFD700',
  totalBorder: 'rgba(43,165,160,0.1)', numpadBg: '#0B2440',
  numpadBorder: 'rgba(43,165,160,0.15)', numpadBtn: 'rgba(255,255,255,0.03)',
  numpadBtnText: 'rgba(255,255,255,0.5)', scrim: 'rgba(6,17,31,0.5)',
  isaBg: '#0B2440', bestBorder: 'rgba(43,165,160,0.15)',
}
const LIGHT = {
  bg: '#F8FAFB', bgCard: '#FFFFFF', bgCell: '#EFF4F8', bgCellHover: '#E4ECF2',
  bgCellBest: 'rgba(43,165,160,0.06)', border: 'rgba(0,0,0,0.06)',
  borderCell: 'rgba(0,0,0,0.08)', text: '#0A2540',
  textSec: 'rgba(10,37,64,0.45)', textMuted: 'rgba(10,37,64,0.15)',
  teal: '#2BA5A0', tealGlow: 'rgba(43,165,160,0.1)', gold: '#C5970A',
  totalBorder: 'rgba(43,165,160,0.15)', numpadBg: '#FFFFFF',
  numpadBorder: 'rgba(0,0,0,0.1)', numpadBtn: 'rgba(0,0,0,0.04)',
  numpadBtnText: 'rgba(0,0,0,0.5)', scrim: 'rgba(0,0,0,0.3)',
  isaBg: '#FFFFFF', bestBorder: 'rgba(43,165,160,0.2)',
}

const JERSEY: Record<string, string> = {
  red: '#DC2626', blue: '#2563EB', white: '#E2E8F0', yellow: '#EAB308',
  green: '#16A34A', black: '#1E293B', pink: '#EC4899', orange: '#EA580C',
}

const ISA = [
  { range: '0–1.9', label: 'Poor', color: '#DC2626' },
  { range: '2–3.9', label: 'Fair', color: '#EA580C' },
  { range: '4–5.9', label: 'Average', color: '#EAB308' },
  { range: '6–7.9', label: 'Good', color: '#2BA5A0' },
  { range: '8–9.9', label: 'Excellent', color: '#2563EB' },
  { range: '10', label: 'Perfect', color: '#FFD700' },
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

/* ─── Helpers ─── */
function scoreClass(s: number): string {
  if (s >= 10) return 'perf'; if (s >= 8) return 'exc'; if (s >= 6) return 'good';
  if (s >= 4) return 'avg'; if (s >= 2) return 'fair'; return 'low'
}
function scoreColor(s: number, dark: boolean): string {
  if (s >= 10) return '#FFD700'; if (s >= 8) return '#2563EB'; if (s >= 6) return '#2BA5A0';
  if (s >= 4) return '#EAB308'; if (s >= 2) return '#EA580C'; return '#DC2626'
}
function getBest2(scores: { wave_number: number; score: number }[]): number[] {
  const sorted = [...scores].sort((a, b) => b.score - a.score)
  return sorted.slice(0, 2).map(s => s.wave_number)
}

const MAX_WAVES = 10
const SCORES = Array.from({ length: 20 }, (_, i) => (i + 1) * 0.5) // 0.5 to 10.0

/* ─── Timer ─── */
function useTimer(start: string | null, dur: number, status: string) {
  const [rem, setRem] = useState(dur * 60)
  useEffect(() => {
    if (!start || status !== 'live') { setRem(dur * 60); return }
    const tick = () => setRem(Math.max(0, dur * 60 - Math.floor((Date.now() - new Date(start).getTime()) / 1000)))
    tick(); const i = setInterval(tick, 1000); return () => clearInterval(i)
  }, [start, dur, status])
  const m = Math.floor(rem / 60), s = rem % 60
  return { rem, fmt: `${m}:${s.toString().padStart(2, '0')}`, warn: rem <= 30, low: rem <= 300 && rem > 30 }
}

export function JudgeClient() {
  const [judge, setJudge] = useState<Judge | null>(null)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [heat, setHeat] = useState<HeatInfo | null>(null)
  const [athletes, setAthletes] = useState<AthleteScore[]>([])
  const [heats, setHeats] = useState<{ id: string; label: string }[]>([])
  const [selectedHeatId, setSelectedHeatId] = useState<string | null>(null)
  const [numpad, setNumpad] = useState<{ athleteId: string; name: string; jersey: string | null; wave: number; rect: DOMRect } | null>(null)
  const [selectedScore, setSelectedScore] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [showISA, setShowISA] = useState(false)
  const [dark, setDark] = useState(true)

  const t = dark ? DARK : LIGHT
  const sb = createClient()
  const timer = useTimer(heat?.actual_start || null, heat?.duration_minutes || 20, heat?.status || 'pending')

  // Persist theme
  useEffect(() => { const s = localStorage.getItem('bsa_theme'); if (s === 'light') setDark(false) }, [])
  const toggleTheme = () => { const next = !dark; setDark(next); localStorage.setItem('bsa_theme', next ? 'dark' : 'light') }

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
    if (!numpad || selectedScore === null || !judge) return
    setSubmitting(true)
    const res = await fetch('/api/judge/score-v2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ judge_id: judge.id, heat_athlete_id: numpad.athleteId, wave_number: numpad.wave, score: selectedScore }) })
    const d = await res.json()
    setSubmitting(false)
    if (d.success) { showMsg(`${selectedScore.toFixed(1)} locked`, true); setNumpad(null); setSelectedScore(null) }
    else showMsg(d.error || 'Error', false)
    loadHeatData()
  }
  const showMsg = (msg: string, ok: boolean) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2500) }
  const getPriority = (id: string) => heat?.priority_order ? heat.priority_order.indexOf(id) + 1 : 0

  // Font stacks
  const ff = { display: 'Space Grotesk, sans-serif', mono: 'JetBrains Mono, monospace', body: 'DM Sans, sans-serif' }

  /* ━━━ PIN LOGIN ━━━ */
  if (!judge) return (
    <div style={{ minHeight: '100dvh', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', width: 320, padding: 24 }}>
        <div style={{ fontSize: 40, fontWeight: 800, color: t.text, fontFamily: ff.display, letterSpacing: '-0.02em' }}>BSA</div>
        <div style={{ fontSize: 11, color: t.textMuted, fontFamily: ff.mono, letterSpacing: '0.15em', marginBottom: 48 }}>COMPETITION JUDGE</div>
        <input type="tel" inputMode="numeric" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyDown={e => { if (e.key === 'Enter' && pin.length >= 4) login() }} placeholder="• • • •"
          style={{ width: '100%', textAlign: 'center', fontSize: 36, fontFamily: ff.mono, letterSpacing: '0.4em', fontWeight: 700, padding: '20px 16px', background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `2px solid ${t.borderCell}`, borderRadius: 16, color: t.text, outline: 'none', boxSizing: 'border-box' }} />
        {pinError && <div style={{ color: '#EF4444', fontSize: 14, marginTop: 12, fontWeight: 500 }}>{pinError}</div>}
        <button onClick={login} disabled={pin.length < 4}
          style={{ width: '100%', marginTop: 20, padding: '18px 0', borderRadius: 16, border: 'none', background: pin.length >= 4 ? t.teal : t.numpadBtn, color: '#fff', fontSize: 18, fontWeight: 700, fontFamily: ff.display, cursor: pin.length >= 4 ? 'pointer' : 'default', opacity: pin.length >= 4 ? 1 : 0.3, transition: 'all 0.2s' }}>
          Enter
        </button>
      </div>
    </div>
  )

  /* ━━━ NO LIVE HEATS ━━━ */
  if (!heats.length) return (
    <div style={{ minHeight: '100dvh', background: t.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: t.text, textAlign: 'center', padding: 32 }}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.15 }}>🌊</div>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: ff.display, marginBottom: 8 }}>No Live Heats</div>
      <div style={{ fontSize: 15, color: t.textSec }}>Waiting for a heat to go live…</div>
      <div style={{ fontSize: 13, color: t.textMuted, marginTop: 40, fontFamily: ff.mono }}>{judge.name} · {judge.role === 'head_judge' ? 'Head Judge' : 'Judge'}</div>
      <button onClick={logout} style={{ fontSize: 13, color: t.textMuted, marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Sign out</button>
    </div>
  )

  // Compute sorted athletes + best waves + totals
  const sorted = athletes.map(a => {
    const best2 = getBest2(a.my_scores)
    const total = a.my_scores.filter(s => best2.includes(s.wave_number)).reduce((sum, s) => sum + s.score, 0)
    return { ...a, best2, total }
  }).sort((a, b) => b.total - a.total)
  const leaderTotal = sorted[0]?.total || 0

  /* ━━━ MAIN SCORING GRID ━━━ */
  return (
    <div style={{ minHeight: '100dvh', background: t.bg, color: t.text, fontFamily: ff.body, display: 'flex', flexDirection: 'column' }}>

      {/* ═══ HEADER ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px', flexShrink: 0, borderBottom: `1px solid ${t.border}`, background: dark ? 'linear-gradient(180deg, rgba(43,165,160,0.03) 0%, transparent 100%)' : undefined }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontFamily: ff.display, fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>Heat {heat?.heat_number}</span>
          <span style={{ fontFamily: ff.mono, fontSize: 11, color: t.textSec, letterSpacing: '0.02em' }}>{heat?.division_name} · {heat?.round_name}</span>
        </div>
        <div style={{ fontFamily: ff.mono, fontSize: 44, fontWeight: 800, letterSpacing: '0.08em', lineHeight: 1, color: timer.warn ? '#EF4444' : t.text, animation: timer.warn ? 'pulse 1s ease-in-out infinite' : undefined }}>
          {timer.fmt}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => setShowISA(!showISA)} style={{ fontFamily: ff.mono, fontSize: 10, fontWeight: 600, color: t.teal, background: t.tealGlow, border: `1px solid ${dark ? 'rgba(43,165,160,0.15)' : 'rgba(43,165,160,0.2)'}`, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', letterSpacing: '0.08em' }}>ISA</button>
          <button onClick={toggleTheme} style={{ fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>{dark ? '☀️' : '🌙'}</button>
          <span style={{ fontFamily: ff.mono, fontSize: 11, color: t.textMuted }}>{judge.name}</span>
          <button onClick={logout} style={{ fontFamily: ff.mono, fontSize: 10, color: t.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>Exit</button>
        </div>
      </div>

      {/* ═══ PRIORITY STRIP ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '6px 24px', flexShrink: 0, borderBottom: `1px solid ${t.border}`, background: dark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
        <span style={{ fontFamily: ff.mono, fontSize: 9, fontWeight: 600, color: t.textMuted, letterSpacing: '0.12em', marginRight: 8 }}>PRIORITY</span>
        {heat?.priority_order?.length ? heat.priority_order.map((id, i) => {
          const a = athletes.find(x => x.heat_athlete_id === id)
          return (
            <span key={id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 4, fontSize: 11, fontFamily: ff.mono, fontWeight: 600, color: i === 0 ? t.gold : t.textSec, background: i === 0 ? (dark ? 'rgba(255,215,0,0.08)' : 'rgba(197,151,10,0.08)') : 'transparent' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: JERSEY[a?.jersey_color || ''] || '#94A3B8' }} />
              P{i + 1} {a?.athlete_name?.split(' ').pop()}
            </span>
          )
        }) : <span style={{ fontFamily: ff.mono, fontSize: 11, color: t.textMuted }}>Not established</span>}
      </div>

      {/* ═══ ISA PANEL ═══ */}
      {showISA && (
        <div style={{ position: 'fixed', top: 48, right: 24, zIndex: 90, background: t.isaBg, border: `1px solid ${t.borderCell}`, borderRadius: 12, padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', minWidth: 200 }}>
          {ISA.map(c => (
            <div key={c.range} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontFamily: ff.mono, fontSize: 11 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />
              <span style={{ color: t.textSec, width: 44 }}>{c.range}</span>
              <span style={{ fontWeight: 600, color: c.color }}>{c.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ═══ GRID ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Column headers */}
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, borderBottom: `1px solid ${t.border}` }}>
          <div style={{ width: 220, flexShrink: 0, padding: '8px 24px', fontFamily: ff.mono, fontSize: 9, fontWeight: 600, color: t.textMuted, letterSpacing: '0.1em' }}>ATHLETE</div>
          <div style={{ flex: 1, display: 'flex' }}>
            {Array.from({ length: MAX_WAVES }, (_, i) => (
              <div key={i} style={{ flex: 1, minWidth: 72, textAlign: 'center', padding: '8px 4px', fontFamily: ff.mono, fontSize: 9, fontWeight: 600, color: t.textMuted, letterSpacing: '0.1em' }}>W{i + 1}</div>
            ))}
          </div>
          <div style={{ width: 120, flexShrink: 0, textAlign: 'center', padding: '8px 12px', fontFamily: ff.mono, fontSize: 9, fontWeight: 600, color: t.textMuted, letterSpacing: '0.1em' }}>TOTAL</div>
          <div style={{ width: 90, flexShrink: 0, textAlign: 'center', padding: '8px 12px', fontFamily: ff.mono, fontSize: 9, fontWeight: 600, color: t.textMuted, letterSpacing: '0.1em' }}>NEEDS</div>
        </div>

        {/* Athlete rows */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {sorted.map((athlete, rank) => {
            const jColor = JERSEY[athlete.jersey_color || ''] || '#94A3B8'
            const isWhite = athlete.jersey_color === 'white'
            const isLeader = rank === 0 && athlete.total > 0
            const priority = getPriority(athlete.heat_athlete_id)
            const scoresMap = new Map(athlete.my_scores.map(s => [s.wave_number, s.score]))

            return (
              <div key={athlete.heat_athlete_id} style={{ flex: 1, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${t.border}`, minHeight: 0 }}>

                {/* Jersey bar */}
                <div style={{ width: 5, alignSelf: 'stretch', background: jColor, borderRadius: '0 3px 3px 0', flexShrink: 0 }} />

                {/* Athlete info */}
                <div style={{ width: 215, flexShrink: 0, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: jColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ff.mono, fontSize: 10, fontWeight: 800, color: isWhite ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)', border: isWhite ? `1px solid ${dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}` : 'none', flexShrink: 0 }}>
                    {rank + 1}
                  </div>
                  <div>
                    <div style={{ fontFamily: ff.display, fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 }}>{athlete.athlete_name}</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                      {priority === 1 && <span style={{ fontFamily: ff.mono, fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 3, background: dark ? 'rgba(255,215,0,0.1)' : 'rgba(197,151,10,0.1)', color: t.gold }}>P1</span>}
                    </div>
                  </div>
                </div>

                {/* Wave cells */}
                <div style={{ flex: 1, display: 'flex', alignSelf: 'stretch' }}>
                  {Array.from({ length: MAX_WAVES }, (_, wi) => {
                    const waveNum = wi + 1
                    const score = scoresMap.get(waveNum)
                    const isBest = athlete.best2.includes(waveNum)

                    if (score !== undefined) {
                      return (
                        <div key={wi} style={{ flex: 1, minWidth: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${t.borderCell}`, background: isBest ? t.bgCellBest : t.bgCell, boxShadow: isBest ? `inset 0 0 0 1px ${t.bestBorder}` : 'none', position: 'relative' }}>
                          <span style={{ fontFamily: ff.mono, fontWeight: 700, fontSize: isBest ? 22 : 20, letterSpacing: '0.02em', color: scoreColor(score, dark) }}>{score.toFixed(1)}</span>
                          {isBest && <span style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: t.teal, opacity: 0.5 }} />}
                        </div>
                      )
                    }
                    return (
                      <div key={wi} onClick={(e) => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                        setNumpad({ athleteId: athlete.heat_athlete_id, name: athlete.athlete_name, jersey: athlete.jersey_color, wave: waveNum, rect })
                        setSelectedScore(null)
                      }} style={{ flex: 1, minWidth: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${t.borderCell}`, cursor: 'pointer', transition: 'background 0.12s', color: t.textMuted, fontSize: 16, fontFamily: ff.mono }}>
                        <span style={{ opacity: 0.3 }}>+</span>
                      </div>
                    )
                  })}
                </div>

                {/* Total */}
                <div style={{ width: 120, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: `2px solid ${t.totalBorder}`, padding: '0 12px' }}>
                  <span style={{ fontFamily: ff.mono, fontSize: 28, fontWeight: 800, letterSpacing: '0.02em', lineHeight: 1, color: isLeader ? t.teal : t.text }}>{athlete.total.toFixed(2)}</span>
                  <span style={{ fontFamily: ff.mono, fontSize: 8, fontWeight: 600, color: t.textMuted, letterSpacing: '0.1em', marginTop: 2 }}>BEST 2</span>
                </div>

                {/* Needs */}
                <div style={{ width: 90, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${t.borderCell}`, padding: '0 8px' }}>
                  {rank > 0 && athlete.total > 0 && (() => {
                    const needs = leaderTotal - athlete.total + 0.01
                    if (needs > 0 && needs <= 10) return (
                      <>
                        <span style={{ fontFamily: ff.mono, fontSize: 16, fontWeight: 600, color: t.textSec }}>{needs.toFixed(2)}</span>
                        <span style={{ fontFamily: ff.mono, fontSize: 8, fontWeight: 500, color: t.textMuted, letterSpacing: '0.08em', marginTop: 1 }}>TO LEAD</span>
                      </>
                    )
                    return null
                  })()}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <div style={{ padding: '6px 24px', flexShrink: 0, borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: dark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
        <span style={{ fontFamily: ff.mono, fontSize: 9, color: t.textMuted, letterSpacing: '0.1em' }}>BLIND JUDGING · YOUR SCORES ONLY</span>
        {heat?.is_head_judge && <a href={`/judge/head?heat_id=${heat.id}`} style={{ fontFamily: ff.mono, fontSize: 10, color: t.gold, textDecoration: 'none', letterSpacing: '0.05em', fontWeight: 600 }}>HEAD JUDGE PANEL →</a>}
        <span style={{ fontFamily: ff.mono, fontSize: 9, color: t.textMuted, letterSpacing: '0.05em' }}>BSA COMPETE</span>
      </div>

      {/* ═══ NUMPAD ═══ */}
      {numpad && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <div style={{ position: 'absolute', inset: 0, background: t.scrim, backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }} onClick={() => { setNumpad(null); setSelectedScore(null) }} />
          <div style={{
            position: 'absolute', zIndex: 101, background: t.numpadBg, border: `1px solid ${t.numpadBorder}`, borderRadius: 16, padding: 16,
            boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)', width: 340,
            left: Math.min(Math.max(16, numpad.rect.left + numpad.rect.width / 2 - 170), window.innerWidth - 356),
            top: numpad.rect.bottom + 360 > window.innerHeight ? numpad.rect.top - 368 : numpad.rect.bottom + 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 2px' }}>
              <span style={{ fontFamily: ff.display, fontSize: 14, fontWeight: 700, color: JERSEY[numpad.jersey || ''] || t.text }}>{numpad.name}</span>
              <span style={{ fontFamily: ff.mono, fontSize: 11, color: t.textSec }}>WAVE {numpad.wave}</span>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 12, padding: '8px 0', borderRadius: 10, background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
              <div style={{ fontFamily: ff.mono, fontSize: 48, fontWeight: 800, color: selectedScore !== null ? scoreColor(selectedScore, dark) : t.textMuted, transition: 'color 0.1s' }}>
                {selectedScore !== null ? selectedScore.toFixed(1) : '—.—'}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 10 }}>
              {SCORES.map(s => (
                <button key={s} onClick={() => setSelectedScore(s)}
                  style={{ padding: '14px 0', borderRadius: 10, border: selectedScore === s ? `1.5px solid ${scoreColor(s, dark)}` : '1.5px solid transparent', background: selectedScore === s ? `${scoreColor(s, dark)}20` : t.numpadBtn, color: selectedScore === s ? scoreColor(s, dark) : t.numpadBtnText, fontSize: 16, fontFamily: ff.mono, fontWeight: 700, cursor: 'pointer', transition: 'all 0.1s' }}>
                  {s.toFixed(1)}
                </button>
              ))}
            </div>
            <button onClick={submitScore} disabled={selectedScore === null || submitting}
              style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: selectedScore !== null ? t.teal : t.numpadBtn, color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: ff.display, cursor: selectedScore !== null ? 'pointer' : 'default', opacity: selectedScore !== null ? 1 : 0.15, transition: 'all 0.15s' }}>
              {submitting ? 'Submitting…' : selectedScore !== null ? `Lock ${selectedScore.toFixed(1)}` : 'Select a Score'}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 200, padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: ff.mono, background: toast.ok ? 'rgba(43,165,160,0.95)' : 'rgba(220,38,38,0.95)', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          {toast.msg}
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
    </div>
  )
}
