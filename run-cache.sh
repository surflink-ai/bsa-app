#!/bin/bash
cd /Users/aimi/Documents/Projects/bsa-app
source .env.local
SUPABASE_SERVICE_ROLE_KEY="$(echo -n $SUPABASE_SERVICE_ROLE_KEY | tr -d '[:space:]')" SURFLINE_ACCESS_TOKEN="$(echo -n $SURFLINE_ACCESS_TOKEN | tr -d '[:space:]')" npx tsx scripts/cache-surfline.ts