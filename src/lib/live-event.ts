import { createClient } from '@supabase/supabase-js'

/**
 * Single source of truth for "which LiveHeats event is live right now".
 *
 * Reads the `live_event` row from site_settings (admin-editable), cached
 * in-memory for a short TTL so high-frequency pollers (the live scores
 * endpoint) don't hit the database every few seconds. Falls back to the
 * LIVEHEATS_LIVE_EVENT_ID env var so there is never a hardcoded ID in code.
 */

const TTL_MS = 30_000
let cache: { value: string | null; at: number } | null = null

export async function getLiveEventId(): Promise<string | null> {
  const now = Date.now()
  if (cache && now - cache.at < TTL_MS) return cache.value

  let value: string | null = process.env.LIVEHEATS_LIVE_EVENT_ID || null

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (url && anon) {
    try {
      const supabase = createClient(url, anon)
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'live_event')
        .single()
      const fromDb = data?.value?.liveheats_event_id
      if (fromDb) value = String(fromDb)
    } catch {
      /* fall back to env */
    }
  }

  cache = { value, at: now }
  return value
}
