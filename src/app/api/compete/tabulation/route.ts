import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/compete/tabulation?heat_id=xxx
 * Returns full ISA tabulation data for a heat
 * Used by printable tabulation sheet
 */
export async function GET(request: NextRequest) {
  const heatId = request.nextUrl.searchParams.get('heat_id')
  if (!heatId) return NextResponse.json({ error: 'heat_id required' }, { status: 400 })

  // Get heat + round + division + event info
  const { data: heat } = await supabase
    .from('comp_heats')
    .select(`
      id, heat_number, status, duration_minutes, actual_start, actual_end, certified, certified_at, priority_order,
      round:comp_rounds(
        name, round_number,
        event_division:comp_event_divisions(
          panel_size, drop_high_low, scoring_best_of,
          division:comp_divisions(name),
          event:comp_events(name, location, event_date)
        )
      )
    `)
    .eq('id', heatId)
    .single()

  if (!heat) return NextResponse.json({ error: 'Heat not found' }, { status: 404 })

  const round = heat.round as any
  const ed = round?.event_division
  const div = ed?.division
  const ev = ed?.event

  // Get assigned judges
  const { data: judges } = await supabase
    .from('comp_heat_judges')
    .select('judge_id, position, is_head_judge, judge:comp_judges(name)')
    .eq('heat_id', heatId)
    .order('position')

  // Get athletes
  const { data: athletes } = await supabase
    .from('comp_heat_athletes')
    .select('id, athlete_name, jersey_color, result_position, total_score, penalty, penalty_wave')
    .eq('heat_id', heatId)
    .order('result_position')

  if (!athletes) return NextResponse.json({ error: 'No athletes' }, { status: 404 })

  // Get ALL judge scores
  const athleteIds = athletes.map(a => a.id)
  const { data: allScores } = await supabase
    .from('comp_judge_scores')
    .select('heat_athlete_id, wave_number, judge_id, score, is_override')
    .in('heat_athlete_id', athleteIds)
    .order('wave_number')

  // Get averaged wave scores
  const { data: waveScores } = await supabase
    .from('comp_wave_scores')
    .select('heat_athlete_id, wave_number, score')
    .in('heat_athlete_id', athleteIds)
    .order('wave_number')

  // Get interferences
  const { data: interferences } = await supabase
    .from('comp_interference')
    .select('athlete_id, wave_number, penalty_type, notes')
    .eq('heat_id', heatId)

  // Structure tabulation data
  const scoringJudges = (judges || []).filter(j => !j.is_head_judge)
  const headJudge = (judges || []).find(j => j.is_head_judge)

  const tabulation = athletes.map(a => {
    const myScores = (allScores || []).filter(s => s.heat_athlete_id === a.id)
    const myWaves = (waveScores || []).filter(s => s.heat_athlete_id === a.id)
    const myInterferences = (interferences || []).filter(i => i.athlete_id === a.id)

    // Group by wave
    const maxWave = Math.max(0, ...myScores.map(s => s.wave_number), ...myWaves.map(w => w.wave_number))
    const waves = []
    for (let w = 1; w <= maxWave; w++) {
      const judgeScoresForWave = scoringJudges.map(j => {
        const score = myScores.find(s => s.wave_number === w && s.judge_id === j.judge_id)
        return { position: j.position, score: score ? Number(score.score) : null, is_override: score?.is_override || false }
      })
      const averaged = myWaves.find(ws => ws.wave_number === w)
      const interference = myInterferences.find(i => i.wave_number === w)

      waves.push({
        wave_number: w,
        judge_scores: judgeScoresForWave,
        averaged_score: averaged ? Number(averaged.score) : null,
        interference: interference ? { type: interference.penalty_type, notes: interference.notes } : null,
      })
    }

    // Best waves
    const avgScores = waves.filter(w => w.averaged_score !== null).map(w => ({ wave: w.wave_number, score: w.averaged_score! }))
    avgScores.sort((a, b) => b.score - a.score)
    const bestOf = ed?.scoring_best_of || 2
    const counting = avgScores.slice(0, bestOf)

    return {
      athlete_name: a.athlete_name,
      jersey_color: a.jersey_color,
      position: a.result_position,
      total_score: Number(a.total_score),
      penalty: a.penalty,
      waves,
      counting_waves: counting.map(c => c.wave),
    }
  })

  return NextResponse.json({
    event_name: ev?.name || '',
    event_date: ev?.event_date || '',
    location: ev?.location || '',
    division: div?.name || '',
    round: round?.name || '',
    heat_number: heat.heat_number,
    duration_minutes: heat.duration_minutes,
    start_time: heat.actual_start,
    end_time: heat.actual_end,
    certified: heat.certified,
    certified_at: heat.certified_at,
    panel_size: ed?.panel_size || 5,
    scoring_best_of: ed?.scoring_best_of || 2,
    judges: scoringJudges.map(j => ({ position: j.position, name: (j.judge as any)?.name || 'Unknown' })),
    head_judge: headJudge ? (headJudge.judge as any)?.name || 'Unknown' : null,
    athletes: tabulation,
  })
}
