'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

const JERSEY_HEX: Record<string, string> = { red: '#DC2626', blue: '#2563EB', white: '#E2E8F0', yellow: '#EAB308', green: '#16A34A', black: '#1E293B', pink: '#EC4899', orange: '#EA580C' }

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

export default function HeadJudgePageWrapper() {
  return <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0A2540', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}><HeadJudgePage /></Suspense>
}

function HeadJudgePage() {
  const searchParams = useSearchParams()
  const heatId = searchParams.get('heat_id')
  const sb = createClient()

  const [judge, setJudge] = useState<{ id: string; name: string } | null>(null)
  const [data, setData] = useState<PanelData | null>(null)
  const [error, setError] = useState('')
  const [selectedAthlete, setSelectedAthlete] = useState<string | null>(null)
  const [interferenceModal, setInterferenceModal] = useState<{ athleteId: string; athleteName: string } | null>(null)
  const [intWave, setIntWave] = useState('')
  const [intType, setIntType] = useState('interference_half')
  const [intNotes, setIntNotes] = useState('')
  const [overrideModal, setOverrideModal] = useState<{ scoreId: string; judgeName: string; wave: number; current: number } | null>(null)
  const [overrideScore, setOverrideScore] = useState('')
  const [overrideReason, setOverrideReason] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('bsa_judge')
    if (saved) setJudge(JSON.parse(saved))
  }, [])

  const loadPanel = useCallback(async () => {
    if (!heatId || !judge) return
    const res = await fetch(`/api/judge/head-panel?heat_id=${heatId}&judge_id=${judge.id}`)
    const json = await res.json()
    if (json.error) setError(json.error)
    else setData(json)
  }, [heatId, judge])

  useEffect(() => { loadPanel() }, [loadPanel])

  // Auto-refresh every 3 seconds
  useEffect(() => {
    if (!heatId || !judge) return
    const i = setInterval(loadPanel, 3000)
    return () => clearInterval(i)
  }, [heatId, judge, loadPanel])

  // Realtime
  useEffect(() => {
    if (!heatId) return
    const channel = sb.channel(`head-${heatId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comp_judge_scores' }, () => loadPanel())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comp_interference' }, () => loadPanel())
      .subscribe()
    return () => { sb.removeChannel(channel) }
  }, [heatId, loadPanel])

  const callInterference = async () => {
    if (!interferenceModal || !intWave || !judge) return
    await fetch('/api/judge/interference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        judge_id: judge.id, heat_id: heatId,
        athlete_id: interferenceModal.athleteId,
        wave_number: parseInt(intWave), penalty_type: intType,
        notes: intNotes || null,
      }),
    })
    setInterferenceModal(null); setIntWave(''); setIntNotes('')
    loadPanel()
  }

  const overrideJudgeScore = async () => {
    if (!overrideModal || !overrideScore || !overrideReason || !judge) return
    await fetch('/api/judge/head-panel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'override_score', judge_id: judge.id, heat_id: heatId,
        score_id: overrideModal.scoreId,
        new_score: parseFloat(overrideScore), reason: overrideReason,
      }),
    })
    setOverrideModal(null); setOverrideScore(''); setOverrideReason('')
    loadPanel()
  }

  const certifyHeat = async () => {
    if (!judge || !heatId) return
    if (!confirm('Certify these results? A 15-minute protest window will begin.')) return
    await fetch('/api/judge/head-panel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'certify', judge_id: judge.id, heat_id: heatId }),
    })
    loadPanel()
  }

  const rotatePriority = async (athleteId: string) => {
    await fetch('/api/judge/priority', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'rotate', heat_id: heatId, athlete_id: athleteId }),
    })
    loadPanel()
  }

  const initPriority = async () => {
    await fetch('/api/judge/priority', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'init', heat_id: heatId }),
    })
    loadPanel()
  }

  if (!judge) return <div style={{ minHeight: '100vh', background: '#0A2540', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Please log in as a judge first at /judge</div>
  if (error) return <div style={{ minHeight: '100vh', background: '#0A2540', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>{error}</div>
  if (!data) return <div style={{ minHeight: '100vh', background: '#0A2540', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>

  const scoringJudges = data.judges.filter(j => !j.is_head_judge)

  return (
    <div style={{ minHeight: '100vh', background: '#0A2540', color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: '#FFD700' }}>HEAD JUDGE</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>{judge.name}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {data.heat.status === 'complete' && !data.heat.certified && (
            <button onClick={certifyHeat} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#FFD700', color: '#0A2540', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" }}>
              Certify Results
            </button>
          )}
          {data.heat.certified && (
            <span style={{ fontSize: 10, color: '#2BA5A0', fontFamily: "'JetBrains Mono', monospace" }}>✓ CERTIFIED</span>
          )}
          <a href="/judge" style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>← Back</a>
        </div>
      </div>

      {/* Priority bar */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Priority:</span>
        {data.heat.priority_order && data.heat.priority_order.length > 0 ? (
          data.heat.priority_order.map((id, i) => {
            const a = data.athletes.find(a => a.id === id)
            return (
              <button key={id} onClick={() => rotatePriority(id)} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6,
                background: i === 0 ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.04)',
                border: i === 0 ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.06)',
                color: i === 0 ? '#FFD700' : 'rgba(255,255,255,0.4)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
              }}>
                {a?.jersey_color && <span style={{ width: 8, height: 8, borderRadius: 2, background: JERSEY_HEX[a.jersey_color] || '#94A3B8' }} />}
                {a?.athlete_name?.split(' ').pop() || '?'}
              </button>
            )
          })
        ) : (
          <button onClick={initPriority} style={{
            padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
            background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)',
            color: '#FFD700', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
          }}>Initialize Priority</button>
        )}
      </div>

      {/* Athletes with full score breakdown */}
      {data.athletes.map(athlete => {
        const isExpanded = selectedAthlete === athlete.id
        return (
          <div key={athlete.id} style={{ margin: '8px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
            {/* Athlete header */}
            <button onClick={() => setSelectedAthlete(isExpanded ? null : athlete.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
              background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
              border: 'none', cursor: 'pointer', textAlign: 'left',
            }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: athlete.result_position === 1 ? '#2BA5A0' : 'rgba(255,255,255,0.3)', width: 24 }}>
                {athlete.result_position || '-'}
              </span>
              {athlete.jersey_color && <span style={{ width: 14, height: 14, borderRadius: 3, background: JERSEY_HEX[athlete.jersey_color] || '#94A3B8', flexShrink: 0 }} />}
              {athlete.has_priority && <span style={{ fontSize: 8, color: '#FFD700', fontWeight: 700 }}>P</span>}
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{athlete.athlete_name}</span>
              {athlete.penalty && athlete.penalty !== 'none' && (
                <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(220,38,38,0.15)', color: '#EF4444', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>INT</span>
              )}
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: athlete.result_position === 1 ? '#2BA5A0' : '#fff' }}>
                {athlete.total_score.toFixed(2)}
              </span>
              {athlete.needs_score !== null && (
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
                  needs {athlete.needs_score.toFixed(2)}
                </span>
              )}
            </button>

            {/* Expanded: wave-by-wave with all judge scores */}
            {isExpanded && (
              <div style={{ padding: '0 16px 16px' }}>
                {/* Interference button */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <button onClick={() => setInterferenceModal({ athleteId: athlete.id, athleteName: athlete.athlete_name })} style={{
                    padding: '6px 12px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                    background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)',
                    color: '#EF4444', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
                  }}>🚩 Call Interference</button>
                </div>

                {/* Wave table */}
                {athlete.waves.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          <th style={thStyle}>Wave</th>
                          {scoringJudges.map(j => (
                            <th key={j.judge_id} style={thStyle}>J{j.position}</th>
                          ))}
                          <th style={thStyle}>Avg</th>
                          <th style={thStyle}>Flag</th>
                        </tr>
                      </thead>
                      <tbody>
                        {athlete.waves.map(wave => (
                          <tr key={wave.wave_number} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={tdStyle}>W{wave.wave_number}</td>
                            {scoringJudges.map(j => {
                              const js = wave.judge_scores.find(s => s.judge_id === j.judge_id)
                              return (
                                <td key={j.judge_id} style={{ ...tdStyle, color: js ? (js.is_override ? '#FFD700' : '#fff') : 'rgba(255,255,255,0.15)' }}>
                                  {js ? js.score.toFixed(1) : '—'}
                                </td>
                              )
                            })}
                            <td style={{ ...tdStyle, fontWeight: 700, color: wave.averaged_score !== null ? '#2BA5A0' : 'rgba(255,255,255,0.15)' }}>
                              {wave.averaged_score !== null ? wave.averaged_score.toFixed(2) : '...'}
                            </td>
                            <td style={tdStyle}>
                              {wave.interference && <span style={{ color: '#EF4444', fontSize: 10 }}>INT</span>}
                              {!wave.all_submitted && !wave.interference && <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>⏳</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', padding: '8px 0' }}>No waves scored yet</div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Judge Performance Summary */}
      <div style={{ margin: '16px', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Judge Performance</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {data.judge_performance.map(jp => {
            const deviation = Math.abs(jp.average_score - data.heat_average)
            const isOutlier = deviation > 1.5 && jp.scores_submitted > 2
            return (
              <div key={jp.judge_id} style={{
                padding: '8px 14px', borderRadius: 8,
                border: isOutlier ? '1px solid rgba(220,38,38,0.3)' : '1px solid rgba(255,255,255,0.06)',
                background: isOutlier ? 'rgba(220,38,38,0.05)' : 'rgba(255,255,255,0.02)',
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: isOutlier ? '#EF4444' : '#fff' }}>J{jp.position} — {jp.judge_name}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  Avg: {jp.average_score.toFixed(2)} · {jp.scores_submitted} scores
                  {isOutlier && <span style={{ color: '#EF4444', marginLeft: 4 }}>⚠ OUTLIER</span>}
                </div>
              </div>
            )
          })}
          <div style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(43,165,160,0.2)', background: 'rgba(43,165,160,0.05)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#2BA5A0' }}>Heat Average</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{data.heat_average.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Interference Modal */}
      {interferenceModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 100 }}>
          <div style={{ background: '#0A2540', borderRadius: 16, padding: 24, maxWidth: 380, width: '100%', border: '1px solid rgba(220,38,38,0.2)' }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: '#EF4444', marginBottom: 4 }}>🚩 Interference</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>{interferenceModal.athleteName}</div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Wave Number</label>
              <input type="number" value={intWave} onChange={e => setIntWave(e.target.value)} min={1} style={inputStyle} placeholder="1" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Penalty Type</label>
              <select value={intType} onChange={e => setIntType(e.target.value)} style={inputStyle}>
                <option value="interference_half">Interference — Half Score</option>
                <option value="interference_zero">Interference — Zero Score</option>
                <option value="double_interference">Double Interference — Zero + Elimination</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Notes</label>
              <input value={intNotes} onChange={e => setIntNotes(e.target.value)} style={inputStyle} placeholder="Optional" />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setInterferenceModal(null)} style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={callInterference} disabled={!intWave} style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = { padding: '6px 8px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }
const tdStyle: React.CSSProperties = { padding: '8px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600 }
const labelStyle: React.CSSProperties = { display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }
