'use client'

import { useState, useEffect, use } from 'react'

const FONT_ID = 'tab-fonts'
if (typeof document !== 'undefined' && !document.getElementById(FONT_ID)) {
  const l = document.createElement('link'); l.id = FONT_ID; l.rel = 'stylesheet'
  l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600;700&display=swap'
  document.head.appendChild(l)
}

const ff = { ui: 'Inter, -apple-system, sans-serif', mono: 'Geist Mono, ui-monospace, monospace' }
const JERSEY: Record<string, string> = { red: '#DC2626', blue: '#2563EB', white: '#CBD5E1', yellow: '#EAB308', green: '#16A34A', black: '#1E293B', pink: '#EC4899', orange: '#EA580C' }

interface TabulationData {
  event_name: string; event_date: string; location: string; division: string; round: string
  heat_number: number; duration_minutes: number; start_time: string | null; end_time: string | null
  certified: boolean; certified_at: string | null; panel_size: number; scoring_best_of: number
  judges: { position: number; name: string }[]
  head_judge: string | null
  athletes: {
    athlete_name: string; jersey_color: string; position: number; total_score: number; penalty: string
    counting_waves: number[]
    waves: {
      wave_number: number
      judge_scores: { position: number; score: number | null; is_override: boolean }[]
      averaged_score: number | null
      interference: { type: string; notes: string } | null
    }[]
  }[]
}

