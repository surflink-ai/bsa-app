# AI Surf Judging — Market Research & Competitive Analysis

## The Competitive Landscape

### Tier 1 — Current Market Leaders

**1. WSL + AWS (Incumbent)**
- Apple Watch telemetry on surfers: ~100 data points/sec (GPS, speed, acceleration, heart rate)
- AWS processes data in real-time → stats for broadcast (wave speed, ride duration, turn data)
- Amazon Bedrock generates narrative insights for commentators
- NO AI scoring. NO judge assistance. Broadcast-only.
- **Gap: Zero judge-facing AI. Zero computer vision. Just telemetry + storytelling.**
- Relationship: Exclusive multi-year deal with WSL. ISA does NOT have this.

**2. Flowstate AI (Surf Park Leader)**
- 7.4 million wave dataset — largest in the world
- Real-time maneuver recognition (snaps, carves, barrels, airs)
- Auto-crops and edits video highlights
- Installed at 6+ surf parks (Palm Springs, URBNSURF, The Wave, Revel Surf, o2 SURFTOWN)
- Performance tracking, coaching tools, competition scoring assistance
- **Gap: Surf park only (controlled environment, fixed cameras, consistent waves). Not built for ocean competition. No judge panel integration. No priority/interference. No ISA compliance.**
- CTO: Chris Hausler. Head Coach: Andy King

**3. LiveHeats (Competition Management)**
- Dominant in grassroots/federation competition management
- Used by Surfing Australia, many national feds
- Heat management, registration, live results, season points
- **Gap: Zero AI. Zero computer vision. Just a digital scorecard.**

**4. STACT (Event Management + Scoring)**
- Based in Encinitas, CA (BoardScore Inc.)
- Hundreds of events globally including Chile national federation
- Mobile app for fans + Event Manager for organizers
- API integrations with other scoring systems
- **Gap: Zero AI. Broader sports focus (bodyboarding, skateboarding, motocross). Not surf-specialized AI.**

**5. Refresh Technology (Broadcast Scoring)**
- 28 years in judging systems since 1995
- Portable, internet-independent systems
- Broadcast graphics (chroma key), judge replay (5 cameras), LED displays
- Used at WSL QS events and national tours
- **Gap: Legacy tech. Zero AI. Hardware-heavy (requires on-site operator). No cloud. No modern web UI.**

**6. JudgeMate (Digital Judging Platform)**
- Tablet-based scoring for panel judges
- Auto-calculates averages, drop high/low
- Real-time heat totals
- **Gap: Generic judging platform (not surf-specific AI). Zero vision. Just digitized paper scorecards.**

### Tier 2 — Emerging/R&D Players

**7. Cub Digital (NZ — AI Judging R&D)**
- Built AI-powered scoring system for "a large surfing organisation" (unnamed client, likely Surfing NZ or similar)
- Computer vision: wave height detection, surfer positioning, performance metrics
- POC/R&D stage — not publicly deployed at scale
- Also work with High Performance Sport NZ (Olympics) and David Nyika (boxer)
- **Gap: Consultancy, not product company. Built it for one client. No public platform. No distribution.**

**8. Microsoft + USA Surfing**
- Collaboration on AI movement analysis
- Details scarce — likely Azure CV services
- **Gap: R&D/marketing partnership. No production system.**

**9. Flowcast**
- Expanding from wave pools to beach environments
- AI-powered video capture
- **Gap: Very early. Limited public info.**

### Tier 3 — Academic/Indie

**10. Oliver Ricken (Medium/ML Research)**
- Personal project training CV model on surf camera footage
- Deep neural networks for still image inference
- **Gap: Academic project. No product.**

---

## The Critical Gaps (Where BSA Wins)

Nobody has built an integrated system that does ALL of this:

| Capability | WSL/AWS | Flowstate | LiveHeats | STACT | Refresh | Cub | BSA Compete |
|---|---|---|---|---|---|---|---|
| Competition management | - | - | YES | YES | Partial | - | YES |
| ISA-compliant blind judging | - | - | YES | YES | YES | - | YES |
| Multi-judge panel scoring | - | - | YES | YES | YES | - | YES |
| Priority management | - | - | YES | YES | YES | - | YES |
| Apple Watch for athletes | YES | - | - | - | - | - | YES |
| Computer vision (ocean) | - | - | - | - | - | POC | **PLANNED** |
| AI maneuver detection | - | YES* | - | - | - | POC | **PLANNED** |
| AI score suggestion | - | - | - | - | - | POC | **PLANNED** |
| Judge bias detection | - | - | - | - | - | - | YES (basic) |
| Real-time telemetry | YES | YES* | - | - | - | - | **PLANNED** |
| Livestream overlay | - | - | - | - | YES | - | YES |
| WebSocket relay to watches | - | - | - | - | - | - | YES |

*Flowstate = surf parks only (controlled environment)

**The killer insight: Nobody has combined competition management + AI vision + wearable telemetry + judge assistance into one platform.** WSL has telemetry but no judge AI. Flowstate has vision but only in pools. LiveHeats has comp management but zero AI. Cub built a POC but has no platform.

---

## Positioning Strategy: "SurfVision AI"

### The Pitch
**BSA Compete + SurfVision AI = the world's first end-to-end AI-assisted surf competition platform.**

From registration to final results, with AI at every layer:
- **Before the heat**: AI-powered seeding based on historical performance data
- **During the heat**: Real-time CV maneuver detection, wave quality analysis, telemetry from watches
- **At the judge's table**: AI score range suggestions, consistency alerts, blind panel with outlier detection
- **After the heat**: Automated highlight reels, performance reports, season analytics
- **For fans**: AI commentary, score predictions, interactive overlays

