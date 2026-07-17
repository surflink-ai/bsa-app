/**
 * Surfline (premium) + WindGuru fetch + cache-to-Supabase pipeline.
 *
 * Shared by the Vercel Cron route (`/api/cron/surf-cache`) and the CLI script
 * (`scripts/cache-surfline.ts`). Surfline blocks direct calls from
 * datacenter/residential IPs, so calls are routed through a proxy
 * (SURFLINE_PROXY_BASE) when configured.
 *
 * All configuration comes from the environment — nothing is hardcoded.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const SL_BASE = 'https://services.surfline.com'

function env() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const SL_PROXY = (process.env.SURFLINE_PROXY_BASE || '').replace(/\/$/, '')
  const SL_PROXY_KEY = process.env.SURFLINE_PROXY_KEY || process.env.SURFLINE_PROXY_SECRET || ''
  const IS_VERCEL_PROXY = SL_PROXY.includes('bsa.surf') || SL_PROXY.includes('vercel.app') || SL_PROXY.includes('/api/surfline-proxy')
  return { SUPABASE_URL, SUPABASE_KEY, SL_PROXY, SL_PROXY_KEY, IS_VERCEL_PROXY }
}

function resolveSurflineClientAuth(): string {
  const raw = (process.env.SURFLINE_CLIENT_AUTH || '').trim()
  if (!raw) return ''
  if (raw.startsWith('Basic ')) return raw
  return 'Basic ' + Buffer.from(raw).toString('base64')
}

const SUBREGIONS: Record<string, string> = {
  east: '58581a836630e24c44878fe9',
  south: '58581a836630e24c44879149',
  west: '58581a836630e24c44879148',
}

const PREMIUM_SPOTS = [
  { id: '5842041f4e65fad6a7708b48', name: 'Soup Bowl', coast: 'east' },
  { id: '5842041f4e65fad6a7708c7e', name: 'Parlour', coast: 'east' },
  { id: '640a28064519059fe096b71e', name: 'Crane Bay', coast: 'east' },
  { id: '640a2802b6d769e2d74b3d07', name: 'Ragged Point', coast: 'east' },
  { id: '640a280199dd447996fd3885', name: 'Conset Point', coast: 'east' },
  { id: '640a27ffb6d769a0e34b3c63', name: 'Sand Bank', coast: 'east' },
  { id: '640a27fee92030d47097e32b', name: 'Tent Bay', coast: 'east' },
  { id: '5842041f4e65fad6a7708c7f', name: 'Cattle Wash', coast: 'east' },
  { id: '67f94aeca64db676f445bef3', name: 'Tabletop', coast: 'east' },
  { id: '5842041f4e65fad6a7708c81', name: "Branden's", coast: 'south' },
  { id: '584204204e65fad6a77099c0', name: 'Freights Bay', coast: 'south' },
  { id: '584204204e65fad6a77099c5', name: 'South Point', coast: 'south' },
  { id: '584204204e65fad6a77099c4', name: "Surfer's Point", coast: 'south' },
  { id: '584204214e65fad6a7709cea', name: 'Hastings', coast: 'south' },
  { id: '640a27fc606c45138daaa78c', name: 'Silver Sands', coast: 'south' },
  { id: '640a2804b6d76970754b3d90', name: 'Long Beach', coast: 'south' },
  { id: '5842041f4e65fad6a7708c80', name: 'Duppies', coast: 'west' },
  { id: '584204204e65fad6a77099c8', name: 'Maycocks', coast: 'west' },
  { id: '584204204e65fad6a77099c3', name: 'Tropicana', coast: 'west' },
  { id: '640a27f94519050e0a96b45a', name: 'Sandy Lane', coast: 'west' },
  { id: '640a27fb451905b3a196b4bb', name: 'Batts Rock', coast: 'west' },
]

const WINDGURU_SPOTS = [
  { id: 64149, name: 'Barbados South' },
  { id: 64150, name: 'Barbados North' },
]

const DELAY_BETWEEN_SPOTS_MS = 400

export interface SurfCacheResult {
  ok: boolean
  overviewSpots: number
  premiumSpots: number
  windguruSpots: number
  wroteToSupabase: boolean
  error?: string
}

export async function refreshSurfCache(log: (m: string) => void = () => {}): Promise<SurfCacheResult> {
  const { SUPABASE_URL, SUPABASE_KEY, SL_PROXY, SL_PROXY_KEY, IS_VERCEL_PROXY } = env()
  const CLIENT_AUTH = resolveSurflineClientAuth()

  let token = process.env.SURFLINE_ACCESS_TOKEN || ''
  const refreshToken = process.env.SURFLINE_REFRESH_TOKEN || ''

  function slUrl(kbygPath: string, qs: string): string {
    if (SL_PROXY) {
      if (IS_VERCEL_PROXY) return `${SL_PROXY}?path=${encodeURIComponent(kbygPath)}${qs ? '&' + qs : ''}`
      const keyParam = SL_PROXY_KEY ? `${qs ? '&' : ''}key=${encodeURIComponent(SL_PROXY_KEY)}` : ''
      return `${SL_PROXY}${kbygPath}${qs ? '?' + qs : ''}${keyParam}`
    }
    return `${SL_BASE}/kbyg${kbygPath}${qs ? '?' + qs : ''}`
  }
  function slHeaders(): Record<string, string> {
    if (SL_PROXY && IS_VERCEL_PROXY && SL_PROXY_KEY) return { 'x-proxy-secret': SL_PROXY_KEY }
    return {}
  }
  const slFetch = (kbygPath: string, qs: string) => fetch(slUrl(kbygPath, qs), { headers: slHeaders() })

  async function ensureToken(): Promise<string> {
    if (!token) return ''
    try {
      const test = await slFetch('/spots/forecasts/wave', `spotId=5842041f4e65fad6a7708b48&days=1&intervalHours=6&accesstoken=${token}`)
      if (test.ok) {
        const d = await test.json()
        if (d?.data?.wave?.length) return token
      }
    } catch { /* fall through to refresh */ }
    if (!refreshToken || !CLIENT_AUTH) return ''
    try {
      const res = await fetch(`${SL_BASE}/trusted/token?isShortLived=false`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorizationString: CLIENT_AUTH,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          device_id: 'bsa-cache',
          device_type: 'web',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.access_token) return data.access_token
      }
    } catch { /* fall back to free tier */ }
    return ''
  }

  async function fetchOverview() {
    const results: Record<string, any> = {}
    for (const [coast, subregionId] of Object.entries(SUBREGIONS)) {
      try {
        const res = token
          ? await slFetch('/regions/overview', `subregionId=${subregionId}&accesstoken=${token}`)
          : await slFetch('/regions/overview', `subregionId=${subregionId}`)
        if (!res.ok) { results[coast] = []; continue }
        const data = await res.json()
        results[coast] = (data?.data?.spots || []).map((s: any) => ({
          spotId: s._id,
          name: s.name,
          conditions: s.conditions?.value || 'FLAT',
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

  async function fetchPremium() {
    if (!token) return null
    const forecasts: Record<string, any> = {}
    for (const spot of PREMIUM_SPOTS) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_SPOTS_MS))
      try {
        const [waveRes, windRes, ratingRes] = await Promise.all([
          slFetch('/spots/forecasts/wave', `spotId=${spot.id}&days=3&intervalHours=1&accesstoken=${token}`),
          slFetch('/spots/forecasts/wind', `spotId=${spot.id}&days=3&intervalHours=3&accesstoken=${token}`),
          slFetch('/spots/forecasts/rating', `spotId=${spot.id}&days=3&intervalHours=3&accesstoken=${token}`),
        ])
        const [waveData, windData, ratingData] = await Promise.all([
          waveRes.ok ? waveRes.json() : null,
          windRes.ok ? windRes.json() : null,
          ratingRes.ok ? ratingRes.json() : null,
        ])
        forecasts[spot.id] = {
          name: spot.name,
          coast: spot.coast,
          waves: (waveData?.data?.wave || []).map((w: any) => ({
            ts: w.timestamp, min: w.surf?.min, max: w.surf?.max, human: w.surf?.humanRelation,
            swells: (w.swells || []).slice(0, 3).map((s: any) => ({ h: s.height, p: s.period, d: s.direction, dp: s.directionMin })),
            power: w.power,
          })).slice(0, 72),
          winds: (windData?.data?.wind || []).map((w: any) => ({ ts: w.timestamp, speed: w.speed, gust: w.gust, dir: w.direction, dirType: w.directionType })).slice(0, 24),
          ratings: (ratingData?.data?.rating || []).map((r: any) => ({ ts: r.timestamp, key: r.rating?.key, value: r.rating?.value })).slice(0, 24),
        }
      } catch (e) {
        log(`  premium failed ${spot.name}: ${e}`)
      }
    }
    return forecasts
  }

  async function fetchWindGuru() {
    const results: Record<number, any> = {}
    for (const spot of WINDGURU_SPOTS) {
      try {
        const res = await fetch(`https://www.windguru.cz/int/iapi.php?q=forecast&id_spot=${spot.id}&id_model=47`, {
          headers: { Referer: 'https://www.windguru.cz/' },
        })
        if (!res.ok) continue
        const data = await res.json()
        const fcst = data.fcst || {}
        results[spot.id] = {
          name: spot.name, model: 'ECMWF WAM', initDate: fcst.initdate, hours: fcst.hours || [],
          waveHeight: fcst.HTSGW || [], wavePeriod: fcst.PERPW || [], waveDir: fcst.DIRPW || [],
          swellHeight: fcst.SWELL1 || [], swellPeriod: fcst.SWPER1 || [], swellDir: fcst.SWDIR1 || [],
          windWaveHeight: fcst.WVHGT || [], windWavePeriod: fcst.WVPER || [], windWaveDir: fcst.WVDIR || [],
        }
      } catch { /* skip */ }
    }
    return results
  }

  token = await ensureToken()

  log('Fetching Surfline overview...')
  const surfline = await fetchOverview()
  const overviewSpots = Object.values(surfline).reduce((n, s: any) => n + s.length, 0)

  log('Fetching Surfline premium...')
  const premium = await fetchPremium()
  const premiumSpots = premium ? Object.keys(premium).length : 0

  log('Fetching WindGuru...')
  const windguru = await fetchWindGuru()
  const windguruSpots = Object.keys(windguru).length

  const sources = ['surfline']
  if (premiumSpots > 0) sources.push('surfline-premium')
  sources.push('windguru-ecmwf-wam')

  const payload = { timestamp: new Date().toISOString(), sources, surfline, premium, windguru }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { ok: true, overviewSpots, premiumSpots, windguruSpots, wroteToSupabase: false, error: 'No Supabase service credentials' }
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/surf_cache?on_conflict=key`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ key: 'latest', data: payload, updated_at: new Date().toISOString() }),
  })

  if (!res.ok) {
    return { ok: false, overviewSpots, premiumSpots, windguruSpots, wroteToSupabase: false, error: `Supabase ${res.status}` }
  }
  return { ok: true, overviewSpots, premiumSpots, windguruSpots, wroteToSupabase: true }
}
