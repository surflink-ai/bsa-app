'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

/* ─── Design Tokens ─── */
const DARK = {
  bg: 'linear-gradient(135deg, #020B18 0%, #0A1628 25%, #071A2E 50%, #0C1F35 75%, #061422 100%)',
  glass: 'rgba(255,255,255,0.03)', glassHover: 'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(255,255,255,0.08)', glassStrong: 'rgba(255,255,255,0.05)',
  glassBright: 'rgba(255,255,255,0.07)',
  text: '#F1F5F9', textSec: 'rgba(255,255,255,0.4)', textMuted: 'rgba(255,255,255,0.15)',
  teal: '#2DD4BF', gold: '#FBBF24', red: '#F87171',
  scrim: 'rgba(0,0,0,0.4)', numpadGlass: 'rgba(15,30,55,0.85)',
  shadow: '0 8px 32px rgba(0,0,0,0.3)',
}
const LIGHT = {
  bg: 'linear-gradient(135deg, #E8F0F8 0%, #F0F4FA 25%, #E4EEF6 50%, #EDF2F8 75%, #F5F8FC 100%)',
  glass: 'rgba(255,255,255,0.55)', glassHover: 'rgba(255,255,255,0.7)',
  glassBorder: 'rgba(0,0,0,0.06)', glassStrong: 'rgba(255,255,255,0.6)',
  glassBright: 'rgba(255,255,255,0.75)',
  text: '#0F172A', textSec: 'rgba(15,23,42,0.5)', textMuted: 'rgba(15,23,42,0.15)',
  teal: '#0D9488', gold: '#B45309', red: '#DC2626',
  scrim: 'rgba(0,0,0,0.2)', numpadGlass: 'rgba(255,255,255,0.88)',
  shadow: '0 8px 32px rgba(0,0,0,0.08)',
}

const JERSEY: Record<string, string> = {
  red: '#DC2626', blue: '#2563EB', white: '#E2E8F0', yellow: '#EAB308',
  green: '#16A34A', black: '#1E293B', pink: '#EC4899', orange: '#EA580C',
}

const ISA = [
  { range: '0–1.9', label: 'Poor', color: '#F87171' },
  { range: '2–3.9', label: 'Fair', color: '#FB923C' },
  { range: '4–5.9', label: 'Average', color: '#FBBF24' },
  { range: '6–7.9', label: 'Good', color: '#2DD4BF' },
  { range: '8–9.9', label: 'Excellent', color: '#60A5FA' },
  { range: '10', label: 'Perfect', color: '#FBBF24' },
]

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

function scoreColor(s: number): string {
  if (s >= 8) return '#60A5FA'; if (s >= 6) return '#2DD4BF';
  if (s >= 4) return '#FBBF24'; if (s >= 2) return '#FB923C'; return '#F87171'
}
function scoreTint(s: number, dark: boolean): string {
  const base = scoreColor(s)
  return dark ? `${base}12` : `${base}18`
}
function getBest2(scores: { wave_number: number; score: number }[]): number[] {
  return [...scores].sort((a, b) => b.score - a.score).slice(0, 2).map(s => s.wave_number)
}

const MAX_WAVES = 10
const SCORES = Array.from({ length: 20 }, (_, i) => (i + 1) * 0.5)
const ff = { display: 'Space Grotesk, sans-serif', mono: 'JetBrains Mono, monospace', body: 'DM Sans, sans-serif' }

function useTimer(start: string | null, dur: number, status: string) {
  const [rem, setRem] = useState(dur * 60)
  useEffect(() => {
    if (!start || status !== 'live') { setRem(dur * 60); return }
    const tick = () => setRem(Math.max(0, dur * 60 - Math.floor((Date.now() - new Date(start).getTime()) / 1000)))
    tick(); const i = setInterval(tick, 1000); return () => clearInterval(i)
  }, [start, dur, status])
  const m = Math.floor(rem / 60), s = rem % 60
  return { rem, fmt: `${m}:${s.toString().padStart(2, '0')}`, warn: rem <= 30 }
}

