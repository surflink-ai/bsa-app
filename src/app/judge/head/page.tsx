'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

const JERSEY: Record<string, { bg: string; text: string; dot: string }> = {
  red:    { bg: 'bg-red-600',    text: 'text-white',     dot: '#DC2626' },
  blue:   { bg: 'bg-blue-600',   text: 'text-white',     dot: '#2563EB' },
  white:  { bg: 'bg-slate-200',  text: 'text-slate-900', dot: '#E2E8F0' },
  yellow: { bg: 'bg-yellow-400', text: 'text-slate-900', dot: '#EAB308' },
  green:  { bg: 'bg-green-600',  text: 'text-white',     dot: '#16A34A' },
  black:  { bg: 'bg-slate-800',  text: 'text-white',     dot: '#1E293B' },
  pink:   { bg: 'bg-pink-500',   text: 'text-white',     dot: '#EC4899' },
  orange: { bg: 'bg-orange-500', text: 'text-white',     dot: '#EA580C' },
}

/* ─── Types ─── */
interface JudgeInfo { judge_id: string; name: string; position: number; is_head_judge: boolean }
interface WaveJudgeScore { judge_id: string; judge_name: string; judge_position: number; score: number; is_override: boolean; override_reason: string | null }
interface WaveData { wave_number: number; averaged_score: number | null; judge_scores: WaveJudgeScore[]; all_submitted: boolean; interference: any }
interface AthleteData {
  id: string; athlete_name: string; jersey_color: string | null; wave_count: number
  total_score: number; needs_score: number | null; penalty: string; penalty_wave: number | null
  has_priority: boolean; result_position: number; waves: WaveData[]
}
interface PanelData {
  heat: { id: string; status: string; duration_minutes: number; actual_start: string | null; is_paused: boolean; certified: boolean; priority_order: string[] }
  judges: JudgeInfo[]
  athletes: AthleteData[]
  judge_performance: { judge_id: string; judge_name: string; position: number; scores_submitted: number; average_score: number }[]
  heat_average: number
}

/* ─── Timer ─── */
function useTimer(start: string | null, dur: number, status: string) {
  const [rem, setRem] = useState(dur * 60)
  useEffect(() => {
    if (!start || status !== 'live') { setRem(dur * 60); return }
    const tick = () => { const e = Math.floor((Date.now() - new Date(start).getTime()) / 1000); setRem(Math.max(0, dur * 60 - e)) }
    tick(); const i = setInterval(tick, 1000); return () => clearInterval(i)
  }, [start, dur, status])
  return { rem, fmt: `${Math.floor(rem / 60)}:${(rem % 60).toString().padStart(2, '0')}`, warn: rem <= 30, low: rem <= 300 && rem > 30 }
}

export default function HeadJudgePageWrapper() {
  return <Suspense fallback={<div className="min-h-dvh bg-[#0A2540] text-white/20 flex items-center justify-center">Loading…</div>}><HeadJudgePage /></Suspense>
}

