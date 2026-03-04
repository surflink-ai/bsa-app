# BSA Priority Watch

Real-time priority display for surfers during BSA competitions. Shows priority position, heat timer, wave count, and score on Apple Watch Ultra — with haptic feedback on every priority change.

## Architecture

```
BSA Compete (Supabase) → Relay Server (Mac mini) → iPhone → Apple Watch
                         WebSocket bridge           WatchConnectivity
```

## Components

### 1. Relay Server (`watch-relay/`)
Node.js WebSocket server that bridges Supabase Realtime to watch clients.

```bash
cd watch-relay
npm install
npm start
# or: PORT=8080 node server.js
```

**Endpoints:**
- `ws://IP:8080/?heat_id=xxx&athlete_id=xxx` — Watch connection
- `http://IP:8080/health` — Server health
- `http://IP:8080/heats` — Active heats + connected clients
- `http://IP:8080/qr/HEAT_ID/ATHLETE_ID` — QR connection data

**Messages pushed to clients:**
| Type | Data | Trigger |
|------|------|---------|
| `priority` | position, jersey, waves, score, needs | Any priority/score change |
| `timer` | remaining seconds, formatted, warnings | Every second |
| `interference` | penalty type, is_me, message | Interference called |
| `heat_status` | status, certified, established | Heat state change |
| `haptic` | pattern, message | Special events (30s warning) |

### 2. watchOS App (`WatchApp/`)
SwiftUI app for Apple Watch Ultra (49mm).

**States:**
- **Establishing** — dots showing who's ridden, waiting for priority to lock
- **P1 (Priority)** — gold "P1", "YOUR WAVE" text
- **P2-P4 (Chasing)** — shows "need X.XX" score to move up
- **Interference** — red overlay with penalty details
- **Suspended** — yellow "SUSPENDED" badge

**Haptics:**
| Event | Pattern |
|-------|---------|
| Gained P1 | Double strong buzz (success × 2) |
| Moved up | Single strong buzz (success) |
| Moved down | Click |
| Interference on you | Double failure buzz |
| 30 seconds remaining | Double warning buzz |
| Heat ended | Warning buzz |

### 3. iPhone Companion (TODO)
- WatchConnectivity bridge
- QR code scanner for easy pairing
- Backup display

## Setup for Competition Day

1. Start relay server on Mac mini:
   ```bash
   cd watch-relay && npm start
   ```

2. Connect Mac mini to beach WiFi hotspot

3. On each surfer's iPhone:
   - Open BSA Priority Watch app
   - Enter relay IP (e.g., `ws://192.168.1.100:8080`)
   - Scan QR code from head judge panel (or enter heat + athlete ID)

4. Watch automatically receives priority updates via WatchConnectivity

## ISA Compliance

This app displays ONLY publicly available competition data:
- Priority position (visible on physical priority disc)
- Heat timer (visible on scoreboard)
- Wave count
- Total score (public results)

**No coaching data, strategy, or advice is provided.**
Compliant with ISA Electronic Coaching rules.

## Development

Open `BSAPriorityWatch.xcodeproj` in Xcode 16+.
Targets: watchOS 11+, iOS 18+.

Test with relay: `cd watch-relay && npm run dev`
Test client: `node watch-relay/test-client.js HEAT_ID ATHLETE_ID`
