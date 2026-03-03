'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const JERSEY_HEX: Record<string, string> = { red: '#DC2626', blue: '#2563EB', white: '#E2E8F0', yellow: '#EAB308', green: '#16A34A', black: '#1E293B', pink: '#EC4899', orange: '#EA580C' }

interface Judge { id: string; name: string; role: string }
interface LiveHeat {
  id: string; heat_number: number; round_name: string; division_name: string
  athletes: {
    id: string; athlete_name: string; jersey_color: string | null
    waves: { id: string; wave_number: number; score: number }[]
    total: number
    position: number
  }[]
}

export function JudgeClient() {
  const [judge, setJudge] = useState<Judge | null>(null)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [heat, setHeat] = useState<LiveHeat | null>(null)
  const [heats, setHeats] = useState<{ id: string; label: string }[]>([])
  const [selectedHeatId, setSelectedHeatId] = useState<string | null>(null)
  const [selectedAthlete, setSelectedAthlete] = useState<string | null>(null)
  const [scoreValue, setScoreValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [lastScore, setLastScore] = useState<string | null>(null)

  const sb = createClient()

  // PIN login
  const login = async () => {
    setPinError('')
    const res = await fetch('/api/judge/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    const data = await res.json()
    if (data.judge) {
      setJudge(data.judge)
      localStorage.setItem('bsa_judge', JSON.stringify(data.judge))
    } else {
      setPinError('Invalid PIN')
    }
  }

  // Restore session
  useEffect(() => {
    const saved = localStorage.getItem('bsa_judge')
    if (saved) setJudge(JSON.parse(saved))
  }, [])

  // Load live heats
  const loadHeats = useCallback(async () => {
    const { data } = await sb
      .from('comp_heats')
      .select(`
        id, heat_number, status,
        round:comp_rounds(name, event_division:comp_event_divisions(division:comp_divisions(name)))
      `)
      .eq('status', 'live')

    if (data && data.length > 0) {
      const heatList = data.map((h: Record<string, unknown>) => {
        const round = h.round as unknown as Record<string, unknown>
        const ed = round?.event_division as unknown as Record<string, unknown>
        const div = ed?.division as unknown as Record<string, string>
        return {
          id: h.id as string,
          label: `${div?.name || ''} — ${round?.name || ''} — Heat ${h.heat_number}`,
        }
      })
      setHeats(heatList)
      if (!selectedHeatId && heatList.length > 0) setSelectedHeatId(heatList[0].id)
    } else {
      setHeats([])
    }
  }, [selectedHeatId])

  useEffect(() => {
    if (judge) { loadHeats(); const i = setInterval(loadHeats, 15000); return () => clearInterval(i) }
  }, [judge, loadHeats])

  // Load heat details
  const loadHeat = useCallback(async () => {
    if (!selectedHeatId) return

    const { data: h } = await sb
      .from('comp_heats')
      .select(`
        id, heat_number, status,
        round:comp_rounds(name, event_division:comp_event_divisions(division:comp_divisions(name), scoring_best_of)),
        athletes:comp_heat_athletes(
          id, athlete_name, jersey_color, seed_position,
          waves:comp_wave_scores(id, wave_number, score)
        )
      `)
      .eq('id', selectedHeatId)
      .single()

    if (h) {
      const round = h.round as unknown as Record<string, unknown>
      const ed = round?.event_division as unknown as Record<string, unknown>
      const div = ed?.division as unknown as Record<string, string>
      const bestOf = (ed?.scoring_best_of as number) || 2

      const athletes = ((h.athletes || []) as Record<string, unknown>[]).map((a) => {
        const waves = ((a.waves || []) as { id: string; wave_number: number; score: number }[])
          .sort((x, y) => x.wave_number - y.wave_number)
        const topScores = [...waves].sort((x, y) => y.score - x.score).slice(0, bestOf)
        const total = topScores.reduce((s, w) => s + w.score, 0)
        return {
          id: a.id as string,
          athlete_name: a.athlete_name as string,
          jersey_color: a.jersey_color as string | null,
          waves,
          total,
          position: 0,
        }
      }).sort((a, b) => b.total - a.total)

      athletes.forEach((a, i) => { a.position = i + 1 })

      setHeat({
        id: h.id as string,
        heat_number: h.heat_number as number,
        round_name: (round?.name as string) || '',
        division_name: div?.name || '',
        athletes,
      })
    }
  }, [selectedHeatId])

  useEffect(() => { loadHeat() }, [selectedHeatId, loadHeat])

  // Realtime subscription for live scores
  useEffect(() => {
    if (!selectedHeatId) return

    const channel = sb.channel(`heat-${selectedHeatId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comp_wave_scores' }, () => { loadHeat() })
      .subscribe()

    return () => { sb.removeChannel(channel) }
  }, [selectedHeatId, loadHeat])

  // Submit score
  const submitScore = async (athleteId: string, waveNum: number, score: number) => {
    setSubmitting(true)
    await fetch('/api/judge/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        heat_athlete_id: athleteId,
        wave_number: waveNum,
        score,
        judge_id: judge?.id,
      }),
    })
    setSubmitting(false)
    setScoreValue('')
    setLastScore(`${score.toFixed(1)} → Wave ${waveNum}`)
    setTimeout(() => setLastScore(null), 2000)
    loadHeat()
  }

  const logout = () => {
    setJudge(null)
    localStorage.removeItem('bsa_judge')
  }

  // ─── PIN Screen ───
  if (!judge) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A2540', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 340, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 4 }}>BSA</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 40 }}>Judge Login</div>

          <input
            type="tel"
            inputMode="numeric"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter PIN"
            style={{
              width: '100%', padding: '18px', fontSize: 28, textAlign: 'center',
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.3em',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, color: '#fff', outline: 'none', boxSizing: 'border-box',
            }}
            onKeyDown={e => { if (e.key === 'Enter' && pin.length >= 4) login() }}
          />

          {pinError && <div style={{ color: '#DC2626', fontSize: 13, marginTop: 12 }}>{pinError}</div>}

          <button onClick={login} disabled={pin.length < 4} style={{
            width: '100%', padding: 16, marginTop: 20, borderRadius: 12,
            background: pin.length >= 4 ? '#2BA5A0' : 'rgba(255,255,255,0.06)',
            color: '#fff', border: 'none', fontSize: 16, fontWeight: 600,
            fontFamily: "'Space Grotesk', sans-serif", cursor: pin.length >= 4 ? 'pointer' : 'default',
            opacity: pin.length >= 4 ? 1 : 0.4,
          }}>
            Enter
          </button>
        </div>
      </div>
    )
  }

  // ─── No Live Heats ───
  if (heats.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A2540', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, color: '#fff' }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No Live Heats</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>Waiting for a heat to go live...</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Logged in as {judge.name}</div>
        <button onClick={logout} style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>Sign out</button>
      </div>
    )
  }

  // ─── Scoring Interface ───
  return (
    <div style={{ minHeight: '100vh', background: '#0A2540', color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700 }}>BSA</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.3)', marginLeft: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {judge.name}
          </span>
        </div>
        <button onClick={logout} style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>Exit</button>
      </div>

      {/* Heat selector */}
      {heats.length > 1 && (
        <div style={{ padding: '8px 16px', display: 'flex', gap: 8, overflowX: 'auto' }}>
          {heats.map(h => (
            <button key={h.id} onClick={() => setSelectedHeatId(h.id)} style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
              fontFamily: "'Space Grotesk', sans-serif",
              background: selectedHeatId === h.id ? 'rgba(43,165,160,0.2)' : 'rgba(255,255,255,0.04)',
              border: selectedHeatId === h.id ? '1px solid rgba(43,165,160,0.4)' : '1px solid rgba(255,255,255,0.06)',
              color: selectedHeatId === h.id ? '#2BA5A0' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
            }}>
              {h.label}
            </button>
          ))}
        </div>
      )}

      {/* Heat info */}
      {heat && (
        <div style={{ padding: '12px 16px 8px' }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700 }}>
            Heat {heat.heat_number}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>
            {heat.division_name} — {heat.round_name}
          </div>
        </div>
      )}

      {/* Score confirmation */}
      {lastScore && (
        <div style={{
          margin: '0 16px 8px', padding: '10px 16px', borderRadius: 8,
          background: 'rgba(43,165,160,0.15)', border: '1px solid rgba(43,165,160,0.3)',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#2BA5A0', textAlign: 'center',
        }}>
          {lastScore}
        </div>
      )}

      {/* Athletes */}
      {heat && heat.athletes.map((athlete, ai) => {
        const isSelected = selectedAthlete === athlete.id
        const nextWave = (athlete.waves?.length || 0) + 1

        return (
          <div key={athlete.id} style={{ margin: '8px 16px', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            {/* Athlete header — tap to select */}
            <button
              onClick={() => setSelectedAthlete(isSelected ? null : athlete.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                background: isSelected ? 'rgba(43,165,160,0.08)' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                borderBottom: isSelected ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
            >
              {/* Position */}
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700,
                color: ai === 0 ? '#2BA5A0' : 'rgba(255,255,255,0.3)', width: 28,
              }}>
                {athlete.position}
              </span>

              {/* Jersey */}
              {athlete.jersey_color && (
                <span style={{
                  width: 16, height: 16, borderRadius: 4,
                  background: JERSEY_HEX[athlete.jersey_color] || '#94A3B8',
                  border: athlete.jersey_color === 'white' ? '1px solid rgba(255,255,255,0.3)' : 'none',
                  flexShrink: 0,
                }} />
              )}

              {/* Name */}
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#fff' }}>
                {athlete.athlete_name}
              </span>

              {/* Total */}
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700,
                color: ai === 0 ? '#2BA5A0' : '#fff',
              }}>
                {athlete.total.toFixed(2)}
              </span>
            </button>

            {/* Expanded: waves + score input */}
            {isSelected && (
              <div style={{ padding: '12px 16px 16px' }}>
                {/* Wave scores */}
                {athlete.waves && athlete.waves.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                    {athlete.waves.map((w, wi) => {
                      const sorted = [...athlete.waves].sort((a, b) => b.score - a.score)
                      const isCounting = wi < 2 && sorted.slice(0, 2).some(s => s.wave_number === w.wave_number)
                      return (
                        <div key={w.id} style={{
                          padding: '6px 12px', borderRadius: 6, textAlign: 'center',
                          background: isCounting ? 'rgba(43,165,160,0.15)' : 'rgba(255,255,255,0.04)',
                          border: isCounting ? '1px solid rgba(43,165,160,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        }}>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>W{w.wave_number}</div>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: isCounting ? '#2BA5A0' : 'rgba(255,255,255,0.6)' }}>
                            {w.score.toFixed(1)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Score input */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', width: 50 }}>
                    W{nextWave}
                  </div>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    max="10"
                    value={scoreValue}
                    onChange={e => setScoreValue(e.target.value)}
                    placeholder="0.0"
                    style={{
                      flex: 1, padding: '14px', fontSize: 24, textAlign: 'center',
                      fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 10, color: '#fff', outline: 'none', boxSizing: 'border-box',
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && scoreValue) {
                        const val = parseFloat(scoreValue)
                        if (val >= 0 && val <= 10) submitScore(athlete.id, nextWave, val)
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const val = parseFloat(scoreValue)
                      if (val >= 0 && val <= 10) submitScore(athlete.id, nextWave, val)
                    }}
                    disabled={submitting || !scoreValue || parseFloat(scoreValue) < 0 || parseFloat(scoreValue) > 10}
                    style={{
                      padding: '14px 24px', borderRadius: 10, border: 'none',
                      background: scoreValue && parseFloat(scoreValue) >= 0 && parseFloat(scoreValue) <= 10 ? '#2BA5A0' : 'rgba(255,255,255,0.06)',
                      color: '#fff', fontSize: 16, fontWeight: 700,
                      fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer',
                      opacity: submitting ? 0.5 : 1,
                    }}
                  >
                    {submitting ? '...' : 'Score'}
                  </button>
                </div>

                {/* Quick score buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginTop: 10 }}>
                  {[0.5, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 9.5, 10.0].map(s => (
                    <button key={s} onClick={() => setScoreValue(s.toFixed(1))} style={{
                      padding: '12px 0', borderRadius: 8, border: 'none',
                      background: scoreValue === s.toFixed(1) ? 'rgba(43,165,160,0.2)' : 'rgba(255,255,255,0.04)',
                      color: scoreValue === s.toFixed(1) ? '#2BA5A0' : 'rgba(255,255,255,0.5)',
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600,
                      cursor: 'pointer',
                    }}>
                      {s.toFixed(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
