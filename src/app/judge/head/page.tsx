'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

/* ─── Design Tokens ─── */
const DARK = {
  bg: '#06111F', bgCell: '#0D2137', bgCellBest: 'rgba(43,165,160,0.08)',
  border: 'rgba(255,255,255,0.04)', borderCell: 'rgba(255,255,255,0.06)',
  text: '#F1F5F9', textSec: 'rgba(255,255,255,0.35)', textMuted: 'rgba(255,255,255,0.12)',
  teal: '#2BA5A0', gold: '#FFD700', tealGlow: 'rgba(43,165,160,0.15)',
  totalBorder: 'rgba(43,165,160,0.1)', bestBorder: 'rgba(43,165,160,0.15)',
  modalBg: '#0B2440', scrim: 'rgba(6,17,31,0.5)',
}
const LIGHT = {
  bg: '#F8FAFB', bgCell: '#EFF4F8', bgCellBest: 'rgba(43,165,160,0.06)',
  border: 'rgba(0,0,0,0.06)', borderCell: 'rgba(0,0,0,0.08)',
  text: '#0A2540', textSec: 'rgba(10,37,64,0.45)', textMuted: 'rgba(10,37,64,0.15)',
  teal: '#2BA5A0', gold: '#C5970A', tealGlow: 'rgba(43,165,160,0.1)',
  totalBorder: 'rgba(43,165,160,0.15)', bestBorder: 'rgba(43,165,160,0.2)',
  modalBg: '#FFFFFF', scrim: 'rgba(0,0,0,0.3)',
}

const JERSEY: Record<string, string> = {
  red: '#DC2626', blue: '#2563EB', white: '#E2E8F0', yellow: '#EAB308',
  green: '#16A34A', black: '#1E293B', pink: '#EC4899', orange: '#EA580C',
}

const ff = { display: 'Space Grotesk, sans-serif', mono: 'JetBrains Mono, monospace', body: 'DM Sans, sans-serif' }

function scoreColor(s: number): string {
  if (s >= 10) return '#FFD700'; if (s >= 8) return '#2563EB'; if (s >= 6) return '#2BA5A0';
  if (s >= 4) return '#EAB308'; if (s >= 2) return '#EA580C'; return '#DC2626'
}

/* ─── Types ─── */
interface WaveJudgeScore { judge_id: string; judge_name: string; judge_position: number; score: number; is_override: boolean }
interface WaveData { wave_number: number; averaged_score: number | null; judge_scores: WaveJudgeScore[]; all_submitted: boolean }
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
  return { rem, fmt: `${m}:${s.toString().padStart(2, '0')}`, warn: rem <= 30, low: rem <= 300 && rem > 30 }
}

