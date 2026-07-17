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
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'x-proxy-key',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    // Only allow GET
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Auth — fail CLOSED: with no PROXY_KEY configured the worker is disabled,
    // so it can never become an open Surfline relay. Prefer the header; the
    // query param is accepted only for backwards compatibility.
    if (!env.PROXY_KEY) {
      return new Response('Proxy not configured', { status: 503 })
    }
    const authKey = request.headers.get('x-proxy-key') || url.searchParams.get('key')
    if (authKey !== env.PROXY_KEY) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Reject path traversal, then allow only known kbyg prefixes.
    if (path.includes('..') || path.includes('//')) {
      return new Response('Bad request', { status: 400 })
    }
    let targetUrl
    if (path.startsWith('/regions/') || path.startsWith('/spots/')) {
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
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Cache-Control': `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL * 2}`,
        },
      })
    } catch {
      return new Response(JSON.stringify({ error: 'Proxy error' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  },
}
