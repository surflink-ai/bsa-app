# BSA Priority Watch

Real-time priority display for surfers. Apple Watch Ultra connects **directly to Supabase** over the internet — no relay server, no iPhone.

## Architecture

```
Supabase Realtime (cloud) ← internet ← Starlink + UniFi AP ← WiFi → Apple Watch Ultra
                                                                       (on surfer's wrist)
```

**Zero infrastructure at the beach** besides the Starlink + UniFi outdoor AP you already have.

The watch:
1. Joins the beach WiFi (Starlink + UniFi)
2. Connects directly to Supabase Realtime over WSS
3. Polls Supabase REST API every 3s as backup
4. Runs timer locally (no network needed once started)

## How It Works

| Layer | What | Failover |
|-------|------|----------|
| **Realtime** | Supabase WebSocket push on any DB change | If dropped, polling takes over |
| **Polling** | REST API every 3 seconds | Always running as backup |
| **Timer** | Local countdown from heat start time | Network-independent |
| **Haptics** | Local on watch | Triggered by state changes |

Even if WiFi drops for 30 seconds while a surfer is out in the lineup, the timer keeps counting locally. When WiFi reconnects, the next poll (within 3s) catches up on priority/score changes.

## Beach Setup

**Equipment needed:**
- Starlink dish + router
- UniFi outdoor AP (aimed at lineup)
- That's it. No Mac mini, no laptop.

**Before the event:**
- Pre-pair each Apple Watch Ultra with the WiFi network name + password
- Load BSA Priority Watch app on each watch

**Before each heat:**
- Head judge starts heat in BSA Compete admin
- Each surfer opens the app, enters heat ID + their athlete ID, taps "Go"
- Watch connects, shows "Establishing..." phase
- Surfer paddles out

## WiFi Range

| Setup | Range | Notes |
|-------|-------|-------|
| Starlink router only | ~30m | Too short for most lineups |
| + UniFi U6 Mesh | ~60m | OK for close breaks |
| + UniFi U6 Long-Range | ~120m | Covers Drill Hall |
| + UniFi nanoHD outdoor | ~180m | Covers most breaks |

Drill Hall lineup is ~80-100m from shore. A UniFi Long-Range AP covers it.

## watchOS App

**States:**
| State | Display |
|-------|---------|
| Establishing | Dots showing who's ridden. "2 of 3 riders" |
| P1 | Gold "P1" + "YOUR WAVE" |
| P2-P4 | Silver/bronze + "need X.XX" score |
| Interference | Red overlay + penalty details |
| Suspended | Yellow "SUSPENDED" badge |
| DQ | Red "DISQUALIFIED" |

**Haptics:**
| Event | Pattern |
|-------|---------|
| Gained P1 | Double strong buzz |
| Moved up | Single buzz |
| Moved down | Click |
| Interference on you | Double failure buzz |
| 30 seconds left | Double warning |

## Files

```
BSAPriorityWatch/
├── WatchApp/
│   ├── BSAPriorityWatchApp.swift    # Entry point
│   ├── Views/
│   │   ├── PriorityView.swift       # Main watch face
│   │   └── ConnectView.swift        # Heat + athlete ID input
│   ├── Services/
│   │   └── RelayConnection.swift    # Supabase direct connection
│   └── Models/                      # (future)
├── Shared/
│   └── PriorityState.swift          # Data models
└── README.md
```

## Development

1. Create Xcode project: watchOS App (watchOS 11+)
2. Add files from `WatchApp/` and `Shared/`
3. Bundle ID: `surf.bsa.priority-watch`
4. Capabilities: Background Modes (WebSocket), WiFi
5. Build to Apple Watch Ultra simulator or device

## Relay Server (Optional)

The `watch-relay/` directory contains an optional Node.js WebSocket relay server. Use this if you want to:
- Add custom logic (QR pairing, admin dashboard)
- Run on a local network without internet
- Add authentication layer

For standard use, the direct Supabase connection is simpler and more reliable.