export default function Wrapper() {
  return <Suspense fallback={<div style={{ minHeight: '100dvh', background: '#06111F', color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading…</div>}><HeadJudgePage /></Suspense>
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
  const [dark, setDark] = useState(true)

  const t = dark ? DARK : LIGHT
  const timer = useTimer(data?.heat?.actual_start || null, data?.heat?.duration_minutes || 20, data?.heat?.status || 'pending')

  useEffect(() => { const s = localStorage.getItem('bsa_judge'); if (s) setJudge(JSON.parse(s)) }, [])
  useEffect(() => { const s = localStorage.getItem('bsa_theme'); if (s === 'light') setDark(false) }, [])
  const toggleTheme = () => { const next = !dark; setDark(next); localStorage.setItem('bsa_theme', next ? 'dark' : 'light') }

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

  const certifyHeat = async () => {
    if (!judge || !heatId || !confirm('Certify results? 15-minute protest window begins.')) return
    await fetch('/api/judge/head-panel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'certify', judge_id: judge.id, heat_id: heatId }) })
    loadPanel()
  }

  if (!judge) return <div style={{ minHeight: '100dvh', background: t.bg, color: t.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><a href="/judge" style={{ color: t.teal }}>Log in at /judge →</a></div>
  if (error) return <div style={{ minHeight: '100dvh', background: t.bg, color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, fontFamily: ff.mono }}>{error}</div>
  if (!data) return <div style={{ minHeight: '100dvh', background: t.bg, color: t.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading…</div>

  const scoringJudges = data.judges.filter(j => !j.is_head_judge)
  const maxWaves = Math.max(...data.athletes.map(a => a.waves.length), 3)
  const leaderTotal = data.athletes.length ? Math.max(...data.athletes.map(a => a.total_score)) : 0

  return (
    <div style={{ minHeight: '100dvh', background: t.bg, color: t.text, fontFamily: ff.body, display: 'flex', flexDirection: 'column' }}>

      {/* ═══ HEADER ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px', flexShrink: 0, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: t.gold, fontFamily: ff.display, letterSpacing: '0.05em' }}>HEAD JUDGE</span>
          <span style={{ fontSize: 12, color: t.textMuted, fontFamily: ff.mono }}>{judge.name}</span>
        </div>
        <div style={{ fontFamily: ff.mono, fontSize: 44, fontWeight: 800, letterSpacing: '0.08em', lineHeight: 1, color: timer.warn ? '#EF4444' : t.text }}>{timer.fmt}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {data.heat.status === 'live' && !data.heat.certified && <button onClick={certifyHeat} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: t.gold, color: '#0A2540', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: ff.display }}>Certify Results</button>}
          {data.heat.certified && <span style={{ fontSize: 12, fontFamily: ff.mono, color: t.teal, fontWeight: 700 }}>✓ CERTIFIED</span>}
          <button onClick={toggleTheme} style={{ fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>{dark ? '☀️' : '🌙'}</button>
          <a href="/judge" style={{ fontSize: 12, color: t.textMuted, textDecoration: 'none' }}>← Back</a>
        </div>
      </div>

      {/* ═══ PRIORITY RAIL ═══ */}
      <div style={{ padding: '8px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
        <span style={{ fontFamily: ff.mono, fontSize: 9, fontWeight: 600, color: t.textMuted, letterSpacing: '0.12em', marginRight: 4 }}>
          PRIORITY{priorityState?.phase === 'establishing' ? ' · ESTABLISHING' : ''}
        </span>
        {priorityState?.phase === 'establishing' ? (
          priorityState.athletes?.map((a: any) => (
            <button key={a.heat_athlete_id} onClick={() => !a.has_ridden ? priorityAction('wave_ridden', a.heat_athlete_id) : null}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: ff.display, cursor: a.has_ridden ? 'default' : 'pointer', border: a.has_ridden ? `1px solid ${t.borderCell}` : `1px solid ${t.tealGlow}`, background: a.has_ridden ? 'transparent' : t.tealGlow, color: a.has_ridden ? t.textMuted : t.teal }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: JERSEY[a.jersey_color] || '#94A3B8' }} />
              {a.athlete_name?.split(' ').pop()}{a.has_ridden && ' ✓'}
            </button>
          ))
        ) : data.heat.priority_order?.length ? (
          data.heat.priority_order.map((id, i) => {
            const a = data.athletes.find(x => x.id === id)
            const pa = priorityState?.athletes?.find((x: any) => x.heat_athlete_id === id)
            const susp = pa?.priority_status === 'suspended'
            return (
              <div key={id} style={{ position: 'relative' }}>
                <button onClick={() => setPriorityMenu(priorityMenu === id ? null : id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: ff.display, cursor: 'pointer', border: i === 0 ? `1px solid ${dark ? 'rgba(255,215,0,0.2)' : 'rgba(197,151,10,0.2)'}` : `1px solid ${t.borderCell}`, background: i === 0 ? (dark ? 'rgba(255,215,0,0.08)' : 'rgba(197,151,10,0.06)') : 'transparent', color: susp ? t.textMuted : i === 0 ? t.gold : t.textSec, opacity: susp ? 0.5 : 1 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: JERSEY[a?.jersey_color || ''] || '#94A3B8' }} />
                  P{i + 1} {a?.athlete_name?.split(' ').pop()}{susp && ' ⏸'}
                </button>
                {priorityMenu === id && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 50, background: t.modalBg, borderRadius: 12, border: `1px solid ${t.borderCell}`, overflow: 'hidden', minWidth: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                    {[
                      { label: '🌊 Wave Ridden', action: 'wave_ridden' },
                      ...(susp ? [{ label: '▶ Reinstate', action: 'reinstate' }] : [{ label: '⏸ Suspend', action: 'suspend' }]),
                      { label: '🚫 Blocking', action: 'block', danger: true },
                    ].map(item => (
                      <button key={item.action} onClick={() => priorityAction(item.action, id)}
                        style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', borderBottom: `1px solid ${t.border}`, background: 'transparent', color: (item as any).danger ? '#EF4444' : t.textSec, fontSize: 13, textAlign: 'left', cursor: 'pointer', fontFamily: ff.body }}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <button onClick={() => priorityAction('start')} style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, fontFamily: ff.mono, background: t.tealGlow, border: `1px solid ${t.tealGlow}`, color: t.teal, cursor: 'pointer' }}>Start Heat</button>
        )}
      </div>

      {priorityMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setPriorityMenu(null)} />}

      {/* ═══ GRID ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Column headers */}
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, borderBottom: `1px solid ${t.border}` }}>
          <div style={{ width: 220, flexShrink: 0, padding: '8px 24px', fontFamily: ff.mono, fontSize: 9, fontWeight: 600, color: t.textMuted, letterSpacing: '0.1em' }}>ATHLETE</div>
          <div style={{ flex: 1, display: 'flex' }}>
            {Array.from({ length: maxWaves }, (_, i) => (
              <div key={i} style={{ flex: 1, minWidth: 80, textAlign: 'center', padding: '8px 4px', fontFamily: ff.mono, fontSize: 9, fontWeight: 600, color: t.textMuted, letterSpacing: '0.1em' }}>W{i + 1}</div>
            ))}
          </div>
          <div style={{ width: 120, flexShrink: 0, textAlign: 'center', fontFamily: ff.mono, fontSize: 9, fontWeight: 600, color: t.textMuted, letterSpacing: '0.1em' }}>TOTAL</div>
          <div style={{ width: 90, flexShrink: 0, textAlign: 'center', fontFamily: ff.mono, fontSize: 9, fontWeight: 600, color: t.textMuted, letterSpacing: '0.1em' }}>NEEDS</div>
          <div style={{ width: 48, flexShrink: 0 }} />
        </div>

        {/* Athlete rows */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {data.athletes.map((athlete, rank) => {
            const jColor = JERSEY[athlete.jersey_color || ''] || '#94A3B8'
            const isWhite = athlete.jersey_color === 'white'
            const isLeader = athlete.total_score === leaderTotal && athlete.total_score > 0
            const isDQ = athlete.penalty === 'double_interference'
            const hasInt = athlete.penalty && athlete.penalty !== 'none' && !isDQ

            // Find best 2 waves
            const wavesWithScores = athlete.waves.filter(w => w.averaged_score != null)
            const best2 = [...wavesWithScores].sort((a, b) => (b.averaged_score || 0) - (a.averaged_score || 0)).slice(0, 2).map(w => w.wave_number)

            return (
              <div key={athlete.id} style={{ flex: 1, display: 'flex', alignItems: 'stretch', borderBottom: `1px solid ${t.border}`, minHeight: 0, opacity: isDQ ? 0.4 : 1 }}>

                <div style={{ width: 5, background: jColor, borderRadius: '0 3px 3px 0', flexShrink: 0 }} />

                <div style={{ width: 215, flexShrink: 0, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: jColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ff.mono, fontSize: 10, fontWeight: 800, color: isWhite ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)', flexShrink: 0 }}>
                    {athlete.result_position || '–'}
                  </div>
                  <div>
                    <div style={{ fontFamily: ff.display, fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>{athlete.athlete_name}</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                      {isDQ && <span style={{ fontFamily: ff.mono, fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 3, background: 'rgba(220,38,38,0.1)', color: '#EF4444' }}>DQ</span>}
                      {hasInt && <span style={{ fontFamily: ff.mono, fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 3, background: 'rgba(220,38,38,0.08)', color: '#EF4444' }}>INT</span>}
                      <span style={{ fontFamily: ff.mono, fontSize: 10, color: t.textMuted }}>{athlete.wave_count}w</span>
                    </div>
                  </div>
                </div>

                {/* Wave cells with judge breakdowns */}
                <div style={{ flex: 1, display: 'flex', alignSelf: 'stretch' }}>
                  {Array.from({ length: maxWaves }, (_, wi) => {
                    const wave = athlete.waves.find(w => w.wave_number === wi + 1)
                    const isBest = best2.includes(wi + 1)
                    if (!wave || wave.averaged_score == null) {
                      return <div key={wi} style={{ flex: 1, minWidth: 80, borderLeft: `1px solid ${t.borderCell}` }} />
                    }
                    const js = wave.judge_scores || []
                    const sorted = [...js.map(s => s.score)].sort((a, b) => a - b)
                    const lo = sorted[0], hi = sorted[sorted.length - 1]
                    let loD = false, hiD = false

                    return (
                      <div key={wi} style={{ flex: 1, minWidth: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${t.borderCell}`, background: isBest ? t.bgCellBest : t.bgCell, boxShadow: isBest ? `inset 0 0 0 1px ${t.bestBorder}` : 'none', position: 'relative', gap: 2 }}>
                        <span style={{ fontFamily: ff.mono, fontWeight: 700, fontSize: isBest ? 20 : 18, color: scoreColor(wave.averaged_score) }}>{wave.averaged_score.toFixed(2)}</span>
                        {/* Individual judge scores */}
                        <div style={{ display: 'flex', gap: 4 }}>
                          {js.map((s, si) => {
                            let dropped = false
                            if (js.length >= 5) {
                              if (!loD && s.score === lo) { dropped = true; loD = true }
                              else if (!hiD && s.score === hi) { dropped = true; hiD = true }
                            }
                            return <span key={si} style={{ fontFamily: ff.mono, fontSize: 9, fontWeight: 600, color: dropped ? t.textMuted : s.is_override ? t.gold : t.textSec, textDecoration: dropped ? 'line-through' : 'none', letterSpacing: '0.02em' }}>{s.score.toFixed(1)}</span>
                          })}
                        </div>
                        {isBest && <span style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: t.teal, opacity: 0.5 }} />}
                      </div>
                    )
                  })}
                </div>

                {/* Total */}
                <div style={{ width: 120, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: `2px solid ${t.totalBorder}` }}>
                  <span style={{ fontFamily: ff.mono, fontSize: 28, fontWeight: 800, lineHeight: 1, color: isLeader ? t.teal : t.text }}>{athlete.total_score.toFixed(2)}</span>
                  <span style={{ fontFamily: ff.mono, fontSize: 8, fontWeight: 600, color: t.textMuted, letterSpacing: '0.1em', marginTop: 2 }}>BEST 2</span>
                </div>

                {/* Needs */}
                <div style={{ width: 90, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${t.borderCell}` }}>
                  {athlete.needs_score != null && athlete.needs_score > 0 && athlete.needs_score <= 10 && (
                    <>
                      <span style={{ fontFamily: ff.mono, fontSize: 16, fontWeight: 600, color: t.textSec }}>{athlete.needs_score.toFixed(2)}</span>
                      <span style={{ fontFamily: ff.mono, fontSize: 8, color: t.textMuted, letterSpacing: '0.08em', marginTop: 1 }}>TO LEAD</span>
                    </>
                  )}
                </div>

                {/* Interference */}
                <div style={{ width: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <button onClick={() => setIntModal({ id: athlete.id, name: athlete.athlete_name })}
                    style={{ fontSize: 16, background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3, padding: 6 }}>🚩</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══ JUDGE STATS FOOTER ═══ */}
      <div style={{ padding: '8px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: ff.mono, fontSize: 9, color: t.textMuted, letterSpacing: '0.08em' }}>JUDGES</span>
        {data.judge_performance.map(jp => {
          const dev = Math.abs(jp.average_score - data.heat_average)
          const outlier = dev > 1.5 && jp.scores_submitted > 2
          return (
            <span key={jp.judge_id} style={{ fontFamily: ff.mono, fontSize: 11, color: outlier ? '#EF4444' : t.textSec }}>
              J{jp.position} {jp.judge_name.split(' ').pop()} · avg {jp.average_score.toFixed(1)} · {jp.scores_submitted}{outlier && ' ⚠'}
            </span>
          )
        })}
        <span style={{ fontFamily: ff.mono, fontSize: 11, color: t.teal, marginLeft: 'auto' }}>Heat avg {data.heat_average.toFixed(2)}</span>
        <span style={{ fontFamily: ff.mono, fontSize: 9, color: t.textMuted }}>HEAD JUDGE · ALL SCORES VISIBLE</span>
      </div>

      {/* ═══ INTERFERENCE MODAL ═══ */}
      {intModal && (
        <div style={{ position: 'fixed', inset: 0, background: t.scrim, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: t.modalBg, borderRadius: 24, padding: 28, width: 380, border: '2px solid rgba(220,38,38,0.2)' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#EF4444', fontFamily: ff.display, marginBottom: 4 }}>🚩 Interference</div>
            <div style={{ fontSize: 14, color: t.textSec, marginBottom: 20 }}>{intModal.name}</div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontFamily: ff.mono, color: t.textMuted, letterSpacing: '0.08em', marginBottom: 6 }}>WAVE NUMBER</div>
              <input type="number" value={intWave} onChange={e => setIntWave(e.target.value)} min={1}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${t.borderCell}`, background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: t.text, fontSize: 16, fontFamily: ff.mono, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontFamily: ff.mono, color: t.textMuted, letterSpacing: '0.08em', marginBottom: 6 }}>PENALTY</div>
              <select value={intType} onChange={e => setIntType(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${t.borderCell}`, background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: t.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}>
                <option value="interference_half">Half 2nd-best wave</option>
                <option value="interference_zero">Zero 2nd-best wave</option>
                <option value="double_interference">Double — DQ</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setIntModal(null)} style={{ flex: 1, padding: 14, borderRadius: 12, border: `1px solid ${t.borderCell}`, background: 'transparent', color: t.textSec, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={callInterference} disabled={!intWave} style={{ flex: 1, padding: 14, borderRadius: 12, border: 'none', background: '#DC2626', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: intWave ? 1 : 0.3 }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
    </div>
  )
}
