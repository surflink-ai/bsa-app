#!/bin/bash
# Surf Intel v2 — Send surf report to Telegram.
# Usage: ./scripts/run-surf-report.sh [morning|afternoon|evening]
#   morning   → standard AM report (default)
#   afternoon → afternoon check-in
#   evening   → 9 PM report + 7-day outlook + chart image

set -euo pipefail
cd "$(dirname "$0")/.."

KIND="${1:-morning}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sending ${KIND} surf report..."
KIND="$KIND" npx tsx scripts/surf-telegram.ts
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Done."
