/**
 * Fetches Surfline (premium) + WindGuru data from local machine and caches to Supabase.
 * Run via cron every 15 minutes: npx tsx scripts/cache-surfline.ts
 * 
 * Surfline premium gives: 6-day forecast, 1-hour intervals, spot ratings, detailed swell.
 * Vercel can't hit Surfline directly (IP blocked), so we cache here → Supabase → Vercel reads.
 */

const SUPABASE_URL = 'https://veggfcumdveuoumrblcn.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const SL_BASE = 'https://services.surfline.com'
let SL_TOKEN = process.env.SURFLINE_ACCESS_TOKEN || ''
const SL_REFRESH = process.env.SURFLINE_REFRESH_TOKEN || ''

// Auto-refresh: test token, refresh if expired
async function ensureToken(): Promise<string> {
  if (!SL_TOKEN) return ''
  // Quick test
  const test = await fetch(`${SL_BASE}/kbyg/spots/forecasts/wave?spotId=5842041f4e65fad6a7708b48&days=1&intervalHours=6&accesstoken=${SL_TOKEN}`)
  if (test.ok) {
    const d = await test.json()
    if (d?.data?.wave?.length) return SL_TOKEN // Token works
  }
  // Token expired — try refresh
  if (!SL_REFRESH) {
    console.warn('⚠️  Surfline token expired, no refresh token available')
    return ''
  }
  console.log('🔄 Surfline token expired, attempting refresh...')
  try {
    const res = await fetch(`${SL_BASE}/trusted/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: SL_REFRESH }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.access_token) {
        SL_TOKEN = data.access_token
        console.log('✅ Surfline token refreshed')
        return SL_TOKEN
      }
    }
    console.warn('⚠️  Surfline refresh failed, falling back to free tier')
    return ''
  } catch {
    console.warn('⚠️  Surfline refresh error, falling back to free tier')
    return ''
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
  { id: '5842041f4e65fad6a7708c81', name: "Brandon's", coast: 'south' },
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
        ? `${SL_BASE}/kbyg/regions/overview?subregionId=${subregionId}&accesstoken=${SL_TOKEN}`
        : `${SL_BASE}/kbyg/regions/overview?subregionId=${subregionId}`
      const res = await fetch(url)
      if (!res.ok) { results[coast] = []; continue }
      const data = await res.json()
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
      // Wave forecast — 3 days hourly
      const waveRes = await fetch(
        `${SL_BASE}/kbyg/spots/forecasts/wave?spotId=${spot.id}&days=3&intervalHours=1&accesstoken=${SL_TOKEN}`
      )
      // Wind forecast
      const windRes = await fetch(
        `${SL_BASE}/kbyg/spots/forecasts/wind?spotId=${spot.id}&days=3&intervalHours=3&accesstoken=${SL_TOKEN}`
      )
      // Rating forecast
      const ratingRes = await fetch(
        `${SL_BASE}/kbyg/spots/forecasts/rating?spotId=${spot.id}&days=3&intervalHours=3&accesstoken=${SL_TOKEN}`
      )

      const [waveData, windData, ratingData] = await Promise.all([
        waveRes.ok ? waveRes.json() : null,
        windRes.ok ? windRes.json() : null,
        ratingRes.ok ? ratingRes.json() : null,
      ])

      const waves = (waveData?.data?.wave || []).map((w: any) => ({
        ts: w.timestamp,
        min: w.surf?.min,
        max: w.surf?.max,
        human: w.surf?.humanRelation,
        swells: (w.swells || []).slice(0, 3).map((s: any) => ({
          h: s.height, p: s.period, d: s.direction, dp: s.directionMin
        })),
        power: w.power,
      }))

      const winds = (windData?.data?.wind || []).map((w: any) => ({
        ts: w.timestamp,
        speed: w.speed, gust: w.gust, dir: w.direction, dirType: w.directionType,
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
