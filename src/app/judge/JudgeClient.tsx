'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

/* ─── Fonts ─── */
const FONT_ID = 'bsa-fonts'
if (typeof document !== 'undefined' && !document.getElementById(FONT_ID)) {
  const l = document.createElement('link'); l.id = FONT_ID; l.rel = 'stylesheet'
  l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600;700;800&display=swap'
  document.head.appendChild(l)
}

/* ─── Theme — light only ─── */
const T = {
  bg: 'linear-gradient(145deg, #E4E9EF 0%, #EDF1F5 40%, #E6EBF0 100%)',
  glass: 'rgba(255,255,255,0.55)', glassStrong: 'rgba(255,255,255,0.65)',
  glassBorder: 'rgba(0,0,0,0.08)',
  text: '#0F172A', textSec: 'rgba(15,23,42,0.55)', textMuted: 'rgba(15,23,42,0.25)',
  scrim: 'rgba(0,0,0,0.2)', numpadGlass: 'rgba(255,255,255,0.92)',
  shadow: '0 8px 32px rgba(0,0,0,0.08)',
  scoreBg: 'rgba(0,0,0,0.04)', scoreBgBest: 'rgba(0,0,0,0.07)',
  red: '#DC2626',
}

const ISA_FOOTER = [
  { range: '0–1.9', label: 'Poor' },
  { range: '2–3.9', label: 'Fair' },
  { range: '4–5.9', label: 'Average' },
  { range: '6–7.9', label: 'Good' },
  { range: '8–9.9', label: 'Excellent' },
  { range: '10', label: 'Perfect' },
]

const JERSEY: Record<string, string> = {
  red: '#DC2626', blue: '#2563EB', white: '#CBD5E1', yellow: '#EAB308',
  green: '#16A34A', black: '#1E293B', pink: '#EC4899', orange: '#EA580C',
}

const ff = { ui: 'Inter, -apple-system, sans-serif', mono: 'Geist Mono, ui-monospace, monospace' }
const MIN_WAVES = 4
const MAX_WAVES = 10
const SCORES = Array.from({ length: 20 }, (_, i) => (i + 1) * 0.5)

const glass = (bg: string, border: string, blur = 40, radius = 16) => ({
  background: bg, backdropFilter: `blur(${blur}px)`, WebkitBackdropFilter: `blur(${blur}px)`,
  border: `1px solid ${border}`, borderRadius: radius,
} as const)

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

function getBest2(scores: { wave_number: number; score: number }[]): number[] {
  return [...scores].sort((a, b) => b.score - a.score).slice(0, 2).map(s => s.wave_number)
}

function useTimer(start: string | null, dur: number, status: string) {
  const [rem, setRem] = useState(dur * 60)
  useEffect(() => {
    if (!start || status !== 'live') { setRem(dur * 60); return }
    const tick = () => setRem(Math.max(0, dur * 60 - Math.floor((Date.now() - new Date(start).getTime()) / 1000)))
    tick(); const i = setInterval(tick, 1000); return () => clearInterval(i)
  }, [start, dur, status])
  const m = Math.floor(rem / 60), s = rem % 60
  const total = dur * 60
  const pct = total > 0 ? rem / total : 1
  return { rem, fmt: `${m}:${s.toString().padStart(2, '0')}`, warn: rem <= 30, pct }
}

function playScoreLockSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.12)
    osc.connect(gain).connect(ctx.destination)
    osc.start(); osc.stop(ctx.currentTime + 0.12)
  } catch {}
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
  const [customInput, setCustomInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [lastScored, setLastScored] = useState<string | null>(null) // "athleteId-wave" key
  const [connected, setConnected] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  const sb = createClient()
  const timer = useTimer(heat?.actual_start || null, heat?.duration_minutes || 20, heat?.status || 'pending')

  const login = async () => {
    setPinError('')
    const res = await fetch('/api/judge/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) })
    const d = await res.json()
    if (d.judge) { setJudge(d.judge); localStorage.setItem('bsa_judge', JSON.stringify(d.judge)) }
    else setPinError('Invalid PIN')
  }
  const logout = () => { setJudge(null); localStorage.removeItem('bsa_judge') }
  useEffect(() => {
    const s = localStorage.getItem('bsa_judge')
    if (s) { setJudge(JSON.parse(s)); return }
    // Auto-login from URL params (QR code flow)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const urlPin = params.get('pin')
      const urlHeat = params.get('heat_id')
      if (urlPin) {
        setPin(urlPin)
        fetch('/api/judge/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: urlPin }) })
          .then(r => r.json())
          .then(d => {
            if (d.judge) { setJudge(d.judge); localStorage.setItem('bsa_judge', JSON.stringify(d.judge)); if (urlHeat) setSelectedHeatId(urlHeat) }
          })
      }
    }
  }, [])

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
      .subscribe((status) => { setConnected(status === 'SUBSCRIBED') })
    return () => { sb.removeChannel(ch) }
  }, [selectedHeatId, loadHeatData])

  const submitScore = async () => {
    if (!numpad || selectedScore === null || !judge) return
    setSubmitting(true)
    const res = await fetch('/api/judge/score-v2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ judge_id: judge.id, heat_athlete_id: numpad.athleteId, wave_number: numpad.wave, score: selectedScore }) })
    const d = await res.json()
    setSubmitting(false)
    if (d.success) {
      playScoreLockSound()
      showMsg(`${selectedScore.toFixed(1)} locked`, true)
      setLastScored(`${numpad.athleteId}-${numpad.wave}`)
      setTimeout(() => setLastScored(null), 1500)
      setNumpad(null); setSelectedScore(null); setCustomInput('')
    } else showMsg(d.error || 'Error', false)
    loadHeatData()
  }
  const showMsg = (msg: string, ok: boolean) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2500) }
  const handleCustomInput = (val: string) => {
    setCustomInput(val)
    const n = parseFloat(val)
    if (!isNaN(n) && n >= 0 && n <= 10) {
      setSelectedScore(Math.round(n * 10) / 10)
    } else if (val === '') {
      setSelectedScore(null)
    }
  }
  const getPriority = (id: string) => heat?.priority_order ? heat.priority_order.indexOf(id) + 1 : 0

  /* ━━━ PIN LOGIN ━━━ */
  if (!judge) return (
    <div style={{ minHeight: '100dvh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', width: 340, padding: 32, ...glass(T.glassStrong, T.glassBorder, 60, 28) }}>
        <div style={{ fontSize: 42, fontWeight: 800, color: T.text, fontFamily: ff.ui, letterSpacing: '-0.04em' }}>BSA</div>
        <div style={{ fontSize: 10, color: T.textMuted, fontFamily: ff.mono, letterSpacing: '0.2em', marginBottom: 40 }}>COMPETITION JUDGE</div>
        <input type="tel" inputMode="numeric" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyDown={e => { if (e.key === 'Enter' && pin.length >= 4) login() }} placeholder="PIN"
          style={{ width: '100%', textAlign: 'center', fontSize: 32, fontFamily: ff.mono, letterSpacing: '0.5em', fontWeight: 700, padding: '18px 16px', ...glass(T.glass, T.glassBorder, 20, 16), color: T.text, outline: 'none', boxSizing: 'border-box' }} />
        {pinError && <div style={{ color: '#DC2626', fontSize: 13, marginTop: 12, fontWeight: 500 }}>{pinError}</div>}
        <button onClick={login} disabled={pin.length < 4}
          style={{ width: '100%', marginTop: 16, padding: '16px 0', borderRadius: 16, border: 'none', background: pin.length >= 4 ? T.text : T.glass, color: pin.length >= 4 ? '#fff' : T.textMuted, fontSize: 16, fontWeight: 700, fontFamily: ff.ui, cursor: pin.length >= 4 ? 'pointer' : 'default', opacity: pin.length >= 4 ? 1 : 0.3, transition: 'all 0.3s' }}>
          Enter
        </button>
      </div>
    </div>
  )

  /* ━━━ NO LIVE HEATS ━━━ */
  if (!heats.length) return (
    <div style={{ minHeight: '100dvh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 32 }}>
      <div style={{ padding: '40px 48px', ...glass(T.glassStrong, T.glassBorder, 60, 28) }}>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: ff.ui, marginBottom: 6, color: T.text }}>No Live Heats</div>
        <div style={{ fontSize: 14, color: T.textSec }}>Waiting for a heat to go live</div>
        <div style={{ fontSize: 12, color: T.textMuted, marginTop: 32, fontFamily: ff.mono }}>{judge.name}</div>
        <button onClick={logout} style={{ fontSize: 12, color: T.textMuted, marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Sign out</button>
      </div>
    </div>
  )

  const sorted = athletes.map(a => {
    const best2 = getBest2(a.my_scores)
    const total = a.my_scores.filter(s => best2.includes(s.wave_number)).reduce((sum, s) => sum + s.score, 0)
    return { ...a, best2, total }
  }).sort((a, b) => b.total - a.total)
  const leaderTotal = sorted[0]?.total || 0

  // Auto-size: highest scored wave + 2, clamped to MIN_WAVES..MAX_WAVES
  const highestWave = Math.max(0, ...athletes.flatMap(a => a.my_scores.map(s => s.wave_number)))
  const visibleWaves = Math.min(MAX_WAVES, Math.max(MIN_WAVES, highestWave + 2))

  /* ━━━ MAIN GRID ━━━ */
  return (
    <div style={{ minHeight: '100dvh', background: T.bg, color: T.text, fontFamily: ff.ui, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ═══ HEADER ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', margin: '8px 12px 0', flexShrink: 0, ...glass(T.glassStrong, T.glassBorder, 40, 16) }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>Heat {heat?.heat_number}</span>
          <span style={{ fontFamily: ff.mono, fontSize: 10, color: T.textSec }}>{heat?.division_name} · {heat?.round_name}</span>
        </div>
        <div style={{ fontFamily: ff.mono, fontSize: 40, fontWeight: 800, letterSpacing: '0.04em', lineHeight: 1, color: timer.warn ? '#DC2626' : T.text, animation: timer.warn ? 'pulse 1s ease-in-out infinite' : undefined }}>
          {timer.fmt}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: connected ? '#16A34A' : '#DC2626' }} title={connected ? 'Connected' : 'Reconnecting'} />
          <span style={{ fontFamily: ff.mono, fontSize: 10, color: T.textMuted }}>{judge.name}</span>
          <button onClick={toggleFullscreen} style={{ fontFamily: ff.mono, fontSize: 9, color: T.textMuted, background: 'none', border: `1px solid ${T.glassBorder}`, cursor: 'pointer', padding: '3px 8px', borderRadius: 6 }}>{isFullscreen ? 'Exit' : 'Full'}</button>
          <button onClick={logout} style={{ fontFamily: ff.mono, fontSize: 9, color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>Exit</button>
        </div>
      </div>

      {/* ═══ PROGRESS BAR ═══ */}
      <div style={{ height: 3, margin: '0 12px', borderRadius: 2, background: 'rgba(0,0,0,0.04)', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${timer.pct * 100}%`, borderRadius: 2, transition: 'width 1s linear', background: timer.warn ? '#DC2626' : timer.pct < 0.15 ? '#EAB308' : '#2BA5A0' }} />
      </div>

      {/* ═══ PRIORITY ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', margin: '6px 12px 0', flexShrink: 0, ...glass(T.glass, T.glassBorder, 20, 12) }}>
        <span style={{ fontFamily: ff.mono, fontSize: 9, fontWeight: 700, color: T.textSec, letterSpacing: '0.12em', marginRight: 4 }}>PRIORITY</span>
        {heat?.priority_order?.length ? heat.priority_order.map((id, i) => {
          const a = athletes.find(x => x.heat_athlete_id === id)
          const jc = JERSEY[a?.jersey_color || ''] || '#94A3B8'
          return (
            <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', fontSize: 11, fontFamily: ff.mono, fontWeight: 700, color: T.text, ...glass(i === 0 ? `${jc}12` : 'rgba(0,0,0,0.02)', i === 0 ? `${jc}25` : T.glassBorder, 20, 8) }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: jc }} />
              P{i + 1} {a?.athlete_name?.split(' ').pop()}
            </span>
          )
        }) : <span style={{ fontFamily: ff.mono, fontSize: 10, color: T.textMuted }}>Not established</span>}
      </div>

      {/* ═══ GRID ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', margin: '6px 12px', gap: 4, overflow: 'hidden', ...glass(T.glass, T.glassBorder, 30, 20), padding: 6 }}>

        {/* Headers */}
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, padding: '0 4px' }}>
          <div style={{ width: 200, flexShrink: 0, paddingLeft: 16, fontFamily: ff.mono, fontSize: 8, fontWeight: 600, color: T.textMuted, letterSpacing: '0.12em' }}>ATHLETE</div>
          <div style={{ flex: 1, display: 'flex' }}>
            {Array.from({ length: visibleWaves }, (_, i) => (
              <div key={i} style={{ flex: 1, minWidth: 72, textAlign: 'center', fontFamily: ff.mono, fontSize: 9, fontWeight: 600, color: T.textMuted, letterSpacing: '0.1em', padding: '6px 0' }}>W{i + 1}</div>
            ))}
          </div>
          <div style={{ width: 110, flexShrink: 0, textAlign: 'center', fontFamily: ff.mono, fontSize: 8, fontWeight: 600, color: T.textMuted, letterSpacing: '0.1em' }}>TOTAL</div>
          <div style={{ width: 80, flexShrink: 0, textAlign: 'center', fontFamily: ff.mono, fontSize: 8, fontWeight: 600, color: T.textMuted, letterSpacing: '0.1em' }}>NEEDS</div>
        </div>

        {/* Rows */}
        {sorted.map((athlete, rank) => {
          const jc = JERSEY[athlete.jersey_color || ''] || '#94A3B8'
          const isWhite = athlete.jersey_color === 'white'
          const isLeader = rank === 0 && athlete.total > 0
          const scoresMap = new Map(athlete.my_scores.map(s => [s.wave_number, s.score]))
          const bestWaveLabels = athlete.best2.length >= 2 ? `W${athlete.best2[0]} + W${athlete.best2[1]}` : athlete.best2.length === 1 ? `W${athlete.best2[0]}` : ''

          return (
            <div key={athlete.heat_athlete_id} style={{ flex: 1, display: 'flex', alignItems: 'center', minHeight: 0, ...glass(T.glassStrong, T.glassBorder, 20, 14), overflow: 'hidden', position: 'relative' }}>

              {/* Jersey bar */}
              <div style={{ width: 5, alignSelf: 'stretch', background: jc, borderRadius: '14px 0 0 14px', flexShrink: 0 }} />

              {/* Athlete */}
              <div style={{ width: 195, flexShrink: 0, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: jc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ff.mono, fontSize: 15, fontWeight: 800, color: (isWhite || athlete.jersey_color === 'yellow') ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)', flexShrink: 0 }}>
                  {rank + 1}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 }}>{athlete.athlete_name}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                    {getPriority(athlete.heat_athlete_id) === 1 && <span style={{ fontFamily: ff.mono, fontSize: 9, fontWeight: 700, color: T.textSec }}>P1</span>}
                    {athlete.my_scores.length > 0 && <span style={{ fontFamily: ff.mono, fontSize: 9, color: T.textMuted }}>{athlete.my_scores.length}w</span>}
                  </div>
                </div>
              </div>

              {/* Wave cells */}
              <div style={{ flex: 1, display: 'flex', alignSelf: 'stretch', gap: 4, padding: '6px 0' }}>
                {Array.from({ length: visibleWaves }, (_, wi) => {
                  const wn = wi + 1
                  const score = scoresMap.get(wn)
                  const isBest = athlete.best2.includes(wn)

                  if (score !== undefined) {
                    const isJustScored = lastScored === `${athlete.heat_athlete_id}-${wn}`
                    return (
                      <div key={wi} style={{ flex: 1, minWidth: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: isBest ? T.scoreBgBest : T.scoreBg, boxShadow: isBest ? `inset 0 0 0 2px ${jc}25` : 'none', position: 'relative', animation: isJustScored ? 'scoreFlash 1.5s ease-out' : undefined }}>
                        <span style={{ fontFamily: ff.mono, fontWeight: 700, fontSize: isBest ? 22 : 18, color: T.text }}>{score.toFixed(1)}</span>
                        {isBest && <span style={{ position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: jc }} />}
                      </div>
                    )
                  }
                  return (
                    <div key={wi} onClick={(e) => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                      setNumpad({ athleteId: athlete.heat_athlete_id, name: athlete.athlete_name, jersey: athlete.jersey_color, wave: wn, rect })
                      setSelectedScore(null)
                      setCustomInput('')
                    }} style={{ flex: 1, minWidth: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s', border: `1.5px dashed rgba(0,0,0,0.08)`, background: 'rgba(0,0,0,0.01)' }}>
                      <span style={{ fontSize: 18, fontWeight: 600, color: T.textMuted, fontFamily: ff.mono }}>+</span>
                    </div>
                  )
                })}
              </div>

              {/* Total */}
              <div style={{ width: 110, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${T.glassBorder}` }}>
                <span style={{ fontFamily: ff.mono, fontSize: 28, fontWeight: 800, lineHeight: 1, color: isLeader ? jc : T.text }}>{athlete.total.toFixed(2)}</span>
                {bestWaveLabels && <span style={{ fontFamily: ff.mono, fontSize: 7, fontWeight: 600, color: T.textMuted, letterSpacing: '0.05em', marginTop: 3 }}>{bestWaveLabels}</span>}
              </div>

              {/* Needs */}
              <div style={{ width: 80, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${T.glassBorder}` }}>
                {rank > 0 && athlete.total > 0 && (() => {
                  const needs = leaderTotal - athlete.total + 0.01
                  if (needs > 0 && needs <= 10) return (
                    <>
                      <span style={{ fontFamily: ff.mono, fontSize: 15, fontWeight: 600, color: T.textSec }}>{needs.toFixed(2)}</span>
                      <span style={{ fontFamily: ff.mono, fontSize: 7, color: T.textMuted, letterSpacing: '0.08em', marginTop: 1 }}>TO LEAD</span>
                    </>
                  )
                  return null
                })()}
              </div>
            </div>
          )
        })}
      </div>

      {/* ═══ FOOTER — ISA Guide always visible ═══ */}
      <div style={{ padding: '8px 20px', margin: '0 12px 8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...glass(T.glassStrong, T.glassBorder, 30, 12) }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {ISA_FOOTER.map(c => (
            <span key={c.range} style={{ fontFamily: ff.mono, fontSize: 9, color: T.textSec }}>
              <span style={{ fontWeight: 700 }}>{c.range}</span> {c.label}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {heat?.is_head_judge && <a href={`/judge/head?heat_id=${heat.id}`} style={{ fontFamily: ff.mono, fontSize: 10, color: T.text, textDecoration: 'none', letterSpacing: '0.04em', fontWeight: 700, padding: '4px 12px', ...glass('rgba(0,0,0,0.04)', T.glassBorder, 20, 8) }}>HEAD JUDGE</a>}
          <span style={{ fontFamily: ff.mono, fontSize: 8, color: T.textMuted, letterSpacing: '0.08em' }}>BSA COMPETE</span>
        </div>
      </div>

      {/* ═══ NUMPAD ═══ */}
      {numpad && (() => {
        const jc = JERSEY[numpad.jersey || ''] || '#94A3B8'
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
            <div style={{ position: 'absolute', inset: 0, background: T.scrim, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} onClick={() => { setNumpad(null); setSelectedScore(null) }} />
            <div style={{
              position: 'absolute', zIndex: 101, width: 340, padding: 20,
              ...glass(T.numpadGlass, T.glassBorder, 60, 24),
              boxShadow: T.shadow,
              left: Math.min(Math.max(16, numpad.rect.left + numpad.rect.width / 2 - 170), typeof window !== 'undefined' ? window.innerWidth - 356 : 800),
              top: numpad.rect.bottom + 380 > (typeof window !== 'undefined' ? window.innerHeight : 1000) ? numpad.rect.top - 388 : numpad.rect.bottom + 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 4, background: jc }} />
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{numpad.name}</span>
                </div>
                <span style={{ fontFamily: ff.mono, fontSize: 10, color: T.textSec, ...glass('transparent', T.glassBorder, 20, 6), padding: '2px 8px' }}>W{numpad.wave}</span>
              </div>

              {/* Custom score input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <input type="number" inputMode="decimal" step="0.1" min="0" max="10" value={customInput}
                  onChange={e => handleCustomInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && selectedScore !== null) submitScore() }}
                  placeholder="Custom"
                  style={{ flex: 1, textAlign: 'center', fontSize: 28, fontFamily: ff.mono, fontWeight: 800, padding: '12px 8px', ...glass(selectedScore !== null ? `${jc}06` : 'rgba(0,0,0,0.02)', T.glassBorder, 15, 14), color: T.text, outline: 'none', boxSizing: 'border-box' }} />
                <div style={{ textAlign: 'center', minWidth: 60 }}>
                  <div style={{ fontFamily: ff.mono, fontSize: 10, color: T.textMuted }}>0.0 – 10.0</div>
                </div>
              </div>

              {/* Quick-select grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 10 }}>
                {SCORES.map(s => {
                  const sel = selectedScore === s && customInput === ''
                  return (
                    <button key={s} onClick={() => { setSelectedScore(s); setCustomInput('') }}
                      style={{ padding: '11px 0', borderRadius: 10, border: 'none', fontFamily: ff.mono, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.12s',
                        background: sel ? `${jc}15` : 'rgba(0,0,0,0.03)',
                        color: sel ? T.text : T.textSec,
                        boxShadow: sel ? `inset 0 0 0 1.5px ${jc}40` : 'none',
                      }}>
                      {s.toFixed(1)}
                    </button>
                  )
                })}
              </div>

              <button onClick={submitScore} disabled={selectedScore === null || submitting}
                style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 700, fontFamily: ff.ui, cursor: selectedScore !== null ? 'pointer' : 'default', transition: 'all 0.2s',
                  background: selectedScore !== null ? T.text : T.glass, color: selectedScore !== null ? '#fff' : T.textMuted,
                  opacity: selectedScore !== null ? 1 : 0.2,
                }}>
                {submitting ? 'Submitting' : selectedScore !== null ? `Lock ${selectedScore.toFixed(1)}` : 'Select a Score'}
              </button>
            </div>
          </div>
        )
      })()}

      {toast && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 200, padding: '10px 20px', fontSize: 13, fontWeight: 600, fontFamily: ff.mono, color: '#fff', boxShadow: T.shadow,
          ...glass(toast.ok ? 'rgba(15,23,42,0.85)' : 'rgba(220,38,38,0.85)', 'rgba(255,255,255,0.1)', 20, 12) }}>
          {toast.msg}
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } } @keyframes scoreFlash { 0% { background: rgba(43,165,160,0.2); transform: scale(1.03); } 100% { background: transparent; transform: scale(1); } }`}</style>
    </div>
  )
}
