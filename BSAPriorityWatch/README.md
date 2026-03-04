# BSA Priority Watch

Real-time priority display for surfers during BSA competitions. Apple Watch Ultra connects **directly to the relay server over WiFi** — no iPhone needed in the water.

## Architecture

```
BSA Compete (Supabase) → Relay Server (Mac mini) ← WiFi direct → Apple Watch Ultra
                         on beach hotspot           (on surfer's wrist, in the ocean)
```

**No iPhone required.** Apple Watch Ultra has:
- Independent WiFi (connects without iPhone)
- 100m water resistance (designed for ocean)
- Native WebSocket support (watchOS 10+)
- Optional LTE cellular fallback

WSL currently uses physical colored disc/flags only. **BSA would be first to put live priority data on surfers' wrists.**

## Beach Setup

```
[Starlink/MiFi Hotspot] ← WiFi → [Mac mini running relay server]
                         ← WiFi → [Apple Watch Ultra #1 (Red jersey)]
                         ← WiFi → [Apple Watch Ultra #2 (Blue jersey)]
                         ← WiFi → [Apple Watch Ultra #3 (White jersey)]
                         ← WiFi → [Apple Watch Ultra #4 (Yellow jersey)]
                         ← WiFi → [Head Judge iPad]
```

1. Portable WiFi hotspot at the beach (Starlink, MiFi, phone hotspot)
2. Mac mini on the hotspot runs the relay server
3. Each surfer's Apple Watch Ultra pre-joins the hotspot WiFi before paddling out
4. Watch connects directly to relay — works up to ~50-100m from access point
5. For longer range: WiFi repeater aimed at the lineup

**Fallback:** Apple Watch Ultra cellular (LTE) — works anywhere with cell signal

## WiFi Range

| Setup | Range |
|-------|-------|
| Standard WiFi hotspot | ~30-50m |
| WiFi repeater pointed at lineup | ~100-150m |
| Ubiquiti outdoor AP | ~200m+ |
| LTE cellular (Watch Ultra) | Unlimited |

Most lineups at Drill Hall, Soup Bowl, etc. are within 100m of shore.

## Components

### 1. Relay Server (`../watch-relay/`)

```bash
cd watch-relay
npm install
PORT=8080 npm start
```

- Subscribes to Supabase Realtime (priority, scores, interference)
- WebSocket server on port 8080
- Pushes updates to all connected watches
- Auto-cleanup when watches disconnect

### 2. watchOS App (`WatchApp/`)

SwiftUI app for Apple Watch Ultra 49mm.

- **Direct WiFi WebSocket** — no iPhone relay needed
- **Auto-reconnect** — exponential backoff, 50 attempts (surfer may drift in/out of range)
- **Keep-alive ping** every 15 seconds
- **waitsForConnectivity** — automatically reconnects when WiFi comes back

**What the surfer sees:**
- Jersey color stripe matching their vest
- Priority position (P1/P2/P3/P4) — huge, readable in water
- Heat timer countdown
- Wave count
- Total score
- Needs score (what they need to move up)

**Haptics:**
| Event | Pattern |
|-------|---------|
| Gained P1 | Double strong buzz |
| Moved up | Single buzz |
| Moved down | Click |
| Interference on you | Double failure buzz |
| 30 seconds remaining | Double warning |
| Heat ended | Warning buzz |

## Competition Day Workflow

1. **Before heats start:**
   - Start relay server: `cd watch-relay && npm start`
   - Note the Mac mini's IP on the hotspot network
   - Pre-configure each surfer's watch: Settings → WiFi → join beach hotspot

2. **Before each heat:**
   - Head judge assigns athletes to heat in BSA Compete admin
   - Each surfer opens BSA Priority Watch on their Ultra
   - Enter relay IP + heat ID + their athlete ID (or scan QR)
   - Watch shows "Connecting..." then "Establishing..."

3. **During heat:**
   - Priority updates push instantly as head judge manages priority
   - Timer counts down in sync
   - Interference alerts buzz immediately
   - If surfer goes out of WiFi range: watch shows "Reconnecting..." and auto-retries
   - When back in range: auto-reconnects, catches up to current state

4. **After heat:**
   - Watch shows final results
   - Surfer taps X to disconnect, ready for next heat

## ISA Compliance

Displays ONLY publicly available data:
- Priority position (same as physical disc on beach)
- Heat timer (same as scoreboard)
- Wave count, scores (same as live results page)

**No coaching data, strategy, or advice. Read-only. Display only.**

## Development

Requires Xcode 16+ with watchOS 11 SDK.

1. Create new Xcode project: watchOS App
2. Add Swift files from `WatchApp/` and `Shared/`
3. Build target: Apple Watch Ultra (49mm)
4. Test with relay: `cd watch-relay && npm run dev`
