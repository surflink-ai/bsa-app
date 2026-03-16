/**
 * Cloudflare Worker — Surfline API Proxy
 * Proxies requests to Surfline's kbyg API to avoid IP blocking from Vercel.
 * Deploy: wrangler deploy
 */

const SURFLINE_BASE = 'https://services.surfline.com'
const ALLOWED_ORIGIN = 'https://bsa.surf'
const CACHE_TTL = 900 // 15 minutes

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = url.pathname

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    // Only allow GET
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Simple auth check — pass a secret via header or query param
    const authKey = url.searchParams.get('key') || request.headers.get('x-proxy-key')
    if (env.PROXY_KEY && authKey !== env.PROXY_KEY) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Route: /regions/overview?subregionId=...
    // Route: /spots/forecasts/wave?spotId=...
    // Route: /spots/forecasts/wind?spotId=...
    // Route: /spots/forecasts/rating?spotId=...
    let targetUrl
    if (path.startsWith('/regions/')) {
      targetUrl = `${SURFLINE_BASE}/kbyg${path}?${url.searchParams.toString()}`
    } else if (path.startsWith('/spots/')) {
      targetUrl = `${SURFLINE_BASE}/kbyg${path}?${url.searchParams.toString()}`
    } else {
      return new Response('Not found', { status: 404 })
    }

    // Remove our proxy key from the forwarded URL
    const targetUrlObj = new URL(targetUrl)
    targetUrlObj.searchParams.delete('key')

    try {
      const resp = await fetch(targetUrlObj.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      })

      const body = await resp.text()

      return new Response(body, {
        status: resp.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL * 2}`,
        },
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Proxy error', detail: err.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  },
}
