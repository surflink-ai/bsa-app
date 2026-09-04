/**
 * Fetches Surfline (premium) + WindGuru data from local machine and caches to Supabase.
 * Run via cron every 15 minutes: npx tsx scripts/cache-surfline.ts
 * 
 * Surfline premium gives: 6-day forecast, 1-hour intervals, spot ratings, detailed swell.
 * Vercel can't hit Surfline directly (IP blocked), so we cache here → Supabase → Vercel reads.
 */

const SUPABASE_URL = 'https://veggfcumdveuoumrblcn.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
// Surfline now CF-bot-blocks direct calls from residential/datacenter IPs (502/403).
// Route through the deployed CF Worker proxy when configured; the worker calls
// Surfline from Cloudflare's network (not blocked) and prepends /kbyg itself.
// Set SURFLINE_PROXY_BASE to e.g. https://surfline-proxy.<acct>.workers.dev
// When unset, falls back to direct (will fail until the proxy is wired up).
const SL_PROXY = (process.env.SURFLINE_PROXY_BASE || '').replace(/\/$/, '')
const SL_PROXY_KEY = process.env.SURFLINE_PROXY_KEY || ''
const SL_BASE = 'https://services.surfline.com'

// Build a Surfline kbyg URL, routing through the proxy when available.
//
// Vercel proxy path:  <proxyBase>?path=<kbygPath>&<qs>&secret=<key>
//   e.g. https://bsa.surf/api/surfline-proxy?path=/spots/forecasts/wave&spotId=xxx
// CF Worker proxy path: <proxyBase><kbygPath>?<qs>&key=<proxyKey>
//   e.g. https://surfline-proxy.xxx.workers.dev/spots/forecasts/wave?spotId=xxx
// Direct (fallback):  https://services.surfline.com/kbyg<kbygPath>?<qs>
//
const IS_VERCEL_PROXY = SL_PROXY.includes('bsa.surf') || SL_PROXY.includes('vercel.app')

// Chrome-TLS-impersonated fetch for Surfline endpoints (bot wall blocks Node's
// fingerprint; real-Chrome fingerprints pass). URL goes via stdin, never argv.
import { spawnSync } from 'child_process'
import path from 'path'
function slFetch(url: string): { ok: boolean; json: () => any } {
  const r = spawnSync('python3', [path.join(__dirname, 'sl-fetch.py')], {
    input: url,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    timeout: 40000,
  })
  const ok = r.status === 0
  const body = r.stdout || ''
  return {
    ok,
    json: () => {
      try { return JSON.parse(body) } catch { return null }
    },
  }
}

function slUrl(kbygPath: string, qs: string): string {
  // Proxy transport retired 2026-09-04: datacenter IPs are hard-blocked by
  // Surfline's bot wall. Direct + Chrome TLS impersonation (slFetch) works.
  if (SL_PROXY && process.env.SURFLINE_USE_PROXY === '1') {
    if (IS_VERCEL_PROXY) {
      // Vercel proxy: path as query param
      const secretParam = SL_PROXY_KEY ? `&secret=${encodeURIComponent(SL_PROXY_KEY)}` : ''
      return `${SL_PROXY}?path=${encodeURIComponent(kbygPath)}${qs ? '&' + qs : ''}${secretParam}`
    } else {
      // CF Worker proxy: path in URL
      const keyParam = SL_PROXY_KEY ? `${qs ? '&' : ''}key=${encodeURIComponent(SL_PROXY_KEY)}` : ''
      return `${SL_PROXY}${kbygPath}${qs ? '?' + qs : ''}${keyParam}`
    }
  }
  return `${SL_BASE}/kbyg${kbygPath}${qs ? '?' + qs : ''}`
}
let SL_TOKEN = process.env.SURFLINE_ACCESS_TOKEN || ''
const SL_REFRESH = process.env.SURFLINE_REFRESH_TOKEN || ''

// Static Surfline app client credentials (base64 of clientId:clientSecret)
const SL_CLIENT_AUTH = 'Basic NWM1OWU3YzNmMGI2Y2IxYWQwMmJhZjY2OnNrX1FxWEpkbjZOeTVzTVJ1MjdBbWcz'

// Auth proxy base — routes token refresh through Vercel to bypass CF fingerprinting
const AUTH_PROXY_BASE = (process.env.SURFLINE_PROXY_BASE || '').replace('/surfline-proxy', '/surfline-auth').replace(/\/$/, '')

