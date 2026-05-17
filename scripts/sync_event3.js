// Sync LiveHeats Event #3 → BSA Compete Supabase
// LiveHeats ID: 506069 (SOTY Championship Event #3 - Branden's - 2026)
// Recalculates cumulative season points: E1 + E2 + E3

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://veggfcumdveuoumrblcn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZ2dmY3VtZHZldW91bXJibGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjEyMzkxNSwiZXhwIjoyMDg3Njk5OTE1fQ.Uuc0omewZgBAejINDCDsrVx2Lr-ksxIF2i-kiyLRw9Y';
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const SEASON_ID = '9548a85a-3657-43dd-9458-f3947a5152f8';
const LH_EVENT_ID = '506069';
const EVENT_NAME = 'SOTY Championship Event #3 2026';
const EVENT_LOCATION = "Branden's, Barbados";
const EVENT_DATE_START = '2026-05-16';
const EVENT_DATE_END = '2026-05-17';

const POINTS = { 1: 1000, 2: 800, 3: 650, 4: 500, 5: 400, 6: 300, 7: 200, 8: 100 };

const DIV_MAP = {
  'Open Mens': 'c6f2ee52-73d5-4ba1-b246-603cc0c3037c',
  'Open Mens ': 'c6f2ee52-73d5-4ba1-b246-603cc0c3037c',
  'Open Womens': '10b9da46-7bf6-493d-a13e-6947809de670',
  'Under 18 Boys': '91adcb37-6891-4679-a675-ca1e518b660f',
  'Under 18 Girls': 'c4ebe80e-c365-4aaa-9f15-9b2bf4e8441f',
  'Under 16 Boys': '10628747-5c76-4353-9fc2-086fef0da1ec',
  'Under 14 Boys': '9e5d6a01-1f0b-49b7-98a3-d9fec20f2806',
  'Long Board Open': '5c13a29d-961d-4993-a19d-e0193f498e1b',
  'Grand Masters (over 40 years old)': 'f0ba772f-4aa1-4556-be4e-6e7c29aa752e',
  'Novis': 'abfee225-aaad-44f7-a74c-a7a95d390ce3',
};

const ROUND_MAP = { 'Round 1': 1, 'Round 2': 2, 'Round 3': 3, 'Quarterfinal': 4, 'Semifinal': 5, 'Final': 6 };

// Normalize sloppy LiveHeats name capitalization
function titleCase(name) {
  return name.split(' ').map(p => {
    if (!p) return p;
    if (p.length <= 2 && p.toLowerCase() !== p) return p; // keep "St", "Mc" alone
    return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
  }).join(' ');
}

async function fetchEvent(id) {
  const resp = await fetch('https://liveheats.com/api/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'https://liveheats.com' },
    body: JSON.stringify({
      query: `{ event(id: "${id}") { id name status eventDivisions { division { name } heats { round position startTime endTime result { place total competitor { athlete { id name } } } } } } }`
    })
  });
  const j = await resp.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data.event;
}

async function findOrCreateAthlete(lhId, rawName) {
  const lhIdStr = String(lhId);
  const name = titleCase(rawName);

  // Try by liveheats_id
  let { data: ath } = await sb.from('athletes').select('id, name').eq('liveheats_id', lhIdStr).maybeSingle();
  if (ath) return { id: ath.id, name: ath.name, created: false };

  // Try by liveheats_aliases
  const { data: byAlias } = await sb.from('athletes').select('id, name').contains('liveheats_aliases', [lhIdStr]).maybeSingle();
  if (byAlias) return { id: byAlias.id, name: byAlias.name, created: false };

  // Try by name match (case-insensitive)
  const { data: byName } = await sb.from('athletes').select('id, name, liveheats_id, liveheats_aliases')
    .ilike('name', name).maybeSingle();
  if (byName) {
    // Attach this LH id as an alias
    const aliases = byName.liveheats_aliases || [];
    if (!aliases.includes(lhIdStr) && byName.liveheats_id !== lhIdStr) {
      aliases.push(lhIdStr);
      await sb.from('athletes').update({ liveheats_aliases: aliases }).eq('id', byName.id);
    }
    return { id: byName.id, name: byName.name, created: false };
  }

  // Create
  const { data: created, error } = await sb.from('athletes').insert({
    name,
    liveheats_id: lhIdStr,
    nationality: 'Barbados',
    active: true,
  }).select().single();
  if (error) throw new Error(`Athlete create (${name}): ${error.message}`);
  return { id: created.id, name, created: true };
}