### Why BSA Wins Over Each Competitor

**vs WSL/AWS**: You have the full competition stack (they outsource to LiveHeats). You have judge-facing AI (they have broadcast-only). You're ISA-compliant (they're WSL-proprietary). You're affordable (they cost millions).

**vs Flowstate**: You work in the ocean, not just pools. You have competition management. You have judge integration. Their CV is trained on pool waves — ocean is harder and more valuable.

**vs LiveHeats**: They're a digital scorecard. You're an AI platform. Their moat is distribution (federations use them). Your moat is technology nobody else has.

**vs Refresh**: They've been doing the same thing for 28 years. Hardware-heavy, internet-independent legacy approach. You're cloud-native, AI-first, runs on iPads.

**vs Cub Digital**: They built a POC for one client. You have a production platform already running events. They're a consultancy; you're a product.

### The ISA/WSL Contract Play

**ISA is the better first target.** Why:
1. ISA doesn't have a tech partner (WSL has AWS). ISA uses whatever the host nation provides.
2. ISA governs ALL national federations — win ISA, you're the standard for 100+ countries.
3. ISA is the Olympic pathway — surfing is in LA 2028. They need modern tech NOW.
4. ISA events are smaller scale = easier to prove the system works.
5. ISA cares about standardization across federations — a unified platform is exactly what they want.

**Approach:**
1. Run BSA events flawlessly (March 14 = first live test)
2. Document everything — case study with data
3. Build the AI layer (CV + telemetry + judge assist)
4. Approach ISA Technical Committee with a demo
5. Offer free pilot at an ISA-sanctioned event (Pan Am Games qualifiers, World Juniors, etc.)
6. Once ISA adopts, WSL conversations follow naturally

### Revenue Model
- **Federation licenses**: $X/year per national federation (ISA pushes adoption)
- **Event fees**: Per-event pricing for non-federation events
- **AI tier**: Premium AI features (CV, telemetry, judge assist) as upsell
- **Data/analytics**: Historical performance data, scouting reports
- **Broadcast integration**: Real-time overlays and AI commentary for livestreams

---

## Technical Roadmap: AI Layer

### Phase 1 — Foundation (What We Have)
- [x] Full ISA-compliant competition management
- [x] Multi-judge blind scoring with outlier detection
- [x] Apple Watch priority display via WebSocket relay
- [x] Livestream with score overlay
- [x] Real-time Supabase → watch pipeline (tested, working)

### Phase 2 — Watch Telemetry (Build on Existing Watch Infrastructure)
- [ ] Extend watch app to capture accelerometer + gyroscope data during heat
- [ ] Stream sensor data to relay server alongside priority
- [ ] Wave detection from motion patterns (paddle → popup → ride → kickout)
- [ ] Auto-count waves without head judge manually tapping
- [ ] Ride duration, speed estimates from GPS
- [ ] Store per-wave telemetry in Supabase for analysis

### Phase 3 — Computer Vision (Camera Analysis)
- [ ] Ingest livestream feed (already have Cloudflare Stream)
- [ ] Jersey color detection for surfer identification (we have the hex colors)
- [ ] Wave detection: identify when a surfer is actively riding
- [ ] Basic maneuver classification: bottom turn, cutback, snap, aerial, barrel
- [ ] Wave quality scoring: wave size, section length, tube time
- [ ] Priority tracking: who's deepest, who's closest to peak

### Phase 4 — Judge Assistance
- [ ] AI score range suggestion: "Based on maneuvers detected: 6.5–7.5"
- [ ] Consistency monitoring: "Your average is 2.1 below panel mean this heat"
- [ ] Historical comparison: "Similar waves scored 7.2 avg in last 3 events"
- [ ] Head judge dashboard: AI flags heats where human scores diverge significantly from AI estimate
- [ ] Post-heat audit: automated report comparing AI analysis to actual scores

### Phase 5 — Fan Experience & Broadcast
- [ ] AI-generated real-time commentary
- [ ] Score predictions overlay on livestream
- [ ] Automated highlight detection and clip generation
- [ ] "Need X to advance" predictions based on historical performance
- [ ] Interactive second-screen experience for fans

### Phase 6 — Training Data Flywheel
- [ ] Every BSA event generates labeled training data (video + human scores + telemetry)
- [ ] Model improves with each event
- [ ] Federation-specific calibration (different regions score differently)
- [ ] Open dataset possibility (academic partnerships, credibility)

---

## Key Technical Decisions Needed

1. **CV Model**: Build vs API? Gemini/Claude multimodal for early POC, custom model for production?
2. **Edge vs Cloud**: Process video on-site (low latency, works offline) or cloud (easier, more power)?
3. **Training data**: How to label? Use human judge scores as ground truth? Manual annotation?
4. **Privacy**: Surfer telemetry data ownership? Opt-in for biometric data?
5. **ISA rules**: Need to verify AI assistance is permitted under current ISA judging rules
6. **Latency target**: How fast does CV analysis need to be? Real-time (seconds) or post-wave (acceptable)?

---

## Immediate Next Steps

1. Lock down March 14 event — flawless BSA Compete demo
2. Start capturing training data: record all heats from multiple angles with timestamps synced to judge scores
3. Build Phase 2 (watch telemetry) — extends existing infrastructure
4. POC Phase 3 with Gemini Vision API — feed frames from livestream, test maneuver detection
5. Write the ISA pitch deck
6. Register SurfVision AI domain/brand
