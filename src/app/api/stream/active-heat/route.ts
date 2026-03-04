import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Returns the current live heat for stream overlay
export async function GET() {
  const { data: heats } = await supabase
    .from('comp_heats')
    .select(`
      id, heat_number, status,
      round:comp_rounds(
        name, round_number,
        event_division:comp_event_divisions(
          scoring_best_of,
          division:comp_divisions(name),
          event:comp_events(name)
        )
      ),
      priority_order,
      athletes:comp_heat_athletes(
        id, athlete_name, jersey_color, has_priority, penalty, total_score, needs_score,
        waves:comp_wave_scores(wave_number, score)
      )
    `)
    .eq('status', 'live')
    .limit(1)

  if (!heats || heats.length === 0) {
    return NextResponse.json({ active: false })
  }

  const h = heats[0]
  const round = h.round as unknown as Record<string, unknown>
  const ed = round?.event_division as unknown as Record<string, unknown>
  const div = ed?.division as unknown as Record<string, string>
  const ev = ed?.event as unknown as Record<string, string>
  const bestOf = (ed?.scoring_best_of as number) || 2

  const athletes = ((h.athletes || []) as unknown[]).map((a: unknown) => {
    const at = a as Record<string, unknown>
    const waves = ((at.waves || []) as { wave_number: number; score: number }[]).sort((x, y) => x.wave_number - y.wave_number)
    const topScores = [...waves].sort((x, y) => y.score - x.score).slice(0, bestOf)
    const cachedTotal = at.total_score as number
    const total = cachedTotal || topScores.reduce((s, w) => s + w.score, 0)
    return {
      id: at.id as string,
      name: at.athlete_name as string,
      jersey: at.jersey_color as string | null,
      priority: at.has_priority as boolean,
      penalty: (at.penalty as string) || 'none',
      needs: (at.needs_score as number) || null,
      waves: waves.map(w => w.score),
      bestWaves: topScores.map(w => w.score),
      total,
      position: 0,
    }
  }).sort((a, b) => b.total - a.total)

  athletes.forEach((a, i) => { a.position = i + 1 })

  return NextResponse.json({
    active: true,
    heat: {
      id: h.id,
      heatNumber: h.heat_number,
      roundName: round?.name || '',
      divisionName: div?.name || '',
      eventName: ev?.name || '',
      athletes,
    }
  })
}
