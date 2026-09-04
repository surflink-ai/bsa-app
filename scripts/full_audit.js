// Full audit: LiveHeats vs Supabase heat_athletes vs Supabase season_points
// Catches any incorrect positions, points, or missing athletes across all events.

const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  'https://veggfcumdveuoumrblcn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZ2dmY3VtZHZldW91bXJibGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjEyMzkxNSwiZXhwIjoyMDg3Njk5OTE1fQ.Uuc0omewZgBAejINDCDsrVx2Lr-ksxIF2i-kiyLRw9Y'
);

const SEASON_ID = '9548a85a-3657-43dd-9458-f3947a5152f8';
const POINTS = { 1: 1000, 2: 800, 3: 650, 4: 500, 5: 400, 6: 300, 7: 200, 8: 100 };

const LH_TO_BSA_DIV = {
  'Open Mens': 'Open Men',
  'Open Mens ': 'Open Men',
  'Open Womens': 'Open Women',
  'Under 18 Boys': 'Under 18 Boys',
  'Under 18 Girls': 'Under 18 Girls',
  'Under 16 Boys': 'Under 16 Boys',
  'Under 14 Boys': 'Under 14 Boys',
  'Long Board Open': 'Longboard Open',
  'Grand Masters (over 40 years old)': 'Grand Masters',
  'Novis': 'Novis',
};

const LH_EVENT_IDS = {
  'SOTY Championship Event #1 2026': '429674',
  'SOTY Championship Event #2 2026': '493370',
  'SOTY Championship Event #3 2026': '506069',
};

