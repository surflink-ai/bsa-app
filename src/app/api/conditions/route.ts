import { NextResponse } from "next/server"
import { BARBADOS_SPOTS, type SurflineSpot } from "@/lib/surfline"

export const dynamic = "force-dynamic"

/* ─── The Ultimate Surf Forecast Engine ────────────────────────────────────
 * 
 * DATA SOURCES (9):
 * 1. Surfline LOTUS (premium) — spot-specific ML-calibrated model, hourly
 * 2. Surfline Premium Forecasts — 3-day hourly wave/wind/ratings per key spot
 * 3. WindGuru ECMWF WAM — European wave model, 3-day swell forecast
 * 4. Open-Meteo Marine (GFS Wave) — NOAA wave model per spot
 * 5. Open-Meteo Weather — wind/temp per spot
 * 6. NOAA Buoy 41044 — real measured Atlantic swell (NE Caribbean)
 * 7. NOAA Buoy 41043 — real measured Caribbean swell (NE Puerto Rico)
 * 8. NOAA Tides — hi/lo predictions (St. Lucia + Barbados offset)
 * 9. Sunrise/Sunset — Open-Meteo
 * 
 * SMART LAYER:
 * - Swell window filtering (only show swells that can reach each coast)
 * - Multi-model consensus (Surfline + ECMWF + GFS agreement = confidence)
 * - NOAA buoy confirmation ("swell is in the water" signal)
 * - Tide offset correction (St. Lucia → Barbados ~20min)
 * - Staleness detection + failover chain
 * - Surfline primary, Open-Meteo fallback
 * ──────────────────────────────────────────────────────────────────────── */

// ─── Constants ────────────────────────────────────────────────────────────

const NOAA_BUOYS = [
  { id: "41044", name: "NE Caribbean", lat: 21.58, lon: -58.63, desc: "330 NM NE of St Martin — upstream Atlantic swell" },
  { id: "41043", name: "NE Puerto Rico", lat: 21.09, lon: -64.86, desc: "170 NM NNE of San Juan — Caribbean swell" },
]
const TIDE_STATION = "TEC4777"
const BARBADOS_TIDE_OFFSET_MIN = 20 // St. Lucia → Barbados approximate offset

// Swell window: what degree range can actually reach each coast?
// Barbados sits at ~13.1°N, 59.6°W. East coast faces ~90°, south ~180°, west ~270°.
const SWELL_WINDOWS: Record<string, { min: number; max: number; label: string }> = {
  East:  { min: 10,  max: 150, label: "N to SSE" },   // North Atlantic groundswell + trade wind swell
  South: { min: 100, max: 240, label: "ESE to WSW" },  // Southern hemi + Caribbean wrap
  West:  { min: 250, max: 360, label: "W to N" },      // Rare NW groundswell
}

// ─── Swell Window Filter ─────────────────────────────────────────────────

function isSwellInWindow(swellDirDeg: number, coast: string): boolean {
  const window = SWELL_WINDOWS[coast]
  if (!window) return true // unknown coast = show everything
  const dir = ((swellDirDeg % 360) + 360) % 360
  if (window.min < window.max) {
    return dir >= window.min && dir <= window.max
  }
  // Wraps around 360 (e.g. West: 250-360)
  return dir >= window.min || dir <= (window.max % 360)
}

function swellExposureScore(swellDirDeg: number, coast: string): number {
  // 0 = blocked, 1 = perfect direct hit
  const coastFacing: Record<string, number> = { East: 90, South: 180, West: 270 }
  const facing = coastFacing[coast] || 90
  let diff = Math.abs(swellDirDeg - facing)
  if (diff > 180) diff = 360 - diff
  if (diff > 90) return 0 // completely shadowed
  return 1 - (diff / 90) // linear decay
}

// ─── Multi-Model Consensus ───────────────────────────────────────────────

interface ModelReading {
  source: string
  waveHeightM: number
  swellHeightM?: number
  swellPeriodS?: number
  swellDirDeg?: number
}

