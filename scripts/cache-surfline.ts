/**
 * CLI: refresh the Surfline + WindGuru cache in Supabase.
 *   npm run cache:surf
 *
 * The actual logic lives in src/lib/surf-cache.ts and is shared with the
 * Vercel Cron route (/api/cron/surf-cache), which is the recommended way to
 * run this on a schedule. This CLI is for manual/local runs.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY + Surfline env vars (see .env.example).
 */
import './_supabase' // loads .env.local into process.env
import { refreshSurfCache } from '../src/lib/surf-cache'

refreshSurfCache((m) => console.log(m))
  .then((r) => {
    console.log(
      `${r.ok ? '✅' : '❌'} overview:${r.overviewSpots} premium:${r.premiumSpots} windguru:${r.windguruSpots}` +
        (r.wroteToSupabase ? ' → cached' : ` (not written${r.error ? `: ${r.error}` : ''})`)
    )
    process.exit(r.ok ? 0 : 1)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