// Auto-refresh: test token, refresh if expired
async function ensureToken(): Promise<string> {
  if (!SL_TOKEN) return ''
  // Quick test
  // NOTE: /spots/forecasts/wave was retired by Surfline (404); the aggregate
  // /spots/forecasts endpoint carries surf+swells+wind per hour now.
  const test = slFetch(slUrl('/spots/forecasts', `spotId=5842041f4e65fad6a7708b48&days=1&intervalHours=6&accesstoken=${SL_TOKEN}`))
  if (test.ok) {
    const d = test.json()
    if (d?.data?.forecasts?.length) return SL_TOKEN // Token works
  }
  // Token expired — try refresh
  if (!SL_REFRESH) {
    console.warn('⚠️  Surfline token expired, no refresh token available')
    return ''
  }
  console.log('🔄 Surfline token expired, attempting refresh via auth proxy...')
  try {
    // Route through Vercel auth proxy to bypass CF fingerprinting on Mac's Node.js
    const authUrl = AUTH_PROXY_BASE
      ? AUTH_PROXY_BASE
      : `${SL_BASE}/trusted/token?isShortLived=false`
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (AUTH_PROXY_BASE && SL_PROXY_KEY) headers['x-proxy-secret'] = SL_PROXY_KEY
    const body = AUTH_PROXY_BASE
      ? JSON.stringify({ refresh_token: SL_REFRESH, client_auth: SL_CLIENT_AUTH })
      : JSON.stringify({ authorizationString: SL_CLIENT_AUTH, grant_type: 'refresh_token', refresh_token: SL_REFRESH, device_id: 'bsa-cache', device_type: 'web' })
    const res = await fetch(authUrl, { method: 'POST', headers, body })
    if (res.ok) {
      const data = await res.json()
      if (data.access_token) {
        SL_TOKEN = data.access_token
        console.log('✅ Surfline token refreshed')
        return SL_TOKEN
      }
    }
    const errText = await res.text().catch(() => '')
    console.warn(`⚠️  Surfline refresh failed (${res.status}): ${errText.slice(0, 200)}`)
    return await passwordGrant()
  } catch (e: any) {
    console.warn(`⚠️  Surfline refresh error: ${e.message}`)
    return await passwordGrant()
  }
}

// Last resort: mint a fresh token pair via the auth proxy's password grant
// (credentials live only in Vercel env as SURFLINE_EMAIL / SURFLINE_PASSWORD).
async function passwordGrant(): Promise<string> {
  if (!AUTH_PROXY_BASE) return ''
  console.log('🔐 Attempting Surfline password grant via auth proxy...')
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (SL_PROXY_KEY) headers['x-proxy-secret'] = SL_PROXY_KEY
    const res = await fetch(AUTH_PROXY_BASE, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        grant_type: 'password',
        client_auth: SL_CLIENT_AUTH,
        // Credentials come from local .env.local; sent only to our own
        // secret-gated Vercel proxy over HTTPS.
        username: process.env.SURFLINE_EMAIL || undefined,
        password: process.env.SURFLINE_PASSWORD || undefined,
      }),
    })
    if (!res.ok) {
      const t = await res.text().catch(() => '')
      console.warn(`⚠️  Password grant failed (${res.status}): ${t.slice(0, 200)}`)
      return ''
    }
    const data = await res.json()
    if (!data.access_token) return ''
    SL_TOKEN = data.access_token
    console.log('✅ Fresh Surfline token pair minted')
    persistTokens(data.access_token, data.refresh_token)
    return SL_TOKEN
  } catch (e: any) {
    console.warn(`⚠️  Password grant error: ${e.message}`)
    return ''
  }
}

// Persist new tokens into .env.local so future runs skip the re-login
function persistTokens(access: string, refresh?: string) {
  try {
    const fs = require('fs')
    const path = require('path')
    const envPath = path.join(__dirname, '..', '.env.local')
    if (!fs.existsSync(envPath)) return
    let txt = fs.readFileSync(envPath, 'utf8')
    txt = txt.replace(/^SURFLINE_ACCESS_TOKEN=.*$/m, `SURFLINE_ACCESS_TOKEN=${access}`)
    if (refresh) txt = txt.replace(/^SURFLINE_REFRESH_TOKEN=.*$/m, `SURFLINE_REFRESH_TOKEN=${refresh}`)
    fs.writeFileSync(envPath, txt)
    console.log('💾 Tokens persisted to .env.local')
  } catch (e: any) {
    console.warn(`⚠️  Could not persist tokens: ${e.message}`)
  }
}

const SUBREGIONS: Record<string, string> = {
  east: '58581a836630e24c44878fe9',
  south: '58581a836630e24c44879149',
  west: '58581a836630e24c44879148',
}

