import { createClient } from '@/lib/supabase/server'
import { ResultsClient } from './ResultsClient'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
export const revalidate = 300

interface Division {
  id: string
  name: string
  shortName: string
  sortOrder: number
  finals: Finalist[]
  rounds: Round[]
}
interface Finalist { place: number; athleteId: string; name: string; total: number; waveScores: number[] }
interface Round { id: string; name: string; roundNumber: number; heats: Heat[] }
interface Heat { id: string; heatNumber: number; athletes: HeatAthlete[] }
interface HeatAthlete { athleteId: string; name: string; jerseyColor: string | null; resultPosition: number | null; totalScore: number | null; advanced: boolean; waveScores: number[] }

export async function generateMetadata({ params }: { params: Promise<{ eventId: string }> }): Promise<Metadata> {
  const { eventId } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('comp_events').select('name').eq('id', eventId).single()
  if (!event) return { title: 'Results — BSA' }
  return {
    title: `${event.name} Results — BSA`,
    description: `Full results for ${event.name} — Barbados Surfing Association.`,
  }
}

export default async function EventResultsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const supabase = await createClient()

  // Get event
  const { data: event } = await supabase
    .from('comp_events')
    .select('id, name, event_date, end_date, location, status, season_id')
    .eq('id', eventId)
    .single()
  if (!event) notFound()

  // Get season info
  const { data: season } = await supabase
    .from('comp_seasons')
    .select('name, year, points_system')
    .eq('id', event.season_id)
    .single()

  // Get event divisions with division info
  const { data: eventDivisions } = await supabase
    .from('comp_event_divisions')
    .select('id, division_id, comp_divisions(name, short_name, sort_order)')
    .eq('event_id', eventId)
    .order('division_id')

  if (!eventDivisions || eventDivisions.length === 0) notFound()

  const divisions: Division[] = []

  for (const ed of eventDivisions) {
    const div = ed.comp_divisions as any
    if (!div) continue

    // Get rounds for this event division
    const { data: rounds } = await supabase
      .from('comp_rounds')
      .select('id, name, round_number')
      .eq('event_division_id', ed.id)
      .order('round_number')

    const roundsData: Round[] = []
    let finalists: Finalist[] = []

    for (const round of rounds || []) {
      // Get heats for this round
      const { data: heats } = await supabase
        .from('comp_heats')
        .select('id, heat_number')
        .eq('round_id', round.id)
        .order('heat_number')

      const heatsData: Heat[] = []

      for (const heat of heats || []) {
        // Get heat athletes
        const { data: heatAthletes } = await supabase
          .from('comp_heat_athletes')
          .select('athlete_id, athlete_name, jersey_color, result_position, total_score, advanced')
          .eq('heat_id', heat.id)
          .order('result_position', { ascending: true, nullsFirst: false })

        // Get wave scores for each athlete
        const athletes: HeatAthlete[] = []
        for (const ha of heatAthletes || []) {
          const { data: waves } = await supabase
            .from('comp_wave_scores')
            .select('wave_number, score')
            .eq('heat_athlete_id', `${heat.id}`) // Need the heat_athlete join id
            .order('wave_number')

          // Actually get heat_athlete id first
          const { data: haRecord } = await supabase
            .from('comp_heat_athletes')
            .select('id')
            .eq('heat_id', heat.id)
            .eq('athlete_id', ha.athlete_id)
            .single()

          let waveScores: number[] = []
          if (haRecord) {
            const { data: ws } = await supabase
              .from('comp_wave_scores')
              .select('wave_number, score')
              .eq('heat_athlete_id', haRecord.id)
              .order('wave_number')
            waveScores = (ws || []).map(w => w.score)
          }

          athletes.push({
            athleteId: ha.athlete_id,
            name: ha.athlete_name,
            jerseyColor: ha.jersey_color,
            resultPosition: ha.result_position,
            totalScore: ha.total_score,
            advanced: ha.advanced || false,
            waveScores,
          })
        }

        heatsData.push({ id: heat.id, heatNumber: heat.heat_number, athletes })
      }

      roundsData.push({ id: round.id, name: round.name, roundNumber: round.round_number, heats: heatsData })

      // The last round is the final — extract finalists
      if (round.name.toLowerCase().includes('final') && !round.name.toLowerCase().includes('semi') && !round.name.toLowerCase().includes('quarter')) {
        for (const heat of heatsData) {
          for (const a of heat.athletes) {
            if (a.resultPosition) {
              finalists.push({
                place: a.resultPosition,
                athleteId: a.athleteId,
                name: a.name,
                total: a.totalScore || 0,
                waveScores: a.waveScores,
              })
            }
          }
        }
        finalists.sort((a, b) => a.place - b.place)
      }
    }

    divisions.push({
      id: ed.id,
      name: div.name,
      shortName: div.short_name || div.name,
      sortOrder: div.sort_order || 0,
      finals: finalists,
      rounds: roundsData,
    })
  }

  divisions.sort((a, b) => a.sortOrder - b.sortOrder)

  // Get season points for this event
  const { data: seasonPoints } = await supabase
    .from('comp_season_points')
    .select('athlete_id, division_id, total_points, events_counted, best_result, athletes(name)')
    .eq('season_id', event.season_id)

  return (
    <ResultsClient
      event={{ name: event.name, date: event.event_date, endDate: event.end_date, location: event.location, status: event.status }}
      season={season ? { name: season.name, year: season.year, points: season.points_system as Record<string, number> } : null}
      divisions={divisions}
      seasonPoints={(seasonPoints || []).map(sp => ({
        athleteId: sp.athlete_id,
        name: (sp.athletes as any)?.name || '',
        divisionId: sp.division_id,
        totalPoints: sp.total_points,
        bestResult: sp.best_result,
      }))}
    />
  )
}
