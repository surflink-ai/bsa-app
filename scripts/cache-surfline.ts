/**
 * Surf Intel v2 cache job — fetches all data sources and stores to Supabase.
 * Run every 30 min: npx tsx scripts/cache-surfline.ts
 *
 * Sources:
 *   1. Surfline premium (overview + hourly forecast + tides + ratings)
 *   2. WindGuru ECMWF WAM
 *   3. NOAA buoys 41040 + 41043 (realtime + spectral)
 *   4. Open-Meteo Marine ECMWF (east + south coast, 7-day)
 *   5. NHC active Atlantic storms
 *
 * No LLM. No verdicts. Data only.
 */

// Self-load .env.local
import { readFileSync, existsSync, writeFileSync } from 'fs'
import { join } from 'path'
try {
  const envPath = join(process.cwd(), '.env.local')
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      if (!process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
      }
    }
  }
} catch {}

const SUPABASE_URL = 'https://veggfcumdveuoumrblcn.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const SL_PROXY = (process.env.SURFLINE_PROXY_BASE || '').replace(/\/$/, '')
const SL_PROXY_KEY = process.env.SURFLINE_PROXY_KEY || ''
const SL_BASE = 'https://services.surfline.com'
const IS_VERCEL_PROXY = SL_PROXY.includes('bsa.surf') || SL_PROXY.includes('vercel.app')
const AUTH_PROXY_BASE = (process.env.SURFLINE_PROXY_BASE || '').replace('/surfline-proxy', '/surfline-auth').replace(/\/$/, '')

// ── Supabase REST upsert helper ──────────────────────────────────────────────
async function sbUpsert(table: string, rows: any | any[], conflictKeys: string): Promise<void> {
  if (!SUPABASE_KEY) return
  const body = Array.isArray(rows) ? rows : [rows]
  if (!body.length) return
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${conflictKeys}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error(`  ❌ sb.${table}: ${res.status} ${err.slice(0, 200)}`)
  }
}

async function sbSelect(table: string, qs: string): Promise<any[]> {
  if (!SUPABASE_KEY) return []
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  })
  if (!res.ok) return []
  return res.json()
}

// ── Chrome-TLS Surfline fetch ─────────────────────────────────────────────────
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
    json: () => { try { return JSON.parse(body) } catch { return null } },
  }
}

function slUrl(kbygPath: string, qs: string): string {
  if (SL_PROXY && process.env.SURFLINE_USE_PROXY === '1') {
    if (IS_VERCEL_PROXY) {
      const secretParam = SL_PROXY_KEY ? `&secret=${SL_PROXY_KEY}` : ''
      return `${SL_PROXY}?path=${encodeURIComponent(kbygPath)}${qs ? '&' + qs : ''}${secretParam}`
    } else {
      const keyParam = SL_PROXY_KEY ? `${qs ? '&' : ''}key=${encodeURIComponent(SL_PROXY_KEY)}` : ''
      return `${SL_PROXY}${kbygPath}${qs ? '?' + qs : ''}${keyParam}`
    }
  }
  return `${SL_BASE}/kbyg${kbygPath}${qs ? '?' + qs : ''}`
}

let SL_TOKEN = process.env.SURFLINE_ACCESS_TOKEN || ''
const SL_REFRESH = process.env.SURFLINE_REFRESH_TOKEN || ''
const SL_CLIENT_AUTH = 'Basic NWM1OWU3YzNmMGI2Y2IxYWQwMmJhZjY2OnNrX1FxWEpkbjZOeTVzTVJ1MjdBbWcz'

async function ensureToken(): Promise<string> {
  if (!SL_TOKEN) return ''
  const test = slFetch(slUrl('/spots/forecasts', `spotId=5842041f4e65fad6a7708b48&days=1&intervalHours=6&accesstoken=${SL_TOKEN}`))
  if (test.ok) {
    const d = test.json()
    if (d?.data?.forecasts?.length) return SL_TOKEN
  }
  if (!SL_REFRESH) { console.warn('⚠️  Surfline token expired, no refresh token'); return '' }
  console.log('🔄 Refreshing Surfline token...')
  try {
    const authUrl = AUTH_PROXY_BASE || `${SL_BASE}/trusted/token?isShortLived=false`
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (AUTH_PROXY_BASE && SL_PROXY_KEY) headers['x-proxy-secret'] = SL_PROXY_KEY
    const body = AUTH_PROXY_BASE
      ? JSON.stringify({ refresh_token: SL_REFRESH, client_auth: SL_CLIENT_AUTH })
      : JSON.stringify({ authorizationString: SL_CLIENT_AUTH, grant_type: 'refresh_token', refresh_token: SL_REFRESH, device_id: 'bsa-cache', device_type: 'web' })
    const res = await fetch(authUrl, { method: 'POST', headers, body })
    if (res.ok) {
      const data = await res.json()
      if (data.access_token) { SL_TOKEN = data.access_token; console.log('✅ Token refreshed'); return SL_TOKEN }
    }
    return await passwordGrant()
  } catch (e: any) {
    console.warn(`⚠️  Refresh error: ${e.message}`)
    return await passwordGrant()
  }
}

