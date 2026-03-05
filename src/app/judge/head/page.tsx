'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

const FONT_ID = 'bsa-fonts'
if (typeof document !== 'undefined' && !document.getElementById(FONT_ID)) {
  const l = document.createElement('link'); l.id = FONT_ID; l.rel = 'stylesheet'
  l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600;700;800&display=swap'
  document.head.appendChild(l)
}

const T = {
  bg: 'linear-gradient(145deg, #E4E9EF 0%, #EDF1F5 40%, #E6EBF0 100%)',
  glass: 'rgba(255,255,255,0.55)', glassStrong: 'rgba(255,255,255,0.65)',
  glassBorder: 'rgba(0,0,0,0.08)',
  text: '#0F172A', textSec: 'rgba(15,23,42,0.55)', textMuted: 'rgba(15,23,42,0.25)',
  scrim: 'rgba(0,0,0,0.2)', modalGlass: 'rgba(255,255,255,0.92)',
  shadow: '0 8px 32px rgba(0,0,0,0.08)',
  scoreBg: 'rgba(0,0,0,0.04)', scoreBgBest: 'rgba(0,0,0,0.07)',
  red: '#DC2626',
}
const JERSEY: Record<string, string> = { red: '#DC2626', blue: '#2563EB', white: '#CBD5E1', yellow: '#EAB308', green: '#16A34A', black: '#1E293B', pink: '#EC4899', orange: '#EA580C' }
const ff = { ui: 'Inter, -apple-system, sans-serif', mono: 'Geist Mono, ui-monospace, monospace' }

const glass = (bg: string, border: string, blur = 40, radius = 16) => ({
  background: bg, backdropFilter: `blur(${blur}px)`, WebkitBackdropFilter: `blur(${blur}px)`,
  border: `1px solid ${border}`, borderRadius: radius,
} as const)

interface WaveJudgeScore { score_id: string; judge_id: string; judge_name: string; judge_position: number; score: number; is_override: boolean; override_reason?: string }
interface WaveData { wave_number: number; averaged_score: number | null; judge_scores: WaveJudgeScore[] }
interface AthleteData {
  id: string; athlete_name: string; jersey_color: string | null; wave_count: number
  total_score: number; needs_score: number | null; penalty: string
  has_priority: boolean; result_position: number; waves: WaveData[]
}
interface PanelData {
  heat: { id: string; status: string; duration_minutes: number; actual_start: string | null; certified: boolean; priority_order: string[] }
  judges: { judge_id: string; name: string; position: number; is_head_judge: boolean }[]
  athletes: AthleteData[]
  judge_performance: { judge_id: string; judge_name: string; position: number; scores_submitted: number; average_score: number }[]
  heat_average: number
}

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

