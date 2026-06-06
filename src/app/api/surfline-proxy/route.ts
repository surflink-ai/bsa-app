/**
 * Surfline Proxy — routes Surfline kbyg API calls through Vercel's network
 * so they don't get CF-bot-blocked (residential/datacenter IP issue).
 *
 * Usage: /api/surfline-proxy?path=/spots/forecasts/wave&spotId=xxx&days=1&intervalHours=3
 *
 * Security: locked to internal use only via SURFLINE_PROXY_SECRET env var.
 * The cache-surfline.ts script sets x-proxy-secret header.
 */

const SL_BASE = 'https://services.surfline.com/kbyg'
const SECRET = process.env.SURFLINE_PROXY_SECRET || ''

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request) {
  // Auth check — must match secret if one is set
  if (SECRET) {
    const provided = req.headers.get('x-proxy-secret') || new URL(req.url).searchParams.get('secret') || ''
    if (provided !== SECRET) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')
  if (!path || !path.startsWith('/')) {
    return new Response('Missing path param', { status: 400 })
  }

  // Forward all query params except our own
  const forward = new URLSearchParams(searchParams)
  forward.delete('path')
  forward.delete('secret')

  const targetUrl = `${SL_BASE}${path}?${forward.toString()}`

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.surfline.com/',
        'Origin': 'https://www.surfline.com',
      },
      signal: AbortSignal.timeout(12000),
    })

    const body = await res.text()
    return new Response(body, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Proxy fetch failed', detail: e.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
