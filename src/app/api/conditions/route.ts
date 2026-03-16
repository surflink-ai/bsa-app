import { NextResponse } from "next/server"
import { BARBADOS_SPOTS } from "@/lib/surfline"

export const dynamic = "force-dynamic"

/* ─── Data Sources ────────────────────────────────────────────────────────
 * 1. Surfline            — cached via local cron → Supabase (spot conditions, ratings)
 * 2. WindGuru ECMWF WAM  — cached via local cron → Supabase (wave/swell forecast)
 * 3. Open-Meteo Marine   — wave/swell height, period, direction per spot
 * 4. Open-Meteo Weather  — wind speed/dir/gusts, temperature
 * 5. NOAA Buoys          — real measured Atlantic swell (41044, 41043)
 * 6. NOAA Tides          — hi/lo tide from TEC4777 (St. Lucia, nearest)
 * 5. Open-Meteo Forecast — sunrise/sunset
 * ──────────────────────────────────────────────────────────────────────── */

const NOAA_BUOYS = [
  { id: "41044", name: "NE Caribbean", lat: 21.58, lon: -58.63, desc: "330 NM NE of St Martin — upstream Atlantic swell" },
  { id: "41043", name: "NE Puerto Rico", lat: 21.09, lon: -64.86, desc: "170 NM NNE of San Juan — Caribbean swell" },
]
const TIDE_STATION = "TEC4777" // St. Lucia — nearest NOAA tide station to Barbados

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

// ─── Fetch helpers ────────────────────────────────────────────────────────

