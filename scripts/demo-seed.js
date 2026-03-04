#!/usr/bin/env node
/**
 * BSA Compete — Demo Heat Seed
 * 
 * Creates a self-contained demo event with a live heat, 4 athletes,
 * priority established, and scores in progress.
 * 
 * Usage:
 *   node scripts/demo-seed.js          # seed demo data
 *   node scripts/demo-seed.js --clean  # remove all demo data
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://veggfcumdveuoumrblcn.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZ2dmY3VtZHZldW91bXJibGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjEyMzkxNSwiZXhwIjoyMDg3Njk5OTE1fQ.Uuc0omewZgBAejINDCDsrVx2Lr-ksxIF2i-kiyLRw9Y'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Fixed UUIDs — all start with "de000000-0000-" so they're easy to find
const IDS = {
  event:     'de000000-0000-0000-0000-000000000001',
  division:  'de000000-0000-0000-0000-000000000002',
  evtDiv:    'de000000-0000-0000-0000-000000000003',
  round:     'de000000-0000-0000-0000-000000000004',
  heat:      'de000000-0000-0000-0000-000000000005',
  athlete1:  'de000000-0000-0000-0000-000000000011',
  athlete2:  'de000000-0000-0000-0000-000000000012',
  athlete3:  'de000000-0000-0000-0000-000000000013',
  athlete4:  'de000000-0000-0000-0000-000000000014',
  ha1:       'de000000-0000-0000-0000-000000000021',
  ha2:       'de000000-0000-0000-0000-000000000022',
  ha3:       'de000000-0000-0000-0000-000000000023',
  ha4:       'de000000-0000-0000-0000-000000000024',
  judge1:    'de000000-0000-0000-0000-000000000031',
  judge2:    'de000000-0000-0000-0000-000000000032',
  judge3:    'de000000-0000-0000-0000-000000000033',
  interf1:   'de000000-0000-0000-0000-000000000041',
}

const SEASON_ID = '9548a85a-3657-43dd-9458-f3947a5152f8'
const ALL_IDS = Object.values(IDS)

const athletes = [
  { id: IDS.athlete1, ha: IDS.ha1, name: 'Demo Red',    jersey: 'red',    seed: 1 },
  { id: IDS.athlete2, ha: IDS.ha2, name: 'Demo Blue',   jersey: 'blue',   seed: 2 },
  { id: IDS.athlete3, ha: IDS.ha3, name: 'Demo White',  jersey: 'white',  seed: 3 },
  { id: IDS.athlete4, ha: IDS.ha4, name: 'Demo Yellow', jersey: 'yellow', seed: 4 },
]

async function clean() {
  console.log('🧹 Cleaning demo data...')
  
  // Delete by known IDs in FK order
  const ops = [
    ['comp_interference', IDS.interf1],
    ['comp_heat_athletes', [IDS.ha1, IDS.ha2, IDS.ha3, IDS.ha4]],
    ['comp_heats', IDS.heat],
    ['comp_rounds', IDS.round],
    ['comp_event_divisions', IDS.evtDiv],
    ['comp_events', IDS.event],
    ['comp_divisions', IDS.division],
    ['athletes', [IDS.athlete1, IDS.athlete2, IDS.athlete3, IDS.athlete4]],
    ['comp_judges', [IDS.judge1, IDS.judge2, IDS.judge3]],
  ]
  
  for (const [table, ids] of ops) {
    const idList = Array.isArray(ids) ? ids : [ids]
    const { error } = await supabase.from(table).delete().in('id', idList)
    if (error) console.log(`  ⚠️  ${table}: ${error.message}`)
    else console.log(`  ✅ ${table}`)
  }
  
  console.log('\n✨ Demo data cleaned!')
}

async function seed() {
  console.log('🌱 Seeding demo data...\n')
  await clean()
  console.log('')
  
  // 1. Division
  let { error } = await supabase.from('comp_divisions').insert({
    id: IDS.division, name: 'DEMO Open', short_name: 'DM', sort_order: 99, active: true,
  })
  if (error) throw err('Division', error)
  console.log('✅ Division: DEMO Open')
  
  // 2. Event  
  ;({ error } = await supabase.from('comp_events').insert({
    id: IDS.event, season_id: SEASON_ID,
    name: '🧪 DEMO EVENT — DELETE ME',
    location: 'Demo Beach',
    event_date: new Date().toISOString().split('T')[0],
    status: 'active',
  }))
  if (error) throw err('Event', error)
  console.log('✅ Event: DEMO EVENT')
  
  // 3. Event Division
  ;({ error } = await supabase.from('comp_event_divisions').insert({
    id: IDS.evtDiv, event_id: IDS.event, division_id: IDS.division,
    panel_size: 3, drop_high_low: false, scoring_best_of: 2,
  }))
  if (error) throw err('EventDiv', error)
  console.log('✅ Event Division')
  
  // 4. Round
  ;({ error } = await supabase.from('comp_rounds').insert({
    id: IDS.round, event_division_id: IDS.evtDiv,
    round_number: 1, name: 'Round 1', status: 'active',
  }))
  if (error) throw err('Round', error)
  console.log('✅ Round 1')
  
  // 5. Heat — LIVE, started 8 min ago
  const heatStart = new Date(Date.now() - 8 * 60 * 1000)
  ;({ error } = await supabase.from('comp_heats').insert({
    id: IDS.heat, round_id: IDS.round, heat_number: 1,
    status: 'live', duration_minutes: 20,
    actual_start: heatStart.toISOString(),
    priority_established: true,
    priority_order: [IDS.ha2, IDS.ha1, IDS.ha4, IDS.ha3],
    priority_riders: [IDS.ha1, IDS.ha2, IDS.ha3, IDS.ha4],
  }))
  if (error) throw err('Heat', error)
  console.log('✅ Heat 1 — LIVE (12 min remaining)')
  
  // 6. Athletes
  for (const a of athletes) {
    ;({ error } = await supabase.from('athletes').insert({
      id: a.id, name: a.name, gender: 'male', active: true,
    }))
    if (error) throw err(`Athlete ${a.name}`, error)
  }
  console.log('✅ 4 Demo Athletes')
  
  // 7. Heat Athletes
  const haData = [
    { a: athletes[0], wave_count: 4, total_score: 13.50, needs_score: null,  has_priority: false, pri_status: 'active', pri_pos: 2, penalty: 'none', result: 1 },
    { a: athletes[1], wave_count: 3, total_score: 12.75, needs_score: 0.76,  has_priority: true,  pri_status: 'active', pri_pos: 1, penalty: 'none', result: 2 },
    { a: athletes[2], wave_count: 2, total_score: 9.20,  needs_score: 4.31,  has_priority: false, pri_status: 'active', pri_pos: 4, penalty: 'none', result: 3 },
    { a: athletes[3], wave_count: 3, total_score: 8.40,  needs_score: 5.11,  has_priority: false, pri_status: 'active', pri_pos: 3, penalty: 'interference_half', result: 4 },
  ]
  
  for (const h of haData) {
    ;({ error } = await supabase.from('comp_heat_athletes').insert({
      id: h.a.ha, heat_id: IDS.heat, athlete_id: h.a.id,
      athlete_name: h.a.name, jersey_color: h.a.jersey,
      seed_position: h.a.seed, wave_count: h.wave_count,
      total_score: h.total_score, needs_score: h.needs_score,
      has_priority: h.has_priority,
      priority_status: h.pri_status, priority_position: h.pri_pos,
      penalty: h.penalty, is_disqualified: false,
      result_position: h.result,
    }))
    if (error) throw err(`HA ${h.a.name}`, error)
  }
  console.log('✅ 4 Heat Athletes (scores + priority + interference)')
  
  // 8. Judges
  for (const [id, name] of [[IDS.judge1, 'Demo Judge 1'], [IDS.judge2, 'Demo Judge 2'], [IDS.judge3, 'Demo Judge 3']]) {
    ;({ error } = await supabase.from('comp_judges').insert({ id, name, pin: '0000', active: true }))
    if (error) throw err(`Judge ${name}`, error)
  }
  console.log('✅ 3 Demo Judges')
  
  // 9. Interference on Yellow
  ;({ error } = await supabase.from('comp_interference').insert({
    id: IDS.interf1, heat_id: IDS.heat,
    athlete_id: IDS.ha4, interfered_athlete_id: IDS.ha2,
    called_by: IDS.judge1, wave_number: 2,
    penalty_type: 'interference',
  }))
  if (error) console.log(`  ⚠️  Interference: ${error.message}`)
  else console.log('✅ Interference on Demo Yellow')
  
  console.log('\n' + '═'.repeat(50))
  console.log('🎉 DEMO DATA READY')
  console.log('═'.repeat(50))
  console.log(`\n  Heat ID:    ${IDS.heat}`)
  console.log(`\n  Athletes:`)
  console.log(`    🔴 Red    → ${IDS.ha1}  (P2, leading 13.50)`)
  console.log(`    🔵 Blue   → ${IDS.ha2}  (P1, 12.75, needs 0.76)`)
  console.log(`    ⚪ White  → ${IDS.ha3}  (P4, 9.20, needs 4.31)`)
  console.log(`    🟡 Yellow → ${IDS.ha4}  (P3, 8.40, interference!)`)
  console.log(`\n  Watch: enter heat ID + athlete ID → Go`)
  console.log(`  Clean: node scripts/demo-seed.js --clean\n`)
}

function err(label, e) { return new Error(`${label}: ${e.message}`) }

;(process.argv.includes('--clean') ? clean() : seed()).catch(e => {
  console.error('❌', e.message)
  process.exit(1)
})