// ALL 21 Barbados spots for premium hourly forecast
const PREMIUM_SPOTS = [
  // East Coast
  { id: '5842041f4e65fad6a7708b48', name: 'Soup Bowl', coast: 'east' },
  { id: '5842041f4e65fad6a7708c7e', name: 'Parlour', coast: 'east' },
  { id: '640a28064519059fe096b71e', name: 'Crane Bay', coast: 'east' },
  { id: '640a2802b6d769e2d74b3d07', name: 'Ragged Point', coast: 'east' },
  { id: '640a280199dd447996fd3885', name: 'Conset Point', coast: 'east' },
  { id: '640a27ffb6d769a0e34b3c63', name: 'Sand Bank', coast: 'east' },
  { id: '640a27fee92030d47097e32b', name: 'Tent Bay', coast: 'east' },
  { id: '5842041f4e65fad6a7708c7f', name: 'Cattle Wash', coast: 'east' },
  { id: '67f94aeca64db676f445bef3', name: 'Tabletop', coast: 'east' },
  // South Coast
  { id: '5842041f4e65fad6a7708c81', name: "Branden's", coast: 'south' },
  { id: '584204204e65fad6a77099c0', name: 'Freights Bay', coast: 'south' },
  { id: '584204204e65fad6a77099c5', name: 'South Point', coast: 'south' },
  { id: '584204204e65fad6a77099c4', name: "Surfer's Point", coast: 'south' },
  { id: '584204214e65fad6a7709cea', name: 'Hastings', coast: 'south' },
  { id: '640a27fc606c45138daaa78c', name: 'Silver Sands', coast: 'south' },
  { id: '640a2804b6d76970754b3d90', name: 'Long Beach', coast: 'south' },
  // West Coast
  { id: '5842041f4e65fad6a7708c80', name: 'Duppies', coast: 'west' },
  { id: '584204204e65fad6a77099c8', name: 'Maycocks', coast: 'west' },
  { id: '584204204e65fad6a77099c3', name: 'Tropicana', coast: 'west' },
  { id: '640a27f94519050e0a96b45a', name: 'Sandy Lane', coast: 'west' },
  { id: '640a27fb451905b3a196b4bb', name: 'Batts Rock', coast: 'west' },
]

const DELAY_BETWEEN_SPOTS_MS = 500 // Be nice to Surfline's API

const WINDGURU_SPOTS = [
  { id: 64149, name: 'Barbados South' },
  { id: 64150, name: 'Barbados North' },
]

async function fetchSurflineOverview() {
  const results: Record<string, any> = {}
  for (const [coast, subregionId] of Object.entries(SUBREGIONS)) {
    try {
      const url = SL_TOKEN
        ? slUrl('/regions/overview', `subregionId=${subregionId}&accesstoken=${SL_TOKEN}`)
        : slUrl('/regions/overview', `subregionId=${subregionId}`)
      const res = slFetch(url)
      if (!res.ok) { results[coast] = []; continue }
      const data = res.json()
      results[coast] = (data?.data?.spots || []).map((s: any) => ({
        spotId: s._id,
        name: s.name,
        conditions: s.conditions?.value || 'FLAT',
        // Surfline returns waveHeight min/max in METERS — convert to feet for display
        waveMin: Math.round((s.waveHeight?.min || 0) * 3.28084),
        waveMax: Math.round((s.waveHeight?.max || 0) * 3.28084),
        waveHeightM: { min: s.waveHeight?.min || 0, max: s.waveHeight?.max || 0 },
        humanRelation: s.waveHeight?.humanRelation || '',
        coast: coast.charAt(0).toUpperCase() + coast.slice(1),
      }))
    } catch { results[coast] = [] }
  }
  return results
}

