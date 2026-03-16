import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://veggfcumdveuoumrblcn.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fixHeatTotals() {
  // Get all heat_athletes
  const { data: has, error } = await supabase
    .from('comp_heat_athletes')
    .select('id, athlete_name')
  
  if (error || !has) { console.error('Failed to fetch heat athletes:', error); return }
  
  console.log(`Processing ${has.length} heat athlete entries...`)
  let updated = 0
  
  for (const ha of has) {
    // Get wave scores for this heat athlete
    const { data: waves } = await supabase
      .from('comp_wave_scores')
      .select('score')
      .eq('heat_athlete_id', ha.id)
      .order('score', { ascending: false })
    
    if (!waves || waves.length === 0) continue
    
    // Best 2 waves (ISA standard)
    const scores = waves.map(w => w.score).filter(s => s != null).sort((a, b) => b - a)
    const best2 = scores.slice(0, 2).reduce((a, b) => a + b, 0)
    const total = Math.round(best2 * 100) / 100
    
    const { error: updateErr } = await supabase
      .from('comp_heat_athletes')
      .update({ total_score: total, wave_count: waves.length })
      .eq('id', ha.id)
    
    if (!updateErr) {
      updated++
      if (total > 0) console.log(`  ${ha.athlete_name}: ${total} (${waves.length} waves, best 2: ${scores.slice(0,2).join(' + ')})`)
    }
  }
  
  console.log(`\n✅ Updated ${updated}/${has.length} heat athletes with computed totals`)
}

fixHeatTotals().catch(console.error)