function HeadJudgePage() {
  const searchParams = useSearchParams()
  const heatId = searchParams.get('heat_id')
  const sb = createClient()

  const [judge, setJudge] = useState<{ id: string; name: string } | null>(null)
  const [data, setData] = useState<PanelData | null>(null)
  const [error, setError] = useState('')
  const [expandedAthlete, setExpandedAthlete] = useState<string | null>(null)
  const [priorityState, setPriorityState] = useState<any>(null)
  const [priorityMenu, setPriorityMenu] = useState<string | null>(null)

  // Modals
  const [intModal, setIntModal] = useState<{ id: string; name: string } | null>(null)
  const [intWave, setIntWave] = useState('')
  const [intType, setIntType] = useState('interference_half')
  const [intNotes, setIntNotes] = useState('')
  const [overrideModal, setOverrideModal] = useState<{ scoreId: string; judgeName: string; wave: number; current: number } | null>(null)
  const [overrideScore, setOverrideScore] = useState('')
  const [overrideReason, setOverrideReason] = useState('')

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
    const ch = sb.channel(`head-${heatId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comp_judge_scores' }, () => loadPanel())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comp_interference' }, () => loadPanel())
      .subscribe()
    return () => { sb.removeChannel(ch) }
  }, [heatId, loadPanel])

  /* ─── Actions ─── */
  const priorityAction = async (action: string, athleteId?: string) => {
    await fetch('/api/judge/priority', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, heat_id: heatId, athlete_id: athleteId }) })
    setPriorityMenu(null); loadPanel(); loadPriority()
  }

  const callInterference = async () => {
    if (!intModal || !intWave || !judge) return
    await fetch('/api/judge/interference', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ judge_id: judge.id, heat_id: heatId, athlete_id: intModal.id, wave_number: parseInt(intWave), penalty_type: intType, notes: intNotes || null }) })
    setIntModal(null); setIntWave(''); setIntNotes(''); loadPanel()
  }

  const certifyHeat = async () => {
    if (!judge || !heatId) return
    if (!confirm('Certify results? 15-minute protest window begins.')) return
    await fetch('/api/judge/head-panel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'certify', judge_id: judge.id, heat_id: heatId }) })
    loadPanel()
  }

  /* ─── Guards ─── */
  if (!judge) return (
    <div className="min-h-dvh bg-[#0A2540] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-white/40 mb-2">Not logged in</div>
        <a href="/judge" className="text-teal-400 underline text-sm">Go to Judge Login →</a>
      </div>
    </div>
  )
  if (error) return <div className="min-h-dvh bg-[#0A2540] text-red-400 flex items-center justify-center p-6 text-center">{error}</div>
  if (!data) return <div className="min-h-dvh bg-[#0A2540] text-white/20 flex items-center justify-center">Loading…</div>

  const scoringJudges = data.judges.filter(j => !j.is_head_judge)
  const maxWaves = Math.max(...data.athletes.map(a => a.waves.length), 0)

  return (
    <div className="min-h-dvh bg-[#0A2540] text-white select-none">

      {/* ━━ TOP BAR ━━ */}
      <div className="sticky top-0 z-30 bg-[#0A2540]/95 backdrop-blur-sm border-b border-white/[0.06]">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-yellow-400 tracking-wide" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>HEAD JUDGE</span>
            <span className="text-[10px] font-mono text-white/20">{judge.name}</span>
          </div>

          <div className={`font-mono text-2xl font-bold tracking-wider ${timer.warn ? 'text-red-500 animate-pulse' : timer.low ? 'text-yellow-400' : 'text-white/90'}`}>
            {timer.fmt}
          </div>

          <div className="flex items-center gap-3">
            {data.heat.status === 'live' && !data.heat.certified && (
              <button onClick={certifyHeat} className="px-4 py-1.5 rounded-lg bg-yellow-500/15 border border-yellow-500/25 text-yellow-400 text-xs font-bold cursor-pointer hover:bg-yellow-500/25 transition-colors" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Certify Results
              </button>
            )}
            {data.heat.certified && <span className="text-[10px] font-mono text-teal-500">✓ CERTIFIED</span>}
            <a href="/judge" className="text-[10px] text-white/20 no-underline hover:text-white/40">← Back</a>
          </div>
        </div>
      </div>

      {/* ━━ PRIORITY RAIL ━━ */}
      <div className="px-5 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] font-mono text-white/20 tracking-widest uppercase mr-1">
            Priority{priorityState?.phase === 'establishing' ? ' · establishing' : ''}
          </span>

          {priorityState?.phase === 'establishing' ? (
            <>
              {priorityState.athletes?.map((a: any) => (
                <button key={a.heat_athlete_id}
                  onClick={() => !a.has_ridden ? priorityAction('wave_ridden', a.heat_athlete_id) : null}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                    a.has_ridden
                      ? 'bg-white/[0.02] border-white/[0.04] text-white/20 cursor-default'
                      : 'bg-teal-500/10 border-teal-500/25 text-teal-400 hover:bg-teal-500/20'
                  }`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {a.jersey_color && <span className={`w-2 h-2 rounded-sm ${JERSEY[a.jersey_color]?.bg || 'bg-gray-500'}`} />}
                  {a.athlete_name?.split(' ').pop()}
                  {a.has_ridden && <span className="text-[8px] opacity-40">✓</span>}
                </button>
              ))}
              <span className="text-[10px] font-mono text-white/15">{priorityState.riders_count}/{priorityState.riders_needed} riders</span>
            </>
          ) : data.heat.priority_order?.length ? (
            data.heat.priority_order.map((id, i) => {
              const a = data.athletes.find(x => x.id === id)
              const pa = priorityState?.athletes?.find((x: any) => x.heat_athlete_id === id)
              const susp = pa?.priority_status === 'suspended'
              return (
                <div key={id} className="relative">
                  <button onClick={() => setPriorityMenu(priorityMenu === id ? null : id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                      susp ? 'bg-yellow-500/5 border-yellow-500/20 border-dashed text-yellow-500/50 opacity-60'
                      : i === 0 ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                      : 'bg-white/[0.03] border-white/[0.06] text-white/35'
                    }`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {a?.jersey_color && <span className={`w-2 h-2 rounded-sm ${JERSEY[a.jersey_color]?.bg || 'bg-gray-500'}`} />}
                    P{i + 1} {a?.athlete_name?.split(' ').pop()}
                    {susp && <span className="text-[8px]">⏸</span>}
                  </button>

                  {/* Priority context menu */}
                  {priorityMenu === id && (
                    <div className="absolute top-full left-0 mt-1 z-40 bg-[#0F2D4A] rounded-xl border border-white/10 overflow-hidden min-w-[180px] shadow-xl">
                      <PriorityBtn label="🌊 Wave Ridden" onClick={() => priorityAction('wave_ridden', id)} />
                      {!susp
                        ? <PriorityBtn label="⏸ Suspend Priority" onClick={() => priorityAction('suspend', id)} />
                        : <PriorityBtn label="▶ Reinstate" onClick={() => priorityAction('reinstate', id)} />
                      }
                      <PriorityBtn label="🚫 Blocking (drop last)" onClick={() => priorityAction('block', id)} danger />
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <button onClick={() => priorityAction('start')} className="px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono bg-teal-500/10 border border-teal-500/25 text-teal-400 cursor-pointer hover:bg-teal-500/20 transition-colors">
              Start Heat (ISA Priority)
            </button>
          )}
        </div>
      </div>

      {/* Close priority menu on outside click */}
      {priorityMenu && <div className="fixed inset-0 z-30" onClick={() => setPriorityMenu(null)} />}

      {/* ━━ SCORE MATRIX ━━ */}
      <div className="px-5 py-4">
        <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.01]">
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-4 py-3 text-[9px] font-mono text-white/20 tracking-widest uppercase w-[200px]">Athlete</th>
                <th className="px-3 py-3 text-[9px] font-mono text-white/20 tracking-widest uppercase text-center w-[70px]">Total</th>
                <th className="px-3 py-3 text-[9px] font-mono text-white/20 tracking-widest uppercase text-center w-[70px]">Needs</th>
                {Array.from({ length: Math.max(maxWaves, 3) }, (_, i) => (
                  <th key={i} className="px-2 py-3 text-[9px] font-mono text-white/15 tracking-wider uppercase text-center">W{i + 1}</th>
                ))}
                <th className="px-3 py-3 text-[9px] font-mono text-white/20 tracking-widest uppercase text-center w-[60px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.athletes.map((athlete, ai) => {
                const j = JERSEY[athlete.jersey_color || ''] || JERSEY.white
                const isExpanded = expandedAthlete === athlete.id
                return (
                  <tr key={athlete.id}
                    className={`border-b border-white/[0.03] transition-colors ${isExpanded ? 'bg-white/[0.02]' : 'hover:bg-white/[0.015]'}`}>

                    {/* Athlete */}
                    <td className="px-4 py-3">
                      <button onClick={() => setExpandedAthlete(isExpanded ? null : athlete.id)} className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer text-left">
                        <span className="text-sm font-mono font-bold text-white/30 w-5">{athlete.result_position || '-'}</span>
                        <span className={`w-3.5 h-3.5 rounded ${j.bg} ${athlete.jersey_color === 'white' ? 'ring-1 ring-inset ring-white/30' : ''} shrink-0`} />
                        {athlete.has_priority && <span className="text-[8px] font-mono font-bold text-yellow-400 bg-yellow-500/15 px-1 rounded">P</span>}
                        <span className="text-sm font-semibold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{athlete.athlete_name}</span>
                        {athlete.penalty === 'double_interference'
                          ? <span className="text-[9px] font-mono font-bold text-red-500 bg-red-500/15 px-1.5 py-0.5 rounded">DQ</span>
                          : athlete.penalty && athlete.penalty !== 'none'
                          ? <span className="text-[9px] font-mono font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">INT</span>
                          : null}
                      </button>
                    </td>

                    {/* Total */}
                    <td className="px-3 py-3 text-center">
                      <span className={`font-mono text-lg font-bold ${athlete.result_position === 1 ? 'text-teal-400' : 'text-white'}`}>
                        {athlete.total_score.toFixed(2)}
                      </span>
                    </td>

                    {/* Needs */}
                    <td className="px-3 py-3 text-center">
                      <span className="font-mono text-sm text-white/25">
                        {athlete.needs_score !== null ? athlete.needs_score.toFixed(2) : '—'}
                      </span>
                    </td>

                    {/* Waves */}
                    {Array.from({ length: Math.max(maxWaves, 3) }, (_, wi) => {
                      const wave = athlete.waves.find(w => w.wave_number === wi + 1)
                      return (
                        <td key={wi} className="px-2 py-3 text-center">
                          {wave ? (
                            <div>
                              <div className={`font-mono text-sm font-bold ${wave.averaged_score !== null ? 'text-white/80' : 'text-white/15'}`}>
                                {wave.averaged_score !== null ? wave.averaged_score.toFixed(2) : '…'}
                              </div>
                              {/* Individual judge scores (expanded inline) */}
                              {isExpanded && (
                                <div className="flex justify-center gap-1 mt-1">
                                  {scoringJudges.map(sj => {
                                    const js = wave.judge_scores.find(s => s.judge_id === sj.judge_id)
                                    return (
                                      <span key={sj.judge_id} className={`text-[9px] font-mono px-1 rounded ${
                                        js?.is_override ? 'text-yellow-400 bg-yellow-500/10' : 'text-white/25'
                                      }`}>
                                        {js ? js.score.toFixed(1) : '—'}
                                      </span>
                                    )
                                  })}
                                </div>
                              )}
                              {wave.interference && <div className="text-[8px] text-red-400 font-mono mt-0.5">INT</div>}
                            </div>
                          ) : (
                            <span className="text-white/[0.06] text-sm">—</span>
                          )}
                        </td>
                      )
                    })}

                    {/* Actions */}
                    <td className="px-3 py-3 text-center">
                      <button onClick={() => setIntModal({ id: athlete.id, name: athlete.athlete_name })}
                        className="text-[10px] font-mono text-red-400/60 hover:text-red-400 cursor-pointer bg-transparent border-none transition-colors">
                        🚩
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Expand legend */}
        {expandedAthlete && (
          <div className="mt-2 flex gap-4 text-[9px] font-mono text-white/15">
            <span>Judge scores shown below averages</span>
            {scoringJudges.map(j => <span key={j.judge_id}>J{j.position}: {j.name}</span>)}
          </div>
        )}
      </div>

      {/* ━━ JUDGE PERFORMANCE ━━ */}
      <div className="px-5 pb-6">
        <div className="text-[9px] font-mono text-white/15 tracking-widest uppercase mb-3">Judge Performance</div>
        <div className="flex gap-3 flex-wrap">
          {data.judge_performance.map(jp => {
            const dev = Math.abs(jp.average_score - data.heat_average)
            const outlier = dev > 1.5 && jp.scores_submitted > 2
            return (
              <div key={jp.judge_id} className={`px-4 py-3 rounded-xl border ${outlier ? 'border-red-500/25 bg-red-500/5' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                <div className={`text-xs font-semibold ${outlier ? 'text-red-400' : 'text-white/60'}`}>J{jp.position} {jp.judge_name}</div>
                <div className="font-mono text-[10px] text-white/30 mt-1">
                  avg {jp.average_score.toFixed(2)} · {jp.scores_submitted} scores
                  {outlier && <span className="text-red-400 ml-1">⚠ outlier</span>}
                </div>
              </div>
            )
          })}
          <div className="px-4 py-3 rounded-xl border border-teal-500/20 bg-teal-500/5">
            <div className="text-xs font-semibold text-teal-400">Heat Average</div>
            <div className="font-mono text-[10px] text-white/30 mt-1">{data.heat_average.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* ━━ INTERFERENCE MODAL ━━ */}
      {intModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
          <div className="bg-[#0B2D4A] rounded-3xl p-6 max-w-sm w-full border border-red-500/20">
            <div className="text-base font-bold text-red-400 mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>🚩 Interference</div>
            <div className="text-sm text-white/40 mb-5">{intModal.name}</div>

            <label className="block text-[9px] font-mono text-white/25 tracking-widest uppercase mb-1.5">Wave Number</label>
            <input type="number" value={intWave} onChange={e => setIntWave(e.target.value)} min={1}
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-white text-sm font-mono outline-none mb-4" placeholder="1" />

            <label className="block text-[9px] font-mono text-white/25 tracking-widest uppercase mb-1.5">Penalty Type</label>
            <select value={intType} onChange={e => setIntType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-white text-sm outline-none mb-4 appearance-none">
              <option value="interference_half">Half 2nd-best wave</option>
              <option value="interference_zero">Zero 2nd-best wave</option>
              <option value="double_interference">Double — DQ + Elimination</option>
            </select>

            <label className="block text-[9px] font-mono text-white/25 tracking-widest uppercase mb-1.5">Notes</label>
            <input value={intNotes} onChange={e => setIntNotes(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-white text-sm outline-none mb-5" placeholder="Optional" />

            <div className="flex gap-3">
              <button onClick={() => setIntModal(null)} className="flex-1 py-3 rounded-xl border border-white/10 bg-transparent text-white/40 text-sm font-semibold cursor-pointer">Cancel</button>
              <button onClick={callInterference} disabled={!intWave} className="flex-1 py-3 rounded-xl border-none bg-red-600 hover:bg-red-500 text-white text-sm font-bold cursor-pointer disabled:opacity-30 transition-colors">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Priority Menu Button ─── */
function PriorityBtn({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className={`block w-full px-4 py-2.5 border-none border-b border-white/[0.04] bg-transparent text-xs text-left cursor-pointer transition-colors ${
        danger ? 'text-red-400 hover:bg-red-500/10' : 'text-white/60 hover:bg-white/[0.06]'
      }`} style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {label}
    </button>
  )
}
