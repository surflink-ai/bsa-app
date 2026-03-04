import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const JERSEY_COLORS = ['red', 'blue', 'white', 'yellow', 'green', 'black', 'pink', 'orange']

function getRoundName(num: number, total: number): string {
  if (num === total) return 'Final'
  if (num === total - 1) return 'Semifinals'
  if (num === total - 2) return 'Quarterfinals'
  return `Round ${num}`
}

// Snake-seed athletes into heats for maximum seed separation
// E.g., 4 heats with 8 seeded athletes:
// Heat 1: seed 1, seed 8
// Heat 2: seed 2, seed 7
// Heat 3: seed 3, seed 6
// Heat 4: seed 4, seed 5
function snakeSeed(athletes: { name: string; id: string | null; seed: number }[], numHeats: number, perHeat: number): { name: string; id: string | null; seed: number; jersey: string }[][] {
  const heats: { name: string; id: string | null; seed: number; jersey: string }[][] = Array.from({ length: numHeats }, () => [])

  let heatIndex = 0
  let direction = 1 // 1 = forward, -1 = backward

  for (const athlete of athletes) {
    // Skip full heats
    while (heats[heatIndex].length >= perHeat) {
      heatIndex += direction
      if (heatIndex >= numHeats) { direction = -1; heatIndex = numHeats - 1 }
      if (heatIndex < 0) { direction = 1; heatIndex = 0 }
    }

    const jersey = JERSEY_COLORS[heats[heatIndex].length % JERSEY_COLORS.length]
    heats[heatIndex].push({ ...athlete, jersey })

    // Snake: alternate direction
    heatIndex += direction
    if (heatIndex >= numHeats) { direction = -1; heatIndex = numHeats - 1 }
    if (heatIndex < 0) { direction = 1; heatIndex = 0 }
  }

  return heats
}

// POST { event_division_id, athletes_per_heat?, preview? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event_division_id, athletes_per_heat = 4, preview = false } = body
    if (!event_division_id) return NextResponse.json({ error: 'event_division_id required' }, { status: 400 })

    // Get event division config
    const { data: ed } = await supabase
      .from('comp_event_divisions')
      .select('id, advances_per_heat, ride_time_minutes, max_athletes')
      .eq('id', event_division_id)
      .single()

    if (!ed) return NextResponse.json({ error: 'Division not found' }, { status: 404 })

    // Get registered + seeded athletes
    const { data: regs } = await supabase
      .from('comp_registrations')
      .select('id, athlete_name, athlete_id, seed_rank')
      .eq('event_division_id', event_division_id)
      .in('status', ['confirmed', 'registered', 'pending'])
      .order('seed_rank', { ascending: true, nullsFirst: false })

    if (!regs || regs.length === 0) {
      return NextResponse.json({ error: 'No registrations found. Register athletes first.' }, { status: 400 })
    }

    // Sort: seeded first (by seed_rank), then unseeded
    const seeded = regs.filter(r => r.seed_rank).sort((a, b) => (a.seed_rank || 999) - (b.seed_rank || 999))
    const unseeded = regs.filter(r => !r.seed_rank)
    // Shuffle unseeded
    for (let i = unseeded.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unseeded[i], unseeded[j]] = [unseeded[j], unseeded[i]]
    }
    const allAthletes = [...seeded, ...unseeded].map((r, i) => ({
      name: r.athlete_name,
      id: r.athlete_id,
      seed: r.seed_rank || (seeded.length + i + 1),
    }))

    const numAthletes = allAthletes.length
    const perHeat = athletes_per_heat

    // Calculate bracket structure
    let remaining = numAthletes
    const rounds: { name: string; heatCount: number }[] = []
    let roundNum = 1
    while (remaining > perHeat) {
      const heatsNeeded = Math.ceil(remaining / perHeat)
      rounds.push({ name: `Round ${roundNum}`, heatCount: heatsNeeded })
      remaining = heatsNeeded * ed.advances_per_heat
      roundNum++
    }
    rounds.push({ name: 'Final', heatCount: 1 })
    const totalRounds = rounds.length
    rounds.forEach((r, i) => { r.name = getRoundName(i + 1, totalRounds) })

    // Snake-seed athletes into Round 1 heats
    const r1Heats = snakeSeed(allAthletes, rounds[0].heatCount, perHeat)

    // Preview mode — return proposed draw without saving
    if (preview) {
      return NextResponse.json({
        preview: true,
        athletes: numAthletes,
        rounds: rounds.map(r => ({ name: r.name, heats: r.heatCount })),
        round1: r1Heats.map((heat, i) => ({
          heat: i + 1,
          athletes: heat.map(a => ({ name: a.name, seed: a.seed, jersey: a.jersey })),
        })),
      })
    }

    // Delete existing rounds/heats for this division (fresh draw)
    const { data: existingRounds } = await supabase
      .from('comp_rounds')
      .select('id')
      .eq('event_division_id', event_division_id)

    if (existingRounds && existingRounds.length > 0) {
      // Cascade will handle heats + heat_athletes + wave_scores
      await supabase
        .from('comp_rounds')
        .delete()
        .eq('event_division_id', event_division_id)
    }

    // Create rounds and heats
    for (let i = 0; i < rounds.length; i++) {
      const { data: round } = await supabase
        .from('comp_rounds')
        .insert({
          event_division_id,
          round_number: i + 1,
          name: rounds[i].name,
        })
        .select('id')
        .single()

      if (!round) continue

      // Create heats
      const heatInserts = Array.from({ length: rounds[i].heatCount }, (_, j) => ({
        round_id: round.id,
        heat_number: j + 1,
        duration_minutes: ed.ride_time_minutes,
      }))

      const { data: heats } = await supabase
        .from('comp_heats')
        .insert(heatInserts)
        .select('id, heat_number')

      // Only populate Round 1 heats with athletes
      if (i === 0 && heats) {
        for (const heat of heats) {
          const heatAthletes = r1Heats[heat.heat_number - 1]
          if (!heatAthletes) continue

          const athleteInserts = heatAthletes.map((a, idx) => ({
            heat_id: heat.id,
            athlete_id: a.id || null,
            athlete_name: a.name,
            jersey_color: a.jersey,
            seed_position: a.seed,
          }))

          await supabase.from('comp_heat_athletes').insert(athleteInserts)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Draw complete: ${numAthletes} athletes across ${rounds.length} rounds (${rounds[0].heatCount} R1 heats)`,
      athletes: numAthletes,
      rounds: rounds.map(r => ({ name: r.name, heats: r.heatCount })),
      round1: r1Heats.map((heat, i) => ({
        heat: i + 1,
        athletes: heat.map(a => ({ name: a.name, seed: a.seed, jersey: a.jersey })),
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
