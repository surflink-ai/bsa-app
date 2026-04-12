const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  'https://veggfcumdveuoumrblcn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZ2dmY3VtZHZldW91bXJibGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjEyMzkxNSwiZXhwIjoyMDg3Njk5OTE1fQ.Uuc0omewZgBAejINDCDsrVx2Lr-ksxIF2i-kiyLRw9Y'
);

const SEASON_ID = '9548a85a-3657-43dd-9458-f3947a5152f8';
const POINTS = {1: 1000, 2: 800, 3: 650, 4: 500, 5: 400, 6: 300, 7: 200, 8: 100};

const DIV_MAP = {
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

const ROUND_MAP = { 'Quarterfinal': 4, 'Semifinal': 5, 'Final': 6 };

async function main() {
  const resp = await fetch('https://liveheats.com/api/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({query: '{ event(id: "493370") { name status eventDivisions { division { name } heats { round position startTime endTime result { place total competitor { athlete { id name } } } } } } }'})
  });
  const lhData = (await resp.json()).data.event;
  console.log('Loaded: ' + lhData.name + ' (' + lhData.status + ')');

  const { data: event2, error: evErr } = await sb.from('comp_events').insert({
    name: 'SOTY Championship Event #2 2026',
    event_date: '2026-04-11',
    end_date: '2026-04-11',
    location: 'South Point, Barbados',
    status: 'complete',
    season_id: SEASON_ID,
  }).select().single();
  if (evErr) { console.log('Event create error:', evErr.message); return; }
  console.log('Created Event #2: ' + event2.id);
  const EVENT2_ID = event2.id;

  const allPlacements = [];

  for (const div of lhData.eventDivisions) {
    const divName = div.division.name;
    const divId = DIV_MAP[divName];
    if (!divId) { console.log('SKIP division: ' + divName); continue; }
    console.log('\nProcessing: ' + divName);

    const { data: ed, error: edErr } = await sb.from('comp_event_divisions').insert({
      event_id: EVENT2_ID,
      division_id: divId,
    }).select().single();
    if (edErr) { console.log('  ED error:', edErr.message); continue; }

    const heats = div.heats || [];
    const finalHeat = heats.find(function(h) { return h.round === 'Final'; });
    
    const roundGroups = {};
    for (const h of heats) {
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
      if (rErr) { console.log('  Round error (' + roundName + '):', rErr.message); continue; }

      for (const h of roundHeats) {
        const heatNum = h.position + 1;
        
        const { data: heat, error: hErr } = await sb.from('comp_heats').insert({
          round_id: round.id,
          heat_number: heatNum,
          status: 'complete',
          actual_start: h.startTime,
          actual_end: h.endTime,
          duration_minutes: 20,
        }).select().single();
        if (hErr) { console.log('  Heat error:', hErr.message); continue; }

        const results = (h.result || []).sort(function(a, b) { return a.place - b.place; });
        const jerseys = ['red', 'blue', 'white', 'yellow', 'green', 'black', 'pink', 'orange'];
        
        for (let i = 0; i < results.length; i++) {
          const r = results[i];
          const athName = r.competitor.athlete.name;
          const lhId = String(r.competitor.athlete.id);
          
          let { data: athlete } = await sb.from('athletes').select('id').eq('liveheats_id', lhId).single();
          
          if (!athlete) {
            const { data: byAlias } = await sb.from('athletes').select('id').contains('liveheats_aliases', [lhId]).single();
            athlete = byAlias;
          }
          
          if (!athlete) {
            const nameParts = athName.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ');
            const { data: newAth, error: aErr } = await sb.from('athletes').insert({
              first_name: firstName,
              last_name: lastName,
              liveheats_id: lhId,
              status: 'active',
            }).select().single();
            if (aErr) { console.log('  Athlete error (' + athName + '):', aErr.message); continue; }
            athlete = newAth;
            console.log('  NEW athlete: ' + athName + ' (LH:' + lhId + ')');
          }
          
          const advanced = roundName !== 'Final' && r.place <= 2;
          
          const { error: haErr } = await sb.from('comp_heat_athletes').insert({
            heat_id: heat.id,
            athlete_id: athlete.id,
            athlete_name: athName,
            jersey_color: jerseys[i] || 'white',
            seed_position: i + 1,
            result_position: r.place,
            total_score: r.total,
            advanced: advanced,
            wave_count: 0,
          });
          if (haErr) console.log('  HA error (' + athName + '):', haErr.message);
        }
      }
    }

    if (finalHeat) {
      for (const r of finalHeat.result || []) {
        allPlacements.push({
          division_id: divId,
          athlete_name: r.competitor.athlete.name,
          lh_id: String(r.competitor.athlete.id),
          place: r.place,
        });
      }
    }
    
    console.log('  Done: ' + divName + ' (' + heats.length + ' heats)');
  }

  console.log('\n=== SEASON POINTS ===');
  
  const { data: existingPoints } = await sb.from('comp_season_points').select('*').eq('season_id', SEASON_ID);
  const pointsMap = {};
  
  for (const ep of existingPoints || []) {
    const key = ep.division_id + ':' + ep.athlete_id;
    pointsMap[key] = {
      athlete_id: ep.athlete_id,
      athlete_name: ep.athlete_name,
      division_id: ep.division_id,
      e1_points: ep.total_points,
      e2_points: 0,
      e1_best: ep.best_result,
      e2_best: null,
      existing_id: ep.id,
    };
  }
  
  for (const p of allPlacements) {
    const pts = POINTS[p.place] || 0;
    
    let { data: athlete } = await sb.from('athletes').select('id').eq('liveheats_id', p.lh_id).single();
    if (!athlete) {
      const { data: byAlias } = await sb.from('athletes').select('id').contains('liveheats_aliases', [p.lh_id]).single();
      athlete = byAlias;
    }
    if (!athlete) { console.log('  WARNING: No athlete for ' + p.athlete_name); continue; }
    
    const key = p.division_id + ':' + athlete.id;
    if (!pointsMap[key]) {
      pointsMap[key] = {
        athlete_id: athlete.id,
        athlete_name: p.athlete_name,
        division_id: p.division_id,
        e1_points: 0,
        e2_points: 0,
        e1_best: null,
        e2_best: null,
        existing_id: null,
      };
    }
    pointsMap[key].e2_points = pts;
    pointsMap[key].e2_best = p.place;
  }
  
  for (const key of Object.keys(pointsMap)) {
    const p = pointsMap[key];
    const totalPts = p.e1_points + p.e2_points;
    const bests = [p.e1_best, p.e2_best].filter(function(x) { return x != null; });
    const bestResult = bests.length > 0 ? Math.min.apply(null, bests) : null;
    const eventsCounted = (p.e1_points > 0 ? 1 : 0) + (p.e2_points > 0 ? 1 : 0);
    
    if (p.existing_id) {
      const { error } = await sb.from('comp_season_points').update({
        total_points: totalPts,
        events_counted: eventsCounted,
        best_result: bestResult,
        updated_at: new Date().toISOString(),
      }).eq('id', p.existing_id);
      if (error) console.log('  Pts error (' + p.athlete_name + '):', error.message);
      else console.log('  UPDATED: ' + p.athlete_name + ' = ' + totalPts + ' pts (E1:' + p.e1_points + ' + E2:' + p.e2_points + ')');
    } else if (p.e2_points > 0) {
      const { error } = await sb.from('comp_season_points').insert({
        season_id: SEASON_ID,
        division_id: p.division_id,
        athlete_id: p.athlete_id,
        athlete_name: p.athlete_name,
        total_points: totalPts,
        events_counted: eventsCounted,
        best_result: bestResult,
      });
      if (error) console.log('  Pts error (' + p.athlete_name + '):', error.message);
      else console.log('  NEW: ' + p.athlete_name + ' = ' + totalPts + ' pts');
    }
  }
  
  console.log('\n=== SYNC COMPLETE ===');
}

main().catch(console.error);
