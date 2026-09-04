/**
 * Surfline Auth Proxy — proxies the Surfline token refresh through Vercel's
 * network so it isn't CF-bot-blocked from the Mac mini's Node.js fingerprint.
 *
 * POST /api/surfline-auth
 * Body: { refresh_token: string, client_auth: string }
 *   or { grant_type: 'password', client_auth: string } — uses SURFLINE_EMAIL /
 *   SURFLINE_PASSWORD from Vercel env (never sent by the caller) to mint a
 *   fresh token pair when the refresh token has died.
 *
 * Security: locked via SURFLINE_PROXY_SECRET env var (same as data proxy).
 */

const SL_AUTH_URL = 'https://services.surfline.com/trusted/token?isShortLived=false'
const SECRET = process.env.SURFLINE_PROXY_SECRET || ''

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  // Auth check
  if (SECRET) {
    const provided = req.headers.get('x-proxy-secret') || ''
    if (provided !== SECRET) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return new Response('Bad JSON', { status: 400 })
  }

  const { refresh_token, client_auth, grant_type } = body
  const wantsPassword = grant_type === 'password'
  if (!client_auth || (!refresh_token && !wantsPassword)) {
    return new Response('Missing refresh_token or client_auth', { status: 400 })
  }
  if (wantsPassword && (!process.env.SURFLINE_EMAIL || !process.env.SURFLINE_PASSWORD)) {
    return new Response(
      JSON.stringify({ error: 'password_grant_unconfigured', detail: 'Set SURFLINE_EMAIL and SURFLINE_PASSWORD in Vercel env' }),
      { status: 501, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const grantBody = wantsPassword
    ? {
        authorizationString: client_auth,
        grant_type: 'password',
        username: process.env.SURFLINE_EMAIL,
        password: process.env.SURFLINE_PASSWORD,
        device_id: 'bsa-cache',
        device_type: 'web',
      }
    : {
        authorizationString: client_auth,
        grant_type: 'refresh_token',
        refresh_token,
        device_id: 'bsa-cache',
        device_type: 'web',
      }

  try {
    const res = await fetch(SL_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Origin': 'https://www.surfline.com',
        'Referer': 'https://www.surfline.com/',
      },
      body: JSON.stringify(grantBody),
      signal: AbortSignal.timeout(15000),
    })

    const data = await res.text()
    return new Response(data, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Auth proxy failed', detail: e.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
