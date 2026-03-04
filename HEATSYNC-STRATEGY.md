# HeatSync — Strategy & Go-to-Market Plan
## The World's First End-to-End AI-Assisted Surf Competition Platform
### Prepared March 4, 2026

---

## Executive Summary

HeatSync combines ISA-compliant competition management, multi-judge blind scoring, Apple Watch athlete telemetry, computer vision analysis, and livestream broadcast into a single unified platform. No competitor offers all five. The $8.92B AI in sports market is growing at 21%+ CAGR to $60.78B by 2034. ISA has no technology partner — Refresh Technology (est. 1996) provides legacy hardware scoring. We replace them.

---

## 1. Market Opportunity

| Metric | Value | Source |
|--------|-------|--------|
| Global surfing population | 35 million | Industry Research |
| Surf equipment & tech market | $4.59B (2024) | Straits Research |
| Sports technology market | $26.79B (2024), 23.2% CAGR | Statifacts |
| AI in sports market | $8.92B → $60.78B by 2034 | Precedence Research |
| ISA member federations | 100+ countries | ISA |
| LiveHeats events/year | 5,000+ in 50 countries | LiveHeats |
| Flowstate waves captured | 525,000+ at Waco Surf alone (2025) | Blooloop |

**The gap:** No company combines competition management + AI vision + wearable telemetry + judge assistance + broadcast. The market is fragmented across 6+ providers, each doing one piece.

---

## 2. Competitive Landscape

### What Each Competitor Has (and Doesn't)

| Capability | HeatSync | WSL/AWS | Flowstate | LiveHeats | Refresh | STACT | Kazo |
|-----------|-----------|---------|-----------|-----------|---------|-------|------|
| Competition management | YES | - | - | YES | Partial | YES | - |
| ISA-compliant blind judging | YES | - | - | YES | YES | YES | YES |
| Multi-judge panel (5) | YES | - | - | YES | YES | YES | YES |
| Priority/interference mgmt | YES | - | - | YES | YES | YES | - |
| Apple Watch for athletes | YES | YES | - | - | - | - | - |
| Computer vision (ocean) | PLANNED | Roadmap | Pools only | - | - | - | - |
| AI maneuver detection | PLANNED | - | YES* | - | - | - | - |
| AI judge assistance | PLANNED | - | - | - | - | - | - |
| Wearable telemetry | PLANNED | YES | - | - | - | - | - |
| Livestream overlay | YES | YES | - | - | YES | - | - |
| Real-time WebSocket relay | YES | YES | - | - | - | - | - |
| Edge AI (no hardware) | PLANNED | - | YES | - | - | - | - |
| Cloud-native | YES | YES | YES | YES | - | YES | - |

*Flowstate = surf parks only (controlled cameras, consistent waves)

### Competitor Deep Dive

**LiveHeats** — $1.8M funded, 5,000 events/year, backed by Joel Parkinson. Dominant in grassroots. Zero AI. Zero vision. Zero telemetry. Pure digital scorecard. Their moat is distribution, not technology.

**Flowstate AI** — Best CV in surf, but locked to wave pools. 525K+ waves captured. Edge-based cameras, biometric surfer ID without wearables. B2B2C revenue sharing on video packages. Cannot operate in open ocean (variable cameras, lighting, waves).

**Refresh Technology** — ISA's current tech partner (since 1996). Windows-based local servers, heavy hardware stacks, multi-camera "Judge Replay Systems." Hired with trained personnel per event. Legacy. No AI. No cloud. No modern UI.

**WSL/AWS** — Apple Watch telemetry (100 data points/sec), Amazon Kinesis streaming, Bedrock Gen AI for broadcaster narratives. Exclusive deal. Broadcast-only — judges don't see any of it. Future roadmap includes CV but not yet built.

**STACT** — Bootstrapped, Carlsbad CA. NSSA, APB World Tour. Freemium SaaS. No AI. Generic action sports.

**Kazo Vision** — Chinese hardware company. Ultra Score Terminal, 8-channel HD VAR. Primarily taekwondo/basketball. Hardware CapEx model.

**Cub Digital** — NZ agency. Built one CV POC for unnamed client. Not a product company.

**USA Surfing + Microsoft** — Azure AI hackathon project for Olympic coaching. 3D biomechanical analysis from single camera. Coaching tool, not judging.

---

## 3. Regulatory Framework

### ISA Rules (Critical Compliance)

1. **5-judge panel mandated** for top-tier events. Scores 0.1–10.0, drop high/low, average middle 3. ✅ We have this.

2. **Human-in-the-loop required.** Priority and interference calls by Priority Judge and Head Judge only. No protests against subjective scoring. ✅ We have this.

