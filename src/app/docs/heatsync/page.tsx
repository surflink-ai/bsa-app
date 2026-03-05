export const metadata = {
  title: 'HeatSync — AI-Assisted Surf Competition Platform',
  description: 'The world\'s first end-to-end AI-assisted surf competition platform. Competition management, wearable telemetry, computer vision, and judge assistance.',
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

function LayerCard({ number, title, status, children }: { number: number; title: string; status: 'built' | 'planned'; children: React.ReactNode }) {
  return (
    <div style={{ ...S.card, borderLeft: `4px solid ${status === 'built' ? '#16A34A' : '#2BA5A0'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: status === 'built' ? '#16A34A' : '#2BA5A0',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700,
        }}>{number}</div>
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 700, color: '#0A2540' }}>{title}</div>
        </div>
        <Badge color={status === 'built' ? '#16A34A' : '#2BA5A0'}>{status === 'built' ? 'PRODUCTION' : 'ROADMAP'}</Badge>
      </div>
      {children}
    </div>
  )
}

export default function HeatSyncDocs() {
  return (
    <div style={S.page}>
      <div style={{ marginBottom: 8 }}>
        <a href="/docs" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#2BA5A0', textDecoration: 'none' }}>← docs</a>
      </div>
      <h1 style={S.h1}>HeatSync</h1>
      <p style={S.sub}>
        The world's first end-to-end AI-assisted surf competition platform.
        Competition management, wearable telemetry, computer vision, and judge assistance — unified in a single stack.
      </p>

      {/* Problem */}
      <h2 style={S.h2}>The Problem</h2>
      <p style={S.p}>
        Surf competition technology is fragmented. Competition management, AI vision, wearable telemetry,
        and judge assistance are spread across separate providers with no integration between them.
        No single platform combines all five capabilities.
      </p>
      <table style={S.table}>
        <thead>
          <tr><th style={S.th}>Provider</th><th style={S.th}>Does</th><th style={S.th}>Doesn't</th></tr>
        </thead>
        <tbody>
          {[
            ['LiveHeats', 'Competition management, live results', 'AI, vision, telemetry'],
            ['Flowstate AI', 'Computer vision, maneuver detection', 'Ocean competitions, comp management'],
            ['Refresh Technology', 'Legacy scoring hardware, judge replay', 'Cloud, AI, modern UI'],
            ['WSL/AWS', 'Apple Watch telemetry, broadcast AI', 'Judge assistance, open platform'],
            ['STACT', 'Generic event management', 'AI, surf-specific features'],
          ].map(([p, d, nd], i) => (
            <tr key={i}><td style={S.td}><strong>{p}</strong></td><td style={S.td}>{d}</td><td style={S.td}>{nd}</td></tr>
          ))}
        </tbody>
      </table>

      {/* Platform Layers */}
      <h2 style={S.h2}>The Platform</h2>
      <p style={S.p}>HeatSync is built in six layers — three production, three in development.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
        <LayerCard number={1} title="Competition Management" status="built">
          <ul style={S.ul}>
            <li style={S.li}>Full ISA-compliant event lifecycle: registration → seeding → draw → heats → scoring → results → season points</li>
            <li style={S.li}>5-judge blind scoring with drop high/low</li>
            <li style={S.li}>Priority management with ISA establishment phase</li>
            <li style={S.li}>Interference handling (half penalty on 2nd-best wave, double = DQ)</li>
            <li style={S.li}>Head judge panel with outlier detection and score overrides</li>
            <li style={S.li}>Auto-advancement with snake seeding</li>
            <li style={S.li}>Public live results, admin dashboard, print heat sheets, tabulation</li>
          </ul>
        </LayerCard>

        <LayerCard number={2} title="Apple Watch Priority Display" status="built">
          <ul style={S.ul}>
            <li style={S.li}>Real-time priority position on surfer's wrist via Apple Watch Ultra</li>
            <li style={S.li}>WebSocket relay server (Supabase Realtime → Node.js → watchOS)</li>
            <li style={S.li}>Zero-typing connect flow — surfer taps heat, taps name</li>
            <li style={S.li}>Score updates, interference alerts, countdown timer</li>
            <li style={S.li}>Haptic feedback — priority change, interference, 30-second warning</li>
            <li style={S.li}>50 reconnect attempts with exponential backoff for WiFi range drops</li>
            <li style={S.li}>ISA-compliant: displays only publicly available data</li>
          </ul>
        </LayerCard>

        <LayerCard number={3} title="Livestream and Broadcast" status="built">
          <ul style={S.ul}>
            <li style={S.li}>Cloudflare Stream integration with HLS player</li>
            <li style={S.li}>Score overlay API for OBS — real-time athlete data, positions, DQ status</li>
            <li style={S.li}>VOD library for replays</li>
          </ul>
        </LayerCard>

        <LayerCard number={4} title="Watch Telemetry" status="planned">
          <ul style={S.ul}>
            <li style={S.li}>Extend existing watch infrastructure to capture accelerometer, gyroscope, GPS</li>
            <li style={S.li}>Wave detection from motion patterns (paddle → popup → ride → kickout)</li>
            <li style={S.li}>Auto-count waves without manual input from head judge</li>
            <li style={S.li}>Per-wave metrics: ride duration, speed, G-force on turns</li>
            <li style={S.li}>Stream sensor data alongside priority via existing relay</li>
          </ul>
        </LayerCard>

        <LayerCard number={5} title="Computer Vision" status="planned">
          <ul style={S.ul}>
            <li style={S.li}>Process standard broadcast and drone feeds — no proprietary hardware</li>
            <li style={S.li}>Jersey color detection for surfer identification</li>
            <li style={S.li}>Maneuver classification: bottom turn, cutback, snap, aerial, barrel, floater</li>
            <li style={S.li}>Wave quality metrics: wave size, section length, tube time</li>
            <li style={S.li}>Spray height measurement via computer vision</li>
            <li style={S.li}>Edge AI on standard camera feeds</li>
          </ul>
        </LayerCard>

        <LayerCard number={6} title="Judge Co-Pilot" status="planned">
          <ul style={S.ul}>
            <li style={S.li}>Real-time objective data overlay on judge's iPad</li>
            <li style={S.li}>AI score range suggestion based on CV + telemetry analysis</li>
            <li style={S.li}>Consistency alerts when judge diverges from panel average</li>
            <li style={S.li}>Historical comparison with similar waves from past events</li>
            <li style={S.li}>Post-heat audit report for head judge review</li>
            <li style={S.li}>Positioned as "Judging Aid" — assists, never replaces human judgment</li>
          </ul>
        </LayerCard>
      </div>

      {/* Capability Matrix */}
      <h2 style={S.h2}>Capability Matrix</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Capability</th>
              <th style={S.th}>HeatSync</th>
              <th style={S.th}>WSL/AWS</th>
              <th style={S.th}>Flowstate</th>
              <th style={S.th}>LiveHeats</th>
              <th style={S.th}>Refresh</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Competition management', '✅', '—', '—', '✅', 'Partial'],
              ['ISA blind judging (5-panel)', '✅', '—', '—', '✅', '✅'],
              ['Priority + interference', '✅', '—', '—', '✅', '✅'],
              ['Apple Watch for athletes', '✅', '✅', '—', '—', '—'],
              ['Computer vision (ocean)', 'Planned', 'Roadmap', 'Pools only', '—', '—'],
              ['AI maneuver detection', 'Planned', '—', '✅*', '—', '—'],
              ['AI judge assistance', 'Planned', '—', '—', '—', '—'],
              ['Wearable telemetry', 'Planned', '✅', '—', '—', '—'],
              ['Livestream overlay', '✅', '✅', '—', '—', '✅'],
              ['Real-time WebSocket', '✅', '✅', '—', '—', '—'],
              ['Cloud-native', '✅', '✅', '✅', '✅', '—'],
            ].map(([cap, hs, wsl, fs, lh, rt], i) => (
              <tr key={i}>
                <td style={S.td}>{cap}</td>
                <td style={{ ...S.td, fontWeight: hs === '✅' || hs === 'Planned' ? 600 : 400, color: hs === '✅' ? '#16A34A' : hs === 'Planned' ? '#2BA5A0' : '#94A3B8' }}>{hs}</td>
                <td style={{ ...S.td, color: wsl === '✅' ? '#16A34A' : wsl === 'Roadmap' ? '#EAB308' : '#94A3B8' }}>{wsl}</td>
                <td style={{ ...S.td, color: fs === '✅*' ? '#16A34A' : fs === 'Pools only' ? '#EAB308' : '#94A3B8' }}>{fs}</td>
                <td style={{ ...S.td, color: lh === '✅' ? '#16A34A' : '#94A3B8' }}>{lh}</td>
                <td style={{ ...S.td, color: rt === '✅' ? '#16A34A' : rt === 'Partial' ? '#EAB308' : '#94A3B8' }}>{rt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#94A3B8', marginTop: -16 }}>
        *Flowstate AI operates in surf parks only (controlled cameras, consistent waves). Not built for ocean competition.
      </p>

      {/* Architecture */}
      <h2 style={S.h2}>Architecture</h2>
      <pre style={S.pre}>{`┌──────────────────────────────────────────────────────────┐
│                    HEATSYNC PLATFORM                     │
├──────────┬──────────┬──────────┬──────────┬──────────────┤
│  JUDGE   │  WATCH   │  CAMERA  │ BROADCAST│  ADMIN /     │
│  iPad    │  Ultra   │  FEED    │  OBS     │  PUBLIC      │
├──────────┴──────────┴──────────┴──────────┴──────────────┤
│                   PROCESSING LAYER                        │
│  CV Engine · Telemetry · Wave Detection · Maneuver ID    │
├──────────────────────────────────────────────────────────┤
│                  SUPABASE (CLOUD)                         │
│  Scores · Priority · Telemetry · CV Results · Realtime   │
├──────────────────────────────────────────────────────────┤
│                WEBSOCKET RELAY SERVER                     │
│          Supabase Realtime → Watches / Clients           │
├──────────────────────────────────────────────────────────┤
│                  DELIVERY LAYER                           │
│  Judge Co-Pilot · Watch Priority · Live Results · OBS    │
└──────────────────────────────────────────────────────────┘`}</pre>

      {/* ISA Compliance */}
      <h2 style={S.h2}>ISA Compliance</h2>
      <p style={S.p}>
        HeatSync is built for full compliance with the International Surfing Association rulebook (April 2025)
        and ISA Judging Manual. Key compliance points:
      </p>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Requirement</th><th style={S.th}>Implementation</th></tr></thead>
        <tbody>
          {[
            ['5-judge panel mandated', 'Full 5-panel support with drop high/low averaging'],
            ['Human-in-the-loop', 'Priority and interference calls by judges only. AI is advisory, never autonomous'],
            ['AI cannot autonomously score', 'AI classified as "Judging Aid" (same as Refresh replay system). Suggests, never decides'],
            ['Electronic coaching rules', 'Watch displays only publicly available data — priority, time, published scores'],
            ['Blind judging', 'Judges see only their own scores. No cross-judge visibility'],
            ['Head judge authority', 'Head judge can override any score (with logged reason), certify heats, manage priority'],
            ['Protest window', '15-minute window after certification. Scores locked.'],
          ].map(([req, impl], i) => (
            <tr key={i}><td style={S.td}><strong>{req}</strong></td><td style={S.td}>{impl}</td></tr>
          ))}
        </tbody>
      </table>

      {/* Training Data Flywheel */}
      <h2 style={S.h2}>Training Data Flywheel</h2>
      <p style={S.p}>
        Every competition event generates labeled training data that improves the AI:
      </p>
      <pre style={S.pre}>{`Video (multiple angles)
  + Human judge scores (ground truth)
  + Watch telemetry (motion data)
  = Labeled training examples per wave`}</pre>
      <ul style={S.ul}>
        <li style={S.li}>Each scored wave becomes a training example with video + motion + human judgment</li>
        <li style={S.li}>More events = better AI = more federations = more data</li>
        <li style={S.li}>After 50 events (~2,000 scored waves): meaningful dataset</li>
        <li style={S.li}>After 200 events: largest ocean surf competition dataset in existence</li>
        <li style={S.li}>Open dataset potential for academic partnerships and credibility</li>
      </ul>

      {/* Market Context */}
      <h2 style={S.h2}>Market Context</h2>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Metric</th><th style={S.th}>Value</th></tr></thead>
        <tbody>
          {[
            ['Global surfing population', '35 million'],
            ['Surf equipment and tech market', '$4.59B (2024)'],
            ['Sports technology market', '$26.79B (2024), 23.2% CAGR'],
            ['AI in sports market', '$8.92B (2024) → $60.78B by 2034'],
            ['ISA member federations', '100+ countries'],
          ].map(([m, v], i) => (
            <tr key={i}><td style={S.td}>{m}</td><td style={S.td}><strong>{v}</strong></td></tr>
          ))}
        </tbody>
      </table>

      {/* Key Risks */}
      <h2 style={S.h2}>Risk Mitigation</h2>
      <table style={S.table}>
        <thead><tr><th style={S.th}>Risk</th><th style={S.th}>Mitigation</th></tr></thead>
        <tbody>
          {[
            ['ISA rejects AI', 'Positioned as "Judging Aid" (same classification as Refresh replay). Never claims autonomous scoring'],
            ['CV accuracy insufficient', 'Start as supplementary data for judges. Improve with training data flywheel over time'],
            ['Beach WiFi unreliable', 'Apple Watch Ultra has LTE fallback. 50 reconnect attempts. System degrades gracefully'],
            ['Ocean CV harder than pools', 'Start with jersey detection and wave detection (solvable). Complex maneuver classification iterates over time'],
          ].map(([r, m], i) => (
            <tr key={i}><td style={S.td}><strong>{r}</strong></td><td style={S.td}>{m}</td></tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ marginTop: 64, padding: 24, borderRadius: 12, background: '#F0FDFA', border: '1px solid #2BA5A020' }}>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#64748B', margin: 0 }}>
          HeatSync is developed by the Barbados Surfing Association. For partnership inquiries
          and federation pilots, contact <strong>bsa.surf</strong>.
        </p>
      </div>
    </div>
  )
}