async function main() {
  console.log('=== BSA Event #3 Sync ===\n');

  // Pre-flight: delete any existing Event #3 (idempotent re-runs)
  const { data: existing } = await sb.from('comp_events')
    .select('id, name').ilike('name', '%Event #3%').eq('season_id', SEASON_ID);
  for (const e of (existing || [])) {
    console.log(`Removing stale Event #3 record: ${e.id} (${e.name})`);
    await sb.from('comp_events').delete().eq('id', e.id);
  }

  console.log('\nFetching LiveHeats event ' + LH_EVENT_ID + '...');
  const event = await fetchEvent(LH_EVENT_ID);
  console.log(`Loaded: ${event.name} (status: ${event.status})\n`);

  // Create event
  const { data: e3, error: evErr } = await sb.from('comp_events').insert({
    name: EVENT_NAME,
    event_date: EVENT_DATE_START,
    end_date: EVENT_DATE_END,
    location: EVENT_LOCATION,
    status: 'complete',
    season_id: SEASON_ID,
  }).select().single();
  if (evErr) { console.error('Event create error:', evErr.message); return; }
  console.log(`✅ Created Event #3: ${e3.id}\n`);
  const E3_ID = e3.id;

  // Track placements for season points calc
  const e3Placements = [];   // {division_id, athlete_id, athlete_name, place}
  const newAthletes = [];

  for (const div of event.eventDivisions) {
    const divName = div.division.name;
    const divId = DIV_MAP[divName] || DIV_MAP[divName.trim()];
    if (!divId) { console.log(`⚠️  SKIP unmapped division: "${divName}"`); continue; }

    console.log(`── ${divName.trim()} (${div.heats.length} heats)`);

    const { data: ed, error: edErr } = await sb.from('comp_event_divisions').insert({
      event_id: E3_ID,
      division_id: divId,
    }).select().single();
    if (edErr) { console.log('  ED error:', edErr.message); continue; }

    // Group heats by round
    const roundGroups = {};
    for (const h of div.heats) {
      if (!roundGroups[h.round]) roundGroups[h.round] = [];
      roundGroups[h.round].push(h);
    }

    for (const roundName of Object.keys(roundGroups)) {
      const roundHeats = roundGroups[roundName];
      const roundNum = ROUND_MAP[roundName] || 1;

      const { data: round, error: rErr } = await sb.from('comp_rounds').insert({
        event_division_id: ed.id,
        round_number: roundNum,
        name: roundName,
        format: 'standard',
        status: 'complete',
      }).select().single();
      if (rErr) { console.log(`  Round error (${roundName}):`, rErr.message); continue; }

      for (const h of roundHeats) {
        const heatNum = h.position + 1; // LH is 0-indexed
        const { data: heat, error: hErr } = await sb.from('comp_heats').insert({
          round_id: round.id,
          heat_number: heatNum,
          status: 'complete',
          actual_start: h.startTime,
          actual_end: h.endTime,
          duration_minutes: 20,
        }).select().single();
        if (hErr) { console.log('  Heat error:', hErr.message); continue; }

        const results = (h.result || []).sort((a, b) => a.place - b.place);
        const jerseys = ['red', 'blue', 'white', 'yellow', 'green', 'black', 'pink', 'orange'];

        for (let i = 0; i < results.length; i++) {
          const r = results[i];
          const ath = await findOrCreateAthlete(r.competitor.athlete.id, r.competitor.athlete.name);
          if (ath.created) newAthletes.push(ath.name);

          const advanced = roundName !== 'Final' && r.place <= 2;
          const { error: haErr } = await sb.from('comp_heat_athletes').insert({
            heat_id: heat.id,
            athlete_id: ath.id,
            athlete_name: ath.name,
            jersey_color: jerseys[i] || 'white',
            seed_position: i + 1,
            result_position: r.place,
            total_score: r.total,
            advanced,
            wave_count: 0,
          });
          if (haErr) console.log(`  HA error (${ath.name}):`, haErr.message);

          if (roundName === 'Final' && r.place) {
            e3Placements.push({
              division_id: divId,
              athlete_id: ath.id,
              athlete_name: ath.name,
              place: r.place,
            });
          }
        }
      }
    }
    console.log(`  ✅ ${divName.trim()} done`);
  }

  console.log('\n=== CUMULATIVE SEASON POINTS (E1+E2+E3) ===\n');

  // Get ALL past events for this season (excluding the one we just made? include — they're already in DB)
  const { data: seasonEvents } = await sb.from('comp_events')
    .select('id, name, event_date')
    .eq('season_id', SEASON_ID)
    .order('event_date');
  console.log(`Found ${seasonEvents.length} events this season:`);
  seasonEvents.forEach(e => console.log(`  • ${e.event_date}: ${e.name} (${e.id})`));

  // For each event, get final-round placements per division per athlete
  const eventIds = seasonEvents.map(e => e.id);

  const { data: eventDivs } = await sb.from('comp_event_divisions')
    .select('id, event_id, division_id')
    .in('event_id', eventIds);

  const edByEd = {};
  eventDivs.forEach(ed => { edByEd[ed.id] = ed; });

  const { data: rounds } = await sb.from('comp_rounds')
    .select('id, event_division_id, name')
    .in('event_division_id', eventDivs.map(ed => ed.id))
    .eq('name', 'Final');

  const finalRoundIds = rounds.map(r => r.id);

  const { data: heats } = await sb.from('comp_heats')
    .select('id, round_id')
    .in('round_id', finalRoundIds);

  const heatToRound = {};
  heats.forEach(h => { heatToRound[h.id] = h.round_id; });
  const roundToEd = {};
  rounds.forEach(r => { roundToEd[r.id] = r.event_division_id; });

  const { data: heatAthletes } = await sb.from('comp_heat_athletes')
    .select('athlete_id, athlete_name, result_position, heat_id')
    .in('heat_id', heats.map(h => h.id));

  // Aggregate: { divId: { athleteId: { name, totalPoints, bestPlace, eventsCounted } } }
  const standings = {};
  for (const ha of heatAthletes) {
    if (!ha.result_position || !ha.athlete_id) continue;
    const roundId = heatToRound[ha.heat_id];
    const edId = roundToEd[roundId];
    const ed = edByEd[edId];
    if (!ed) continue;

    const divId = ed.division_id;
    const points = POINTS[ha.result_position] || 0;

    if (!standings[divId]) standings[divId] = {};
    if (!standings[divId][ha.athlete_id]) {
      standings[divId][ha.athlete_id] = {
        athlete_name: ha.athlete_name,
        total_points: 0,
        best_place: ha.result_position,
        events_counted: 0,
      };
    }
    const s = standings[divId][ha.athlete_id];
    s.total_points += points;
    s.best_place = Math.min(s.best_place, ha.result_position);
    s.events_counted += 1;
  }

  // Wipe and re-insert season points
  console.log('\nWiping existing season points for season ' + SEASON_ID + '...');
  const { error: delErr } = await sb.from('comp_season_points').delete().eq('season_id', SEASON_ID);
  if (delErr) { console.error('Delete error:', delErr.message); return; }

  console.log('Inserting fresh standings...\n');
  let inserted = 0;
  const inserts = [];
  for (const divId of Object.keys(standings)) {
    for (const athleteId of Object.keys(standings[divId])) {
      const s = standings[divId][athleteId];
      inserts.push({
        season_id: SEASON_ID,
        division_id: divId,
        athlete_id: athleteId,
        athlete_name: s.athlete_name,
        total_points: s.total_points,
        events_counted: s.events_counted,
        best_result: s.best_place,
      });
    }
  }

  // Insert in batches of 50
  for (let i = 0; i < inserts.length; i += 50) {
    const batch = inserts.slice(i, i + 50);
    const { error } = await sb.from('comp_season_points').insert(batch);
    if (error) { console.error('Insert error:', error.message); return; }
    inserted += batch.length;
  }
  console.log(`✅ Inserted ${inserted} season point records`);

  // Print division leaders
  console.log('\n=== DIVISION LEADERS (after Event #3) ===\n');
  const { data: divInfo } = await sb.from('comp_divisions').select('id, name');
  const divName = {};
  divInfo.forEach(d => { divName[d.id] = d.name; });

  for (const divId of Object.keys(standings)) {
    const sorted = Object.values(standings[divId]).sort((a, b) => b.total_points - a.total_points);
    console.log(`${divName[divId] || divId}:`);
    sorted.slice(0, 3).forEach((s, i) => {
      const medal = ['🥇', '🥈', '🥉'][i];
      console.log(`  ${medal} ${s.athlete_name} — ${s.total_points} pts (${s.events_counted} events)`);
    });
    console.log('');
  }

  if (newAthletes.length > 0) {
    console.log('=== NEW ATHLETES CREATED ===');
    newAthletes.forEach(n => console.log('  + ' + n));
  }

  console.log('\n=== ✅ SYNC COMPLETE ===');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