3. **AI cannot autonomously score a heat.** Technology must be categorized as a **"Judging Aid"** or **"Video Arbitration"** tool. This is how Refresh Technology's replay system is classified. ✅ Our AI is an aid, not a replacement.

4. **Electronic coaching rules** restrict what data can be displayed to athletes in the water. Only publicly available information allowed. ✅ Our watch displays only priority, time, and published scores.

### Positioning: "The Ultimate Judging Co-Pilot"
Frame AI as assisting judges with objective data (speed, rotation, spray height, wave criticality) — never replacing their subjective judgment. This keeps us ISA-compliant while radically improving consistency. JudgeMate already proved this messaging works: "technology must assist, not replace."

---

## 4. The HeatSync Platform

### Layer 1: Competition Management (BUILT)
- Full event lifecycle: registration → seeding → draw → heats → scoring → results → season points
- ISA-compliant blind judging with 3-5 judge panels
- Priority management with establishment phase
- Interference handling (half, zero, DQ)
- Head judge panel with outlier detection
- Auto-advancement with snake seeding
- Public live results, admin dashboard

### Layer 2: Apple Watch Priority Display (BUILT)
- Real-time priority position on surfer's wrist
- WebSocket relay server (Supabase → relay → watch)
- Zero-typing connect flow (tap heat → tap name)
- Score updates, interference alerts, timer
- 50 reconnect attempts with exponential backoff
- Haptic feedback (priority change, interference, heat ending)

### Layer 3: Livestream & Broadcast (BUILT)
- Cloudflare Stream integration
- Score overlay API for OBS
- HLS player with real-time updates
- VOD library

### Layer 4: AI Telemetry (BUILD NEXT)
- Extend watch app: accelerometer, gyroscope, GPS capture during heat
- Stream sensor data alongside priority via relay
- **Wave detection from motion patterns** (paddle → popup → ride → kickout)
- Auto-count waves without head judge manually tapping
- Per-wave metrics: ride duration, speed, G-force on turns
- Store telemetry in Supabase for analysis

### Layer 5: Computer Vision (BUILD NEXT)
- Ingest livestream/drone feed
- **Jersey color detection** for surfer identification (we have the hex colors)
- Wave detection: identify when surfer is actively riding
- **Maneuver classification**: bottom turn, cutback, snap, aerial, barrel, floater
- **Wave quality metrics**: wave size, section length, tube time
- **Spray height measurement**: CV-quantified spray on turns
- Priority tracking: who's deepest at the peak

### Layer 6: Judge Co-Pilot (BUILD AFTER CV)
- Real-time objective data overlay on judge's iPad: "Speed: 32 km/h | Rotation: 360° | Spray: 4ft"
- AI score range suggestion based on CV + telemetry: "Suggested: 6.5–7.5"
- Consistency alerts: "Your last 3 scores are 2.1 below panel average"
- Historical comparison: "Similar waves scored 7.2 avg at last 3 events"
- Post-heat audit report for head judge

---

## 5. Go-to-Market Strategy

### Phase 1: Prove It (Now → March 14)
- Run BSA events flawlessly on the platform
- March 14 Drill Hall: parallel test vs LiveHeats
- Document everything — video, data, case study
- Build demo reel showing judge UI, watch, livestream working together

### Phase 2: Regional Adoption (March → June)
- Pitch to Caribbean surfing federations (Barbados, Jamaica, Trinidad)
- Offer free pilot events to 2-3 national federations
- Build case studies with real data
- Launch watch telemetry (Layer 4) — auto wave counting differentiator

### Phase 3: ISA Approach (June → September)
- Contact ISA Technical Committee with demo + case studies
- Offer free pilot at ISA-sanctioned event (Pan Am qualifiers, World Juniors)
- Position as "Judging Aid" — complement to existing Refresh replay system
- Emphasize: cloud-native, runs on iPads, no hardware to ship

### Phase 4: CV & Co-Pilot Launch (September → December)
- Ship computer vision MVP (jersey detection, wave detection, basic maneuver classification)
- Ship Judge Co-Pilot (objective data overlay on iPad)
- Demo at major ISA event
- Begin conversations with WSL about QS/Challenger Series adoption

