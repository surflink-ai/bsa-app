#!/usr/bin/env node
/**
 * BSA Compete — Full Demo Seed
 * 
 * Creates a complete demo environment for end-to-end testing:
 * - 1 event, 1 division, 1 round, 2 heats
 * - Heat 1: LIVE (just started, no scores, priority establishing)
 * - Heat 2: UPCOMING (next heat, ready to go)
 * - 8 athletes across 2 heats (4 per heat)
 * - 3 judges assigned to both heats (1 head + 2 scoring)
 * 
 * Test flow:
 *   1. bsa.surf/judge → PIN 1111 (head judge) or 2222/3333 (judges)
 *   2. Score waves for each athlete
 *   3. bsa.surf/judge/head → PIN 1111 → manage priority, interference
 *   4. bsa.surf/events/DEMO_EVENT_ID/live → watch scores update
 *   5. Watch app → select Heat 1 → tap athlete name → see priority
 * 
 * Usage:
 *   node scripts/demo-seed.js          # seed
 *   node scripts/demo-seed.js --clean  # remove all demo data
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://veggfcumdveuoumrblcn.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZ2dmY3VtZHZldW91bXJibGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjEyMzkxNSwiZXhwIjoyMDg3Njk5OTE1fQ.Uuc0omewZgBAejINDCDsrVx2Lr-ksxIF2i-kiyLRw9Y'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const SEASON_ID = '9548a85a-3657-43dd-9458-f3947a5152f8'

// All demo UUIDs use de______ prefix
const ID = {
  event:   'de000000-0000-0000-0000-000000000001',
  div:     'de000000-0000-0000-0000-000000000002',
  evtDiv:  'de000000-0000-0000-0000-000000000003',
  round:   'de000000-0000-0000-0000-000000000004',
  heat1:   'de000000-0000-0000-0000-000000000005',
  heat2:   'de000000-0000-0000-0000-000000000006',
  // Athletes (use real Bajan names for feel)
  ath1:    'de000000-0000-0000-0000-000000000011',
  ath2:    'de000000-0000-0000-0000-000000000012',
  ath3:    'de000000-0000-0000-0000-000000000013',
  ath4:    'de000000-0000-0000-0000-000000000014',
  ath5:    'de000000-0000-0000-0000-000000000015',
  ath6:    'de000000-0000-0000-0000-000000000016',
  ath7:    'de000000-0000-0000-0000-000000000017',
  ath8:    'de000000-0000-0000-0000-000000000018',
  // Heat athletes
  ha1:     'de000000-0000-0000-0000-000000000021',
  ha2:     'de000000-0000-0000-0000-000000000022',
  ha3:     'de000000-0000-0000-0000-000000000023',
  ha4:     'de000000-0000-0000-0000-000000000024',
  ha5:     'de000000-0000-0000-0000-000000000025',
  ha6:     'de000000-0000-0000-0000-000000000026',
  ha7:     'de000000-0000-0000-0000-000000000027',
  ha8:     'de000000-0000-0000-0000-000000000028',
  // Judges
  j1:      'de000000-0000-0000-0000-000000000031',
  j2:      'de000000-0000-0000-0000-000000000032',
  j3:      'de000000-0000-0000-0000-000000000033',
  // Heat judges
  hj1:     'de000000-0000-0000-0000-000000000051',
  hj2:     'de000000-0000-0000-0000-000000000052',
  hj3:     'de000000-0000-0000-0000-000000000053',
  hj4:     'de000000-0000-0000-0000-000000000054',
  hj5:     'de000000-0000-0000-0000-000000000055',
  hj6:     'de000000-0000-0000-0000-000000000056',
}

const ALL_IDS = Object.values(ID)

// Athletes — real sounding names
const athletes = [
  { id: ID.ath1, name: 'Zander Cole',    gender: 'male' },
  { id: ID.ath2, name: 'Kai Brathwaite', gender: 'male' },
  { id: ID.ath3, name: 'Remy Alleyne',   gender: 'male' },
  { id: ID.ath4, name: 'Josh Walcott',   gender: 'male' },
  { id: ID.ath5, name: 'Tyler Burke',    gender: 'male' },
  { id: ID.ath6, name: 'Marcus Hinds',   gender: 'male' },
  { id: ID.ath7, name: 'Dylan Chase',    gender: 'male' },
  { id: ID.ath8, name: 'Andre Gill',     gender: 'male' },
]

// Heat 1 athletes
const heat1Athletes = [
  { ath: athletes[0], ha: ID.ha1, jersey: 'red',    seed: 1 },
  { ath: athletes[1], ha: ID.ha2, jersey: 'blue',   seed: 2 },
  { ath: athletes[2], ha: ID.ha3, jersey: 'white',  seed: 3 },
  { ath: athletes[3], ha: ID.ha4, jersey: 'yellow', seed: 4 },
]

// Heat 2 athletes
const heat2Athletes = [
  { ath: athletes[4], ha: ID.ha5, jersey: 'red',    seed: 1 },
  { ath: athletes[5], ha: ID.ha6, jersey: 'blue',   seed: 2 },
  { ath: athletes[6], ha: ID.ha7, jersey: 'white',  seed: 3 },
  { ath: athletes[7], ha: ID.ha8, jersey: 'yellow', seed: 4 },
]

async function clean() {
  console.log('🧹 Cleaning all demo data...')
  
  // Delete in FK order by known IDs
  const ops = [
    ['comp_judge_scores', ALL_IDS],
    ['comp_wave_scores', ALL_IDS],
    ['comp_interference', ALL_IDS],
    ['comp_score_overrides', ALL_IDS],
    ['comp_heat_judges', [ID.hj1, ID.hj2, ID.hj3, ID.hj4, ID.hj5, ID.hj6]],
    ['comp_heat_athletes', [ID.ha1, ID.ha2, ID.ha3, ID.ha4, ID.ha5, ID.ha6, ID.ha7, ID.ha8]],
    ['comp_heats', [ID.heat1, ID.heat2]],
    ['comp_rounds', [ID.round]],
    ['comp_event_divisions', [ID.evtDiv]],
    ['comp_events', [ID.event]],
    ['comp_divisions', [ID.div]],
    ['athletes', [ID.ath1, ID.ath2, ID.ath3, ID.ath4, ID.ath5, ID.ath6, ID.ath7, ID.ath8]],
    ['comp_judges', [ID.j1, ID.j2, ID.j3]],
  ]
  
  for (const [table, ids] of ops) {
    const { error } = await supabase.from(table).delete().in('id', ids)
    if (error && !error.message.includes('0 rows')) {
      // Try heat_id for score tables
      const { error: e2 } = await supabase.from(table).delete().in('heat_id', [ID.heat1, ID.heat2])
      if (e2) console.log(`  ⚠️  ${table}: ${e2.message}`)
      else console.log(`  ✅ ${table}`)
    } else {
      console.log(`  ✅ ${table}`)
    }
  }
  console.log('\n✨ Clean!\n')
}

async function ins(table, data, label) {
  const { error } = await supabase.from(table).insert(data)
  if (error) throw new Error(`${label}: ${error.message}`)
  console.log(`  ✅ ${label}`)
}

async function seed() {
  console.log('🌱 BSA Compete — Full Demo Seed\n')
  await clean()
  
  // ─── Structure ───
  console.log('📋 Creating event structure...')
  
  await ins('comp_divisions', {
    id: ID.div, name: 'DEMO Open', short_name: 'DM', sort_order: 99, active: true
  }, 'Division')
  
  await ins('comp_events', {
    id: ID.event, season_id: SEASON_ID,
    name: '🧪 Demo Event — DELETE ME',
    location: 'Drill Hall, Barbados',
    event_date: new Date().toISOString().split('T')[0],
    status: 'active',
  }, 'Event')
  
  await ins('comp_event_divisions', {
    id: ID.evtDiv, event_id: ID.event, division_id: ID.div,
    panel_size: 3, drop_high_low: false, scoring_best_of: 2,
  }, 'Event Division (3 judges, best 2 waves)')
  
  await ins('comp_rounds', {
    id: ID.round, event_division_id: ID.evtDiv,
    round_number: 1, name: 'Round 1', status: 'active',
  }, 'Round 1')
  
  // ─── Heats ───
  console.log('\n🌊 Creating heats...')
  
  // Heat 1 — LIVE, just started (20 min timer)
  const now = new Date()
  await ins('comp_heats', {
    id: ID.heat1, round_id: ID.round, heat_number: 1,
    status: 'live', duration_minutes: 20,
    actual_start: now.toISOString(),
    priority_established: false,
    priority_order: [ID.ha1, ID.ha2, ID.ha3, ID.ha4],  // Initial seed order
    priority_riders: [],  // No one has ridden yet
  }, 'Heat 1 — LIVE (20:00 on the clock)')
  
  // Heat 2 — Upcoming
  await ins('comp_heats', {
    id: ID.heat2, round_id: ID.round, heat_number: 2,
    status: 'pending', duration_minutes: 20,
    priority_established: false,
    priority_order: [ID.ha5, ID.ha6, ID.ha7, ID.ha8],
    priority_riders: [],
  }, 'Heat 2 — UPCOMING')
  
  // ─── Athletes ───
  console.log('\n🏄 Creating athletes...')
  
  for (const a of athletes) {
    await ins('athletes', {
      id: a.id, name: a.name, gender: a.gender, active: true,
    }, a.name)
  }
  
  // ─── Heat Athletes ───
  console.log('\n🎽 Assigning athletes to heats...')
  
  for (const ha of [...heat1Athletes, ...heat2Athletes]) {
    const heatId = heat1Athletes.includes(ha) ? ID.heat1 : ID.heat2
    await ins('comp_heat_athletes', {
      id: ha.ha, heat_id: heatId, athlete_id: ha.ath.id,
      athlete_name: ha.ath.name, jersey_color: ha.jersey,
      seed_position: ha.seed,
      wave_count: 0, total_score: 0, needs_score: null,
      has_priority: false, priority_status: 'active',
      priority_position: ha.seed, penalty: 'none',
      is_disqualified: false,
    }, `${ha.jersey.toUpperCase().padEnd(7)} ${ha.ath.name}`)
  }
  
  // ─── Judges ───
  console.log('\n⚖️  Creating judges...')
  
  await ins('comp_judges', { id: ID.j1, name: 'Head Judge Adams', pin: '1111', role: 'head_judge', active: true }, 'Head Judge Adams (PIN: 1111)')
  await ins('comp_judges', { id: ID.j2, name: 'Judge Williams',   pin: '2222', role: 'judge',      active: true }, 'Judge Williams (PIN: 2222)')
  await ins('comp_judges', { id: ID.j3, name: 'Judge Thompson',   pin: '3333', role: 'judge',      active: true }, 'Judge Thompson (PIN: 3333)')
  
  // Assign judges to Heat 1
  console.log('\n📋 Assigning judges to heats...')
  
  await ins('comp_heat_judges', { id: ID.hj1, heat_id: ID.heat1, judge_id: ID.j1, position: 1, is_head_judge: true },  'Heat 1 ← Head Judge Adams')
  await ins('comp_heat_judges', { id: ID.hj2, heat_id: ID.heat1, judge_id: ID.j2, position: 2, is_head_judge: false }, 'Heat 1 ← Judge Williams')
  await ins('comp_heat_judges', { id: ID.hj3, heat_id: ID.heat1, judge_id: ID.j3, position: 3, is_head_judge: false }, 'Heat 1 ← Judge Thompson')
  
  // Assign judges to Heat 2 as well
  await ins('comp_heat_judges', { id: ID.hj4, heat_id: ID.heat2, judge_id: ID.j1, position: 1, is_head_judge: true },  'Heat 2 ← Head Judge Adams')
  await ins('comp_heat_judges', { id: ID.hj5, heat_id: ID.heat2, judge_id: ID.j2, position: 2, is_head_judge: false }, 'Heat 2 ← Judge Williams')
  await ins('comp_heat_judges', { id: ID.hj6, heat_id: ID.heat2, judge_id: ID.j3, position: 3, is_head_judge: false }, 'Heat 2 ← Judge Thompson')
  
  // ─── Done ───
  console.log('\n' + '═'.repeat(55))
  console.log('  🎉 FULL DEMO READY — BSA Compete v2')
  console.log('═'.repeat(55))
  
  console.log('\n  📱 JUDGE INTERFACE')
  console.log('  ─────────────────')
  console.log('  URL:  bsa.surf/judge')
  console.log('  Head: PIN 1111 (Head Judge Adams)')
  console.log('  J2:   PIN 2222 (Judge Williams)')
  console.log('  J3:   PIN 3333 (Judge Thompson)')
  
  console.log('\n  👨‍⚖️ HEAD JUDGE PANEL')
  console.log('  ─────────────────')
  console.log('  URL:  bsa.surf/judge/head')
  console.log('  PIN:  1111')
  console.log('  • Manage priority (wave ridden, suspend, block)')
  console.log('  • Call interference')
  console.log('  • Override scores')
  console.log('  • Certify heat results')
  
  console.log('\n  📺 LIVE RESULTS')
  console.log('  ─────────────────')
  console.log(`  URL:  bsa.surf/events/${ID.event}/live`)
  
  console.log('\n  ⌚ WATCH APP')
  console.log('  ─────────────────')
  console.log('  Open app → Heat 1 appears → Tap athlete name')
  
  console.log('\n  🌊 HEAT 1 — LIVE')
  console.log('  ─────────────────')
  heat1Athletes.forEach(ha => {
    const emoji = { red: '🔴', blue: '🔵', white: '⚪', yellow: '🟡' }[ha.jersey]
    console.log(`  ${emoji} ${ha.jersey.toUpperCase().padEnd(7)} ${ha.ath.name}`)
  })
  
  console.log('\n  🌊 HEAT 2 — UPCOMING')
  console.log('  ─────────────────')
  heat2Athletes.forEach(ha => {
    const emoji = { red: '🔴', blue: '🔵', white: '⚪', yellow: '🟡' }[ha.jersey]
    console.log(`  ${emoji} ${ha.jersey.toUpperCase().padEnd(7)} ${ha.ath.name}`)
  })
  
  console.log('\n  🧪 TEST FLOW')
  console.log('  ─────────────────')
  console.log('  1. Open 3 browser tabs: judge (2222), judge (3333), live results')
  console.log('  2. Open head judge panel in 4th tab (1111)')
  console.log('  3. Head judge: tap "Wave Ridden" on Red jersey → priority starts establishing')
  console.log('  4. Judges: score wave 1 for Red (e.g. 6.5, 7.0, 6.8)')
  console.log('  5. Watch live results update in real-time')
  console.log('  6. Repeat for other athletes')
  console.log('  7. Head judge: call interference on Yellow → penalty applied')
  console.log('  8. Head judge: certify heat → 15 min protest window')
  
  console.log(`\n  🗑️  Cleanup: node scripts/demo-seed.js --clean\n`)
}

;(process.argv.includes('--clean') ? clean() : seed()).catch(e => {
  console.error('\n❌', e.message)
  process.exit(1)
})
