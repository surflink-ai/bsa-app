'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const JERSEY_HEX: Record<string, string> = { red: '#DC2626', blue: '#2563EB', white: '#E2E8F0', yellow: '#EAB308', green: '#16A34A', black: '#1E293B', pink: '#EC4899', orange: '#EA580C' }

interface Athlete {
  id: string; athlete_name: string; jersey_color: string | null
  waves: { wave_number: number; score: number }[]
  total: number; position: number
  needs_score: number | null; has_priority: boolean; penalty: string | null
}

interface Heat {
  id: string; heat_number: number; status: string
  priority_order: string[]
  athletes: Athlete[]
}

interface Round {
  id: string; name: string; round_number: number; status: string
  heats: Heat[]
}

interface Division {
  id: string; division_name: string; scoring_best_of: number
  rounds: Round[]
}

interface EventData {
  id: string; name: string; location: string | null; event_date: string | null; status: string
  divisions: Division[]
}

export function LiveResultsClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<EventData | null>(null)
  const [activeDivision, setActiveDivision] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const sb = createClient()

  const load = useCallback(async () => {
    const { data: ev } = await sb.from('comp_events').select(`
      id, name, location, event_date, status,
      event_divisions:comp_event_divisions(
        id, scoring_best_of,
        division:comp_divisions(id, name, short_name),
        rounds:comp_rounds(
          id, round_number, name, status,
          heats:comp_heats(
            id, heat_number, status, priority_order,
            athletes:comp_heat_athletes(
              id, athlete_name, jersey_color, seed_position, result_position, total_score, needs_score, has_priority, penalty,
              waves:comp_wave_scores(wave_number, score)
            )
          )
        )
      )
    `).eq('id', eventId).single()

    if (ev) {
      const divisions: Division[] = ((ev.event_divisions || []) as unknown[]).map((ed: unknown) => {
        const edTyped = ed as Record<string, unknown>
        const div = edTyped.division as unknown as { id: string; name: string; short_name: string }
        const bestOf = (edTyped.scoring_best_of as number) || 2

        const rounds: Round[] = ((edTyped.rounds || []) as unknown[]).map((r: unknown) => {
          const rTyped = r as Record<string, unknown>
          const heats: Heat[] = ((rTyped.heats || []) as unknown[]).map((h: unknown) => {
            const hTyped = h as Record<string, unknown>
            const athletes: Athlete[] = ((hTyped.athletes || []) as unknown[]).map((a: unknown) => {
              const aTyped = a as Record<string, unknown>
              const waves = ((aTyped.waves || []) as { wave_number: number; score: number }[]).sort((x, y) => x.wave_number - y.wave_number)
              const cachedTotal = aTyped.total_score as number
              const topScores = [...waves].sort((x, y) => y.score - x.score).slice(0, bestOf)
              const total = cachedTotal || topScores.reduce((s, w) => s + w.score, 0)
              return {
                id: aTyped.id as string,
                athlete_name: aTyped.athlete_name as string,
                jersey_color: aTyped.jersey_color as string | null,
                waves,
                total,
                position: 0,
                needs_score: (aTyped.needs_score as number) || null,
                has_priority: (aTyped.has_priority as boolean) || false,
                penalty: (aTyped.penalty as string) || null,
              }
            }).sort((a, b) => b.total - a.total)
            athletes.forEach((a, i) => { a.position = i + 1 })

            return {
              id: hTyped.id as string,
              heat_number: hTyped.heat_number as number,
              status: hTyped.status as string,
              priority_order: (hTyped.priority_order as string[]) || [],
              athletes,
            }
          }).sort((a, b) => a.heat_number - b.heat_number)

          return {
            id: rTyped.id as string,
            name: rTyped.name as string,
            round_number: rTyped.round_number as number,
            status: rTyped.status as string,
            heats,
          }
        }).sort((a, b) => a.round_number - b.round_number)

        return {
          id: div.id,
          division_name: div.name,
          scoring_best_of: bestOf,
          rounds,
        }
      })

      setEvent({
        id: ev.id as string,
        name: ev.name as string,
        location: ev.location as string | null,
        event_date: ev.event_date as string | null,
        status: ev.status as string,
        divisions,
      })

      if (!activeDivision && divisions.length > 0) {
        // Auto-select division with live heats, or first
        const liveDiv = divisions.find(d => d.rounds.some(r => r.heats.some(h => h.status === 'live')))
        setActiveDivision(liveDiv?.id || divisions[0].id)
      }
    }
    setLoading(false)
  }, [eventId, activeDivision])

  useEffect(() => { load() }, [load])

  // Realtime
  useEffect(() => {
    const channel = sb.channel(`event-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comp_wave_scores' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comp_heats' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comp_heat_athletes' }, () => load())
      .subscribe()
    return () => { sb.removeChannel(channel) }
  }, [eventId, load])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A2540', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
        Loading...
      </div>
    )
  }

  if (!event) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A2540', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
        Event not found
      </div>
    )
  }

  const currentDiv = event.divisions.find(d => d.id === activeDivision)
  const liveHeat = currentDiv?.rounds.flatMap(r => r.heats).find(h => h.status === 'live')

  return (
    <div style={{ minHeight: '100vh', background: '#0A2540', color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>
        <Link href={`/events/${eventId}`} style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>
          &larr; Event page
        </Link>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, margin: '8px 0 4px', color: '#fff' }}>
          {event.name}
        </h1>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>
          {event.location} — Live Results
        </div>
      </div>

      {/* Division tabs */}
      {event.divisions.length > 1 && (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px', display: 'flex', gap: 4, overflowX: 'auto' }}>
          {event.divisions.map(d => {
            const hasLive = d.rounds.some(r => r.heats.some(h => h.status === 'live'))
            return (
              <button key={d.id} onClick={() => setActiveDivision(d.id)} style={{
                padding: '10px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                fontFamily: "'Space Grotesk', sans-serif",
                background: activeDivision === d.id ? 'rgba(43,165,160,0.15)' : 'rgba(255,255,255,0.03)',
                border: activeDivision === d.id ? '1px solid rgba(43,165,160,0.3)' : '1px solid rgba(255,255,255,0.06)',
                color: activeDivision === d.id ? '#2BA5A0' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer', position: 'relative',
              }}>
                {d.division_name}
                {hasLive && (
                  <span style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 6, height: 6, borderRadius: '50%', background: '#DC2626',
                  }} />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Live heat spotlight */}
      {liveHeat && (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px 0' }}>
          <div style={{
            background: 'rgba(43,165,160,0.06)',
            border: '1px solid rgba(43,165,160,0.15)',
            borderRadius: 12, overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(43,165,160,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: '#DC2626', display: 'inline-block',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: '#DC2626', textTransform: 'uppercase' }}>Live</span>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: '#fff' }}>Heat {liveHeat.heat_number}</span>
            </div>

            {liveHeat.athletes.map((a, i) => {
              const priorityPos = liveHeat.priority_order.indexOf(a.id)
              return (
                <div key={a.id} style={{
                  display: 'grid', gridTemplateColumns: '36px 16px 1fr auto 80px',
                  alignItems: 'center', gap: 12, padding: '14px 20px',
                  borderBottom: i < liveHeat.athletes.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  background: i === 0 ? 'rgba(43,165,160,0.04)' : 'transparent',
                }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: i === 0 ? '#2BA5A0' : 'rgba(255,255,255,0.3)' }}>
                    {a.position}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    {a.jersey_color && (
                      <span style={{ width: 12, height: 12, borderRadius: 3, background: JERSEY_HEX[a.jersey_color], border: a.jersey_color === 'white' ? '1px solid rgba(255,255,255,0.3)' : 'none' }} />
                    )}
                    {priorityPos === 0 && (
                      <span style={{ fontSize: 7, fontWeight: 700, color: '#FFD700', fontFamily: "'JetBrains Mono', monospace" }}>P</span>
                    )}
                  </span>
                  <div>
                    <span style={{ fontSize: 15, fontWeight: i === 0 ? 700 : 500, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {a.athlete_name}
                      {a.penalty && a.penalty !== 'none' && (
                        <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: 'rgba(220,38,38,0.15)', color: '#EF4444', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>INT</span>
                      )}
                    </span>
                    {a.needs_score !== null && i > 0 && (
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>
                        needs {a.needs_score.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {a.waves.map((w, wi) => {
                      const sorted = [...a.waves].sort((x, y) => y.score - x.score)
                      const isCounting = sorted.slice(0, 2).some(s => s.wave_number === w.wave_number)
                      return (
                        <span key={wi} style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                          padding: '3px 8px', borderRadius: 4,
                          color: isCounting ? '#2BA5A0' : 'rgba(255,255,255,0.4)',
                          background: isCounting ? 'rgba(43,165,160,0.12)' : 'rgba(255,255,255,0.04)',
                        }}>
                          {w.score.toFixed(1)}
                        </span>
                      )
                    })}
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: i === 0 ? '#2BA5A0' : '#fff', textAlign: 'right' }}>
                    {a.total.toFixed(2)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* All rounds */}
      {currentDiv && (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
          {currentDiv.rounds.map(round => (
            <div key={round.id} style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
                {round.name}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {round.heats.filter(h => h.status !== 'live').map(heat => (
                  <div key={heat.id} style={{
                    background: 'rgba(255,255,255,0.02)', borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
                  }}>
                    <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600 }}>Heat {heat.heat_number}</span>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
                        color: heat.status === 'complete' ? '#2BA5A0' : 'rgba(255,255,255,0.25)',
                      }}>
                        {heat.status}
                      </span>
                    </div>
                    {heat.athletes.map((a, i) => (
                      <div key={a.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px',
                        borderBottom: i < heat.athletes.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                      }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: i === 0 ? '#2BA5A0' : 'rgba(255,255,255,0.3)', width: 20 }}>
                          {a.position}
                        </span>
                        {a.jersey_color && (
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: JERSEY_HEX[a.jersey_color], border: a.jersey_color === 'white' ? '1px solid rgba(255,255,255,0.3)' : 'none' }} />
                        )}
                        <span style={{ flex: 1, fontSize: 13, fontWeight: i === 0 ? 600 : 400 }}>{a.athlete_name}</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: heat.status === 'complete' && i === 0 ? '#2BA5A0' : 'rgba(255,255,255,0.5)' }}>
                          {a.total > 0 ? a.total.toFixed(2) : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '24px 16px 48px' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.15)' }}>
          Barbados Surfing Association
        </div>
      </div>
    </div>
  )
}
