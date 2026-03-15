import { createClient } from '@/lib/supabase/server'
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
    .select('id, name, event_date, end_date, location, status, comp_seasons(name, year)')
    .in('status', ['complete', 'active'])
    .order('event_date', { ascending: false })

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '6rem 1rem 4rem' }}>
      <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, color: '#0A2540', textAlign: 'center', fontFamily: 'Space Grotesk, sans-serif' }}>
        Competition Results
      </h1>
      <p style={{ textAlign: 'center', color: 'rgba(10,37,64,0.5)', marginBottom: '2rem', fontSize: 14 }}>
        Full heat-by-heat results from BSA competitions
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(events || []).filter(e => e.status === 'complete').map(event => {
          const season = event.comp_seasons as any
          const date = new Date(event.event_date + 'T12:00:00')
          return (
            <Link key={event.id} href={`/results/${event.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '16px 20px',
                borderRadius: 12,
                border: '1px solid rgba(10,37,64,0.08)',
                background: 'rgba(10,37,64,0.02)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s',
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0A2540' }}>{event.name}</div>
                  <div style={{ fontSize: 13, color: 'rgba(10,37,64,0.5)', marginTop: 2 }}>
                    {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {event.location}
                  </div>
                  {season && <div style={{ fontSize: 12, color: '#2BA5A0', fontWeight: 600, marginTop: 2 }}>{season.name}</div>}
                </div>
                <span style={{ color: '#2BA5A0', fontWeight: 700, fontSize: 14 }}>View →</span>
              </div>
            </Link>
          )
        })}
        {(!events || events.filter(e => e.status === 'complete').length === 0) && (
          <p style={{ textAlign: 'center', color: 'rgba(10,37,64,0.4)', padding: '2rem 0' }}>
            No completed events yet.
          </p>
        )}
      </div>
    </div>
  )
}
