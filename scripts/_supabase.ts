/**
 * Shared Supabase config for CLI scripts.
 *
 * Never hardcode credentials. Set these in the environment (or .env.local, which
 * is git-ignored) before running any script:
 *   NEXT_PUBLIC_SUPABASE_URL   (or SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY  (server-only key — bypasses RLS)
 */

function loadDotEnvLocal() {
  // Best-effort load of .env.local so scripts work the same as `next dev`.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { readFileSync } = require('fs') as typeof import('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { join } = require('path') as typeof import('path')
    const content = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
    for (const line of content.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      const key = m[1]
      if (process.env[key]) continue
      process.env[key] = m[2].replace(/^["']|["']$/g, '').replace(/\\n$/, '').trim()
    }
  } catch {
    /* no .env.local — rely on real env */
  }
}

loadDotEnvLocal()

export const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export function requireServiceRole(): { url: string; key: string } {
  if (!SUPABASE_URL) {
    throw new Error(
      'Missing SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL. Set it in the environment or .env.local.'
    )
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. Set it in the environment or .env.local (never commit it).'
    )
  }
  return { url: SUPABASE_URL, key: SUPABASE_SERVICE_ROLE_KEY }
}
