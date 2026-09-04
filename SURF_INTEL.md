# Surf Intel v2

Deterministic surf data pipeline for Barbados. Zero LLM tokens. No verdicts. Adam decides.

## Data Sources

| Source | What | Interval | Table |
|--------|------|----------|-------|
| Surfline premium | Hourly forecast + tides + ratings (21 spots) | 30 min cache | `surf_cache` |
| WindGuru ECMWF WAM | Wave height / period / direction | 30 min cache | `surf_cache` |
| NOAA Buoy 41040 | Real ocean measurements ~800nm E of Barbados | 30 min, 48h history | `buoy_readings` |
| NOAA Buoy 41043 | Real ocean measurements further east | 30 min, 48h history | `buoy_readings` |
| Open-Meteo Marine | ECMWF 7-day hourly (east + south coast points) | 30 min cache | `openmeteo_forecasts` |
| NHC Storms | Active Atlantic tropical systems | 30 min cache | `nhc_storms` |

## Scripts

| Script | What | Command |
|--------|------|---------|
| `scripts/cache-surfline.ts` | Fetches all 5 data sources, stores to Supabase | `npx tsx scripts/cache-surfline.ts` |
| `scripts/swell-alert.ts` | Checks alert conditions, sends Telegram if triggered | `npx tsx scripts/swell-alert.ts` |
| `scripts/surf-telegram.ts` | Builds + sends report to Telegram | `KIND=morning npx tsx scripts/surf-telegram.ts` |

## Runner Scripts

```bash
# 30-min cache job (cache + alert check)
./scripts/run-cache-surfline.sh

# Scheduled reports
./scripts/run-surf-report.sh morning    # AM report
./scripts/run-surf-report.sh afternoon  # PM check-in
./scripts/run-surf-report.sh evening    # 9 PM + 7-day outlook + chart

# /surf on-demand (auto-detects morning/afternoon/evening by hour)
./scripts/run-surf-now.sh
```

## Report Format

```
🌊 SURF INTEL — Fri, Sep 4, 1:00 PM AST

🌊 BUOY 41040  |  3.1ft @ 11s ENE  |  📈 +0.8ft/6h
🌊 BUOY 41043  |  2.8ft @ 10s ENE  |  steady

📡 MODEL AGREEMENT: Surfline 3ft · Open-Meteo 3ft · WindGuru 3ft  ✓

━━━━━━━━━━━━━━━━━━━━━━━━
🏄 SOUP BOWL (East)
━━━━━━━━━━━━━━━━━━━━━━━━
Size:  3-4ft  (Surfline: FAIR)
Swell: 3.2ft @ 11s ENE  +  1.8ft @ 7s E windswell
Wind:  ENE 14kt onshore → glassing ~5:30 PM
Tides: ↓ Low 2:41 PM (0.3m)  ↑ High 8:52 PM (1.1m)
Buoy vs model: 41040 says 3.1ft — Surfline 3-4ft ✓

48h: ▃▃▃▄▄▃▃▂ (dropping through evening)
...
```

## KIND Values

- `morning` — standard report (default)
- `afternoon` — afternoon check-in, same format
- `evening` — adds 7-day outlook + sends chart image (PNG via Telegram photo)

## Swell Alerts

Fires a Telegram message when ANY condition triggers:
1. **Buoy 41040**: DPD ≥ 12s AND WVHT > 1.5ft AND no alert in last 12h
2. **Surfline jump**: Soup Bowl 48h peak rises ≥ 2ft vs last alert baseline
3. **NHC storm**: New Atlantic storm within 2500nm with est. swell period ≥ 12s

```bash
# Test alert format (dry run):
DRY_RUN=1 TEST_ALERT=1 npx tsx scripts/swell-alert.ts

# Real test (sends to Telegram):
TEST_ALERT=1 npx tsx scripts/swell-alert.ts
```

## /surf On-Demand

Type `/surf` in any channel — the automation checks for it and runs `run-surf-now.sh`.

To wire this in OpenClaw:
1. Create a 5-min cron automation that runs a bot-polling script
2. **Or** (simpler): trigger `run-surf-now.sh` directly from any shell/SSH session

Quick shortcut from Mac terminal:
```bash
cd ~/Documents/Projects/bsa-app && ./scripts/run-surf-now.sh
```

## OpenClaw Automations

Register these two automations in OpenClaw:

**30-min cache** (every 30 min, no-deliver):
```
Command: /bin/bash /Users/aimi/Documents/Projects/bsa-app/scripts/run-cache-surfline.sh
Schedule: */30 * * * *
```

**Morning report** (6:30 AM AST = 10:30 AM UTC):
```
Command: KIND=morning /bin/bash /Users/aimi/Documents/Projects/bsa-app/scripts/run-surf-report.sh morning
Schedule: 30 10 * * *
```

**Evening report** (9 PM AST = 1 AM UTC):
```
Command: KIND=evening /bin/bash /Users/aimi/Documents/Projects/bsa-app/scripts/run-surf-report.sh evening
Schedule: 0 1 * * *
```

## Supabase Tables

All created via migration `011_surf_intel_v2.sql`:

- `buoy_readings` — NOAA buoy readings, 48h rolling, upserted by `(buoy_id, timestamp)`
- `openmeteo_forecasts` — Open-Meteo 7-day hourly, upserted by `(coast, timestamp)`
- `nhc_storms` — NHC active Atlantic storm snapshots
- `forecast_bias` — Surfline vs buoy accuracy tracking (grows over time)
- `swell_alerts` — Alert deduplication state

## Unit Reference (Surfline API)

- `surf.min / surf.max` → **meters** (convert with × 3.28084 for feet)
- `swells[].height` → **feet** (use directly)
- `wind.speed` → **kph** (× 0.54 for knots)
- Open-Meteo: all values in SI (meters, m/s)
- NOAA buoy: WVHT in meters, WSPD in m/s
