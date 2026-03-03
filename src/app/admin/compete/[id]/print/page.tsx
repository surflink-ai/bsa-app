import { createClient } from '@/lib/supabase/server'

export default async function PrintHeatSheets({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: ev } = await supabase.from('comp_events').select(`
    id, name, location, event_date,
    event_divisions:comp_event_divisions(
      id,
      division:comp_divisions(name, short_name),
      rounds:comp_rounds(
        id, round_number, name,
        heats:comp_heats(
          id, heat_number, duration_minutes,
          athletes:comp_heat_athletes(athlete_name, jersey_color, seed_position)
        )
      )
    )
  `).eq('id', id).single()

  if (!ev) return <div>Event not found</div>

  const JERSEY_HEX: Record<string, string> = { red: '#DC2626', blue: '#2563EB', white: '#E2E8F0', yellow: '#EAB308', green: '#16A34A', black: '#1E293B', pink: '#EC4899', orange: '#EA580C' }

  return (
    <html>
      <head>
        <title>Heat Sheets — {ev.name}</title>
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            .no-print { display: none !important; }
            .heat-card { break-inside: avoid; page-break-inside: avoid; }
          }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0A2540; margin: 0; padding: 20px; }
          h1 { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
          h2 { font-size: 16px; font-weight: 700; margin: 24px 0 12px; border-bottom: 2px solid #0A2540; padding-bottom: 6px; }
          h3 { font-size: 13px; font-weight: 600; margin: 0 0 8px; }
          .meta { font-size: 11px; color: #64748B; }
          .heat-card { border: 1px solid #E2E8F0; border-radius: 6px; padding: 14px; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #94A3B8; padding: 4px 8px; border-bottom: 1px solid #E2E8F0; }
          td { padding: 8px; border-bottom: 1px solid #F1F5F9; font-size: 13px; }
          .jersey { width: 14px; height: 14px; border-radius: 3px; display: inline-block; vertical-align: middle; }
          .score-cell { width: 60px; border: 1px solid #E2E8F0; border-radius: 3px; height: 24px; }
        `}} />
      </head>
      <body>
        <div className="no-print" style={{ marginBottom: 20, padding: 12, background: '#F8FAFC', borderRadius: 8 }}>
          <button onClick={() => {}} style={{ padding: '8px 16px', background: '#0A2540', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
            ref={(el) => { if (el) el.onclick = () => window.print() }}>
            Print Heat Sheets
          </button>
        </div>

        <h1>{ev.name}</h1>
        <p className="meta">{ev.location} — {ev.event_date ? new Date(ev.event_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}</p>

        {((ev.event_divisions || []) as unknown[]).map((edRaw: unknown) => {
          const ed = edRaw as Record<string, unknown>
          const div = ed.division as unknown as { name: string; short_name: string }
          const rounds = ((ed.rounds || []) as Record<string, unknown>[]).sort((a, b) => (a.round_number as number) - (b.round_number as number))

          return (
            <div key={ed.id as string}>
              <h2>{div.name}</h2>
              {rounds.map(round => {
                const heats = ((round.heats || []) as Record<string, unknown>[]).sort((a, b) => (a.heat_number as number) - (b.heat_number as number))
                return (
                  <div key={round.id as string}>
                    <h3>{round.name as string}</h3>
                    {heats.map(heat => {
                      const athletes = ((heat.athletes || []) as Record<string, unknown>[]).sort((a, b) => ((a.seed_position as number) || 0) - ((b.seed_position as number) || 0))
                      return (
                        <div key={heat.id as string} className="heat-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontWeight: 600, fontSize: 13 }}>Heat {heat.heat_number as number}</span>
                            <span className="meta">{heat.duration_minutes as number} min</span>
                          </div>
                          <table>
                            <thead>
                              <tr>
                                <th style={{ width: 30 }}>#</th>
                                <th style={{ width: 24 }}></th>
                                <th>Athlete</th>
                                {Array.from({ length: 8 }).map((_, i) => <th key={i} style={{ width: 50, textAlign: 'center' }}>W{i + 1}</th>)}
                                <th style={{ width: 60, textAlign: 'right' }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {athletes.length > 0 ? athletes.map((a, i) => (
                                <tr key={i}>
                                  <td style={{ fontWeight: 600, color: '#94A3B8' }}>{i + 1}</td>
                                  <td>{(a.jersey_color as string) && <span className="jersey" style={{ background: JERSEY_HEX[(a.jersey_color as string)] || '#94A3B8', border: (a.jersey_color as string) === 'white' ? '1px solid #CBD5E1' : 'none' }} />}</td>
                                  <td style={{ fontWeight: 500 }}>{a.athlete_name as string}</td>
                                  {Array.from({ length: 8 }).map((_, j) => <td key={j}><div className="score-cell" /></td>)}
                                  <td style={{ textAlign: 'right', fontWeight: 700 }}></td>
                                </tr>
                              )) : (
                                <tr><td colSpan={11} style={{ color: '#94A3B8', fontStyle: 'italic' }}>No athletes assigned</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )
        })}
      </body>
    </html>
  )
}