### Phase 5: Scale (2027)
- ISA official technology partner
- B2B2C: athlete subscriptions for AI-analyzed footage + telemetry
- Wave pool installations (compete with Flowstate on their turf, but with competition management they don't have)
- WSL Challenger Series pilot

---

## 6. Revenue Model

### B2B: Federation Licenses
| Tier | Features | Price |
|------|----------|-------|
| Core | Competition management, scoring, live results | $2,000/year per federation |
| Pro | + Apple Watch priority display, livestream overlay | $5,000/year |
| AI | + CV analysis, telemetry, Judge Co-Pilot | $12,000/year |
| Enterprise | + Custom broadcast integration, API access, white-label | Custom |

### Per-Event Fees
- Small events (<50 athletes): $50/event
- Medium events (50-200): $150/event
- Large/ISA-sanctioned: $500/event

### B2B2C: Athlete Subscriptions
- Free tier: live results, basic stats
- Pro ($9.99/mo): AI-analyzed footage, telemetry overlays, performance tracking
- Team ($29.99/mo): coaching analytics, multi-athlete comparison

### Broadcast Integration
- Livestream overlay API: $1,000/event
- AI commentary generation: $2,000/event
- Full broadcast package (overlay + commentary + highlights): $5,000/event

---

## 7. Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     HEATSYNC PLATFORM                   │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│  JUDGE   │  WATCH   │  CAMERA  │ BROADCAST│   ADMIN/PUBLIC  │
│  iPAD    │  ULTRA   │  FEED    │  OBS     │   WEB APP       │
├──────────┴──────────┴──────────┴──────────┴─────────────────┤
│                    EDGE AI PROCESSOR                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ CV Engine│ │Telemetry │ │ Wave     │ │ Maneuver      │  │
│  │ (Vision) │ │Processing│ │ Detection│ │ Classification│  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    SUPABASE (CLOUD)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Scores   │ │ Priority │ │Telemetry │ │ CV Results    │  │
│  │ (Source  │ │ (Realtime│ │ (Time    │ │ (Maneuvers,   │  │
│  │  of Truth│ │  Enabled)│ │  Series) │ │  Metrics)     │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                  WEBSOCKET RELAY SERVER                      │
│            (Supabase Realtime → Watches/Clients)            │
├─────────────────────────────────────────────────────────────┤
│                    DELIVERY LAYER                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Judge    │ │ Watch    │ │ Live     │ │ Broadcast     │  │
│  │ Co-Pilot │ │ Priority │ │ Results  │ │ Overlay       │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Key Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| ISA rejects AI as non-compliant | Position strictly as "Judging Aid" (same category as Refresh replay). Never claim autonomous scoring |
| LiveHeats adds AI features | They're 6+ years behind on watch + CV infrastructure. Our unified stack is the moat |
| Flowstate enters ocean competitions | Their CV is trained on pool waves. Ocean is fundamentally harder (variable lighting, waves, camera angles). We have competition management they don't |
| WSL/AWS builds scoring into their platform | WSL is exclusive contract, doesn't serve ISA or federations. Different market |
| CV accuracy insufficient for competition use | Start as "supplementary data" for judges, not authoritative. Improve over time with training data flywheel |
| Beach WiFi unreliable for watches | Apple Watch Ultra has LTE fallback. Relay server handles 50 reconnect attempts. System degrades gracefully (priority still works from last known state) |
| Data privacy concerns (biometric telemetry) | Opt-in only. Athletes own their data. GDPR-compliant storage. Clear consent flow |

---

## 9. The Training Data Flywheel

Every BSA event generates labeled training data:
- **Video** (multiple angles) + **human judge scores** (ground truth) + **watch telemetry** (motion data)
- Each wave is a labeled training example: video frames + accelerometer trace + 3-5 judge scores
- More events = better AI = more federations = more data
- After 50 events (~2,000 waves scored), we have a dataset comparable to early Flowstate
- After 200 events, we have the largest ocean surf competition dataset in the world
- Open dataset possibility for academic partnerships = credibility + publications

---

## 10. Why BSA/Adam Wins This

1. **Already built the competition stack.** LiveHeats took 8 years and $1.8M to get where you are today.
2. **Already have the watch infrastructure.** WSL is the only other org doing this. You're the only one doing it for ISA-level events.
3. **Already have the livestream.** Cloudflare Stream, OBS overlay, score API — all working.
4. **ISA has no partner.** Refresh Technology is a 30-year-old Portuguese hardware company. They're ripe for displacement.
5. **Caribbean position.** First-mover advantage in a region with growing surf culture, close to ISA World Games venues.
6. **Technical depth.** The person building this understands both the surfing AND the technology. That's rare.

---

## Immediate Next Steps

1. **March 14:** Flawless BSA Compete demo at Drill Hall
2. **March 15-31:** Build watch telemetry (auto wave counting)
3. **April:** Approach Barbados Surfing Association about official adoption
4. **April:** Register HeatSync brand/domain
5. **May:** CV POC — feed livestream frames to Gemini 3.1 Pro for maneuver detection
6. **June:** ISA pitch deck + demo video
7. **June:** Contact ISA Technical Committee