/* ─── Glass helper ─── */
const glass = (bg: string, border: string, blur = 40, radius = 16) => ({
  background: bg, backdropFilter: `blur(${blur}px)`, WebkitBackdropFilter: `blur(${blur}px)`,
  border: `1px solid ${border}`, borderRadius: radius,
} as const)

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

  useEffect(() => { const s = localStorage.getItem('bsa_theme'); if (s === 'light') setDark(false) }, [])
  const toggleTheme = () => { const next = !dark; setDark(next); localStorage.setItem('bsa_theme', next ? 'dark' : 'light') }

  const login = async () => {
    setPinError('')
    const res = await fetch('/api/judge/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) })
    const d = await res.json()
    if (d.judge) { setJudge(d.judge); localStorage.setItem('bsa_judge', JSON.stringify(d.judge)) }
    else setPinError('Invalid PIN')
  }
  const logout = () => { setJudge(null); localStorage.removeItem('bsa_judge') }
  useEffect(() => { const s = localStorage.getItem('bsa_judge'); if (s) setJudge(JSON.parse(s)) }, [])

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

  useEffect(() => {
    if (!selectedHeatId) return
    const ch = sb.channel(`judge-${selectedHeatId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comp_judge_scores' }, () => loadHeatData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comp_heat_athletes' }, () => loadHeatData())
      .subscribe()
    return () => { sb.removeChannel(ch) }
  }, [selectedHeatId, loadHeatData])

  const submitScore = async () => {
    if (!numpad || selectedScore === null || !judge) return
    setSubmitting(true)
    const res = await fetch('/api/judge/score-v2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ judge_id: judge.id, heat_athlete_id: numpad.athleteId, wave_number: numpad.wave, score: selectedScore }) })
    const d = await res.json()
    setSubmitting(false)
    if (d.success) { showMsg(`${selectedScore.toFixed(1)} locked ✓`, true); setNumpad(null); setSelectedScore(null) }
    else showMsg(d.error || 'Error', false)
    loadHeatData()
  }
  const showMsg = (msg: string, ok: boolean) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2500) }
  const getPriority = (id: string) => heat?.priority_order ? heat.priority_order.indexOf(id) + 1 : 0

  /* ━━━ PIN LOGIN ━━━ */
  if (!judge) return (
    <div style={{ minHeight: '100dvh', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', width: 340, padding: 32, ...glass(t.glass, t.glassBorder, 60, 28) }}>
        <div style={{ fontSize: 42, fontWeight: 800, color: t.text, fontFamily: ff.display, letterSpacing: '-0.03em' }}>BSA</div>
        <div style={{ fontSize: 10, color: t.textMuted, fontFamily: ff.mono, letterSpacing: '0.2em', marginBottom: 40 }}>COMPETITION JUDGE</div>
        <input type="tel" inputMode="numeric" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyDown={e => { if (e.key === 'Enter' && pin.length >= 4) login() }} placeholder="• • • •"
          style={{ width: '100%', textAlign: 'center', fontSize: 32, fontFamily: ff.mono, letterSpacing: '0.5em', fontWeight: 700, padding: '18px 16px', ...glass(t.glassStrong, t.glassBorder, 20, 16), color: t.text, outline: 'none', boxSizing: 'border-box' }} />
        {pinError && <div style={{ color: t.red, fontSize: 13, marginTop: 12, fontWeight: 500 }}>{pinError}</div>}
        <button onClick={login} disabled={pin.length < 4}
          style={{ width: '100%', marginTop: 16, padding: '16px 0', borderRadius: 16, border: 'none', background: pin.length >= 4 ? t.teal : t.glass, color: pin.length >= 4 ? '#fff' : t.textMuted, fontSize: 16, fontWeight: 700, fontFamily: ff.display, cursor: pin.length >= 4 ? 'pointer' : 'default', opacity: pin.length >= 4 ? 1 : 0.3, transition: 'all 0.3s' }}>
          Enter
        </button>
      </div>
    </div>
  )

  /* ━━━ NO LIVE HEATS ━━━ */
  if (!heats.length) return (
    <div style={{ minHeight: '100dvh', background: t.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: t.text, textAlign: 'center', padding: 32 }}>
      <div style={{ padding: '40px 48px', ...glass(t.glass, t.glassBorder, 60, 28) }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.2 }}>🌊</div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: ff.display, marginBottom: 6 }}>No Live Heats</div>
        <div style={{ fontSize: 14, color: t.textSec }}>Waiting for a heat to go live…</div>
        <div style={{ fontSize: 12, color: t.textMuted, marginTop: 32, fontFamily: ff.mono }}>{judge.name}</div>
        <button onClick={logout} style={{ fontSize: 12, color: t.textMuted, marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Sign out</button>
      </div>
    </div>
  )

  const sorted = athletes.map(a => {
    const best2 = getBest2(a.my_scores)
    const total = a.my_scores.filter(s => best2.includes(s.wave_number)).reduce((sum, s) => sum + s.score, 0)
    return { ...a, best2, total }
  }).sort((a, b) => b.total - a.total)
  const leaderTotal = sorted[0]?.total || 0

  /* ━━━ MAIN GRID ━━━ */
  return (
    <div style={{ minHeight: '100dvh', background: t.bg, color: t.text, fontFamily: ff.body, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ═══ HEADER — floating glass bar ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', margin: '8px 12px 0', flexShrink: 0, ...glass(t.glassStrong, t.glassBorder, 40, 16) }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontFamily: ff.display, fontSize: 17, fontWeight: 700 }}>Heat {heat?.heat_number}</span>
          <span style={{ fontFamily: ff.mono, fontSize: 10, color: t.textSec }}>{heat?.division_name} · {heat?.round_name}</span>
        </div>
        <div style={{ fontFamily: ff.mono, fontSize: 40, fontWeight: 800, letterSpacing: '0.06em', lineHeight: 1, color: timer.warn ? t.red : t.text, animation: timer.warn ? 'pulse 1s ease-in-out infinite' : undefined }}>
          {timer.fmt}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setShowISA(!showISA)} style={{ fontFamily: ff.mono, fontSize: 9, fontWeight: 600, color: t.teal, padding: '5px 10px', cursor: 'pointer', letterSpacing: '0.08em', ...glass('transparent', t.glassBorder, 20, 8) }}>ISA</button>
          <button onClick={toggleTheme} style={{ fontSize: 13, padding: '4px 8px', cursor: 'pointer', ...glass('transparent', t.glassBorder, 20, 8) }}>{dark ? '☀️' : '🌙'}</button>
          <span style={{ fontFamily: ff.mono, fontSize: 10, color: t.textMuted }}>{judge.name}</span>
          <button onClick={logout} style={{ fontFamily: ff.mono, fontSize: 9, color: t.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>Exit</button>
        </div>
      </div>

      {/* ═══ PRIORITY — glass chips ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 20px', margin: '6px 12px 0', flexShrink: 0 }}>
        <span style={{ fontFamily: ff.mono, fontSize: 8, fontWeight: 600, color: t.textMuted, letterSpacing: '0.15em', marginRight: 4 }}>PRIORITY</span>
        {heat?.priority_order?.length ? heat.priority_order.map((id, i) => {
          const a = athletes.find(x => x.heat_athlete_id === id)
          const jc = JERSEY[a?.jersey_color || ''] || '#94A3B8'
          return (
            <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', fontSize: 10, fontFamily: ff.mono, fontWeight: 600, color: i === 0 ? t.gold : t.textSec, ...glass(i === 0 ? `${jc}15` : 'transparent', i === 0 ? `${t.gold}30` : t.glassBorder, 20, 8) }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: jc, boxShadow: `0 0 6px ${jc}60` }} />
              P{i + 1} {a?.athlete_name?.split(' ').pop()}
            </span>
          )
        }) : <span style={{ fontFamily: ff.mono, fontSize: 10, color: t.textMuted }}>Not established</span>}
      </div>

      {/* ═══ ISA PANEL ═══ */}
      {showISA && (
        <div style={{ position: 'fixed', top: 56, right: 24, zIndex: 90, padding: '14px 18px', boxShadow: t.shadow, ...glass(t.numpadGlass, t.glassBorder, 60, 16), minWidth: 180 }}>
          {ISA.map(c => (
            <div key={c.range} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontFamily: ff.mono, fontSize: 10 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.color, boxShadow: `0 0 4px ${c.color}80` }} />
              <span style={{ color: t.textSec, width: 40 }}>{c.range}</span>
              <span style={{ fontWeight: 600, color: c.color }}>{c.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ═══ GRID ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', margin: '6px 12px', gap: 4, overflow: 'hidden', ...glass(t.glass, t.glassBorder, 30, 20), padding: 6 }}>

        {/* Column headers */}
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, padding: '0 4px' }}>
          <div style={{ width: 200, flexShrink: 0, paddingLeft: 16, fontFamily: ff.mono, fontSize: 8, fontWeight: 600, color: t.textMuted, letterSpacing: '0.12em' }}>ATHLETE</div>
          <div style={{ flex: 1, display: 'flex' }}>
            {Array.from({ length: MAX_WAVES }, (_, i) => (
              <div key={i} style={{ flex: 1, minWidth: 64, textAlign: 'center', fontFamily: ff.mono, fontSize: 8, fontWeight: 600, color: t.textMuted, letterSpacing: '0.1em', padding: '6px 0' }}>W{i + 1}</div>
            ))}
          </div>
          <div style={{ width: 110, flexShrink: 0, textAlign: 'center', fontFamily: ff.mono, fontSize: 8, fontWeight: 600, color: t.textMuted, letterSpacing: '0.1em' }}>TOTAL</div>
          <div style={{ width: 80, flexShrink: 0, textAlign: 'center', fontFamily: ff.mono, fontSize: 8, fontWeight: 600, color: t.textMuted, letterSpacing: '0.1em' }}>NEEDS</div>
        </div>

        {/* Athlete rows — each a glass card */}
        {sorted.map((athlete, rank) => {
          const jc = JERSEY[athlete.jersey_color || ''] || '#94A3B8'
          const isWhite = athlete.jersey_color === 'white'
          const isLeader = rank === 0 && athlete.total > 0
          const priority = getPriority(athlete.heat_athlete_id)
          const scoresMap = new Map(athlete.my_scores.map(s => [s.wave_number, s.score]))

          return (
            <div key={athlete.heat_athlete_id} style={{ flex: 1, display: 'flex', alignItems: 'center', minHeight: 0, ...glass(t.glassStrong, t.glassBorder, 20, 14), overflow: 'hidden', position: 'relative' }}>

              {/* Jersey glow bar */}
              <div style={{ width: 4, alignSelf: 'stretch', background: `linear-gradient(180deg, ${jc}, ${jc}60)`, borderRadius: '14px 0 0 14px', boxShadow: `0 0 12px ${jc}40`, flexShrink: 0 }} />

              {/* Athlete info */}
              <div style={{ width: 196, flexShrink: 0, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: jc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ff.mono, fontSize: 10, fontWeight: 800, color: isWhite ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.85)', flexShrink: 0, boxShadow: `0 2px 8px ${jc}40` }}>
                  {rank + 1}
                </div>
                <div>
                  <div style={{ fontFamily: ff.display, fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 }}>{athlete.athlete_name}</div>
                  {priority === 1 && <span style={{ fontFamily: ff.mono, fontSize: 8, fontWeight: 800, color: t.gold, letterSpacing: '0.05em' }}>P1</span>}
                </div>
              </div>

              {/* Wave cells */}
              <div style={{ flex: 1, display: 'flex', alignSelf: 'stretch', gap: 3, padding: '4px 0' }}>
                {Array.from({ length: MAX_WAVES }, (_, wi) => {
                  const wn = wi + 1
                  const score = scoresMap.get(wn)
                  const isBest = athlete.best2.includes(wn)

                  if (score !== undefined) {
                    return (
                      <div key={wi} style={{ flex: 1, minWidth: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: scoreTint(score, dark), boxShadow: isBest ? `inset 0 0 0 1.5px ${scoreColor(score)}30, 0 0 8px ${scoreColor(score)}15` : 'none', position: 'relative' }}>
                        <span style={{ fontFamily: ff.mono, fontWeight: 700, fontSize: isBest ? 20 : 17, color: scoreColor(score), letterSpacing: '0.02em' }}>{score.toFixed(1)}</span>
                        {isBest && <span style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: scoreColor(score), boxShadow: `0 0 4px ${scoreColor(score)}` }} />}
                      </div>
                    )
                  }
                  return (
                    <div key={wi} onClick={(e) => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                      setNumpad({ athleteId: athlete.heat_athlete_id, name: athlete.athlete_name, jersey: athlete.jersey_color, wave: wn, rect })
                      setSelectedScore(null)
                    }} style={{ flex: 1, minWidth: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, cursor: 'pointer', transition: 'background 0.15s', color: t.textMuted, fontSize: 14, fontFamily: ff.mono }}>
                      <span style={{ opacity: 0.25 }}>+</span>
                    </div>
                  )
                })}
              </div>

              {/* Total */}
              <div style={{ width: 110, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${t.glassBorder}` }}>
                <span style={{ fontFamily: ff.mono, fontSize: 26, fontWeight: 800, lineHeight: 1, color: isLeader ? t.teal : t.text, textShadow: isLeader ? `0 0 12px ${t.teal}40` : 'none' }}>{athlete.total.toFixed(2)}</span>
                <span style={{ fontFamily: ff.mono, fontSize: 7, fontWeight: 600, color: t.textMuted, letterSpacing: '0.12em', marginTop: 2 }}>BEST 2</span>
              </div>

              {/* Needs */}
              <div style={{ width: 80, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${t.glassBorder}` }}>
                {rank > 0 && athlete.total > 0 && (() => {
                  const needs = leaderTotal - athlete.total + 0.01
                  if (needs > 0 && needs <= 10) return (
                    <>
                      <span style={{ fontFamily: ff.mono, fontSize: 14, fontWeight: 600, color: t.textSec }}>{needs.toFixed(2)}</span>
                      <span style={{ fontFamily: ff.mono, fontSize: 7, color: t.textMuted, letterSpacing: '0.08em', marginTop: 1 }}>TO LEAD</span>
                    </>
                  )
                  return null
                })()}
              </div>
            </div>
          )
        })}
      </div>

      {/* ═══ FOOTER ═══ */}
      <div style={{ padding: '6px 24px 8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: ff.mono, fontSize: 8, color: t.textMuted, letterSpacing: '0.12em' }}>BLIND JUDGING · YOUR SCORES ONLY</span>
        {heat?.is_head_judge && <a href={`/judge/head?heat_id=${heat.id}`} style={{ fontFamily: ff.mono, fontSize: 9, color: t.gold, textDecoration: 'none', letterSpacing: '0.05em', fontWeight: 600 }}>HEAD JUDGE →</a>}
        <span style={{ fontFamily: ff.mono, fontSize: 8, color: t.textMuted, letterSpacing: '0.08em' }}>BSA COMPETE</span>
      </div>

      {/* ═══ NUMPAD ═══ */}
      {numpad && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <div style={{ position: 'absolute', inset: 0, background: t.scrim, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} onClick={() => { setNumpad(null); setSelectedScore(null) }} />
          <div style={{
            position: 'absolute', zIndex: 101, width: 340, padding: 20,
            ...glass(t.numpadGlass, t.glassBorder, 60, 24),
            boxShadow: `${t.shadow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
            left: Math.min(Math.max(16, numpad.rect.left + numpad.rect.width / 2 - 170), typeof window !== 'undefined' ? window.innerWidth - 356 : 800),
            top: numpad.rect.bottom + 380 > (typeof window !== 'undefined' ? window.innerHeight : 1000) ? numpad.rect.top - 388 : numpad.rect.bottom + 8,
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 4, background: JERSEY[numpad.jersey || ''] || '#94A3B8', boxShadow: `0 0 6px ${JERSEY[numpad.jersey || ''] || '#94A3B8'}60` }} />
                <span style={{ fontFamily: ff.display, fontSize: 14, fontWeight: 700 }}>{numpad.name}</span>
              </div>
              <span style={{ fontFamily: ff.mono, fontSize: 10, color: t.textSec, ...glass('transparent', t.glassBorder, 20, 6), padding: '2px 8px' }}>W{numpad.wave}</span>
            </div>

            {/* Preview */}
            <div style={{ textAlign: 'center', marginBottom: 14, padding: '10px 0', borderRadius: 14, ...glass(selectedScore !== null ? scoreTint(selectedScore, dark) : 'transparent', 'transparent', 10, 14) }}>
              <div style={{ fontFamily: ff.mono, fontSize: 52, fontWeight: 800, color: selectedScore !== null ? scoreColor(selectedScore) : t.textMuted, transition: 'color 0.15s', textShadow: selectedScore !== null ? `0 0 20px ${scoreColor(selectedScore)}30` : 'none' }}>
                {selectedScore !== null ? selectedScore.toFixed(1) : '—.—'}
              </div>
            </div>

            {/* Score grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5, marginBottom: 12 }}>
              {SCORES.map(s => {
                const sel = selectedScore === s
                return (
                  <button key={s} onClick={() => setSelectedScore(s)}
                    style={{ padding: '13px 0', borderRadius: 10, border: 'none', fontFamily: ff.mono, fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'all 0.12s',
                      ...glass(sel ? `${scoreColor(s)}20` : dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', sel ? `${scoreColor(s)}40` : 'transparent', 10, 10),
                      color: sel ? scoreColor(s) : t.textSec,
                      boxShadow: sel ? `0 0 12px ${scoreColor(s)}20` : 'none',
                    }}>
                    {s.toFixed(1)}
                  </button>
                )
              })}
            </div>

            {/* Submit */}
            <button onClick={submitScore} disabled={selectedScore === null || submitting}
              style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', fontFamily: ff.display, fontSize: 15, fontWeight: 700, cursor: selectedScore !== null ? 'pointer' : 'default', transition: 'all 0.2s',
                background: selectedScore !== null ? t.teal : t.glass, color: selectedScore !== null ? '#fff' : t.textMuted,
                opacity: selectedScore !== null ? 1 : 0.2,
                boxShadow: selectedScore !== null ? `0 4px 16px ${t.teal}40` : 'none',
              }}>
              {submitting ? 'Submitting…' : selectedScore !== null ? `Lock ${selectedScore.toFixed(1)}` : 'Select a Score'}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 200, padding: '10px 20px', fontSize: 13, fontWeight: 600, fontFamily: ff.mono, color: '#fff', boxShadow: t.shadow,
          ...glass(toast.ok ? 'rgba(45,212,191,0.9)' : 'rgba(248,113,113,0.9)', 'rgba(255,255,255,0.1)', 20, 12) }}>
          {toast.msg}
        </div>
      )}

      {showISA && <div style={{ position: 'fixed', inset: 0, zIndex: 80 }} onClick={() => setShowISA(false)} />}

      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
    </div>
  )
}
