import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
export const revalidate = 300

export const metadata: Metadata = {
  title: 'Competition Results — BSA',
  description: 'Full results from Barbados Surfing Association competitions.',
}

export default async function ResultsPage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('comp_events')
    .select('id, name, event_date, end_date, location, status, season_id, comp_seasons(name, year)')
    .in('status', ['complete'])
    .order('event_date', { ascending: false })

  const completed = (events || []).filter(e => e.status === 'complete')

  // If only one completed event, go straight to it
  if (completed.length === 1) {
    redirect(`/results/${completed[0].id}`)
  }

  // Multiple events — show list with division winners preview
  const eventPreviews = await Promise.all(
    completed.map(async (event) => {
      // Get finalists (1st place per division)
      const { data: seasonPoints } = await supabase
        .from('comp_season_points')
        .select('athlete_id, points, placing, comp_divisions(name)')
        .eq('event_id', event.id)
        .eq('placing', 1)
        .order('points', { ascending: false })

      return {
        ...event,
        winners: (seasonPoints || []).map((sp: any) => ({
          division: sp.comp_divisions?.name || '',
          points: sp.points,
        })),
      }
    })
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '6rem 1rem 4rem' }}>
      <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, color: '#0A2540', textAlign: 'center', fontFamily: 'Space Grotesk, sans-serif' }}>
        Competition Results
      </h1>
      <p style={{ textAlign: 'center', color: 'rgba(10,37,64,0.5)', marginBottom: '2rem', fontSize: 14 }}>
        Full heat-by-heat results from BSA competitions
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {eventPreviews.map(event => {
          const season = event.comp_seasons as any
          const date = new Date(event.event_date + 'T12:00:00')
          return (
            <Link key={event.id} href={`/results/${event.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '20px 24px',
                borderRadius: 12,
                border: '1px solid rgba(10,37,64,0.08)',
                background: 'rgba(10,37,64,0.02)',
                transition: 'all 0.2s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#0A2540', fontFamily: 'Space Grotesk, sans-serif' }}>{event.name}</div>
                    <div style={{ fontSize: 13, color: 'rgba(10,37,64,0.5)', marginTop: 2 }}>
                      {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {event.location}
                    </div>
                    {season && <div style={{ fontSize: 12, color: '#2BA5A0', fontWeight: 600, marginTop: 2 }}>{season.name}</div>}
                  </div>
                  <span style={{ color: '#2BA5A0', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>View Full Results →</span>
                </div>
                {event.winners.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    {event.winners.slice(0, 6).map((w, i) => (
                      <span key={i} style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: 'rgba(43,165,160,0.08)',
                        color: '#2BA5A0',
                        fontWeight: 600,
                      }}>
                        🥇 {w.division}
                      </span>
                    ))}
                    {event.winners.length > 6 && (
                      <span style={{ fontSize: 11, color: 'rgba(10,37,64,0.3)' }}>+{event.winners.length - 6} more</span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
        {completed.length === 0 && (
          <p style={{ textAlign: 'center', color: 'rgba(10,37,64,0.4)', padding: '2rem 0' }}>
            No completed events yet.
          </p>
        )}
      </div>
    </div>
  )
}
