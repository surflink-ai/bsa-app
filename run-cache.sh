#!/bin/bash
# Refresh the Surfline/WindGuru cache in Supabase.
# Runs from the repo root; loads .env.local if present (git-ignored).
set -euo pipefail
cd "$(dirname "$0")"
[ -f .env.local ] && set -a && . ./.env.local && set +a
exec npx tsx scripts/cache-surfline.ts
