#!/bin/bash
# Surf Intel v2 — 30-min cache job
# Fetches: Surfline premium + WindGuru + NOAA buoys + Open-Meteo + NHC storms
# Stores everything to Supabase. Runs cache-surfline.ts, then swell-alert.ts.

set -euo pipefail
cd "$(dirname "$0")/.."

export NODE_OPTIONS="--max-old-space-size=512"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting cache job..."
npx tsx scripts/cache-surfline.ts

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Running swell alert check..."
npx tsx scripts/swell-alert.ts || true   # don't fail the cache job on alert errors

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cache job complete."
