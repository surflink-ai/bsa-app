import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Submit a wave score
export async function POST(req: NextRequest) {
  const { heat_athlete_id, wave_number, score, judge_id } = await req.json()

  if (!heat_athlete_id || !wave_number || score === undefined || score === null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (score < 0 || score > 10) {
    return NextResponse.json({ error: 'Score must be 0.0-10.0' }, { status: 400 })
  }

  // Verify judge exists and is active
  if (judge_id) {
    const { data: judge } = await supabase.from('comp_judges').select('id').eq('id', judge_id).eq('active', true).single()
    if (!judge) return NextResponse.json({ error: 'Invalid judge' }, { status: 401 })
  }

  // Upsert score (allows correction)
  const { data, error } = await supabase
    .from('comp_wave_scores')
    .upsert({
      heat_athlete_id,
      wave_number,
      score: parseFloat(score.toFixed(1)),
      judge_id: judge_id || null,
    }, { onConflict: 'heat_athlete_id,wave_number' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ score: data })
}

// Delete a wave score (head judge only)
export async function DELETE(req: NextRequest) {
  const { score_id, judge_id } = await req.json()

  if (judge_id) {
    const { data: judge } = await supabase.from('comp_judges').select('role').eq('id', judge_id).single()
    if (!judge || judge.role !== 'head_judge') {
      return NextResponse.json({ error: 'Head judge only' }, { status: 403 })
    }
  }

  await supabase.from('comp_wave_scores').delete().eq('id', score_id)
  return NextResponse.json({ ok: true })
}