async function passwordGrant(): Promise<string> {
  if (!AUTH_PROXY_BASE) return ''
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (SL_PROXY_KEY) headers['x-proxy-secret'] = SL_PROXY_KEY
    const res = await fetch(AUTH_PROXY_BASE, {
      method: 'POST', headers,
      body: JSON.stringify({ grant_type: 'password', client_auth: SL_CLIENT_AUTH, username: process.env.SURFLINE_EMAIL, password: process.env.SURFLINE_PASSWORD }),
    })
    if (!res.ok) return ''
    const data = await res.json()
    if (!data.access_token) return ''
    SL_TOKEN = data.access_token
    persistTokens(data.access_token, data.refresh_token)
    return SL_TOKEN
  } catch { return '' }
}

function persistTokens(access: string, refresh?: string) {
  try {
    const envPath = path.join(__dirname, '..', '.env.local')
    if (!existsSync(envPath)) return
    let txt = readFileSync(envPath, 'utf8')
    txt = txt.replace(/^SURFLINE_ACCESS_TOKEN=.*$/m, `SURFLINE_ACCESS_TOKEN=${access}`)
    if (refresh) txt = txt.replace(/^SURFLINE_REFRESH_TOKEN=.*$/m, `SURFLINE_REFRESH_TOKEN=${refresh}`)
    writeFileSync(envPath, txt)
    console.log('💾 Tokens persisted')
  } catch (e: any) { console.warn(`⚠️  Could not persist tokens: ${e.message}`) }
}

// ── Constants ────────────────────────────────────────────────────────────────
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

// Spots that get tides fetched (key reporting spots only, to save API calls)
const TIDE_SPOTS = new Set([
  '5842041f4e65fad6a7708b48', // Soup Bowl
  '5842041f4e65fad6a7708c81', // Branden's
])

const WINDGURU_SPOTS = [
  { id: 64149, name: 'Barbados South' },
  { id: 64150, name: 'Barbados North' },
]

const DELAY_MS = 500

// ── Utility ──────────────────────────────────────────────────────────────────
function degToCompass(deg: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  return dirs[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16]
}

function mToKt(ms: number): number { return Math.round(ms * 1.94384 * 10) / 10 }

// ── Surfline overview ─────────────────────────────────────────────────────────
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

// ── Surfline premium (hourly forecast + tides + ratings) ───────────────────
async function fetchSurflinePremium() {
  if (!SL_TOKEN) return null
  const forecasts: Record<string, any> = {}

  for (const spot of PREMIUM_SPOTS) {
    await new Promise(r => setTimeout(r, DELAY_MS))
    try {
      const aggRes = slFetch(slUrl('/spots/forecasts', `spotId=${spot.id}&days=3&intervalHours=1&accesstoken=${SL_TOKEN}`))
      const ratingRes = slFetch(slUrl('/spots/forecasts/rating', `spotId=${spot.id}&days=3&intervalHours=3&accesstoken=${SL_TOKEN}`))

      const aggData = aggRes.ok ? aggRes.json() : null
      const ratingData = ratingRes.ok ? ratingRes.json() : null
      const hours = aggData?.data?.forecasts || []

      // Tides — fetch for key spots only
      let tides: any[] = []
      if (TIDE_SPOTS.has(spot.id)) {
        await new Promise(r => setTimeout(r, DELAY_MS))
        const tidesRes = slFetch(slUrl('/spots/forecasts/tides', `spotId=${spot.id}&days=3&accesstoken=${SL_TOKEN}`))
        if (tidesRes.ok) {
          const tidesData = tidesRes.json()
          tides = (tidesData?.data?.tides || []).map((t: any) => ({
            ts: t.timestamp,
            type: (t.type || '').toLowerCase(), // 'high' | 'low'
            height: t.height, // meters
          }))
        }
      }

      const waves = hours.map((w: any) => ({
        ts: w.timestamp,
        min: w.surf?.min, max: w.surf?.max,
        human: w.surf?.humanRelation,
        swells: (w.swells || []).slice(0, 3).map((s: any) => ({
          h: s.height, p: s.period, d: s.direction, dp: s.directionMin,
        })),
        power: w.power,
        wind: { speed: w.wind?.speed, gust: w.wind?.gust, dir: w.wind?.direction, dirType: w.wind?.directionType },
      }))

      const ratings = (ratingData?.data?.rating || []).map((r: any) => ({
        ts: r.timestamp, key: r.rating?.key, value: r.rating?.value,
      }))

      forecasts[spot.id] = {
        name: spot.name, coast: spot.coast,
        waves: waves.slice(0, 72),
        ratings: ratings.slice(0, 24),
        tides,
      }
    } catch (e) {
      console.error(`  ⚠️ Failed ${spot.name}: ${e}`)
    }
  }
  return forecasts
}