export default function TabulationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [heatId, setHeatId] = useState('')
  const [data, setData] = useState<TabulationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [heats, setHeats] = useState<{ id: string; label: string }[]>([])

  useEffect(() => {
    const load = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const sb = createClient()
      const { data: ev } = await sb.from('comp_events').select(`
        event_divisions:comp_event_divisions(
          division:comp_divisions(short_name),
          rounds:comp_rounds(name, heats:comp_heats(id, heat_number, status))
        )
      `).eq('id', id).single()

      if (ev?.event_divisions) {
        const list: { id: string; label: string }[] = []
        for (const ed of ev.event_divisions as any[]) {
          for (const r of (ed.rounds || [])) {
            for (const h of (r.heats || [])) {
              list.push({ id: h.id, label: `${ed.division?.short_name || ''} ${r.name} H${h.heat_number} (${h.status})` })
            }
          }
        }
        setHeats(list)
        if (list.length > 0) setHeatId(list[0].id)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    if (!heatId) return
    setLoading(true)
    fetch(`/api/compete/tabulation?heat_id=${heatId}`)
      .then(r => r.json())
      .then(json => { if (!json.error) setData(json); setLoading(false) })
  }, [heatId])

  return (
    <div style={{ fontFamily: ff.ui, color: '#0A2540', padding: 24, background: '#fff', minHeight: '100vh' }}>
      <style>{`@media print { .no-print { display: none !important; } @page { margin: 10mm; size: landscape; } }`}</style>

      {/* Controls */}
      <div className="no-print" style={{ marginBottom: 24, padding: 16, background: '#F8FAFC', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
        <select value={heatId} onChange={e => setHeatId(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, fontFamily: ff.mono }}>
          {heats.map(h => <option key={h.id} value={h.id}>{h.label}</option>)}
        </select>
        <button onClick={() => window.print()} style={{ padding: '8px 20px', background: '#0A2540', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Print</button>
        <a href={`/admin/compete/${id}`} style={{ fontSize: 12, color: '#64748B', textDecoration: 'none' }}>Back to Event</a>
      </div>

      {loading && <div style={{ padding: 40, color: '#94A3B8', fontFamily: ff.mono }}>Loading...</div>}

      {data && (
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>{data.event_name}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{data.location} — {data.event_date ? new Date(data.event_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{data.division} — {data.round}</div>
              <div style={{ fontSize: 11, color: '#64748B', fontFamily: ff.mono }}>Heat {data.heat_number} — {data.duration_minutes}min</div>
            </div>
          </div>

          {/* Judge names */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 12, padding: '8px 12px', background: '#F8FAFC', borderRadius: 6 }}>
            {data.judges.map(j => (
              <span key={j.position} style={{ fontFamily: ff.mono, fontSize: 10, color: '#475569' }}>
                <span style={{ fontWeight: 700 }}>J{j.position}</span> {j.name}
              </span>
            ))}
            {data.head_judge && <span style={{ fontFamily: ff.mono, fontSize: 10, color: '#2BA5A0', fontWeight: 700 }}>HJ {data.head_judge}</span>}
          </div>

          {/* Tabulation grid */}
          {data.athletes.map((athlete, ai) => {
            const jc = JERSEY[athlete.jersey_color] || '#94A3B8'
            const isWhite = athlete.jersey_color === 'white' || athlete.jersey_color === 'yellow'
            const maxWave = Math.max(4, ...athlete.waves.map(w => w.wave_number))

            return (
              <div key={ai} style={{ marginBottom: 16, border: '1.5px solid #CBD5E1', borderRadius: 8, overflow: 'hidden' }}>
                {/* Athlete header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: `${jc}08`, borderBottom: '1px solid #E2E8F0' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: jc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ff.mono, fontSize: 13, fontWeight: 800, color: isWhite ? 'rgba(0,0,0,0.6)' : '#fff' }}>
                    {athlete.position}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>{athlete.athlete_name}</span>
                  {athlete.penalty && athlete.penalty !== 'none' && (
                    <span style={{ fontFamily: ff.mono, fontSize: 9, fontWeight: 800, color: '#DC2626', padding: '2px 6px', background: '#FEF2F2', borderRadius: 4 }}>
                      {athlete.penalty === 'double_interference' ? 'DQ' : 'INT'}
                    </span>
                  )}
                  <span style={{ fontFamily: ff.mono, fontSize: 24, fontWeight: 800, letterSpacing: -1, color: jc === '#CBD5E1' ? '#0A2540' : jc }}>{athlete.total_score.toFixed(2)}</span>
                </div>

                {/* Score grid */}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ width: 40, padding: '4px 6px', fontSize: 8, fontFamily: ff.mono, color: '#94A3B8', letterSpacing: '0.1em', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}></th>
                      {Array.from({ length: maxWave }, (_, wi) => (
                        <th key={wi} style={{ padding: '4px 6px', fontSize: 8, fontFamily: ff.mono, color: '#94A3B8', letterSpacing: '0.1em', fontWeight: 600, textAlign: 'center', borderBottom: '1px solid #E2E8F0', background: athlete.counting_waves.includes(wi + 1) ? '#F0FDF4' : 'transparent' }}>
                          W{wi + 1}{athlete.counting_waves.includes(wi + 1) ? ' *' : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.judges.map(judge => (
                      <tr key={judge.position}>
                        <td style={{ padding: '3px 6px', fontSize: 10, fontFamily: ff.mono, color: '#94A3B8', fontWeight: 600, borderBottom: '1px solid #F1F5F9' }}>J{judge.position}</td>
                        {Array.from({ length: maxWave }, (_, wi) => {
                          const wave = athlete.waves.find(w => w.wave_number === wi + 1)
                          const js = wave?.judge_scores.find(s => s.position === judge.position)
                          const isCounting = athlete.counting_waves.includes(wi + 1)
                          return (
                            <td key={wi} style={{ padding: '3px 6px', fontSize: 11, fontFamily: ff.mono, fontWeight: 500, textAlign: 'center', borderBottom: '1px solid #F1F5F9', background: isCounting ? '#F0FDF4' : 'transparent', color: js?.is_override ? '#D97706' : '#475569' }}>
                              {js?.score != null ? js.score.toFixed(1) : ''}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                    <tr style={{ borderTop: '2px solid #0A2540' }}>
                      <td style={{ padding: '5px 6px', fontSize: 9, fontFamily: ff.mono, fontWeight: 800, color: '#0A2540', letterSpacing: '0.05em' }}>AVG</td>
                      {Array.from({ length: maxWave }, (_, wi) => {
                        const wave = athlete.waves.find(w => w.wave_number === wi + 1)
                        const isCounting = athlete.counting_waves.includes(wi + 1)
                        return (
                          <td key={wi} style={{ padding: '5px 6px', fontSize: 13, fontFamily: ff.mono, fontWeight: 700, textAlign: 'center', color: '#0A2540', background: isCounting ? '#DCFCE7' : 'transparent' }}>
                            {wave?.averaged_score != null ? wave.averaged_score.toFixed(2) : ''}
                            {wave?.interference && <span style={{ fontSize: 8, color: '#DC2626', display: 'block' }}>{wave.interference.type}</span>}
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            )
          })}

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, padding: '12px 0', borderTop: '1px solid #E2E8F0' }}>
            <div style={{ fontFamily: ff.mono, fontSize: 9, color: '#94A3B8' }}>
              {data.certified ? `Certified: ${data.certified_at ? new Date(data.certified_at).toLocaleString() : 'Yes'}` : 'NOT YET CERTIFIED'}
              {' — '}ISA {data.panel_size}-Judge Panel — Best {data.scoring_best_of} Waves — * = Counting Wave
            </div>
            <div style={{ display: 'flex', gap: 40 }}>
              <span style={{ fontFamily: ff.mono, fontSize: 9, color: '#94A3B8' }}>Head Judge: _______________</span>
              <span style={{ fontFamily: ff.mono, fontSize: 9, color: '#94A3B8' }}>Event Director: _______________</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
