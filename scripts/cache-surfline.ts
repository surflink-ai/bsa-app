/**
 * Fetches Surfline data from local machine (not blocked) and caches to Supabase.
 * Run via cron every 15 minutes: npx tsx scripts/cache-surfline.ts
 */

const SUPABASE_URL = 'https://veggfcumdveuoumrblcn.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const SL_BASE = 'https://services.surfline.com'

const SUBREGIONS: Record<string, string> = {
  east: '58581a836630e24c44878fe9',
  south: '58581a836630e24c44879149',
  west: '58581a836630e24c44879148',
}

const WINDGURU_SPOTS = [
  { id: 64149, name: 'Barbados South' },
  { id: 64150, name: 'Barbados North' },
]

async function fetchSurfline() {
  const results: Record<string, any> = {}
  for (const [coast, subregionId] of Object.entries(SUBREGIONS)) {
    try {
      const res = await fetch(`${SL_BASE}/kbyg/regions/overview?subregionId=${subregionId}`)
      if (!res.ok) { results[coast] = []; continue }
      const data = await res.json()
      const units = data?.associated?.units?.waveHeight || 'FT'
      const toFeet = units === 'M' ? 3.28084 : 1
      results[coast] = (data?.data?.spots || []).map((s: any) => ({
        spotId: s._id,
        name: s.name,
        conditions: s.conditions?.value || 'FLAT',
        waveMin: Math.round((s.waveHeight?.min || 0) * toFeet),
        waveMax: Math.round((s.waveHeight?.max || 0) * toFeet),
        waveHeightM: { min: s.waveHeight?.min || 0, max: s.waveHeight?.max || 0 },
        humanRelation: s.waveHeight?.humanRelation || '',
        coast: coast.charAt(0).toUpperCase() + coast.slice(1),
      }))
    } catch { results[coast] = [] }
  }
  return results
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
  console.log('🏄 Fetching Surfline...')
  const surfline = await fetchSurfline()
  const slSpotCount = Object.values(surfline).reduce((n, s: any) => n + s.length, 0)
  console.log(`  ✅ ${slSpotCount} spots from Surfline`)

  console.log('🌬️ Fetching WindGuru...')
  const windguru = await fetchWindGuru()
  console.log(`  ✅ ${Object.keys(windguru).length} WindGuru forecasts`)

  const payload = {
    timestamp: new Date().toISOString(),
    sources: ['surfline', 'windguru-ecmwf-wam'],
    surfline,
    windguru,
  }

  // Cache to Supabase (upsert a single row in a cache table)
  // We'll use a simple key-value approach
  if (!SUPABASE_KEY) {
    console.log('⚠️  No SUPABASE_SERVICE_ROLE_KEY — writing to stdout')
    console.log(JSON.stringify(payload, null, 2).slice(0, 500) + '...')
    return
  }

  // Upsert into surf_cache table
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
    console.log(`✅ Cached to Supabase (${slSpotCount} Surfline spots + ${Object.keys(windguru).length} WindGuru forecasts)`)
  } else {
    const err = await res.text()
    console.error(`❌ Supabase error: ${res.status} ${err}`)
  }
}

main().catch(console.error)
