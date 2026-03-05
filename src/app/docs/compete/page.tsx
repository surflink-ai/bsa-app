export const metadata = {
  title: 'BSA Compete — Documentation',
  description: 'ISA-compliant surf competition management system. Multi-judge blind scoring, priority management, Apple Watch integration.',
}

const S = {
  page: { maxWidth: 900, margin: '0 auto', padding: '60px 24px 120px' } as const,
  h1: { fontFamily: 'Space Grotesk, sans-serif', fontSize: 42, fontWeight: 700, color: '#0A2540', marginBottom: 8 } as const,
  sub: { fontFamily: 'DM Sans, sans-serif', fontSize: 18, color: '#64748B', marginBottom: 48, lineHeight: 1.6 } as const,
  h2: { fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, color: '#0A2540', marginTop: 56, marginBottom: 16, paddingBottom: 8, borderBottom: '2px solid #2BA5A0' } as const,
  h3: { fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 600, color: '#0A2540', marginTop: 32, marginBottom: 12 } as const,
  p: { fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#334155', lineHeight: 1.7, marginBottom: 16 } as const,
  code: { fontFamily: 'JetBrains Mono, monospace', fontSize: 13, background: '#F1F5F9', padding: '2px 6px', borderRadius: 4, color: '#0A2540' } as const,
  pre: { fontFamily: 'JetBrains Mono, monospace', fontSize: 13, background: '#0A2540', color: '#E2E8F0', padding: 24, borderRadius: 12, overflowX: 'auto' as const, marginBottom: 24, lineHeight: 1.6 } as const,
  table: { width: '100%', borderCollapse: 'collapse' as const, marginBottom: 24, fontSize: 14, fontFamily: 'DM Sans, sans-serif' } as const,
  th: { textAlign: 'left' as const, padding: '10px 12px', borderBottom: '2px solid #E2E8F0', fontWeight: 600, color: '#0A2540', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' as const, letterSpacing: 0.5 } as const,
  td: { padding: '10px 12px', borderBottom: '1px solid #F1F5F9', color: '#334155' } as const,
  ul: { paddingLeft: 20, marginBottom: 16 } as const,
  li: { fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#334155', lineHeight: 1.7, marginBottom: 6 } as const,
  badge: { display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' } as const,
  card: { border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, marginBottom: 16, background: '#FAFBFC' } as const,
}

function Badge({ children, color = '#2BA5A0' }: { children: React.ReactNode; color?: string }) {
  return <span style={{ ...S.badge, background: color + '15', color }}>{children}</span>
}

export default function CompeteDocs() {
  return (
    <div style={S.page}>
      <div style={{ marginBottom: 8 }}>
        <a href="/docs" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#2BA5A0', textDecoration: 'none' }}>← docs</a>
      </div>
      <h1 style={S.h1}>BSA Compete</h1>
      <p style={S.sub}>
        ISA-compliant surf competition management system built for the Barbados Surfing Association.
        Multi-judge blind scoring, real-time priority management, Apple Watch integration, and livestream overlays.
      </p>

      {/* TOC */}
      <div style={{ ...S.card, marginBottom: 48 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#64748B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Contents</div>
        {['Architecture', 'URL Map', 'Database', 'ISA Scoring', 'Priority System', 'Apple Watch', 'Judge Interface', 'Admin Interface', 'Livestream', 'Event Day Workflow', 'API Reference'].map((s, i) => (
          <div key={i} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#2BA5A0', marginBottom: 4 }}>
            {i + 1}. {s}
          </div>
        ))}
      </div>

      {/* 1. Architecture */}
      <h2 style={S.h2}>1. Architecture</h2>
      <p style={S.p}>
        BSA Compete runs on <strong>Next.js 16</strong> (App Router) with <strong>Supabase</strong> (Postgres, Realtime, RLS) and deploys to <strong>Vercel</strong>.
        The Apple Watch communicates via a WebSocket relay server that bridges Supabase Realtime to watchOS clients.
      </p>
      <pre style={S.pre}>{`Clients (iPad / Watch / Browser)
    ↕
Next.js API Routes (/api/judge/*, /api/compete/*, /api/stream/*)
    ↕
Supabase (Postgres + Realtime + RLS)
    ↕
WebSocket Relay (watch-relay/server.js → port 8080)
    ↕
Apple Watch Ultra (watchOS, SwiftUI)`}</pre>
      <p style={S.p}>
        <strong>Stack:</strong> Next.js 16.1.6 · Supabase · Tailwind CSS · Vercel · Cloudflare Stream · Node.js WebSocket relay
      </p>

      {/* 2. URL Map */}
      <h2 style={S.h2}>2. URL Map</h2>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>URL</th>
            <th style={S.th}>Purpose</th>
            <th style={S.th}>Access</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['/admin/compete', 'Event list and create', 'Admin'],
            ['/admin/compete/judges', 'Judge management and PINs', 'Admin'],
            ['/admin/compete/[id]', 'Event builder — brackets, draw, registration', 'Admin'],
            ['/admin/compete/[id]/print', 'Printable heat sheets with QR codes', 'Admin'],
            ['/admin/compete/[id]/tabulation', 'ISA tabulation sheets', 'Admin'],
            ['/judge', 'Blind scoring interface (PIN login)', 'Judges'],
            ['/judge/head', 'Head judge panel — all scores, overrides', 'Head Judge'],
            ['/events/[id]/live', 'Public live results', 'Public'],
            ['/events/[id]/register', 'Athlete self-registration', 'Public'],
            ['/rankings', 'Season standings', 'Public'],
            ['/athletes', 'Athlete directory', 'Public'],
            ['/stream', 'Livestream with score overlay', 'Public'],
          ].map(([url, purpose, access], i) => (
            <tr key={i}>
              <td style={S.td}><code style={S.code}>{url}</code></td>
              <td style={S.td}>{purpose}</td>
              <td style={S.td}><Badge color={access === 'Public' ? '#16A34A' : access === 'Admin' ? '#DC2626' : '#2563EB'}>{access}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 3. Database */}
      <h2 style={S.h2}>3. Database</h2>
      <h3 style={S.h3}>Migrations</h3>
      <p style={S.p}>13 sequential migrations define the full schema:</p>
      <table style={S.table}>
        <thead>
          <tr><th style={S.th}>#</th><th style={S.th}>Purpose</th></tr>
        </thead>
        <tbody>
          {[
            ['001–005', 'Foundation — schema, RLS, seeds, triggers, stream videos'],
            ['006', 'Competition system — events, divisions, rounds, heats, athletes, scores, registrations'],
            ['007–008', 'Division seeding, stream score source'],
            ['009', 'Athletes table — local registry (replaces LiveHeats as source of truth)'],
            ['010', 'Registration upgrades — status flow, CSV import support'],
            ['011', 'ISA judging — comp_judge_scores, comp_heat_judges, comp_interference, comp_score_overrides'],
            ['012', 'ISA priority fix — priority_established, priority_riders, priority_status columns'],
            ['013', 'Score precision — numeric(5,2) for averaged scores (2 decimal places)'],
          ].map(([n, desc], i) => (
            <tr key={i}><td style={S.td}><code style={S.code}>{n}</code></td><td style={S.td}>{desc}</td></tr>
          ))}
        </tbody>
      </table>

      <h3 style={S.h3}>Core Tables</h3>
      <p style={S.p}><strong>Competition structure:</strong></p>
      <ul style={S.ul}>
        <li style={S.li}><code style={S.code}>comp_events</code> — Events with date, location, status</li>
        <li style={S.li}><code style={S.code}>comp_divisions</code> — Division definitions (Open Men, Open Women, etc.)</li>
        <li style={S.li}><code style={S.code}>comp_event_divisions</code> — Links events to divisions, holds panel_size, drop_high_low, scoring_best_of</li>
        <li style={S.li}><code style={S.code}>comp_rounds</code> / <code style={S.code}>comp_heats</code> — Round and heat structure with status, timer, certification</li>
        <li style={S.li}><code style={S.code}>comp_seasons</code> — Season definitions with points_system config</li>
      </ul>
      <p style={S.p}><strong>Scoring:</strong></p>
      <ul style={S.ul}>
        <li style={S.li}><code style={S.code}>comp_judge_scores</code> — Individual judge scores per wave per athlete <Badge>Source of truth</Badge></li>
        <li style={S.li}><code style={S.code}>comp_wave_scores</code> — Averaged wave scores (computed cache)</li>
        <li style={S.li}><code style={S.code}>comp_heat_judges</code> — Judge-to-heat assignments with position and head_judge flag</li>
        <li style={S.li}><code style={S.code}>comp_interference</code> — Interference calls with penalty type</li>
        <li style={S.li}><code style={S.code}>comp_score_overrides</code> — Head judge overrides with audit trail</li>
      </ul>

      {/* 4. ISA Scoring */}
      <h2 style={S.h2}>4. ISA Scoring System</h2>
      <h3 style={S.h3}>Panel Configuration</h3>
      <ul style={S.ul}>
        <li style={S.li}><strong>5-judge panel</strong> (standard): Drop highest and lowest, average middle 3</li>
        <li style={S.li}><strong>3-judge panel</strong> (minimum): Straight average, no drops</li>
        <li style={S.li}>Head judge is position 1 but <strong>does not score</strong> — manages panel, overrides, certifies</li>
      </ul>

      <h3 style={S.h3}>Score Flow</h3>
      <pre style={S.pre}>{`Judge taps cell → Numpad (0.1–10.0) → Confirm → Lock
  ↓
POST /api/judge/score-v2 (blind submission)
  ↓
Insert comp_judge_scores (judge sees only own scores)
  ↓
All scoring judges submitted → wave_complete = true
  ↓
Calculate average (drop high/low if panel ≥ 5)
  ↓
Upsert comp_wave_scores (averaged score)
  ↓
recalculateHeatTotals() → update total_score, needs_score, result_position
  ↓
Supabase Realtime → WebSocket relay → Apple Watch`}</pre>

      <h3 style={S.h3}>ISA Score Scale</h3>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Range</th><th style={S.th}>Rating</th></tr></thead>
        <tbody>
          {[['0.1 – 1.9', 'Poor'], ['2.0 – 3.9', 'Fair'], ['4.0 – 5.9', 'Average'], ['6.0 – 7.9', 'Good'], ['8.0 – 9.9', 'Excellent'], ['10.0', 'Perfect']].map(([r, l], i) => (
            <tr key={i}><td style={S.td}><code style={S.code}>{r}</code></td><td style={S.td}>{l}</td></tr>
          ))}
        </tbody>
      </table>

      <h3 style={S.h3}>Interference Penalties</h3>
      <ul style={S.ul}>
        <li style={S.li}>Penalty applied to <strong>2nd-best wave</strong> (not the wave where interference occurred)</li>
        <li style={S.li}>Score of 2nd-best wave is halved (50%)</li>
        <li style={S.li}>Double interference in same heat = <strong>disqualification</strong> (total = 0, last place)</li>
        <li style={S.li}>Interference = automatic priority loss</li>
      </ul>

      <h3 style={S.h3}>Certification and Protest</h3>
      <p style={S.p}>
        After all waves are scored, the head judge clicks <strong>Certify</strong>. This locks all scores and
        starts a 15-minute protest window. No score submissions are accepted after certification.
      </p>

      {/* 5. Priority */}
      <h2 style={S.h2}>5. Priority System</h2>
      <h3 style={S.h3}>ISA Establishment Phase</h3>
      <p style={S.p}>Priority is not pre-assigned. It builds as surfers catch waves:</p>
      <ol style={S.ul}>
        <li style={S.li}>Heat starts — no priority established</li>
        <li style={S.li}>Surfers catch waves — each ride is recorded via <code style={S.code}>wave_ridden</code></li>
        <li style={S.li}>When N-1 surfers have ridden (3 of 4): <strong>priority established</strong></li>
        <li style={S.li}>The surfer who has not ridden gets <strong>P1</strong> (first priority)</li>
        <li style={S.li}>Others ordered by return to the Primary Takeoff Zone</li>
      </ol>

      <h3 style={S.h3}>Priority Actions</h3>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Action</th><th style={S.th}>Description</th></tr></thead>
        <tbody>
          {[
            ['start', 'Initialize establishing phase, reset riders'],
            ['wave_ridden', 'Record that athlete caught a wave'],
            ['suspend', 'Athlete paddles outside takeoff zone'],
            ['reinstate', 'Athlete returns to takeoff zone'],
            ['block', 'Priority surfer deliberately blocking'],
            ['interference_priority', 'Priority loss due to interference call'],
            ['set', 'Manual priority order override by head judge'],
          ].map(([a, d], i) => (
            <tr key={i}><td style={S.td}><code style={S.code}>{a}</code></td><td style={S.td}>{d}</td></tr>
          ))}
        </tbody>
      </table>

      <h3 style={S.h3}>Priority Rules</h3>
      <ul style={S.ul}>
        <li style={S.li}>P1 has right of way over all others</li>
        <li style={S.li}>P2 has right of way over P3 and P4 only</li>
        <li style={S.li}><strong>Lost when:</strong> riding a wave, committed paddle and miss, paddling outside zone</li>
        <li style={S.li}><strong>Not lost when:</strong> paddling alongside higher-priority surfer who catches the wave</li>
      </ul>

      {/* 6. Apple Watch */}
      <h2 style={S.h2}>6. Apple Watch Integration</h2>
      <p style={S.p}>
        BSA is the first federation to display real-time priority on surfers' wrists during competition.
        The Apple Watch Ultra connects directly over WiFi — no iPhone required.
      </p>
      <pre style={S.pre}>{`Supabase Realtime
  → watch-relay/server.js (Node.js, port 8080)
    → WebSocket
      → Apple Watch Ultra (watchOS, URLSessionWebSocketTask)`}</pre>

      <h3 style={S.h3}>Watch Features</h3>
      <ul style={S.ul}>
        <li style={S.li}>Priority position (P1–P4) with jersey color coding</li>
        <li style={S.li}>Heat timer with 30-second warning</li>
        <li style={S.li}>Live score updates</li>
        <li style={S.li}>Interference alerts (full-screen red overlay)</li>
        <li style={S.li}>Haptics: strong buzz (P1 gained), tap (priority changed), double (interference), long (heat ending)</li>
      </ul>

      <h3 style={S.h3}>Connect Flow</h3>
      <p style={S.p}>
        Zero typing required. The watch app fetches active heats from Supabase, displays a list.
        Surfer taps their heat, then taps their name. WebSocket connects automatically.
        50 reconnect attempts with exponential backoff handle WiFi range drops.
      </p>

      <h3 style={S.h3}>ISA Compliance</h3>
      <p style={S.p}>
        The watch displays <strong>only publicly available data</strong> — priority position, heat time, and published scores.
        No coaching advice, no strategy suggestions. Fully compliant with ISA electronic coaching rules.
      </p>

      {/* 7. Judge Interface */}
      <h2 style={S.h2}>7. Judge Interface</h2>
      <h3 style={S.h3}>Design Principles</h3>
      <ul style={S.ul}>
        <li style={S.li}><strong>iPad Pro 13" landscape</strong> (1366×1024) — primary device at beach events</li>
        <li style={S.li}><strong>Light mode only</strong> — designed for outdoor sunlight readability</li>
        <li style={S.li}><strong>48px+ touch targets</strong> — usable with wet hands</li>
        <li style={S.li}><strong>Inter + Geist Mono</strong> fonts — clean, modern, high legibility</li>
        <li style={S.li}><strong>Glassmorphism aesthetic</strong> — frosted glass panels with backdrop blur</li>
      </ul>

      <h3 style={S.h3}>Blind Scoring (/judge)</h3>
      <p style={S.p}>
        Judges log in with a 4-digit PIN (or scan a QR code from the printed heat sheet for auto-login).
        The interface shows a grid of athletes (Y-axis) by waves (X-axis). Tapping a cell opens
        a score numpad anchored to that cell. Judges see <strong>only their own scores</strong> — no other
        judge's scores are visible. This is ISA-mandated blind judging.
      </p>

      <h3 style={S.h3}>Head Judge Panel (/judge/head)</h3>
      <p style={S.p}>The head judge sees everything:</p>
      <ul style={S.ul}>
        <li style={S.li}>All individual judge scores per wave (expandable rows)</li>
        <li style={S.li}>Priority rail with one-tap wave_ridden and context menu</li>
        <li style={S.li}>Interference modal (select athlete, wave, penalty type)</li>
        <li style={S.li}>Score override (click any judge score → modal with new score + required reason)</li>
        <li style={S.li}>Judge performance cards (average, range, outlier count)</li>
        <li style={S.li}>Heat certification button</li>
        <li style={S.li}>Horn/buzzer: START (3 blasts) and END (1 blast) via Web Audio API</li>
        <li style={S.li}>Progress bar timer (teal → yellow → red at 30 seconds)</li>
        <li style={S.li}>Fullscreen toggle for iPad</li>
      </ul>

      <h3 style={S.h3}>Jersey Colors</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {[
          ['Red', '#DC2626'], ['Blue', '#2563EB'], ['White', '#E2E8F0'], ['Yellow', '#EAB308'],
          ['Green', '#16A34A'], ['Black', '#1E293B'], ['Pink', '#EC4899'], ['Orange', '#EA580C'],
        ].map(([name, hex]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: hex, border: '1px solid rgba(0,0,0,0.1)' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{name}</span>
          </div>
        ))}
      </div>

      {/* 8. Admin */}
      <h2 style={S.h2}>8. Admin Interface</h2>
      <h3 style={S.h3}>Event Management</h3>
      <p style={S.p}>
        The admin event page (<code style={S.code}>/admin/compete/[id]</code>) provides a tabbed interface
        for managing heats, registrations, and settings. Heat controls include start/end with state machine
        logic — starting a heat sets the actual start time and initializes the priority system.
      </p>

      <h3 style={S.h3}>Judge Assignments</h3>
      <p style={S.p}>
        Assign judges to individual heats or bulk-assign an entire panel to all heats across all rounds
        in a division. Toggle head judge designation per assignment.
      </p>

      <h3 style={S.h3}>Print Heat Sheets</h3>
      <p style={S.p}>
        A4 landscape format with athlete names, jersey swatches, W1–W10 scoring grid, priority boxes,
        judge QR codes (scan to auto-login), and head judge signature line. Designed for beach-side use.
      </p>

      <h3 style={S.h3}>Tabulation</h3>
      <p style={S.p}>
        ISA tabulation sheets with heat selector, per-athlete score grids, counting waves highlighted,
        DQ/interference badges, and certification status. Used for official record-keeping.
      </p>

      {/* 9. Livestream */}
      <h2 style={S.h2}>9. Livestream</h2>
      <p style={S.p}>
        BSA Compete integrates with Cloudflare Stream for live broadcasting. The <code style={S.code}>/api/stream/active-heat</code> endpoint
        provides JSON data for OBS overlays — athlete names, jersey colors, scores, positions, priority order,
        and DQ status. DQ'd athletes show total = 0 and sort last.
      </p>

      {/* 10. Event Day */}
      <h2 style={S.h2}>10. Event Day Workflow</h2>
      <h3 style={S.h3}>Pre-Event</h3>
      <ol style={S.ul}>
        <li style={S.li}>Create event with divisions in admin</li>
        <li style={S.li}>Open registration (admin adds athletes, public self-registration, or CSV import)</li>
        <li style={S.li}>Seed athletes by SOTY points → snake-seed into heats</li>
        <li style={S.li}>Assign judge panels (bulk by division)</li>
        <li style={S.li}>Print heat sheets with QR codes</li>
      </ol>

      <h3 style={S.h3}>During Event</h3>
      <ol style={S.ul}>
        <li style={S.li}>Admin clicks <strong>Start Heat</strong> → timer begins, priority starts establishing</li>
        <li style={S.li}>Head judge taps <strong>Wave Ridden</strong> as surfers catch waves → priority builds</li>
        <li style={S.li}>Judges score on iPads (blind, PIN login or QR scan)</li>
        <li style={S.li}>Head judge monitors scores, calls interference, manages priority</li>
        <li style={S.li}>Admin clicks <strong>End Heat</strong> → horn blast, confirmation</li>
        <li style={S.li}>Head judge <strong>Certifies</strong> results → 15-minute protest window</li>
        <li style={S.li}>Admin <strong>Advances</strong> athletes to next round</li>
      </ol>

      <h3 style={S.h3}>Post-Event</h3>
      <ol style={S.ul}>
        <li style={S.li}>Mark event complete → season points calculated automatically</li>
        <li style={S.li}>Rankings update</li>
        <li style={S.li}>VODs available in admin</li>
      </ol>

      {/* 11. API */}
      <h2 style={S.h2}>11. API Reference</h2>

      <h3 style={S.h3}>Judge Authentication</h3>
      <pre style={S.pre}>{`POST /api/judge/auth
{ "pin": "2222" }

→ { "judge": { "id": "...", "name": "Judge Williams", "role": "judge" } }`}</pre>

      <h3 style={S.h3}>Score Submission (Blind)</h3>
      <pre style={S.pre}>{`POST /api/judge/score-v2
{
  "judge_id": "...",
  "heat_athlete_id": "...",
  "wave_number": 1,
  "score": 7.5
}

→ {
  "success": true,
  "judges_submitted": 3,
  "judges_required": 4,
  "wave_complete": false,
  "averaged_score": null
}`}</pre>

      <h3 style={S.h3}>Head Judge Panel</h3>
      <pre style={S.pre}>{`GET /api/judge/head-panel?judge_id=...&heat_id=...
→ All athletes with all judge scores per wave, performance stats, outlier detection

POST /api/judge/head-panel
{ "action": "override_score", "score_id": "...", "new_score": 7.5, "reason": "..." }
{ "action": "certify", "judge_id": "...", "heat_id": "..." }`}</pre>

      <h3 style={S.h3}>Priority</h3>
      <pre style={S.pre}>{`POST /api/judge/priority
{ "action": "start|wave_ridden|suspend|reinstate|block|set", "heat_id": "...", "athlete_id": "..." }

GET /api/judge/priority?heat_id=...
→ { "phase": "established", "priority_order": [...], "riders_count": 3, "riders_needed": 3 }`}</pre>

      <h3 style={S.h3}>Interference</h3>
      <pre style={S.pre}>{`POST /api/judge/interference
{
  "judge_id": "...",
  "heat_id": "...",
  "athlete_id": "...",
  "wave_number": 1,
  "interfered_with": "...",
  "penalty_type": "interference_half"
}

→ { "success": true, "is_disqualified": false, "total_interferences": 1 }`}</pre>

      <h3 style={S.h3}>Other Endpoints</h3>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Endpoint</th><th style={S.th}>Methods</th><th style={S.th}>Purpose</th></tr></thead>
        <tbody>
          {[
            ['/api/compete/judge-assignments', 'GET/POST/DELETE', 'Manage judge panels per heat or bulk by division'],
            ['/api/compete/tabulation', 'GET', 'Full ISA tabulation data for a heat'],
            ['/api/compete/season-points', 'POST', 'Calculate and store season points for an event'],
            ['/api/stream/active-heat', 'GET', 'Current live heat data for OBS overlay'],
          ].map(([e, m, p], i) => (
            <tr key={i}><td style={S.td}><code style={S.code}>{e}</code></td><td style={S.td}>{m}</td><td style={S.td}>{p}</td></tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 64, padding: 24, borderRadius: 12, background: '#F0FDFA', border: '1px solid #2BA5A020' }}>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#64748B', margin: 0 }}>
          BSA Compete is built by the Barbados Surfing Association. For questions or federation partnerships,
          contact <strong>bsa.surf</strong>.
        </p>
      </div>
    </div>
  )
}
