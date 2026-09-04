#!/bin/bash
# On-demand surf report. Called by the /surf Telegram command handler.
cd /Users/aimi/Documents/Projects/bsa-app || exit 1
set -a
source .env.local
set +a
exec npx tsx scripts/surf-telegram.ts