async function fetchNOAABuoy(buoyId: string) {
  try {
    const res = await fetch(`https://www.ndbc.noaa.gov/data/realtime2/${buoyId}.spec`, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return null
    const text = await res.text()
    const lines = text.split("\n").filter(l => !l.startsWith("#") && l.trim())
    if (!lines.length) return null
    const parts = lines[0].trim().split(/\s+/)
    // Format: YY MM DD hh mm WVHT SwH SwP WWH WWP SwD WWD STEEPNESS APD MWD
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
    return {
      sunrise: data.daily?.sunrise?.[0] || null,
      sunset: data.daily?.sunset?.[0] || null,
    }
  } catch { return null }
}

async function fetchSurfCache() {
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
    const age = Date.now() - new Date(rows[0].updated_at).getTime()
    if (age > 30 * 60 * 1000) return null // stale > 30min
    return rows[0].data
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
      const [marineRes, weatherRes, buoy44, buoy43, tides, sun] = await Promise.all([
        fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${spot.lat}&longitude=${spot.lon}&current=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period&hourly=wave_height,wave_period,swell_wave_height,swell_wave_period,swell_wave_direction&timezone=America/Barbados&forecast_hours=48`, { signal: AbortSignal.timeout(8000) }),
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${spot.lat}&longitude=${spot.lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=America/Barbados&forecast_hours=48`, { signal: AbortSignal.timeout(8000) }),
        fetchNOAABuoy("41044"),
        fetchNOAABuoy("41043"),
        fetchNOAATides(),
        fetchSunTimes(),
      ])

      const [marine, weather] = await Promise.all([
        marineRes.ok ? marineRes.json() : null,
        weatherRes.ok ? weatherRes.json() : null,
      ])

      const mc = marine?.current || {}
      const wc = weather?.current || {}
      const windType = classifyWind(wc.wind_direction_10m || 0, spot.coast)

      return NextResponse.json({
        spot,
        sources: ["open-meteo-marine", "open-meteo-weather", "noaa-buoy-41044", "noaa-buoy-41043", "noaa-tides"],
        current: {
          wave: { height: mc.wave_height || 0, direction: mc.wave_direction || 0, directionLabel: compassDir(mc.wave_direction || 0), period: mc.wave_period || 0, human: humanWaveHeight(mc.wave_height || 0) },
          swell: { height: mc.swell_wave_height || 0, direction: mc.swell_wave_direction || 0, directionLabel: compassDir(mc.swell_wave_direction || 0), period: mc.swell_wave_period || 0 },
          wind: { speed: wc.wind_speed_10m || 0, direction: wc.wind_direction_10m || 0, directionLabel: compassDir(wc.wind_direction_10m || 0), gust: wc.wind_gusts_10m || 0, type: windType },
          temperature: wc.temperature_2m || null,
          conditions: rateConditions(mc.wave_height || 0, mc.swell_wave_height || 0, mc.swell_wave_period || 0, wc.wind_speed_10m || 0, windType),
        },
        buoys: {
          "41044": buoy44,
          "41043": buoy43,
          meta: NOAA_BUOYS,
        },
        tides,
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
      }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } })
    } catch {
      return NextResponse.json({ error: "Failed to fetch forecast" }, { status: 502 })
    }
  }

  // ── All spots overview ─────────────────────────────────────────────────
  try {
    const lats = BARBADOS_SPOTS.map(s => s.lat).join(",")
    const lons = BARBADOS_SPOTS.map(s => s.lon).join(",")

    const [marineRes, weatherRes, buoy44, buoy43, tides, sun, surfCache] = await Promise.all([
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

    const coastSpots: Record<string, any[]> = { east: [], south: [], west: [] }

    // Build Surfline spot lookup from cache
    const slSpots = new Map<string, any>()
    if (surfCache?.surfline) {
      for (const coast of ["east", "south", "west"]) {
        for (const s of surfCache.surfline[coast] || []) {
          slSpots.set(s.spotId, s)
        }
      }
    }

    BARBADOS_SPOTS.forEach((spot, i) => {
      const mc = marines[i]?.current || {}
      const wc = weathers[i]?.current || {}
      const sl = slSpots.get(spot.id) // Surfline data for this spot
      const waveH = mc.wave_height || 0
      const swellH = mc.swell_wave_height || 0
      const swellP = mc.swell_wave_period || 0
      const windSpeed = wc.wind_speed_10m || 0
      const windDir = wc.wind_direction_10m || 0
      const windType = classifyWind(windDir, spot.coast)
      const toFeet = 3.28084

      coastSpots[spot.coast.toLowerCase()]?.push({
        spotId: spot.id,
        name: spot.name,
        // Use Surfline conditions when available, fall back to computed
        conditions: sl?.conditions || rateConditions(waveH, swellH, swellP, windSpeed, windType),
        waveMin: sl?.waveMin ?? Math.round(Math.max(0, waveH - 0.3) * toFeet),
        waveMax: sl?.waveMax ?? Math.round(waveH * toFeet),
        waveM: Math.round(waveH * 10) / 10,
        humanRelation: sl?.humanRelation || humanWaveHeight(waveH),
        // Surfline wave height in meters (when available)
        surflineWaveM: sl?.waveHeightM || null,
        swellHeight: Math.round(swellH * 10) / 10,
        swellPeriod: Math.round(swellP * 10) / 10,
        swellDir: compassDir(mc.swell_wave_direction || 0),
        windSpeed: Math.round(windSpeed),
        windGust: Math.round(wc.wind_gusts_10m || 0),
        windDir: compassDir(windDir),
        windType,
        temp: wc.temperature_2m || null,
        coast: spot.coast,
      })
    })

    for (const coast of ["east", "south", "west"]) {
      coastSpots[coast].sort((a, b) => b.waveMax - a.waveMax)
    }

    const activeSources = ["open-meteo-marine", "open-meteo-weather", "noaa-buoy-41044", "noaa-buoy-41043", "noaa-tides"]
    if (surfCache?.surfline) activeSources.unshift("surfline")
    if (surfCache?.windguru) activeSources.push("windguru-ecmwf-wam")

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      sources: activeSources,
      ...coastSpots,
      buoys: {
        "41044": buoy44,
        "41043": buoy43,
        meta: NOAA_BUOYS,
      },
      windguru: surfCache?.windguru || null,
      tides,
      sun,
      surflineCacheAge: surfCache ? new Date(surfCache.timestamp).toISOString() : null,
    }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 502 })
  }
}
