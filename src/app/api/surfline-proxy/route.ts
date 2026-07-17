/**
 * Surfline Proxy — routes Surfline kbyg API calls through Vercel's network so
 * they don't get CF-bot-blocked (residential/datacenter IP issue).
 *
 * Usage: /api/surfline-proxy?path=/spots/forecasts/wave&spotId=xxx&days=1&intervalHours=3
 * with an `x-proxy-secret` header matching SURFLINE_PROXY_SECRET.
 *
 * Security posture (fail CLOSED):
 *   - No secret configured  → 503 (never an open relay).
 *   - Secret via header only (never query string, to avoid log/Referer leaks).
 *   - Path allowlisted to known kbyg endpoints; `..` and absolute URLs rejected.
 *   - No wildcard CORS; rate limited.
 */

import { rateLimit, tooMany } from '@/lib/rate-limit'

const SL_BASE = 'https://services.surfline.com/kbyg'
const SECRET = process.env.SURFLINE_PROXY_SECRET || ''

// Only these kbyg path prefixes may be proxied.
const ALLOWED_PREFIXES = ['/spots/forecasts/', '/regions/overview', '/spots/reports']

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request) {
  // Fail closed: an unset secret disables the proxy rather than opening it.
  if (!SECRET) {
    return new Response(JSON.stringify({ error: 'Proxy not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (req.headers.get('x-proxy-secret') !== SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const limited = await rateLimit(req, 'surfline-proxy', 60, 60_000)
  if (!limited.success) return tooMany()

  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path') || ''

  // Reject anything that isn't a clean, relative kbyg sub-path.
  if (
    !path.startsWith('/') ||
    path.includes('..') ||
    path.includes('//') ||
    /^https?:/i.test(path) ||
    !ALLOWED_PREFIXES.some((p) => path.startsWith(p))
  ) {
    return new Response(JSON.stringify({ error: 'Invalid path' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const forward = new URLSearchParams(searchParams)
  forward.delete('path')
  forward.delete('secret')

  const targetUrl = `${SL_BASE}${path}?${forward.toString()}`

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
        Referer: 'https://www.surfline.com/',
        Origin: 'https://www.surfline.com',
      },
      signal: AbortSignal.timeout(12000),
    })

    const body = await res.text()
    return new Response(body, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Upstream fetch failed' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