function computeConsensus(readings: ModelReading[]): {
  confidence: "high" | "medium" | "low"
  avgWaveM: number
  spread: number
  agreementNote: string
} {
  const valid = readings.filter(r => r.waveHeightM > 0)
  if (valid.length === 0) return { confidence: "low", avgWaveM: 0, spread: 0, agreementNote: "No data" }
  if (valid.length === 1) return { confidence: "low", avgWaveM: valid[0].waveHeightM, spread: 0, agreementNote: `Single source: ${valid[0].source}` }
  
  const heights = valid.map(r => r.waveHeightM)
  const avg = heights.reduce((a, b) => a + b, 0) / heights.length
  const spread = Math.max(...heights) - Math.min(...heights)
  const spreadPct = avg > 0 ? spread / avg : 0
  
  let confidence: "high" | "medium" | "low"
  let agreementNote: string

  if (spreadPct < 0.25 && valid.length >= 2) {
    confidence = "high"
    agreementNote = `${valid.length} models agree (±${(spread * 3.28084).toFixed(0)}ft)`
  } else if (spreadPct < 0.5) {
    confidence = "medium"
    agreementNote = `Models differ by ${(spread * 3.28084).toFixed(0)}ft`
  } else {
    confidence = "low"
    agreementNote = `Models disagree (${(spread * 3.28084).toFixed(0)}ft spread)`
  }

  return { confidence, avgWaveM: avg, spread, agreementNote }
}

// ─── Buoy Confirmation ──────────────────────────────────────────────────

