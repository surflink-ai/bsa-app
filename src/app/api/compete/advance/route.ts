import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Auto-advance winners from a completed heat to the next round
export async function POST(req: NextRequest) {
  const { heat_id } = await req.json()
  if (!heat_id) return NextResponse.json({ error: 'heat_id required' }, { status: 400 })

  // Get heat + its round + division config
  const { data: heat } = await supabase
    .from('comp_heats')
    .select(`
      id, heat_number, status,
      round:comp_rounds(
        id, round_number, event_division_id,
        event_division:comp_event_divisions(advances_per_heat, scoring_best_of)
      ),
      athletes:comp_heat_athletes(
        id, athlete_name, jersey_color,
        waves:comp_wave_scores(score)
      )
    `)
    .eq('id', heat_id)
    .single()

  if (!heat) return NextResponse.json({ error: 'Heat not found' }, { status: 404 })
  if ((heat.status as string) !== 'complete') return NextResponse.json({ error: 'Heat must be complete to advance' }, { status: 400 })

  const round = heat.round as unknown as Record<string, unknown>
  const ed = round?.event_division as unknown as Record<string, unknown>
  const advancesPerHeat = (ed?.advances_per_heat as number) || 2
  const bestOf = (ed?.scoring_best_of as number) || 2
  const eventDivisionId = round?.event_division_id as string
  const currentRoundNumber = round?.round_number as number

  // Calculate final positions
  const athletes = ((heat.athletes || []) as unknown[]).map((a: unknown) => {
    const at = a as Record<string, unknown>
    const waves = ((at.waves || []) as { score: number }[])
    const topScores = [...waves].map(w => w.score).sort((a, b) => b - a).slice(0, bestOf)
    const total = topScores.reduce((s, v) => s + v, 0)
    return { id: at.id as string, athlete_name: at.athlete_name as string, jersey_color: at.jersey_color as string | null, total }
  }).sort((a, b) => b.total - a.total)

  // Update result positions and advanced status
  for (let i = 0; i < athletes.length; i++) {
    await supabase.from('comp_heat_athletes').update({
      result_position: i + 1,
      advanced: i < advancesPerHeat,
    }).eq('id', athletes[i].id)
  }

  // Find next round
  const { data: nextRound } = await supabase
    .from('comp_rounds')
    .select('id, round_number')
    .eq('event_division_id', eventDivisionId)
    .eq('round_number', currentRoundNumber + 1)
    .single()

  if (!nextRound) {
    // This was the final round — no advancement needed
    return NextResponse.json({ advanced: false, message: 'Final round — no next round', results: athletes.map((a, i) => ({ ...a, position: i + 1 })) })
  }

  // Get all heats in next round
  const { data: nextHeats } = await supabase
    .from('comp_heats')
    .select('id, heat_number')
    .eq('round_id', nextRound.id)
    .order('heat_number')

  if (!nextHeats || nextHeats.length === 0) {
    return NextResponse.json({ advanced: false, message: 'No heats in next round' })
  }

  // Check if ALL heats in current round are complete
  const { data: currentRoundHeats } = await supabase
    .from('comp_heats')
    .select('id, status')
    .eq('round_id', round?.id as string)

  const allComplete = currentRoundHeats?.every(h => h.status === 'complete')
  if (!allComplete) {
    return NextResponse.json({ advanced: false, message: 'Waiting for other heats in this round to complete', results: athletes.map((a, i) => ({ ...a, position: i + 1 })) })
  }

  // Get all advancing athletes from all heats in current round
  const { data: advancingAthletes } = await supabase
    .from('comp_heat_athletes')
    .select('athlete_name, jersey_color, seed_position')
    .in('heat_id', currentRoundHeats!.map(h => h.id))
    .eq('advanced', true)
    .order('seed_position')

  if (!advancingAthletes || advancingAthletes.length === 0) {
    return NextResponse.json({ advanced: false, message: 'No advancing athletes found' })
  }

  // Distribute athletes into next round heats (snake seeding)
  const JERSEY_COLORS = ['red', 'blue', 'white', 'yellow', 'green', 'black', 'pink', 'orange']
  const heatCount = nextHeats.length

  for (let i = 0; i < advancingAthletes.length; i++) {
    const heatIndex = i % heatCount
    const positionInHeat = Math.floor(i / heatCount)
    const a = advancingAthletes[i]

    await supabase.from('comp_heat_athletes').insert({
      heat_id: nextHeats[heatIndex].id,
      athlete_name: a.athlete_name,
      jersey_color: JERSEY_COLORS[positionInHeat % JERSEY_COLORS.length],
      seed_position: positionInHeat + 1,
    })
  }

  return NextResponse.json({
    advanced: true,
    message: `${advancingAthletes.length} athletes advanced to ${nextHeats.length} heats`,
    results: athletes.map((a, i) => ({ ...a, position: i + 1 })),
  })
}