function normName(n) {
  return (n || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

async function fetchLH(id) {
  const r = await fetch('https://liveheats.com/api/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'https://liveheats.com' },
    body: JSON.stringify({
      query: `{ event(id: "${id}") { name status eventDivisions { division { name } heats { round position config { totalCountingRides } result { place total rides competitor { athlete { id name } } } } } } }`,
    }),
  });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data.event;
}

(async () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  BSA FULL AUDIT — All Events × All Divisions');
  console.log('═══════════════════════════════════════════════════════\n');

  const issues = [];
  const log = (level, msg) => { issues.push({ level, msg }); console.log(`${level}: ${msg}`); };

  // 1. Load all season events
  const { data: events } = await sb.from('comp_events').select('id, name, event_date')
    .eq('season_id', SEASON_ID).like('name', 'SOTY Championship%').order('event_date');
  console.log(`Found ${events.length} SOTY events in 2026 season:\n`);
  events.forEach(e => console.log(`  • ${e.event_date} ${e.id.slice(0,8)} ${e.name}`));

  // 2. Load divisions
  const { data: divs } = await sb.from('comp_divisions').select('id, name');
  const divByName = {}; divs.forEach(d => { divByName[d.name] = d.id; });
  const divById = {}; divs.forEach(d => { divById[d.id] = d.name; });

  // 3. For each event, fetch LiveHeats and compare against stored finals
  // Aggregate authoritative final placements: { divId: { athleteName: { event_id: { lhPlace, dbPlace } } } }
  const allFinals = {}; // divId -> [{ event_id, event_name, athlete_name, lh_athlete_id, lh_place, lh_total, db_place, db_total, db_athlete_id }]

  for (const event of events) {
    console.log(`\n═══ ${event.name} ═══`);
    const lhId = LH_EVENT_IDS[event.name];
    if (!lhId) { log('⚠️', `No LiveHeats ID mapped for ${event.name}`); continue; }

    const lh = await fetchLH(lhId);
    console.log(`  LiveHeats: ${lh.name} (${lh.status})`);

    // Load event_divisions for this event
    const { data: eds } = await sb.from('comp_event_divisions').select('id, division_id').eq('event_id', event.id);
    const edByDiv = {}; eds.forEach(ed => { edByDiv[ed.division_id] = ed.id; });

    for (const lhDiv of lh.eventDivisions) {
      const bsaDivName = LH_TO_BSA_DIV[lhDiv.division.name] || LH_TO_BSA_DIV[lhDiv.division.name.trim()];
      if (!bsaDivName) { log('⚠️', `[${event.name}] Unmapped division: "${lhDiv.division.name}"`); continue; }
      const bsaDivId = divByName[bsaDivName];
      if (!bsaDivId) { log('⚠️', `[${event.name}] BSA division not found: ${bsaDivName}`); continue; }
      const edId = edByDiv[bsaDivId];

      // Find LH final
      const lhFinal = lhDiv.heats.find(h => h.round === 'Final');
      if (!lhFinal || !lhFinal.result || lhFinal.result.length === 0) {
        // OK, division might not have run / not have a final
        continue;
      }
      const countingRides = lhFinal.config?.totalCountingRides || 2;
      // Recompute the official heat total from rides (sum of top-N scoring rides).
      // LiveHeats sometimes caches a stale result.total on older heats; the rides
      // themselves are the source of truth for displayed scores.
      const lhPlacements = lhFinal.result.filter(r => r.place && r.place > 0).sort((a, b) => a.place - b.place).map(r => {
        const ridesArr = [];
        for (const rl of Object.values(r.rides || {})) {
          for (const ride of rl) {
            if (ride && typeof ride.total === 'number') ridesArr.push(ride);
          }
        }
        const scoring = ridesArr.filter(rd => rd.scoring_ride).sort((a, b) => b.total - a.total).slice(0, countingRides);
        let recomputedTotal = scoring.reduce((s, x) => s + (x.total || 0), 0);
        if (recomputedTotal === 0 && ridesArr.length > 0) {
          recomputedTotal = [...ridesArr].sort((a, b) => b.total - a.total).slice(0, countingRides).reduce((s, x) => s + (x.total || 0), 0);
        }
        return { ...r, recomputedTotal };
      });

      if (!edId) {
        log('❌', `[${event.name} ${bsaDivName}] LiveHeats has finals but Supabase has no event_division`);
        continue;
      }

      // Get DB final placements
      const { data: rounds } = await sb.from('comp_rounds').select('id, name').eq('event_division_id', edId);
      const finalRound = rounds.find(r => r.name === 'Final');
      if (!finalRound) {
        log('❌', `[${event.name} ${bsaDivName}] LiveHeats has finals but Supabase has no Final round`);
        continue;
      }
      const { data: heats } = await sb.from('comp_heats').select('id, heat_number').eq('round_id', finalRound.id);
      if (!heats || heats.length === 0) {
        log('❌', `[${event.name} ${bsaDivName}] Supabase Final round has no heats`);
        continue;
      }
      const { data: dbAths } = await sb.from('comp_heat_athletes')
        .select('athlete_id, athlete_name, result_position, total_score')
        .in('heat_id', heats.map(h => h.id))
        .order('result_position');

      // Cross-check each LH placement
      for (const lhP of lhPlacements) {
        const lhName = lhP.competitor.athlete.name;
        const lhAthId = lhP.competitor.athlete.id;
        // Match by name (case-insensitive, trimmed)
        const dbMatch = (dbAths || []).find(d => normName(d.athlete_name) === normName(lhName));

        if (!dbMatch) {
          log('❌', `[${event.name} ${bsaDivName}] LH pos ${lhP.place}: ${lhName} (LH:${lhAthId}) — MISSING from Supabase final`);
          continue;
        }
        if (dbMatch.result_position !== lhP.place) {
          log('❌', `[${event.name} ${bsaDivName}] ${lhName}: LH pos ${lhP.place} vs DB pos ${dbMatch.result_position}`);
        }
        const expectedTotal = Math.round(lhP.recomputedTotal * 100) / 100;
        const dbTotal = Math.round((dbMatch.total_score || 0) * 100) / 100;
        if (Math.abs(dbTotal - expectedTotal) > 0.05) {
          log('⚠️', `[${event.name} ${bsaDivName}] ${lhName}: DB total ${dbTotal} vs expected ${expectedTotal} (top-${countingRides} rides; LH cached: ${lhP.total})`);
        }

        // Track for season-points cross-check
        if (!allFinals[bsaDivId]) allFinals[bsaDivId] = [];
        allFinals[bsaDivId].push({
          event_id: event.id, event_name: event.name,
          athlete_name: lhName,
          db_athlete_id: dbMatch.athlete_id,
          place: lhP.place, // authoritative place from LH
        });
      }

      // Also check DB has no EXTRA finalists not in LH
      for (const dbA of dbAths || []) {
        if (!dbA.result_position) continue;
        const lhMatch = lhPlacements.find(p => normName(p.competitor.athlete.name) === normName(dbA.athlete_name));
        if (!lhMatch) {
          log('❌', `[${event.name} ${bsaDivName}] DB pos ${dbA.result_position}: ${dbA.athlete_name} — EXTRA, not in LiveHeats final`);
        }
      }
    }
  }

  // 4. Recompute season points from authoritative LH final placements (matched to DB athlete_ids)
  console.log(`\n═══════════════════════════════════════════════════════`);
  console.log(`  SEASON POINTS CROSS-CHECK (vs LiveHeats authority)`);
  console.log(`═══════════════════════════════════════════════════════`);

  const expected = {}; // divId -> athleteId -> { name, points, events_counted, best_place }
  for (const [divId, placements] of Object.entries(allFinals)) {
    for (const p of placements) {
      if (!p.db_athlete_id) continue; // can't aggregate without athlete_id
      if (!expected[divId]) expected[divId] = {};
      if (!expected[divId][p.db_athlete_id]) {
        expected[divId][p.db_athlete_id] = { name: p.athlete_name, points: 0, events_counted: 0, best_place: p.place };
      }
      const e = expected[divId][p.db_athlete_id];
      e.points += POINTS[p.place] || 0;
      e.events_counted += 1;
      e.best_place = Math.min(e.best_place, p.place);
    }
  }

  // Load stored season points
  const { data: stored } = await sb.from('comp_season_points')
    .select('athlete_id, athlete_name, division_id, total_points, events_counted, best_result')
    .eq('season_id', SEASON_ID);

  // For each stored row, find expected and compare
  const storedByKey = {};
  for (const s of stored || []) {
    if (!s.athlete_id) continue;
    storedByKey[`${s.division_id}:${s.athlete_id}`] = s;
  }
  const expectedByKey = {};
  for (const [divId, atMap] of Object.entries(expected)) {
    for (const [athId, e] of Object.entries(atMap)) {
      expectedByKey[`${divId}:${athId}`] = e;
    }
  }

  // Find mismatches
  console.log('\n--- Mismatches ---');
  let mismatch = 0;
  for (const [key, e] of Object.entries(expectedByKey)) {
    const s = storedByKey[key];
    const [divId, athId] = key.split(':');
    if (!s) {
      log('❌', `MISSING in season_points: ${e.name} ${divById[divId]} (expected ${e.points} pts, ${e.events_counted} events)`);
      mismatch++; continue;
    }
    if (s.total_points !== e.points) {
      log('❌', `POINTS WRONG: ${e.name} ${divById[divId]}: stored=${s.total_points} expected=${e.points}`);
      mismatch++;
    }
    if (s.events_counted !== e.events_counted) {
      log('❌', `EVENTS_COUNT WRONG: ${e.name} ${divById[divId]}: stored=${s.events_counted} expected=${e.events_counted}`);
      mismatch++;
    }
    if (s.best_result !== e.best_place) {
      log('❌', `BEST_PLACE WRONG: ${e.name} ${divById[divId]}: stored=${s.best_result} expected=${e.best_place}`);
      mismatch++;
    }
  }
  // Find extras
  for (const [key, s] of Object.entries(storedByKey)) {
    if (!expectedByKey[key]) {
      const [divId] = key.split(':');
      log('❌', `EXTRA in season_points: ${s.athlete_name} ${divById[divId]} = ${s.total_points} pts (no LH final placement found)`);
      mismatch++;
    }
  }

  console.log(`\n═══════════════════════════════════════════════════════`);
  console.log(`  SUMMARY`);
  console.log(`═══════════════════════════════════════════════════════`);
  const errs = issues.filter(i => i.level === '❌').length;
  const warns = issues.filter(i => i.level === '⚠️').length;
  console.log(`  Errors:   ${errs}`);
  console.log(`  Warnings: ${warns}`);
  if (errs === 0 && warns === 0) console.log(`\n  ✅ FULL AUDIT PASSED — all events, all divisions, all standings match LiveHeats.`);
  else console.log(`\n  ${errs > 0 ? '❌' : '⚠️'} REVIEW ISSUES ABOVE.`);
})();
