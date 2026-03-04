'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

const JERSEY_HEX: Record<string, string> = { red: '#DC2626', blue: '#2563EB', white: '#E2E8F0', yellow: '#EAB308', green: '#16A34A', black: '#1E293B', pink: '#EC4899', orange: '#EA580C' }

/* ─── Types ─── */
interface WaveJudgeScore { judge_id: string; judge_name: string; judge_position: number; score: number; is_override: boolean }
interface WaveData { wave_number: number; averaged_score: number | null; judge_scores: WaveJudgeScore[]; all_submitted: boolean; interference: any }
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

export default function Wrapper() {
  return <Suspense fallback={<div style={{ minHeight: '100dvh', background: '#0A2540', color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading…</div>}><HeadJudgePage /></Suspense>
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

  const certifyHeat = async () => {
    if (!judge || !heatId || !confirm('Certify results? 15-minute protest window begins.')) return
    await fetch('/api/judge/head-panel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'certify', judge_id: judge.id, heat_id: heatId }) })
    loadPanel()
  }

  if (!judge) return <div style={{ minHeight: '100dvh', background: '#0A2540', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><a href="/judge" style={{ color: '#2BA5A0' }}>Log in at /judge →</a></div>
  if (error) return <div style={{ minHeight: '100dvh', background: '#0A2540', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>{error}</div>
  if (!data) return <div style={{ minHeight: '100dvh', background: '#0A2540', color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading…</div>

  const scoringJudges = data.judges.filter(j => !j.is_head_judge)
  const maxWaves = Math.max(...data.athletes.map(a => a.waves.length), 3)

  return (
    <div style={{ minHeight: '100dvh', background: '#0A2540', color: '#fff', fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* ═══ HEADER ═══ */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#FFD700', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.05em' }}>HEAD JUDGE</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)', fontFamily: 'JetBrains Mono, monospace' }}>{judge.name}</span>
        </div>

        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 36, fontWeight: 800, color: timer.warn ? '#EF4444' : timer.low ? '#EAB308' : 'rgba(255,255,255,0.9)', letterSpacing: '0.05em' }}>
          {timer.fmt}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {data.heat.status === 'live' && !data.heat.certified && (
            <button onClick={certifyHeat} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#FFD700', color: '#0A2540', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif' }}>Certify Results</button>
          )}
          {data.heat.certified && <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: '#2BA5A0', fontWeight: 700 }}>✓ CERTIFIED</span>}
          <a href="/judge" style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)', textDecoration: 'none' }}>← Back</a>
        </div>
      </div>

      {/* ═══ PRIORITY RAIL ═══ */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em', marginRight: 4 }}>
          PRIORITY{priorityState?.phase === 'establishing' ? ' · ESTABLISHING' : ''}
        </span>

        {priorityState?.phase === 'establishing' ? (
          <>
            {priorityState.athletes?.map((a: any) => (
              <button key={a.heat_athlete_id} onClick={() => !a.has_ridden ? priorityAction('wave_ridden', a.heat_athlete_id) : null}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', cursor: a.has_ridden ? 'default' : 'pointer', border: a.has_ridden ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(43,165,160,0.3)', background: a.has_ridden ? 'rgba(255,255,255,0.02)' : 'rgba(43,165,160,0.1)', color: a.has_ridden ? 'rgba(255,255,255,0.15)' : '#2BA5A0' }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: JERSEY_HEX[a.jersey_color] || '#94A3B8' }} />
                {a.athlete_name?.split(' ').pop()}
                {a.has_ridden && <span style={{ fontSize: 10, opacity: 0.4 }}>✓</span>}
              </button>
            ))}
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.1)' }}>{priorityState.riders_count}/{priorityState.riders_needed}</span>
          </>
        ) : data.heat.priority_order?.length ? (
          data.heat.priority_order.map((id, i) => {
            const a = data.athletes.find(x => x.id === id)
            const pa = priorityState?.athletes?.find((x: any) => x.heat_athlete_id === id)
            const susp = pa?.priority_status === 'suspended'
            return (
              <div key={id} style={{ position: 'relative' }}>
                <button onClick={() => setPriorityMenu(priorityMenu === id ? null : id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', cursor: 'pointer', border: i === 0 ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.06)', background: i === 0 ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.02)', color: susp ? 'rgba(234,179,8,0.4)' : i === 0 ? '#FFD700' : 'rgba(255,255,255,0.3)', opacity: susp ? 0.5 : 1, borderStyle: susp ? 'dashed' : 'solid' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: JERSEY_HEX[a?.jersey_color || ''] || '#94A3B8' }} />
                  P{i + 1} {a?.athlete_name?.split(' ').pop()}
                  {susp && ' ⏸'}
                </button>
                {priorityMenu === id && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 50, background: '#0F2D4A', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', minWidth: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                    {[
                      { label: '🌊 Wave Ridden', action: 'wave_ridden' },
                      ...(!susp ? [{ label: '⏸ Suspend Priority', action: 'suspend' }] : [{ label: '▶ Reinstate', action: 'reinstate' }]),
                      { label: '🚫 Blocking (drop last)', action: 'block', danger: true },
                    ].map(item => (
                      <button key={item.action} onClick={() => priorityAction(item.action, id)}
                        style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'transparent', color: (item as any).danger ? '#EF4444' : 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'left', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <button onClick={() => priorityAction('start')} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', background: 'rgba(43,165,160,0.1)', border: '1px solid rgba(43,165,160,0.3)', color: '#2BA5A0', cursor: 'pointer' }}>Start Heat</button>
        )}
      </div>

      {/* Close menu overlay */}
      {priorityMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setPriorityMenu(null)} />}

      {/* ═══ ATHLETE CARDS — Fill remaining space ═══ */}
      <div style={{ flex: 1, display: 'grid', gridTemplateRows: `repeat(${data.athletes.length}, 1fr)`, padding: '8px 24px', gap: 8 }}>
        {data.athletes.map(athlete => {
          const jerseyHex = JERSEY_HEX[athlete.jersey_color || ''] || '#94A3B8'
          return (
            <div key={athlete.id} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}>

              {/* Jersey stripe (left edge) */}
              <div style={{ width: 6, alignSelf: 'stretch', background: jerseyHex, flexShrink: 0 }} />

              {/* Position */}
              <div style={{ width: 48, textAlign: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 24, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: athlete.result_position === 1 ? '#2BA5A0' : 'rgba(255,255,255,0.2)' }}>
                  {athlete.result_position || '–'}
                </span>
              </div>

              {/* Name + badges */}
              <div style={{ width: 180, flexShrink: 0, padding: '0 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {athlete.has_priority && <span style={{ fontSize: 10, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#FFD700', background: 'rgba(255,215,0,0.12)', padding: '1px 5px', borderRadius: 4 }}>P</span>}
                  <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>{athlete.athlete_name}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                  {athlete.penalty === 'double_interference' && <span style={{ fontSize: 10, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#EF4444', background: 'rgba(239,68,68,0.12)', padding: '1px 6px', borderRadius: 4 }}>DQ</span>}
                  {athlete.penalty && athlete.penalty !== 'none' && athlete.penalty !== 'double_interference' && <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#EF4444', background: 'rgba(239,68,68,0.08)', padding: '1px 6px', borderRadius: 4 }}>INT</span>}
                  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.1)' }}>{athlete.wave_count} waves</span>
                </div>
              </div>

              {/* Total score — BIG */}
              <div style={{ width: 100, textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: athlete.result_position === 1 ? '#2BA5A0' : '#fff' }}>
                  {athlete.total_score.toFixed(2)}
                </div>
                {athlete.needs_score !== null && (
                  <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.15)' }}>
                    need {athlete.needs_score.toFixed(2)}
                  </div>
                )}
              </div>

              {/* Wave scores */}
              <div style={{ flex: 1, display: 'flex', gap: 4, padding: '0 12px', overflowX: 'auto' }}>
                {Array.from({ length: maxWaves }, (_, wi) => {
                  const wave = athlete.waves.find(w => w.wave_number === wi + 1)
                  return (
                    <div key={wi} style={{ minWidth: 64, textAlign: 'center', padding: '6px 4px', borderRadius: 8, background: wave ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.1)' }}>W{wi + 1}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: wave?.averaged_score != null ? '#fff' : 'rgba(255,255,255,0.05)' }}>
                        {wave?.averaged_score != null ? wave.averaged_score.toFixed(2) : '—'}
                      </div>
                      {/* Judge scores underneath */}
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginTop: 2 }}>
                        {scoringJudges.map(sj => {
                          const js = wave?.judge_scores.find(s => s.judge_id === sj.judge_id)
                          return <span key={sj.judge_id} style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: js ? (js.is_override ? '#FFD700' : 'rgba(255,255,255,0.2)') : 'rgba(255,255,255,0.04)' }}>{js ? js.score.toFixed(1) : '·'}</span>
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Interference button */}
              <div style={{ width: 48, textAlign: 'center', flexShrink: 0 }}>
                <button onClick={() => setIntModal({ id: athlete.id, name: athlete.athlete_name })}
                  style={{ fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, padding: 8 }}>🚩</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ═══ JUDGE STATS BAR ═══ */}
      <div style={{ padding: '10px 24px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.1)', letterSpacing: '0.08em' }}>JUDGES</span>
        {data.judge_performance.map(jp => {
          const dev = Math.abs(jp.average_score - data.heat_average)
          const outlier = dev > 1.5 && jp.scores_submitted > 2
          return (
            <span key={jp.judge_id} style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: outlier ? '#EF4444' : 'rgba(255,255,255,0.25)' }}>
              J{jp.position} {jp.judge_name.split(' ').pop()} · avg {jp.average_score.toFixed(1)} · {jp.scores_submitted}
              {outlier && ' ⚠'}
            </span>
          )
        })}
        <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: '#2BA5A0', marginLeft: 'auto' }}>
          Heat avg {data.heat_average.toFixed(2)}
        </span>
      </div>

      {/* ═══ INTERFERENCE MODAL ═══ */}
      {intModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#0B2D4A', borderRadius: 24, padding: 28, width: 380, border: '2px solid rgba(220,38,38,0.2)' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#EF4444', fontFamily: 'Space Grotesk, sans-serif', marginBottom: 4 }}>🚩 Interference</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>{intModal.name}</div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em', marginBottom: 6 }}>WAVE NUMBER</div>
              <input type="number" value={intWave} onChange={e => setIntWave(e.target.value)} min={1}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 16, fontFamily: 'JetBrains Mono, monospace', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em', marginBottom: 6 }}>PENALTY</div>
              <select value={intType} onChange={e => setIntType(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}>
                <option value="interference_half">Half 2nd-best wave</option>
                <option value="interference_zero">Zero 2nd-best wave</option>
                <option value="double_interference">Double — DQ</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setIntModal(null)} style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={callInterference} disabled={!intWave} style={{ flex: 1, padding: '14px', borderRadius: 12, border: 'none', background: '#DC2626', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: intWave ? 1 : 0.3 }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
