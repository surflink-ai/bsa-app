import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ResultsIndexClient } from './ResultsIndexClient'
export const revalidate = 300

export const metadata: Metadata = {
  title: 'Competition Results — BSA',
  description: 'Full results from all Barbados Surfing Association competitions.',
}

export default async function ResultsPage() {
  const supabase = await createClient()

  // Get all completed events
  const { data: events } = await supabase
    .from('comp_events')
    .select('id, name, event_date, end_date, location, status, season_id, comp_seasons(name, year)')
    .in('status', ['complete'])
    .order('event_date', { ascending: false })

  const completed = (events || []).filter(e => e.status === 'complete')

  // For each event, get division results (finalists)
  const eventResults = await Promise.all(
    completed.map(async (event) => {
      const season = event.comp_seasons as any

      // Get event divisions
      const { data: eventDivisions } = await supabase
        .from('comp_event_divisions')
        .select('id, division_id, comp_divisions(name, short_name, sort_order)')
        .eq('event_id', event.id)

      const divisions = await Promise.all(
        (eventDivisions || []).map(async (ed) => {
          const div = ed.comp_divisions as any
          if (!div) return null

          // Get final round for this division
          const { data: rounds } = await supabase
            .from('comp_rounds')
            .select('id, name')
            .eq('event_division_id', ed.id)
            .order('round_number', { ascending: false })
            .limit(1)

          const finalRound = rounds?.[0]
          if (!finalRound) return { name: div.name, shortName: div.short_name, sortOrder: div.sort_order, results: [] }

          // Get final heat athletes
          const { data: heats } = await supabase
            .from('comp_heats')
            .select('id')
            .eq('round_id', finalRound.id)

          const heatIds = (heats || []).map(h => h.id)
          if (heatIds.length === 0) return { name: div.name, shortName: div.short_name, sortOrder: div.sort_order, results: [] }

          const { data: athletes } = await supabase
            .from('comp_heat_athletes')
            .select('athlete_id, athlete_name, result_position, total_score, comp_wave_scores(score)')
            .in('heat_id', heatIds)
            .order('result_position', { ascending: true, nullsFirst: false })

          return {
            name: div.name,
            shortName: div.short_name,
            sortOrder: div.sort_order,
            results: (athletes || []).map((a: any) => ({
              athleteId: a.athlete_id,
              name: a.athlete_name,
              place: a.result_position,
              total: a.total_score || 0,
              waves: (a.comp_wave_scores || []).map((w: any) => w.score).sort((a: number, b: number) => b - a),
            })),
          }
        })
      )

      return {
        id: event.id,
        name: event.name,
        date: event.event_date,
        endDate: event.end_date,
        location: event.location,
        season: season ? { name: season.name, year: season.year } : null,
        divisions: divisions.filter(Boolean).sort((a: any, b: any) => a.sortOrder - b.sortOrder),
      }
    })
  )

  return <ResultsIndexClient events={eventResults as any} />
}