export default function Wrapper() {
  return <Suspense fallback={<div style={{ minHeight: '100dvh', background: T.bg, color: T.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading</div>}><HeadJudgePage /></Suspense>
}

function HeadJudgePage() {
  const heatId = useSearchParams().get('heat_id')
  const sb = createClient()
  const [judge, setJudge] = useState<{ id: string; name: string } | null>(null)
  const [data, setData] = useState<PanelData | null>(null)
  const [error, setError] = useState('')
  const [priorityState, setPriorityState] = useState<any>(null)
  const [priorityMenu, setPriorityMenu] = useState<string | null>(null)
  const [intModal, setIntModal] = useState<{ id: string; name: string } | null>(null)
  const [intWave, setIntWave] = useState('')
  const [intType, setIntType] = useState('interference_half')
  const [overrideModal, setOverrideModal] = useState<{ scoreId: string; athleteName: string; judgeName: string; waveNumber: number; currentScore: number } | null>(null)
  const [overrideScore, setOverrideScore] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Horn/buzzer via Web Audio API
  const playHorn = (blasts: number) => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const playBlast = (startTime: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(440, startTime)
      osc.frequency.linearRampToValueAtTime(220, startTime + 0.8)
      gain.gain.setValueAtTime(0.5, startTime)
      gain.gain.linearRampToValueAtTime(0, startTime + 0.8)
      osc.connect(gain).connect(ctx.destination)
      osc.start(startTime)
      osc.stop(startTime + 0.8)
    }
    for (let i = 0; i < blasts; i++) playBlast(ctx.currentTime + i * 1.0)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  const timer = useTimer(data?.heat?.actual_start || null, data?.heat?.duration_minutes || 20, data?.heat?.status || 'pending')

  useEffect(() => { const s = localStorage.getItem('bsa_judge'); if (s) setJudge(JSON.parse(s)) }, [])

  const loadPanel = useCallback(async () => {
    if (!heatId || !judge) return
    const res = await fetch(`/api/judge/head-panel?heat_id=${heatId}&judge_id=${judge.id}`)
    const json = await res.json()
    if (json.error) setError(json.error); else setData(json)
  }, [heatId, judge])

  const loadPriority = useCallback(async () => {
    if (!heatId) return
    const res = await fetch(`/api/judge/priority?heat_id=${heatId}`)
    const json = await res.json()
    if (!json.error) setPriorityState(json)
  }, [heatId])

  useEffect(() => { loadPanel(); loadPriority() }, [loadPanel, loadPriority])
  useEffect(() => { if (!heatId || !judge) return; const i = setInterval(() => { loadPanel(); loadPriority() }, 3000); return () => clearInterval(i) }, [heatId, judge, loadPanel, loadPriority])
  useEffect(() => {
    if (!heatId) return
    const ch = sb.channel(`head-${heatId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'comp_judge_scores' }, () => loadPanel()).on('postgres_changes', { event: '*', schema: 'public', table: 'comp_interference' }, () => loadPanel()).subscribe()
    return () => { sb.removeChannel(ch) }
  }, [heatId, loadPanel])

  const priorityAction = async (action: string, athleteId?: string) => {
    await fetch('/api/judge/priority', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, heat_id: heatId, athlete_id: athleteId }) })
    setPriorityMenu(null); loadPanel(); loadPriority()
  }

  const callInterference = async () => {
    if (!intModal || !intWave || !judge) return
    await fetch('/api/judge/interference', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ judge_id: judge.id, heat_id: heatId, athlete_id: intModal.id, wave_number: parseInt(intWave), penalty_type: intType }) })
    setIntModal(null); setIntWave(''); loadPanel()
  }

  const submitOverride = async () => {
    if (!overrideModal || !overrideScore || !overrideReason || !judge) return
    await fetch('/api/judge/head-panel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'override_score',
        judge_id: judge.id,
        heat_id: heatId,
        score_id: overrideModal.scoreId,
        new_score: parseFloat(overrideScore),
        reason: overrideReason,
      }),
    })
    setOverrideModal(null); setOverrideScore(''); setOverrideReason(''); loadPanel()
  }

  const certifyHeat = async () => {
    if (!judge || !heatId || !confirm('Certify results? 15-minute protest window begins.')) return
    await fetch('/api/judge/head-panel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'certify', judge_id: judge.id, heat_id: heatId }) })
    loadPanel()
  }

  if (!judge) return <div style={{ minHeight: '100dvh', background: T.bg, color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><a href="/judge" style={{ color: T.textSec }}>Log in at /judge</a></div>
  if (error) return <div style={{ minHeight: '100dvh', background: T.bg, color: T.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ff.mono }}>{error}</div>
  if (!data) return <div style={{ minHeight: '100dvh', background: T.bg, color: T.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading</div>

  const highestWave = Math.max(0, ...data.athletes.flatMap(a => a.waves.filter(w => w.averaged_score != null).map(w => w.wave_number)))
  const maxWaves = Math.min(10, Math.max(4, highestWave + 2))
  const leaderTotal = data.athletes.length ? Math.max(...data.athletes.map(a => a.total_score)) : 0

  return (
    <div style={{ minHeight: '100dvh', background: T.bg, color: T.text, fontFamily: ff.ui, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', margin: '8px 12px 0', flexShrink: 0, ...glass(T.glassStrong, T.glassBorder, 40, 16) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: ff.mono, fontSize: 10, fontWeight: 700, color: T.textSec, letterSpacing: '0.08em' }}>HEAD JUDGE</span>
          <span style={{ fontSize: 10, color: T.textMuted, fontFamily: ff.mono }}>{judge.name}</span>
        </div>
        <div style={{ fontFamily: ff.mono, fontSize: 40, fontWeight: 800, letterSpacing: '0.04em', lineHeight: 1, color: timer.warn ? T.red : T.text }}>{timer.fmt}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => playHorn(3)} title="3 blasts — Start" style={{ padding: '6px 10px', border: `1px solid ${T.glassBorder}`, background: 'rgba(22,163,74,0.06)', color: '#16A34A', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: ff.mono, borderRadius: 8 }}>START</button>
          <button onClick={() => playHorn(1)} title="1 blast — End" style={{ padding: '6px 10px', border: `1px solid ${T.glassBorder}`, background: 'rgba(220,38,38,0.06)', color: '#DC2626', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: ff.mono, borderRadius: 8 }}>END</button>
          {data.heat.status === 'live' && !data.heat.certified && <button onClick={certifyHeat} style={{ padding: '7px 16px', border: 'none', background: T.text, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: ff.ui, borderRadius: 10 }}>Certify</button>}
          {data.heat.certified && <span style={{ fontSize: 10, fontFamily: ff.mono, color: T.textSec, fontWeight: 700, letterSpacing: '0.05em' }}>CERTIFIED</span>}
          <button onClick={toggleFullscreen} style={{ padding: '6px 10px', border: `1px solid ${T.glassBorder}`, background: 'transparent', color: T.textMuted, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: ff.mono, borderRadius: 8 }}>{isFullscreen ? 'EXIT' : 'FULL'}</button>
          <a href="/judge" style={{ fontSize: 10, color: T.textMuted, textDecoration: 'none', fontFamily: ff.mono }}>Back</a>
        </div>
      </div>

      {/* PRIORITY */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', margin: '6px 12px 0', flexShrink: 0, ...glass(T.glass, T.glassBorder, 20, 12) }}>
        <span style={{ fontFamily: ff.mono, fontSize: 9, fontWeight: 700, color: T.textSec, letterSpacing: '0.12em', marginRight: 4 }}>
          PRIORITY{priorityState?.phase === 'establishing' ? ' / ESTABLISHING' : ''}
        </span>
        {priorityState?.phase === 'establishing' ? (
          priorityState.athletes?.map((a: any) => {
            const jc = JERSEY[a.jersey_color] || '#94A3B8'
            return (
              <button key={a.heat_athlete_id} onClick={() => !a.has_ridden ? priorityAction('wave_ridden', a.heat_athlete_id) : null}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', fontSize: 10, fontWeight: 700, fontFamily: ff.ui, cursor: a.has_ridden ? 'default' : 'pointer', color: a.has_ridden ? T.textMuted : T.textSec, ...glass(a.has_ridden ? 'transparent' : `${jc}08`, a.has_ridden ? T.glassBorder : `${jc}20`, 20, 8) }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: jc }} />
                {a.athlete_name?.split(' ').pop()}{a.has_ridden && ' done'}
              </button>
            )
          })
        ) : data.heat.priority_order?.length ? (
          data.heat.priority_order.map((id, i) => {
            const a = data.athletes.find(x => x.id === id)
            const jc = JERSEY[a?.jersey_color || ''] || '#94A3B8'
            const pa = priorityState?.athletes?.find((x: any) => x.heat_athlete_id === id)
            const susp = pa?.priority_status === 'suspended'
            return (
              <div key={id} style={{ position: 'relative' }}>
                <button onClick={() => setPriorityMenu(priorityMenu === id ? null : id)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', fontSize: 11, fontWeight: 700, fontFamily: ff.ui, cursor: 'pointer', color: susp ? T.textMuted : T.text, opacity: susp ? 0.5 : 1, ...glass(i === 0 ? `${jc}12` : 'rgba(0,0,0,0.02)', i === 0 ? `${jc}25` : T.glassBorder, 20, 8) }}>
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: jc }} />
                  P{i + 1} {a?.athlete_name?.split(' ').pop()}
                </button>
                {priorityMenu === id && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 50, minWidth: 180, overflow: 'hidden', ...glass(T.modalGlass, T.glassBorder, 40, 14), boxShadow: T.shadow }}>
                    {[
                      { label: 'Wave Ridden', action: 'wave_ridden' },
                      ...(susp ? [{ label: 'Reinstate', action: 'reinstate' }] : [{ label: 'Suspend', action: 'suspend' }]),
                      { label: 'Blocking', action: 'block', danger: true },
                    ].map(item => (
                      <button key={item.action} onClick={() => priorityAction(item.action, id)}
                        style={{ display: 'block', width: '100%', padding: '10px 14px', border: 'none', borderBottom: `1px solid ${T.glassBorder}`, background: 'transparent', color: (item as any).danger ? T.red : T.textSec, fontSize: 12, textAlign: 'left', cursor: 'pointer', fontFamily: ff.ui }}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <button onClick={() => priorityAction('start')} style={{ padding: '3px 12px', fontSize: 10, fontWeight: 700, fontFamily: ff.mono, color: T.textSec, cursor: 'pointer', ...glass('transparent', T.glassBorder, 20, 8) }}>Start Heat</button>
        )}
      </div>

      {priorityMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setPriorityMenu(null)} />}

      {/* GRID */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', margin: '6px 12px', gap: 4, overflow: 'hidden', ...glass(T.glass, T.glassBorder, 30, 20), padding: 6 }}>

        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, padding: '0 4px' }}>
          <div style={{ width: 200, flexShrink: 0, paddingLeft: 16, fontFamily: ff.mono, fontSize: 8, fontWeight: 600, color: T.textMuted, letterSpacing: '0.12em' }}>ATHLETE</div>
          <div style={{ flex: 1, display: 'flex' }}>
            {Array.from({ length: maxWaves }, (_, i) => (
              <div key={i} style={{ flex: 1, minWidth: 72, textAlign: 'center', fontFamily: ff.mono, fontSize: 9, fontWeight: 600, color: T.textMuted, letterSpacing: '0.1em', padding: '6px 0' }}>W{i + 1}</div>
            ))}
          </div>
          <div style={{ width: 110, flexShrink: 0, textAlign: 'center', fontFamily: ff.mono, fontSize: 8, fontWeight: 600, color: T.textMuted, letterSpacing: '0.1em' }}>TOTAL</div>
          <div style={{ width: 80, flexShrink: 0, textAlign: 'center', fontFamily: ff.mono, fontSize: 8, fontWeight: 600, color: T.textMuted, letterSpacing: '0.1em' }}>NEEDS</div>
          <div style={{ width: 40, flexShrink: 0 }} />
        </div>

        {data.athletes.map((athlete) => {
          const jc = JERSEY[athlete.jersey_color || ''] || '#94A3B8'
          const isWhite = athlete.jersey_color === 'white'
          const isLeader = athlete.total_score === leaderTotal && athlete.total_score > 0
          const isDQ = athlete.penalty === 'double_interference'
          const hasInt = athlete.penalty && athlete.penalty !== 'none' && !isDQ

          const wavesWithScores = athlete.waves.filter(w => w.averaged_score != null)
          const best2 = [...wavesWithScores].sort((a, b) => (b.averaged_score || 0) - (a.averaged_score || 0)).slice(0, 2).map(w => w.wave_number)
          const bestLabel = best2.length >= 2 ? `W${best2[0]} + W${best2[1]}` : best2.length === 1 ? `W${best2[0]}` : ''

          return (
            <div key={athlete.id} style={{ flex: 1, display: 'flex', alignItems: 'center', minHeight: 0, overflow: 'hidden', opacity: isDQ ? 0.35 : 1, ...glass(T.glassStrong, T.glassBorder, 20, 14) }}>

              <div style={{ width: 5, alignSelf: 'stretch', background: jc, borderRadius: '14px 0 0 14px', flexShrink: 0 }} />

              <div style={{ width: 195, flexShrink: 0, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: jc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ff.mono, fontSize: 15, fontWeight: 800, color: (isWhite || athlete.jersey_color === 'yellow') ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)', flexShrink: 0 }}>
                  {athlete.result_position || '-'}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{athlete.athlete_name}</div>
                  <div style={{ display: 'flex', gap: 5, marginTop: 2 }}>
                    {isDQ && <span style={{ fontFamily: ff.mono, fontSize: 9, fontWeight: 800, color: T.red }}>DQ</span>}
                    {hasInt && <span style={{ fontFamily: ff.mono, fontSize: 9, fontWeight: 800, color: T.red }}>INT</span>}
                    <span style={{ fontFamily: ff.mono, fontSize: 9, color: T.textMuted }}>{athlete.wave_count}w</span>
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', alignSelf: 'stretch', gap: 4, padding: '6px 0' }}>
                {Array.from({ length: maxWaves }, (_, wi) => {
                  const wave = athlete.waves.find(w => w.wave_number === wi + 1)
                  const isBest = best2.includes(wi + 1)
                  if (!wave || wave.averaged_score == null) return (
                    <div key={wi} style={{ flex: 1, minWidth: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, border: '1.5px dashed rgba(0,0,0,0.06)', background: 'rgba(0,0,0,0.01)' }} />
                  )

                  const js = wave.judge_scores || []
                  const sortedScores = [...js.map(s => s.score)].sort((a, b) => a - b)
                  const lo = sortedScores[0], hi = sortedScores[sortedScores.length - 1]
                  let loD = false, hiD = false

                  return (
                    <div key={wi} style={{ flex: 1, minWidth: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: isBest ? T.scoreBgBest : T.scoreBg, boxShadow: isBest ? `inset 0 0 0 2px ${jc}25` : 'none', gap: 1, position: 'relative' }}>
                      <span style={{ fontFamily: ff.mono, fontWeight: 700, fontSize: isBest ? 20 : 17, color: T.text }}>{wave.averaged_score.toFixed(2)}</span>
                      <div style={{ display: 'flex', gap: 3 }}>
                        {js.map((s, si) => {
                          let dropped = false
                          if (js.length >= 5) {
                            if (!loD && s.score === lo) { dropped = true; loD = true }
                            else if (!hiD && s.score === hi) { dropped = true; hiD = true }
                          }
                          return <span key={si} onClick={() => setOverrideModal({ scoreId: s.score_id, athleteName: athlete.athlete_name, judgeName: s.judge_name, waveNumber: wave!.wave_number, currentScore: s.score })} style={{ fontFamily: ff.mono, fontSize: 8, fontWeight: 600, color: dropped ? T.textMuted : s.is_override ? '#D97706' : T.textSec, textDecoration: dropped ? 'line-through' : 'none', cursor: 'pointer', padding: '1px 2px', borderRadius: 3, background: s.is_override ? 'rgba(217,119,6,0.08)' : 'transparent' }}>{s.score.toFixed(1)}</span>
                        })}
                      </div>
                      {isBest && <span style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: jc }} />}
                    </div>
                  )
                })}
              </div>

              <div style={{ width: 110, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${T.glassBorder}` }}>
                <span style={{ fontFamily: ff.mono, fontSize: 28, fontWeight: 800, lineHeight: 1, color: isLeader ? jc : T.text }}>{athlete.total_score.toFixed(2)}</span>
                {bestLabel && <span style={{ fontFamily: ff.mono, fontSize: 7, fontWeight: 600, color: T.textMuted, letterSpacing: '0.05em', marginTop: 3 }}>{bestLabel}</span>}
              </div>

              <div style={{ width: 80, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${T.glassBorder}` }}>
                {athlete.needs_score != null && athlete.needs_score > 0 && athlete.needs_score <= 10 && (
                  <>
                    <span style={{ fontFamily: ff.mono, fontSize: 15, fontWeight: 600, color: T.textSec }}>{athlete.needs_score.toFixed(2)}</span>
                    <span style={{ fontFamily: ff.mono, fontSize: 7, color: T.textMuted, letterSpacing: '0.08em', marginTop: 1 }}>TO LEAD</span>
                  </>
                )}
              </div>

              <div style={{ width: 40, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <button onClick={() => setIntModal({ id: athlete.id, name: athlete.athlete_name })} style={{ fontFamily: ff.mono, fontSize: 9, fontWeight: 700, background: `${T.red}08`, border: `1px solid ${T.red}20`, borderRadius: 6, cursor: 'pointer', color: T.red, opacity: 0.6, padding: '5px 8px', letterSpacing: '0.05em' }}>INT</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* FOOTER — ISA guide + judge stats */}
      <div style={{ padding: '8px 20px', margin: '0 12px 8px', flexShrink: 0, ...glass(T.glassStrong, T.glassBorder, 30, 12) }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {[
              { r: '0–1.9', l: 'Poor' }, { r: '2–3.9', l: 'Fair' }, { r: '4–5.9', l: 'Average' },
              { r: '6–7.9', l: 'Good' }, { r: '8–9.9', l: 'Excellent' }, { r: '10', l: 'Perfect' },
            ].map(c => (
              <span key={c.r} style={{ fontFamily: ff.mono, fontSize: 9, color: T.textSec }}>
                <span style={{ fontWeight: 700 }}>{c.r}</span> {c.l}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {data.judge_performance.map(jp => {
              const outlier = Math.abs(jp.average_score - data.heat_average) > 1.5 && jp.scores_submitted > 2
              return (
                <span key={jp.judge_id} style={{ fontFamily: ff.mono, fontSize: 9, color: outlier ? T.red : T.textSec }}>
                  J{jp.position} {jp.average_score.toFixed(1)}
                </span>
              )
            })}
            <span style={{ fontFamily: ff.mono, fontSize: 9, fontWeight: 700, color: T.text }}>Avg {data.heat_average.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* INTERFERENCE MODAL */}
      {intModal && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ position: 'absolute', inset: 0, background: T.scrim, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} onClick={() => setIntModal(null)} />
          <div style={{ position: 'relative', zIndex: 101, width: 360, padding: 24, ...glass(T.modalGlass, `${T.red}20`, 60, 24), boxShadow: T.shadow }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.red, fontFamily: ff.ui, marginBottom: 4 }}>Interference</div>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 20 }}>{intModal.name}</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 9, fontFamily: ff.mono, color: T.textMuted, letterSpacing: '0.08em', marginBottom: 6 }}>WAVE NUMBER</div>
              <input type="number" value={intWave} onChange={e => setIntWave(e.target.value)} min={1}
                style={{ width: '100%', padding: '11px 14px', ...glass('rgba(0,0,0,0.03)', T.glassBorder, 10, 12), color: T.text, fontSize: 15, fontFamily: ff.mono, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 9, fontFamily: ff.mono, color: T.textMuted, letterSpacing: '0.08em', marginBottom: 6 }}>PENALTY</div>
              <select value={intType} onChange={e => setIntType(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', ...glass('rgba(0,0,0,0.03)', T.glassBorder, 10, 12), color: T.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}>
                <option value="interference_half">Half 2nd-best wave</option>
                <option value="interference_zero">Zero 2nd-best wave</option>
                <option value="double_interference">Double / DQ</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setIntModal(null)} style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${T.glassBorder}`, background: 'transparent', color: T.textSec, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={callInterference} disabled={!intWave} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: T.red, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: intWave ? 1 : 0.3 }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
      {/* OVERRIDE MODAL */}
      {overrideModal && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ position: 'absolute', inset: 0, background: T.scrim, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} onClick={() => setOverrideModal(null)} />
          <div style={{ position: 'relative', zIndex: 101, width: 360, padding: 24, ...glass(T.modalGlass, 'rgba(217,119,6,0.2)', 60, 24), boxShadow: T.shadow }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#D97706', fontFamily: ff.ui, marginBottom: 4 }}>Override Score</div>
            <div style={{ fontSize: 13, color: T.textSec, marginBottom: 4 }}>{overrideModal.athleteName} — W{overrideModal.waveNumber}</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 20 }}>{overrideModal.judgeName}: <span style={{ fontFamily: ff.mono, fontWeight: 700 }}>{overrideModal.currentScore.toFixed(1)}</span></div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 9, fontFamily: ff.mono, color: T.textMuted, letterSpacing: '0.08em', marginBottom: 6 }}>NEW SCORE</div>
              <input type="number" value={overrideScore} onChange={e => setOverrideScore(e.target.value)} min={0} max={10} step={0.1}
                style={{ width: '100%', padding: '11px 14px', ...glass('rgba(0,0,0,0.03)', T.glassBorder, 10, 12), color: T.text, fontSize: 22, fontFamily: ff.mono, fontWeight: 700, outline: 'none', boxSizing: 'border-box', textAlign: 'center' }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 9, fontFamily: ff.mono, color: T.textMuted, letterSpacing: '0.08em', marginBottom: 6 }}>REASON (REQUIRED)</div>
              <input type="text" value={overrideReason} onChange={e => setOverrideReason(e.target.value)} placeholder="e.g. Scoring error, wrong athlete"
                style={{ width: '100%', padding: '11px 14px', ...glass('rgba(0,0,0,0.03)', T.glassBorder, 10, 12), color: T.text, fontSize: 13, fontFamily: ff.ui, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setOverrideModal(null)} style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${T.glassBorder}`, background: 'transparent', color: T.textSec, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitOverride} disabled={!overrideScore || !overrideReason} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: '#D97706', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: overrideScore && overrideReason ? 1 : 0.3 }}>Override</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