async function fetchSurflinePremium() {
  if (!SL_TOKEN) return null
  const forecasts: Record<string, any> = {}
  
  // Fetch in series with delay to avoid rate limiting
  for (const spot of PREMIUM_SPOTS) {
    await new Promise(r => setTimeout(r, DELAY_BETWEEN_SPOTS_MS))
    try {
      // Aggregate forecast — surf + swells + wind per hour (the old /wave,
      // /wind endpoints were partially retired; aggregate carries it all)
      const aggRes = slFetch(
        slUrl('/spots/forecasts', `spotId=${spot.id}&days=3&intervalHours=1&accesstoken=${SL_TOKEN}`)
      )
      // Rating forecast (LOTUS quality rating, still a separate endpoint)
      const ratingRes = slFetch(
        slUrl('/spots/forecasts/rating', `spotId=${spot.id}&days=3&intervalHours=3&accesstoken=${SL_TOKEN}`)
      )

      const aggData = aggRes.ok ? aggRes.json() : null
      const ratingData = ratingRes.ok ? ratingRes.json() : null
      const hours = aggData?.data?.forecasts || []

      const waves = hours.map((w: any) => ({
        ts: w.timestamp,
        min: w.surf?.min,
        max: w.surf?.max,
        human: w.surf?.humanRelation,
        swells: (w.swells || []).slice(0, 3).map((s: any) => ({
          h: s.height, p: s.period, d: s.direction, dp: s.directionMin
        })),
        power: w.power,
      }))

      const winds = hours.filter((_: any, i: number) => i % 3 === 0).map((w: any) => ({
        ts: w.timestamp,
        speed: w.wind?.speed, gust: w.wind?.gust, dir: w.wind?.direction, dirType: w.wind?.directionType,
      }))

      const ratings = (ratingData?.data?.rating || []).map((r: any) => ({
        ts: r.timestamp,
        key: r.rating?.key, value: r.rating?.value,
      }))

      forecasts[spot.id] = {
        name: spot.name,
        coast: spot.coast,
        waves: waves.slice(0, 72), // 3 days hourly
        winds: winds.slice(0, 24), // 3 days every 3h
        ratings: ratings.slice(0, 24),
      }
    } catch (e) {
      console.error(`  ⚠️ Failed ${spot.name}: ${e}`)
    }
  }
  return forecasts
}

async function fetchWindGuru() {
  const results: Record<number, any> = {}
  for (const spot of WINDGURU_SPOTS) {
    try {
      const res = await fetch(`https://www.windguru.cz/int/iapi.php?q=forecast&id_spot=${spot.id}&id_model=47`, {
        headers: { 'Referer': 'https://www.windguru.cz/' },
      })
      if (!res.ok) continue
      const data = await res.json()
      const fcst = data.fcst || {}
      results[spot.id] = {
        name: spot.name,
        model: 'ECMWF WAM',
        initDate: fcst.initdate,
        hours: fcst.hours || [],
        waveHeight: fcst.HTSGW || [],
        wavePeriod: fcst.PERPW || [],
        waveDir: fcst.DIRPW || [],
        swellHeight: fcst.SWELL1 || [],
        swellPeriod: fcst.SWPER1 || [],
        swellDir: fcst.SWDIR1 || [],
        windWaveHeight: fcst.WVHGT || [],
        windWavePeriod: fcst.WVPER || [],
        windWaveDir: fcst.WVDIR || [],
      }
    } catch {}
  }
  return results
}

async function main() {
  // Ensure token is valid before making premium calls
  SL_TOKEN = await ensureToken()
  
  console.log('🏄 Fetching Surfline overview...')
  const surfline = await fetchSurflineOverview()
  const slSpotCount = Object.values(surfline).reduce((n, s: any) => n + s.length, 0)
  console.log(`  ✅ ${slSpotCount} spots from Surfline`)

  console.log('🏄 Fetching Surfline premium forecasts...')
  const premium = await fetchSurflinePremium()
  const premiumCount = premium ? Object.keys(premium).length : 0
  console.log(`  ${premiumCount > 0 ? '✅' : '⚠️'} ${premiumCount} premium spot forecasts${!SL_TOKEN ? ' (no token)' : ''}`)

  console.log('🌬️ Fetching WindGuru...')
  const windguru = await fetchWindGuru()
  console.log(`  ✅ ${Object.keys(windguru).length} WindGuru forecasts`)

  const sources = ['surfline']
  if (premiumCount > 0) sources.push('surfline-premium')
  sources.push('windguru-ecmwf-wam')

  const payload = {
    timestamp: new Date().toISOString(),
    sources,
    surfline,
    premium,
    windguru,
  }

  if (!SUPABASE_KEY) {
    console.log('⚠️  No SUPABASE_SERVICE_ROLE_KEY — writing to stdout')
    console.log(JSON.stringify(payload, null, 2).slice(0, 500) + '...')
    return
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/surf_cache?on_conflict=key`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      key: 'latest',
      data: payload,
      updated_at: new Date().toISOString(),
    }),
  })

  if (res.ok) {
    console.log(`✅ Cached to Supabase (${slSpotCount} overview + ${premiumCount} premium + ${Object.keys(windguru).length} WindGuru)`)
  } else {
    const err = await res.text()
    console.error(`❌ Supabase error: ${res.status} ${err}`)
  }
}

main().catch(console.error)
