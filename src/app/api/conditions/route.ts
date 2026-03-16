import { NextResponse } from "next/server"
import { BARBADOS_SPOTS } from "@/lib/surfline"

export const dynamic = "force-dynamic"

// Wind direction relative to coastline → offshore/onshore classification
function classifyWind(windDir: number, coast: string): string {
  // Barbados coast orientations:
  // East coast faces ~90° (east) — offshore = west (240-300°)
  // South coast faces ~180° (south) — offshore = north (330-30°)  
  // West coast faces ~270° (west) — offshore = east (60-120°)
  const coastFacing: Record<string, number> = { East: 90, South: 180, West: 270 }
  const facing = coastFacing[coast] || 90
  // Angle between wind direction and coast facing
  let diff = Math.abs(windDir - facing)
  if (diff > 180) diff = 360 - diff
  if (diff > 135) return "Offshore"
  if (diff > 90) return "Cross-shore"
  if (diff > 45) return "Cross-shore"
  return "Onshore"
}

function rateConditions(waveMax: number, windSpeed: number, windType: string): string {
  if (waveMax < 0.3) return "FLAT"
  const isOffshore = windType === "Offshore"
  const isOnshore = windType === "Onshore"
  if (isOffshore) {
    if (waveMax >= 2.0) return "EPIC"
    if (waveMax >= 1.2) return "GOOD"
    return "FAIR"
  }
  if (isOnshore && windSpeed > 25) return "POOR"
  if (isOnshore) return "POOR_TO_FAIR"
  // Cross-shore
  if (waveMax >= 1.5) return "FAIR"
  if (waveMax >= 0.6) return "POOR_TO_FAIR"
  return "POOR"
}

function humanRelation(heightM: number): string {
  const ft = heightM * 3.28084
  if (ft < 1) return "Flat"
  if (ft < 2) return "Ankle to knee"
  if (ft < 3) return "Knee to thigh"
  if (ft < 4) return "Thigh to waist"
  if (ft < 5) return "Waist to chest"
  if (ft < 6) return "Chest to head"
  if (ft < 8) return "Overhead"
  if (ft < 10) return "Overhead to well overhead"
  if (ft < 12) return "Well overhead"
  return "Double overhead+"
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const spotId = searchParams.get("spot")

  // Single spot detail
  if (spotId) {
    const spot = BARBADOS_SPOTS.find(s => s.id === spotId)
    if (!spot) return NextResponse.json({ error: "Spot not found" }, { status: 404 })

    try {
      const [marineRes, weatherRes] = await Promise.all([
        fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${spot.lat}&longitude=${spot.lon}&current=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period&hourly=wave_height,swell_wave_height&timezone=America/Barbados&forecast_hours=24`, { signal: AbortSignal.timeout(8000) }),
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${spot.lat}&longitude=${spot.lon}&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=America/Barbados`, { signal: AbortSignal.timeout(8000) }),
      ])

      const [marine, weather] = await Promise.all([
        marineRes.ok ? marineRes.json() : null,
        weatherRes.ok ? weatherRes.json() : null,
      ])

      const mc = marine?.current || {}
      const wc = weather?.current || {}
      const waveHeight = mc.wave_height || 0
      const swellHeight = mc.swell_wave_height || 0
      const windDir = wc.wind_direction_10m || 0
      const windType = classifyWind(windDir, spot.coast)

      return NextResponse.json({
        spot,
        wave: { min: Math.max(0, waveHeight - 0.3), max: waveHeight, humanRelation: humanRelation(waveHeight) },
        swell: { height: swellHeight, direction: mc.swell_wave_direction || 0, period: mc.swell_wave_period || 0 },
        wind: { speed: wc.wind_speed_10m || 0, direction: windDir, directionType: windType, gust: wc.wind_gusts_10m || 0 },
        rating: { key: rateConditions(waveHeight, wc.wind_speed_10m || 0, windType), value: 0 },
        hourly: marine?.hourly ? {
          time: marine.hourly.time?.slice(0, 24) || [],
          waveHeight: marine.hourly.wave_height?.slice(0, 24) || [],
          swellHeight: marine.hourly.swell_wave_height?.slice(0, 24) || [],
        } : null,
      }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } })
    } catch {
      return NextResponse.json({ error: "Failed to fetch forecast" }, { status: 502 })
    }
  }

  // All spots overview — use Open-Meteo (free, no IP blocking)
  try {
    const lats = BARBADOS_SPOTS.map(s => s.lat).join(",")
    const lons = BARBADOS_SPOTS.map(s => s.lon).join(",")

    const [marineRes, weatherRes] = await Promise.all([
      fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${lats}&longitude=${lons}&current=wave_height,wave_direction,wave_period,swell_wave_height&timezone=America/Barbados`, { signal: AbortSignal.timeout(10000) }),
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=wind_speed_10m,wind_direction_10m&timezone=America/Barbados`, { signal: AbortSignal.timeout(10000) }),
    ])

    const [marineData, weatherData] = await Promise.all([
      marineRes.ok ? marineRes.json() : null,
      weatherRes.ok ? weatherRes.json() : null,
    ])

    // Open-Meteo returns array when multiple locations
    const marines = Array.isArray(marineData) ? marineData : [marineData]
    const weathers = Array.isArray(weatherData) ? weatherData : [weatherData]

    const response: Record<string, any> = { timestamp: new Date().toISOString() }
    const coastSpots: Record<string, any[]> = { east: [], south: [], west: [] }

    BARBADOS_SPOTS.forEach((spot, i) => {
      const mc = marines[i]?.current || {}
      const wc = weathers[i]?.current || {}
      const waveHeight = mc.wave_height || 0
      const windSpeed = wc.wind_speed_10m || 0
      const windDir = wc.wind_direction_10m || 0
      const windType = classifyWind(windDir, spot.coast)
      const toFeet = 3.28084

      coastSpots[spot.coast.toLowerCase()]?.push({
        spotId: spot.id,
        name: spot.name,
        conditions: rateConditions(waveHeight, windSpeed, windType),
        waveMin: Math.round(Math.max(0, waveHeight - 0.3) * toFeet),
        waveMax: Math.round(waveHeight * toFeet),
        humanRelation: humanRelation(waveHeight),
        windSpeed: Math.round(windSpeed),
        windDirection: windType,
        coast: spot.coast,
      })
    })

    for (const coast of ["east", "south", "west"]) {
      coastSpots[coast].sort((a, b) => b.waveMax - a.waveMax)
      response[coast] = coastSpots[coast]
    }

    return NextResponse.json(response, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" }
    })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 502 })
  }
}