function buoyConfirmation(buoy44: any, buoy43: any, forecastSwellM: number): {
  confirmed: boolean
  signal: string
  buoySwellM: number | null
} {
  // Use the closer buoy with valid data
  const buoy = buoy44?.swellHeight ?? buoy43?.swellHeight
  if (buoy == null) return { confirmed: false, signal: "No buoy data", buoySwellM: null }
  
  const diff = Math.abs(buoy - forecastSwellM)
  const tolerance = Math.max(0.3, forecastSwellM * 0.3) // 30% or 0.3m

  if (diff <= tolerance) {
    return { confirmed: true, signal: `Buoy confirms swell (${buoy.toFixed(1)}m measured)`, buoySwellM: buoy }
  } else if (buoy > forecastSwellM) {
    return { confirmed: true, signal: `Buoy reads HIGHER than forecast (${buoy.toFixed(1)}m vs ${forecastSwellM.toFixed(1)}m predicted)`, buoySwellM: buoy }
  } else {
    return { confirmed: false, signal: `Buoy reads lower (${buoy.toFixed(1)}m vs ${forecastSwellM.toFixed(1)}m predicted — swell may not have arrived)`, buoySwellM: buoy }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function classifyWind(windDir: number, coast: string): string {
  const coastFacing: Record<string, number> = { East: 90, South: 180, West: 270 }
  const facing = coastFacing[coast] || 90
  let diff = Math.abs(windDir - facing)
  if (diff > 180) diff = 360 - diff
  if (diff > 150) return "Offshore"
  if (diff > 120) return "Cross-offshore"
  if (diff > 60) return "Cross-shore"
  if (diff > 30) return "Cross-onshore"
  return "Onshore"
}

function rateConditions(waveM: number, swellM: number, swellPeriod: number, windKph: number, windType: string): string {
  if (waveM < 0.3) return "FLAT"
  const isClean = windType === "Offshore" || windType === "Cross-offshore"
  const isMessy = windType === "Onshore" || windType === "Cross-onshore"
  const longPeriod = swellPeriod >= 10
  if (isClean && waveM >= 1.8 && longPeriod) return "EPIC"
  if (isClean && waveM >= 1.2) return "GOOD"
  if (isClean) return "FAIR"
  if (windType === "Cross-shore") {
    if (waveM >= 1.5 && windKph < 25) return "FAIR"
    if (waveM >= 0.6) return "POOR_TO_FAIR"
    return "POOR"
  }
  if (isMessy && windKph > 30) return "POOR"
  if (isMessy && waveM >= 1.0) return "POOR_TO_FAIR"
  return "POOR"
}

function humanWaveHeight(m: number): string {
  const ft = m * 3.28084
  if (ft < 0.5) return "Flat"
  if (ft < 1.5) return "Ankle high"
  if (ft < 2.5) return "Knee high"
  if (ft < 3.5) return "Thigh to waist"
  if (ft < 4.5) return "Waist to chest"
  if (ft < 5.5) return "Chest to head"
  if (ft < 7) return "Overhead"
  if (ft < 9) return "Well overhead"
  if (ft < 12) return "Double overhead"
  return "Double overhead+"
}

function compassDir(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
  return dirs[Math.round(deg / 22.5) % 16]
}

function offsetTides(tides: any[], offsetMinutes: number): any[] {
  return tides.map(t => {
    const d = new Date(t.time)
    d.setMinutes(d.getMinutes() + offsetMinutes)
    return { ...t, time: d.toISOString().slice(0, 16).replace("T", " "), originalTime: t.time, offset: `+${offsetMinutes}min (Barbados est.)` }
  })
}

// ─── Fetch Helpers ────────────────────────────────────────────────────────

async function fetchNOAABuoy(buoyId: string) {
  try {
    const res = await fetch(`https://www.ndbc.noaa.gov/data/realtime2/${buoyId}.spec`, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return null
    const text = await res.text()
    const lines = text.split("\n").filter(l => !l.startsWith("#") && l.trim())
    if (!lines.length) return null
    const parts = lines[0].trim().split(/\s+/)
    return {
      time: `${parts[0]}-${parts[1]}-${parts[2]}T${parts[3]}:${parts[4]}Z`,
      waveHeight: parts[5] !== "MM" ? parseFloat(parts[5]) : null,
      swellHeight: parts[6] !== "MM" ? parseFloat(parts[6]) : null,
      swellPeriod: parts[7] !== "MM" ? parseFloat(parts[7]) : null,
      windWaveHeight: parts[8] !== "MM" ? parseFloat(parts[8]) : null,
      windWavePeriod: parts[9] !== "MM" ? parseFloat(parts[9]) : null,
      swellDir: parts[10] !== "MM" ? parts[10] : null,
      windWaveDir: parts[11] !== "MM" ? parts[11] : null,
      steepness: parts[12] || null,
    }
  } catch { return null }
}

async function fetchNOAATides() {
  try {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "")
    const res = await fetch(
      `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date=${fmt(today)}&end_date=${fmt(tomorrow)}&station=${TIDE_STATION}&product=predictions&datum=MLLW&time_zone=lst_ldt&units=metric&interval=hilo&format=json`,
      { signal: AbortSignal.timeout(6000) }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.predictions || []).map((p: any) => ({
      time: p.t,
      height: parseFloat(p.v),
      type: p.type === "H" ? "high" : "low",
    }))
  } catch { return [] }
}

async function fetchSunTimes() {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=13.1&longitude=-59.6&daily=sunrise,sunset&timezone=America/Barbados&forecast_days=2`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    return { sunrise: data.daily?.sunrise?.[0] || null, sunset: data.daily?.sunset?.[0] || null }
  } catch { return null }
}

async function fetchSurfCache(): Promise<{ data: any; ageMs: number; stale: boolean } | null> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return null
    const res = await fetch(`${url}/rest/v1/surf_cache?key=eq.latest&select=data,updated_at`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    const rows = await res.json()
    if (!rows?.[0]) return null
    const ageMs = Date.now() - new Date(rows[0].updated_at).getTime()
    return { data: rows[0].data, ageMs, stale: ageMs > 30 * 60 * 1000 }
  } catch { return null }
}

// ─── Route Handler ────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const spotId = searchParams.get("spot")

  // ── Single spot detail ──────────────────────────────────────────────────
  if (spotId) {
    const spot = BARBADOS_SPOTS.find(s => s.id === spotId)
    if (!spot) return NextResponse.json({ error: "Spot not found" }, { status: 404 })

    try {
      const [marineRes, weatherRes, buoy44, buoy43, tides, sun, surfCacheResult] = await Promise.all([
        fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${spot.lat}&longitude=${spot.lon}&current=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period&hourly=wave_height,wave_period,swell_wave_height,swell_wave_period,swell_wave_direction&timezone=America/Barbados&forecast_hours=48`, { signal: AbortSignal.timeout(8000) }),
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${spot.lat}&longitude=${spot.lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=America/Barbados&forecast_hours=48`, { signal: AbortSignal.timeout(8000) }),
        fetchNOAABuoy("41044"),
        fetchNOAABuoy("41043"),
        fetchNOAATides(),
        fetchSunTimes(),
        fetchSurfCache(),
      ])

      const [marine, weather] = await Promise.all([
        marineRes.ok ? marineRes.json() : null,
        weatherRes.ok ? weatherRes.json() : null,
      ])

      const mc = marine?.current || {}
      const wc = weather?.current || {}
      const windType = classifyWind(wc.wind_direction_10m || 0, spot.coast)
      const surfCache = surfCacheResult?.data
      const premium = surfCache?.premium?.[spotId]

      // Build model readings for consensus
      const modelReadings: ModelReading[] = []
      if (premium?.waves?.[0]) {
        const w = premium.waves[0]
        modelReadings.push({ source: "surfline-lotus", waveHeightM: ((w.min || 0) + (w.max || 0)) / 2 * 0.3048, swellHeightM: w.swells?.[0]?.h, swellPeriodS: w.swells?.[0]?.p, swellDirDeg: w.swells?.[0]?.d })
      }
      if (mc.wave_height) {
        modelReadings.push({ source: "gfs-wave", waveHeightM: mc.wave_height, swellHeightM: mc.swell_wave_height, swellPeriodS: mc.swell_wave_period, swellDirDeg: mc.swell_wave_direction })
      }
      // WindGuru closest reading
      const wgSpot = surfCache?.windguru ? Object.values(surfCache.windguru as Record<string, any>)[0] : null
      if (wgSpot?.waveHeight?.[0]) {
        modelReadings.push({ source: "ecmwf-wam", waveHeightM: wgSpot.waveHeight[0], swellHeightM: wgSpot.swellHeight?.[0], swellPeriodS: wgSpot.swellPeriod?.[0], swellDirDeg: wgSpot.swellDir?.[0] })
      }

      const consensus = computeConsensus(modelReadings)
      const avgSwellM = modelReadings.reduce((a, r) => a + (r.swellHeightM || 0), 0) / Math.max(1, modelReadings.filter(r => r.swellHeightM).length)
      const buoySignal = buoyConfirmation(buoy44, buoy43, avgSwellM)
      const swellDir = mc.swell_wave_direction || premium?.waves?.[0]?.swells?.[0]?.d || 0
      const swellInWindow = isSwellInWindow(swellDir, spot.coast)
      const exposure = swellExposureScore(swellDir, spot.coast)

      return NextResponse.json({
        spot,
        sources: surfCacheResult?.stale === false ? ["surfline-lotus", "surfline-premium", "gfs-wave", "ecmwf-wam", "open-meteo-weather", "noaa-buoy-41044", "noaa-buoy-41043", "noaa-tides"] : ["gfs-wave", "open-meteo-weather", "noaa-buoy-41044", "noaa-buoy-41043", "noaa-tides"],
        current: {
          wave: { height: mc.wave_height || 0, direction: mc.wave_direction || 0, directionLabel: compassDir(mc.wave_direction || 0), period: mc.wave_period || 0, human: humanWaveHeight(mc.wave_height || 0) },
          swell: { height: mc.swell_wave_height || 0, direction: mc.swell_wave_direction || 0, directionLabel: compassDir(mc.swell_wave_direction || 0), period: mc.swell_wave_period || 0 },
          wind: { speed: wc.wind_speed_10m || 0, direction: wc.wind_direction_10m || 0, directionLabel: compassDir(wc.wind_direction_10m || 0), gust: wc.wind_gusts_10m || 0, type: windType },
          temperature: wc.temperature_2m || null,
          conditions: premium ? (premium.ratings?.[0]?.key || rateConditions(mc.wave_height || 0, mc.swell_wave_height || 0, mc.swell_wave_period || 0, wc.wind_speed_10m || 0, windType)) : rateConditions(mc.wave_height || 0, mc.swell_wave_height || 0, mc.swell_wave_period || 0, wc.wind_speed_10m || 0, windType),
        },
        surflinePremium: premium ? {
          waves: premium.waves?.slice(0, 72),  // Full 3-day hourly
          winds: premium.winds?.slice(0, 24),  // 3-day every 3h
          ratings: premium.ratings?.slice(0, 24),
        } : null,
        analysis: {
          consensus,
          buoySignal,
          swellWindow: { inWindow: swellInWindow, exposure: Math.round(exposure * 100), coastWindow: SWELL_WINDOWS[spot.coast], swellDir: compassDir(swellDir), swellDirDeg: swellDir },
          models: modelReadings.map(r => ({ source: r.source, waveM: Math.round(r.waveHeightM * 10) / 10, swellM: r.swellHeightM ? Math.round(r.swellHeightM * 10) / 10 : null, periodS: r.swellPeriodS ? Math.round(r.swellPeriodS) : null })),
        },
        buoys: { "41044": buoy44, "41043": buoy43, meta: NOAA_BUOYS },
        tides: offsetTides(tides, BARBADOS_TIDE_OFFSET_MIN),
        sun,
        hourly: marine?.hourly ? {
          time: marine.hourly.time?.slice(0, 48) || [],
          waveHeight: marine.hourly.wave_height?.slice(0, 48) || [],
          wavePeriod: marine.hourly.wave_period?.slice(0, 48) || [],
          swellHeight: marine.hourly.swell_wave_height?.slice(0, 48) || [],
          swellPeriod: marine.hourly.swell_wave_period?.slice(0, 48) || [],
          swellDirection: marine.hourly.swell_wave_direction?.slice(0, 48) || [],
          windSpeed: weather?.hourly?.wind_speed_10m?.slice(0, 48) || [],
          windDirection: weather?.hourly?.wind_direction_10m?.slice(0, 48) || [],
          windGust: weather?.hourly?.wind_gusts_10m?.slice(0, 48) || [],
        } : null,
        cache: { surflineAge: surfCacheResult?.ageMs ? Math.round(surfCacheResult.ageMs / 60000) + "min" : null, stale: surfCacheResult?.stale ?? true },
      }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } })
    } catch {
      return NextResponse.json({ error: "Failed to fetch forecast" }, { status: 502 })
    }
  }

  // ── All spots overview ─────────────────────────────────────────────────
  try {
    const lats = BARBADOS_SPOTS.map(s => s.lat).join(",")
    const lons = BARBADOS_SPOTS.map(s => s.lon).join(",")

    const [marineRes, weatherRes, buoy44, buoy43, tides, sun, surfCacheResult] = await Promise.all([
      fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${lats}&longitude=${lons}&current=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period&timezone=America/Barbados`, { signal: AbortSignal.timeout(10000) }),
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=America/Barbados`, { signal: AbortSignal.timeout(10000) }),
      fetchNOAABuoy("41044"),
      fetchNOAABuoy("41043"),
      fetchNOAATides(),
      fetchSunTimes(),
      fetchSurfCache(),
    ])

    const [marineData, weatherData] = await Promise.all([
      marineRes.ok ? marineRes.json() : null,
      weatherRes.ok ? weatherRes.json() : null,
    ])

    const marines = Array.isArray(marineData) ? marineData : [marineData]
    const weathers = Array.isArray(weatherData) ? weatherData : [weatherData]
    const surfCache = surfCacheResult?.data
    const cacheStale = surfCacheResult?.stale ?? true

    // Build Surfline spot lookup from cache
    const slSpots = new Map<string, any>()
    if (surfCache?.surfline) {
      for (const coast of ["east", "south", "west"]) {
        for (const s of surfCache.surfline[coast] || []) {
          slSpots.set(s.spotId, s)
        }
      }
    }

    // WindGuru readings for consensus
    const wgSpots = surfCache?.windguru ? Object.values(surfCache.windguru as Record<string, any>) : []
    const wgAvgWave = wgSpots.length > 0 ? wgSpots.reduce((a: number, s: any) => a + (s.waveHeight?.[0] || 0), 0) / wgSpots.length : null

    const coastSpots: Record<string, any[]> = { east: [], south: [], west: [] }

    BARBADOS_SPOTS.forEach((spot, i) => {
      const mc = marines[i]?.current || {}
      const wc = weathers[i]?.current || {}
      const sl = slSpots.get(spot.id)
      const premium = surfCache?.premium?.[spot.id]
      const waveH = mc.wave_height || 0
      const swellH = mc.swell_wave_height || 0
      const swellP = mc.swell_wave_period || 0
      const swellDir = mc.swell_wave_direction || 0
      const windSpeed = wc.wind_speed_10m || 0
      const windDir = wc.wind_direction_10m || 0
      const windType = classifyWind(windDir, spot.coast)
      const toFeet = 3.28084

      // Swell window analysis
      const inWindow = isSwellInWindow(swellDir, spot.coast)
      const exposure = swellExposureScore(swellDir, spot.coast)

      // Multi-model consensus
      const readings: ModelReading[] = []
      // sl.waveHeightM now contains actual meters after cache fix
      if (sl?.waveHeightM) readings.push({ source: "surfline", waveHeightM: sl.waveHeightM.max || 0 })
      if (waveH) readings.push({ source: "gfs-wave", waveHeightM: waveH })
      if (wgAvgWave) readings.push({ source: "ecmwf-wam", waveHeightM: wgAvgWave })
      const consensus = computeConsensus(readings)

      // Use Surfline as primary, fall back to computed
      const conditions = !cacheStale && sl?.conditions
        ? sl.conditions
        : !cacheStale && premium?.ratings?.[0]?.key
        ? premium.ratings[0].key
        : rateConditions(waveH, swellH, swellP, windSpeed, windType)

      coastSpots[spot.coast.toLowerCase()]?.push({
        spotId: spot.id,
        name: spot.name,
        conditions,
        waveMin: !cacheStale && sl ? sl.waveMin : Math.round(Math.max(0, waveH - 0.3) * toFeet),
        waveMax: !cacheStale && sl ? sl.waveMax : Math.round(waveH * toFeet),
        waveM: Math.round(waveH * 10) / 10,
        humanRelation: sl?.humanRelation || humanWaveHeight(waveH),
        surflineWaveM: sl?.waveHeightM || null,
        swellHeight: Math.round(swellH * 10) / 10,
        swellPeriod: Math.round(swellP * 10) / 10,
        swellDir: compassDir(swellDir),
        swellDirDeg: swellDir,
        windSpeed: Math.round(windSpeed),
        windGust: Math.round(wc.wind_gusts_10m || 0),
        windDir: compassDir(windDir),
        windType,
        temp: wc.temperature_2m || null,
        coast: spot.coast,
        // Smart layer
        swellInWindow: inWindow,
        swellExposure: Math.round(exposure * 100),
        confidence: consensus.confidence,
        consensusNote: consensus.agreementNote,
      })
    })

    for (const coast of ["east", "south", "west"]) {
      coastSpots[coast].sort((a, b) => b.waveMax - a.waveMax)
    }

    // Buoy confirmation against average forecast swell
    const avgForecastSwell = BARBADOS_SPOTS.reduce((a, _, i) => a + (marines[i]?.current?.swell_wave_height || 0), 0) / BARBADOS_SPOTS.length
    const buoySignal = buoyConfirmation(buoy44, buoy43, avgForecastSwell)

    const activeSources: string[] = []
    if (!cacheStale && surfCache?.surfline) activeSources.push("surfline-lotus")
    if (!cacheStale && surfCache?.premium) activeSources.push("surfline-premium")
    activeSources.push("gfs-wave", "open-meteo-weather", "noaa-buoy-41044", "noaa-buoy-41043", "noaa-tides")
    if (!cacheStale && surfCache?.windguru) activeSources.push("ecmwf-wam")

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      sources: activeSources,
      ...coastSpots,
      analysis: {
        buoySignal,
        swellWindows: SWELL_WINDOWS,
      },
      buoys: { "41044": buoy44, "41043": buoy43, meta: NOAA_BUOYS },
      windguru: surfCache?.windguru || null,
      premium: surfCache?.premium ? Object.fromEntries(
        Object.entries(surfCache.premium as Record<string, any>).map(([id, p]: [string, any]) => [id, {
          name: p.name,
          coast: p.coast,
          currentWave: p.waves?.[0],
          currentRating: p.ratings?.[0],
          trend: p.waves?.slice(0, 72)?.map((w: any) => ({ ts: w.ts, min: w.min, max: w.max })),
        }])
      ) : null,
      tides: offsetTides(tides, BARBADOS_TIDE_OFFSET_MIN),
      sun,
      cache: { surflineAge: surfCacheResult?.ageMs ? Math.round(surfCacheResult.ageMs / 60000) + "min" : null, stale: cacheStale },
    }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 502 })
  }
}