// ── WindGuru ─────────────────────────────────────────────────────────────────
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
        name: spot.name, model: 'ECMWF WAM', initDate: fcst.initdate,
        hours: fcst.hours || [],
        waveHeight: fcst.HTSGW || [], wavePeriod: fcst.PERPW || [], waveDir: fcst.DIRPW || [],
        swellHeight: fcst.SWELL1 || [], swellPeriod: fcst.SWPER1 || [], swellDir: fcst.SWDIR1 || [],
        windWaveHeight: fcst.WVHGT || [], windWavePeriod: fcst.WVPER || [], windWaveDir: fcst.WVDIR || [],
      }
    } catch {}
  }
  return results
}

// ── NOAA Buoys ───────────────────────────────────────────────────────────────
async function fetchNOAABuoy(buoyId: string): Promise<any[]> {
  const now = Date.now()
  const cutoff48h = now - 48 * 3600 * 1000

  // 1. Realtime .txt (WVHT, DPD, APD, MWD, WSPD, WDIR)
  let txtRows: any[] = []
  try {
    const txtRes = await fetch(`https://www.ndbc.noaa.gov/data/realtime2/${buoyId}.txt`, { signal: AbortSignal.timeout(20000) })
    if (txtRes.ok) {
      const lines = (await txtRes.text()).split('\n')
      // First 2 lines are headers
      for (const line of lines.slice(2)) {
        const parts = line.trim().split(/\s+/)
        if (parts.length < 12) continue
        const [yr, mo, dy, hh, mm] = parts.slice(0, 5).map(Number)
        if ([yr, mo, dy, hh, mm].some(isNaN)) continue
        const ts = Date.UTC(yr, mo - 1, dy, hh, mm)
        if (ts < cutoff48h) continue
        const parse = (v: string) => v === 'MM' ? null : parseFloat(v)
        txtRows.push({
          ts,
          wvht: parse(parts[8]),   // WVHT (m)
          dpd: parse(parts[9]),    // DPD (s)
          apd: parse(parts[10]),   // APD (s)
          mwd: parse(parts[11]),   // MWD (deg)
          wspd: parse(parts[6]),   // WSPD (m/s)
          wdir: parse(parts[5]),   // WDIR (deg)
        })
      }
      txtRows.sort((a, b) => b.ts - a.ts) // newest first
    }
  } catch (e) {
    console.warn(`  ⚠️ NOAA ${buoyId}.txt: ${e}`)
  }

  // 2. Spectral .spec (SwH, SwP, SwD, WWH, WWP, WWD)
  const specMap = new Map<number, any>()
  try {
    const specRes = await fetch(`https://www.ndbc.noaa.gov/data/realtime2/${buoyId}.spec`, { signal: AbortSignal.timeout(20000) })
    if (specRes.ok) {
      const lines = (await specRes.text()).split('\n')
      // Format: YY MM DD hh mm WVHT SwH SwP WWH WWP SwD WWD STEEPNESS APD MWD
      for (const line of lines.slice(2)) {
        const parts = line.trim().split(/\s+/)
        if (parts.length < 10) continue
        const [yr, mo, dy, hh, mm] = parts.slice(0, 5).map(Number)
        if ([yr, mo, dy, hh].some(isNaN)) continue
        const ts = Date.UTC(yr, mo - 1, dy, hh, mm || 0)
        if (ts < cutoff48h) continue
        const parse = (v: string) => v === 'MM' ? null : parseFloat(v)
        specMap.set(ts, {
          swh: parse(parts[6]),   // swell height (m)
          swp: parse(parts[7]),   // swell period (s)
          swdir: parts[10],       // swell direction compass (ENE etc)
          wwh: parse(parts[8]),   // wind wave height (m)
          wwp: parse(parts[9]),   // wind wave period (s)
          wwdir: parts[11],       // wind wave dir compass
        })
      }
    }
  } catch (e) {
    console.warn(`  ⚠️ NOAA ${buoyId}.spec: ${e}`)
  }

  // 3. Merge txt + spec, compute trend
  const merged: any[] = []
  for (let i = 0; i < txtRows.length; i++) {
    const row = txtRows[i]
    // Find closest spec row within 15 min
    let spec: any = null
    for (const [specTs, specData] of specMap.entries()) {
      if (Math.abs(specTs - row.ts) <= 15 * 60 * 1000) { spec = specData; break }
    }

    // Rate of change: compare to row ~6h ago (12 rows of 30min)
    const targetIdx = i + 12
    const ref6h = targetIdx < txtRows.length ? txtRows[targetIdx] : null
    let change6h: number | null = null
    let trend: 'rising' | 'steady' | 'falling' = 'steady'
    if (ref6h?.wvht != null && row.wvht != null) {
      change6h = Math.round((row.wvht - ref6h.wvht) * 100) / 100
      if (change6h > 0.15) trend = 'rising'
      else if (change6h < -0.15) trend = 'falling'
    }

    merged.push({
      buoy_id: buoyId,
      timestamp: new Date(row.ts).toISOString(),
      wvht_m: row.wvht,
      dpd_s: row.dpd,
      apd_s: row.apd,
      mwd_deg: row.mwd != null ? Math.round(row.mwd) : null,
      wspd_kt: row.wspd != null ? mToKt(row.wspd) : null,
      wdir_deg: row.wdir != null ? Math.round(row.wdir) : null,
      trend,
      change_6h_m: change6h,
      primary_swell_json: spec ? { height_m: spec.swh, period_s: spec.swp, dir: spec.swdir } : null,
      secondary_swell_json: spec ? { height_m: spec.wwh, period_s: spec.wwp, dir: spec.wwdir } : null,
      raw_json: { txt: row, spec },
    })
  }
  return merged
}

