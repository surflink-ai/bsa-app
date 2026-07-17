import { createClient } from '@supabase/supabase-js'
import { requireServiceRole } from './_supabase'
import { bestNTotal } from '../src/lib/scoring'

const { url, key } = requireServiceRole()
const supabase = createClient(url, key)

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
    
    // Best 2 waves (ISA standard) — shared, unit-tested helper
    const scores = waves.map(w => w.score as number | null)
    const total = bestNTotal(scores)
    
    const { error: updateErr } = await supabase
      .from('comp_heat_athletes')
      .update({ total_score: total, wave_count: waves.length })
      .eq('id', ha.id)
    
    if (!updateErr) {
      updated++
      if (total > 0) console.log(`  ${ha.athlete_name}: ${total} (${waves.length} waves)`)
    }
  }
  
  console.log(`\n✅ Updated ${updated}/${has.length} heat athletes with computed totals`)
}

fixHeatTotals().catch(console.error)
