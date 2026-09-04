#!/bin/bash
# /surf on-demand — sends an immediate surf report.
# Triggered manually or via OpenClaw automation when /surf is detected.

set -euo pipefail
cd "$(dirname "$0")/.."

echo "[$(date '+%Y-%m-%d %H:%M:%S')] /surf triggered — sending on-demand report..."

# Determine KIND by current hour (AST = UTC-4)
HOUR=$(TZ=America/Barbados date +%H)
if   [ "$HOUR" -ge 18 ]; then KIND="evening"
elif [ "$HOUR" -ge 12 ]; then KIND="afternoon"
else KIND="morning"
fi

KIND="$KIND" npx tsx scripts/surf-telegram.ts
echo "[$(date '+%Y-%m-%d %H:%M:%S')] On-demand report sent (kind=$KIND)."
