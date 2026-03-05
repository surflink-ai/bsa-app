import { createClient } from '@/lib/supabase/server'

export default async function PrintHeatSheets({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: ev } = await supabase.from('comp_events').select(`
    id, name, location, event_date,
    event_divisions:comp_event_divisions(
      id, panel_size, scoring_best_of,
      division:comp_divisions(name, short_name),
      rounds:comp_rounds(
        id, round_number, name,
        heats:comp_heats(
          id, heat_number, duration_minutes,
          athletes:comp_heat_athletes(athlete_name, jersey_color, seed_position),
          judges:comp_heat_judges(judge_id, position, is_head_judge, judge:comp_judges(name))
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
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600;700&display=swap');
          @media print {
            .no-print { display: none !important; }
            .heat-card { break-inside: avoid; page-break-inside: avoid; }
            @page { margin: 12mm; }
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', -apple-system, sans-serif; color: #0A2540; padding: 24px; background: #fff; }
          .mono { font-family: 'Geist Mono', ui-monospace, monospace; }
          h1 { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
          h2 { font-size: 15px; font-weight: 700; margin: 28px 0 10px; border-bottom: 2px solid #0A2540; padding-bottom: 6px; letter-spacing: -0.3px; }
          .meta { font-size: 11px; color: #64748B; margin-top: 2px; }
          .heat-card { border: 1.5px solid #CBD5E1; border-radius: 8px; padding: 16px; margin-bottom: 14px; }
          .heat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #F1F5F9; }
          .heat-title { font-size: 14px; font-weight: 700; }
          .heat-meta { font-size: 10px; color: #64748B; font-family: 'Geist Mono', monospace; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: center; font-size: 8px; font-family: 'Geist Mono', monospace; text-transform: uppercase; letter-spacing: 0.12em; color: #94A3B8; padding: 4px 4px; border-bottom: 1px solid #E2E8F0; font-weight: 600; }
          th:first-child, th:nth-child(2), th:nth-child(3) { text-align: left; }
          td { padding: 7px 4px; border-bottom: 1px solid #F1F5F9; font-size: 12px; text-align: center; }
          td:first-child, td:nth-child(2), td:nth-child(3) { text-align: left; }
          .jersey { width: 12px; height: 12px; border-radius: 3px; display: inline-block; vertical-align: middle; }
          .score-box { width: 100%; height: 22px; border: 1px solid #E2E8F0; border-radius: 3px; background: #FAFBFC; }
          .total-box { width: 100%; height: 22px; border: 1.5px solid #CBD5E1; border-radius: 3px; background: #F8FAFC; }
          .priority-section { margin-top: 10px; display: flex; gap: 12px; align-items: center; }
          .priority-box { width: 32px; height: 32px; border: 1.5px solid #CBD5E1; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #94A3B8; font-family: 'Geist Mono', monospace; }
          .judges-section { margin-top: 10px; padding-top: 8px; border-top: 1px dashed #E2E8F0; display: flex; gap: 16px; flex-wrap: wrap; }
          .judge-tag { font-size: 9px; font-family: 'Geist Mono', monospace; color: #64748B; }
          .judge-tag-head { color: #2BA5A0; font-weight: 700; }
          .isa-footer { margin-top: 8px; padding-top: 6px; border-top: 1px solid #E2E8F0; font-size: 8px; font-family: 'Geist Mono', monospace; color: #94A3B8; display: flex; justify-content: space-between; }
          .qr-section { margin-top: 8px; display: flex; gap: 10px; flex-wrap: wrap; }
          .qr-item { display: flex; align-items: center; gap: 6px; font-size: 8px; font-family: 'Geist Mono', monospace; color: #64748B; }
          .qr-item img { width: 48px; height: 48px; }
          .print-btn { padding: 10px 20px; background: #0A2540; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif; }
          .print-btn:hover { background: #0E3A5C; }
        `}} />
      </head>
      <body>
        <div className="no-print" style={{ marginBottom: 24, padding: 16, background: '#F8FAFC', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="javascript:window.print()" className="print-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>Print Heat Sheets</a>
          <span style={{ fontSize: 12, color: '#64748B' }}>Designed for A4 landscape. Ctrl+P → Landscape → Print.</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
          <div>
            <h1>{ev.name}</h1>
            <p className="meta">{ev.location} — {ev.event_date ? new Date(ev.event_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ''}</p>
          </div>
          <div style={{ fontSize: 9, fontFamily: 'Geist Mono, monospace', color: '#94A3B8' }}>BSA Compete — ISA Rules</div>
        </div>

        {((ev.event_divisions || []) as unknown[]).map((edRaw: unknown) => {
          const ed = edRaw as Record<string, unknown>
          const div = ed.division as unknown as { name: string; short_name: string }
          const rounds = ((ed.rounds || []) as Record<string, unknown>[]).sort((a, b) => (a.round_number as number) - (b.round_number as number))
          const panelSize = (ed.panel_size as number) || 5
          const bestOf = (ed.scoring_best_of as number) || 2
          const waveCount = 10

          return (
            <div key={ed.id as string}>
              <h2>{div.name} <span className="mono" style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500, marginLeft: 8 }}>Panel: {panelSize} judges — Best {bestOf} waves</span></h2>
              {rounds.map(round => {
                const heats = ((round.heats || []) as Record<string, unknown>[]).sort((a, b) => (a.heat_number as number) - (b.heat_number as number))
                return (
                  <div key={round.id as string}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, marginTop: 16 }}>{round.name as string}</div>
                    {heats.map(heat => {
                      const athletes = ((heat.athletes || []) as Record<string, unknown>[]).sort((a, b) => ((a.seed_position as number) || 0) - ((b.seed_position as number) || 0))
                      const judges = ((heat.judges || []) as Record<string, unknown>[]).sort((a, b) => ((a.position as number) || 0) - ((b.position as number) || 0))
                      const scoringJudges = judges.filter(j => !(j.is_head_judge as boolean))
                      const headJudge = judges.find(j => j.is_head_judge as boolean)

                      return (
                        <div key={heat.id as string} className="heat-card">
                          <div className="heat-header">
                            <div>
                              <span className="heat-title">Heat {heat.heat_number as number}</span>
                              <span className="heat-meta" style={{ marginLeft: 10 }}>{heat.duration_minutes as number} min — {athletes.length} surfers</span>
                            </div>
                            <div className="heat-meta">
                              {headJudge && <span>HJ: {((headJudge.judge as any)?.name || 'TBD')}</span>}
                            </div>
                          </div>

                          <table>
                            <thead>
                              <tr>
                                <th style={{ width: 24 }}>#</th>
                                <th style={{ width: 20 }}></th>
                                <th style={{ width: 140 }}>Athlete</th>
                                {scoringJudges.length > 0 ? (
                                  Array.from({ length: waveCount }).map((_, wi) => (
                                    <th key={wi} style={{ minWidth: 44 }}>W{wi + 1}</th>
                                  ))
                                ) : (
                                  Array.from({ length: waveCount }).map((_, wi) => (
                                    <th key={wi} style={{ minWidth: 44 }}>W{wi + 1}</th>
                                  ))
                                )}
                                <th style={{ width: 56, textAlign: 'right' }}>Total</th>
                                <th style={{ width: 30, textAlign: 'center' }}>Pos</th>
                              </tr>
                            </thead>
                            <tbody>
                              {athletes.length > 0 ? athletes.map((a, i) => (
                                <tr key={i}>
                                  <td style={{ fontWeight: 700, color: '#94A3B8', fontFamily: 'Geist Mono, monospace', fontSize: 10 }}>{i + 1}</td>
                                  <td>{(a.jersey_color as string) && <span className="jersey" style={{ background: JERSEY_HEX[(a.jersey_color as string)] || '#94A3B8', border: (a.jersey_color as string) === 'white' ? '1px solid #CBD5E1' : 'none' }} />}</td>
                                  <td style={{ fontWeight: 600, fontSize: 12 }}>{a.athlete_name as string}</td>
                                  {Array.from({ length: waveCount }).map((_, j) => <td key={j}><div className="score-box" /></td>)}
                                  <td><div className="total-box" /></td>
                                  <td></td>
                                </tr>
                              )) : (
                                <tr><td colSpan={waveCount + 4} style={{ color: '#94A3B8', fontStyle: 'italic', textAlign: 'center', padding: 16 }}>No athletes assigned</td></tr>
                              )}
                            </tbody>
                          </table>

                          {/* Priority tracking + judge info */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                            <div className="priority-section">
                              <span className="mono" style={{ fontSize: 8, color: '#94A3B8', letterSpacing: '0.1em', fontWeight: 700 }}>PRIORITY</span>
                              {athletes.map((a, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span className="jersey" style={{ width: 8, height: 8, background: JERSEY_HEX[(a.jersey_color as string)] || '#94A3B8', border: (a.jersey_color as string) === 'white' ? '1px solid #CBD5E1' : 'none' }} />
                                  <div className="priority-box">P{i + 1}</div>
                                </div>
                              ))}
                            </div>
                            {judges.length > 0 && (
                              <div className="judges-section" style={{ border: 'none', padding: 0 }}>
                                {judges.map((j, i) => (
                                  <span key={i} className={`judge-tag ${(j.is_head_judge as boolean) ? 'judge-tag-head' : ''}`}>
                                    {(j.is_head_judge as boolean) ? 'HJ' : `J${j.position as number}`}: {((j.judge as any)?.name || 'TBD')}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* QR codes for judges */}
                          {judges.length > 0 && (
                            <div className="qr-section">
                              {judges.map((j, i) => {
                                const judgeData = j.judge as any
                                const qrUrl = `https://bsa.surf/judge?pin=${judgeData?.pin || ''}&heat_id=${heat.id}`
                                return (
                                  <div key={i} className="qr-item">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(qrUrl)}`} alt="QR" />
                                    <span>{(j.is_head_judge as boolean) ? 'HJ' : `J${j.position as number}`}: {judgeData?.name}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          <div className="isa-footer">
                            <span>ISA {panelSize}-Judge Panel — Drop High/Low — Best {bestOf} Waves</span>
                            <span>Head Judge Signature: _______________</span>
                          </div>
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