// ── Open-Meteo Marine ─────────────────────────────────────────────────────────
async function fetchOpenMeteo(): Promise<any[]> {
  const coasts = [
    { coast: 'east', lat: 13.15, lon: -59.43 },
    { coast: 'south', lat: 13.05, lon: -59.53 },
  ]
  const rows: any[] = []
  for (const { coast, lat, lon } of coasts) {
    try {
      const fields = 'wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,wind_wave_height,wind_wave_period'
      const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=${fields}&forecast_days=7&timezone=America%2FBarbados`
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
      if (!res.ok) { console.warn(`  ⚠️ Open-Meteo ${coast}: HTTP ${res.status}`); continue }
      const data = await res.json()
      const h = data.hourly || {}
      const times: string[] = h.time || []
      for (let i = 0; i < times.length; i++) {
        rows.push({
          coast,
          timestamp: times[i].includes('T') ? times[i] + ':00+00:00' : times[i] + 'T00:00:00+00:00',
          wave_height_m: h.wave_height?.[i] ?? null,
          wave_period_s: h.wave_period?.[i] ?? null,
          wave_dir_deg: h.wave_direction?.[i] ?? null,
          swell_height_m: h.swell_wave_height?.[i] ?? null,
          swell_period_s: h.swell_wave_period?.[i] ?? null,
          swell_dir_deg: h.swell_wave_direction?.[i] ?? null,
          wind_wave_height_m: h.wind_wave_height?.[i] ?? null,
          wind_wave_period_s: h.wind_wave_period?.[i] ?? null,
        })
      }
    } catch (e) {
      console.warn(`  ⚠️ Open-Meteo ${coast}: ${e}`)
    }
  }
  return rows
}

// ── NHC Active Storms ─────────────────────────────────────────────────────────
const BARBADOS_LAT = 13.1
const BARBADOS_LON = -59.5

function haversineNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function bearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * Math.PI / 180
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180)
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
    Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon)
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

function stormCategory(windKt: number, classification: string): number {
  if (classification === 'TD') return 0
  if (classification === 'TS') return 0
  if (windKt >= 137) return 5
  if (windKt >= 113) return 4
  if (windKt >= 96) return 3
  if (windKt >= 83) return 2
  if (windKt >= 64) return 1
  return 0
}

async function fetchNHCStorms(): Promise<any[]> {
  try {
    const res = await fetch('https://www.nhc.noaa.gov/CurrentStorms.json', { signal: AbortSignal.timeout(15000) })
    if (!res.ok) return []
    const data = await res.json()
    const storms: any[] = data.activeStorms || []
    const rows: any[] = []
    const fetchedAt = new Date().toISOString()

    for (const s of storms) {
      // Atlantic only (id starts with 'al')
      if (!s.id?.startsWith('al')) continue
      const lat: number = s.latitudeNumeric ?? parseFloat((s.latitude || '0').replace(/[^0-9.]/g, '')) * (String(s.latitude).includes('S') ? -1 : 1)
      const lon: number = s.longitudeNumeric ?? parseFloat((s.longitude || '0').replace(/[^0-9.]/g, '')) * (String(s.longitude).includes('W') ? -1 : 1)
      const maxWindKt = parseInt(s.intensity || '0')
      const distNm = Math.round(haversineNm(lat, lon, BARBADOS_LAT, BARBADOS_LON))
      const bearToBds = Math.round(bearingDeg(lat, lon, BARBADOS_LAT, BARBADOS_LON))

      // Swell physics (only for storms within 2500nm)
      let estPeriod: number | null = null
      let estEta: number | null = null
      if (distNm <= 2500) {
        // T ≈ 0.5 * sqrt(fetch_nm) capped 8-20s
        estPeriod = Math.round(Math.min(20, Math.max(8, 0.5 * Math.sqrt(distNm))) * 10) / 10
        // Group speed Cg (kt) = 1.515 * T (s)
        const cgKt = 1.515 * estPeriod
        estEta = Math.round(distNm / cgKt)
      }

      rows.push({
        storm_id: s.id,
        name: s.name,
        classification: s.classification,
        category: stormCategory(maxWindKt, s.classification || ''),
        lat, lon,
        max_winds_kt: maxWindKt,
        movement_speed_kt: s.movementSpeed ?? null,
        movement_dir_deg: s.movementDir ?? null,
        distance_nm: distNm,
        bearing_deg: bearToBds,
        est_swell_period_s: estPeriod,
        est_eta_hours: estEta,
        raw_json: s,
        fetched_at: fetchedAt,
      })
    }
    return rows
  } catch (e) {
    console.warn(`  ⚠️ NHC storms: ${e}`)
    return []
  }
}

// ── Forecast Bias Tracking ────────────────────────────────────────────────────
// Compare yesterday's Surfline forecast for Soup Bowl vs buoy 41040 actual.
async function trackForecastBias(premium: Record<string, any> | null): Promise<void> {
  if (!SUPABASE_KEY) return
  try {
    // Get yesterday's date string
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateStr = yesterday.toISOString().split('T')[0]

    // Surfline predicted: find yesterday noon forecast from premium data
    const soupBowlData = premium?.['5842041f4e65fad6a7708b48']
    let surflinePredFt: number | null = null
    if (soupBowlData?.waves?.length) {
      const noonTs = new Date(`${dateStr}T12:00:00-04:00`).getTime() / 1000
      const noonWave = soupBowlData.waves.find((w: any) => Math.abs(w.ts - noonTs) < 3600)
      if (noonWave?.max != null) surflinePredFt = Math.round(noonWave.max * 10) / 10
    }

    // Buoy 41040 actual: get yesterday's median WVHT from DB
    const buoyRows: any[] = await sbSelect('buoy_readings',
      `buoy_id=eq.41040&timestamp=gte.${dateStr}T00:00:00Z&timestamp=lt.${dateStr}T23:59:59Z&select=wvht_m&order=timestamp`)
    const validWvhts = buoyRows.map((r: any) => r.wvht_m).filter((v: any) => v != null)
    let buoyActualFt: number | null = null
    if (validWvhts.length) {
      const sorted = validWvhts.sort((a: number, b: number) => a - b)
      const median = sorted[Math.floor(sorted.length / 2)]
      buoyActualFt = Math.round(median * 3.28084 * 10) / 10
    }

    if (surflinePredFt == null || buoyActualFt == null) return

    await sbUpsert('forecast_bias', {
      source: 'surfline',
      coast: 'east',
      forecast_date: dateStr,
      predicted_height_ft: surflinePredFt,
      actual_height_ft: buoyActualFt,
      error_ft: Math.round((surflinePredFt - buoyActualFt) * 100) / 100,
    }, 'source,coast,forecast_date')
    console.log(`  ✅ Bias: Surfline ${surflinePredFt}ft predicted, ${buoyActualFt}ft actual (${dateStr})`)
  } catch (e) {
    console.warn(`  ⚠️ Bias tracking: ${e}`)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  SL_TOKEN = await ensureToken()

  // ─ Surfline ─
  console.log('🏄 Fetching Surfline overview...')
  const surfline = await fetchSurflineOverview()
  const slCount = Object.values(surfline).reduce((n: number, s: any) => n + s.length, 0)
  console.log(`  ✅ ${slCount} Surfline spots`)

  console.log('🏄 Fetching Surfline premium (hourly + tides)...')
  const premium = await fetchSurflinePremium()
  console.log(`  ${premium ? '✅' : '⚠️'} ${premium ? Object.keys(premium).length : 0} premium spots`)

  // ─ WindGuru ─
  console.log('🌬️ Fetching WindGuru...')
  const windguru = await fetchWindGuru()
  console.log(`  ✅ ${Object.keys(windguru).length} WindGuru forecasts`)

  // ─ Cache main blob to surf_cache ─
  if (SUPABASE_KEY) {
    const payload = {
      timestamp: new Date().toISOString(),
      sources: ['surfline', ...(premium ? ['surfline-premium'] : []), 'windguru-ecmwf-wam'],
      surfline, premium, windguru,
    }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/surf_cache?on_conflict=key`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ key: 'latest', data: payload, updated_at: new Date().toISOString() }),
    })
    if (res.ok) console.log(`✅ surf_cache updated`)
    else console.error(`❌ surf_cache: ${res.status} ${await res.text()}`)
  }

  // ─ NOAA Buoys ─
  console.log('🌊 Fetching NOAA buoys 41040 + 41043...')
  for (const buoyId of ['41040', '41043']) {
    const rows = await fetchNOAABuoy(buoyId)
    if (rows.length) {
      await sbUpsert('buoy_readings', rows, 'buoy_id,timestamp')
      const latest = rows[0]
      const wvhtFt = latest.wvht_m != null ? (latest.wvht_m * 3.28084).toFixed(1) : '??'
      const trendIcon = latest.trend === 'rising' ? '📈' : latest.trend === 'falling' ? '📉' : '→'
      console.log(`  ✅ ${buoyId}: ${wvhtFt}ft @ ${latest.dpd_s}s ${latest.mwd_deg != null ? degToCompass(latest.mwd_deg) : '?'} ${trendIcon} (${rows.length} rows)`)
    } else {
      console.warn(`  ⚠️ ${buoyId}: no data`)
    }
  }

  // ─ Open-Meteo ─
  console.log('📡 Fetching Open-Meteo Marine (7-day)...')
  const omRows = await fetchOpenMeteo()
  if (omRows.length) {
    // Upsert in batches of 200
    for (let i = 0; i < omRows.length; i += 200) {
      await sbUpsert('openmeteo_forecasts', omRows.slice(i, i + 200), 'coast,timestamp')
    }
    console.log(`  ✅ ${omRows.length} Open-Meteo rows stored`)
  } else {
    console.warn('  ⚠️ Open-Meteo: no data')
  }

  // ─ NHC Storms ─
  console.log('🌀 Fetching NHC active Atlantic storms...')
  const storms = await fetchNHCStorms()
  if (storms.length) {
    await sbUpsert('nhc_storms', storms, 'storm_id')
    for (const s of storms) {
      console.log(`  🌀 ${s.name} (${s.classification}) ${s.distance_nm}nm away${s.est_eta_hours ? ` · ETA ${s.est_eta_hours}h` : ''}`)
    }
  } else {
    console.log('  ✅ No active Atlantic storms')
  }

  // ─ Bias tracking ─
  console.log('📊 Tracking forecast bias...')
  await trackForecastBias(premium)

  console.log('\n✅ Cache job complete.')
}

main().catch(err => { console.error(err); process.exit(1) })
