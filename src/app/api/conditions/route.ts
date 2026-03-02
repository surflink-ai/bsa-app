import { NextResponse } from "next/server"
import { BARBADOS_SPOTS, getRegionOverview, getSpotForecast, SUBREGIONS } from "@/lib/surfline"

export const revalidate = 900 // 15 min ISR

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const spotId = searchParams.get("spot")
  const coast = searchParams.get("coast")

  // Single spot detail
  if (spotId) {
    const spot = BARBADOS_SPOTS.find(s => s.id === spotId)
    if (!spot) return NextResponse.json({ error: "Spot not found" }, { status: 404 })

    const [forecast, openMeteo] = await Promise.all([
      getSpotForecast(spotId),
      fetchOpenMeteo(spot.lat, spot.lon),
    ])

    return NextResponse.json({
      spot,
      surfline: forecast,
      openMeteo,
      composite: buildComposite(forecast, openMeteo, spot),
    })
  }

  // All spots overview (grouped by coast)
  const [east, south, west] = await Promise.all([
    getRegionOverview(SUBREGIONS.east),
    getRegionOverview(SUBREGIONS.south),
    getRegionOverview(SUBREGIONS.west),
  ])

  // Merge with spot metadata
  const enriched = (overview: typeof east, coastName: string) =>
    overview.map(o => {
      const spot = BARBADOS_SPOTS.find(s => s.id === o.spotId)
      return { ...o, coast: coastName, type: spot?.type || "", bestSwell: spot?.bestSwell || "" }
    }).sort((a, b) => b.waveMax - a.waveMax) // Sort by best waves

  const result = {
    timestamp: new Date().toISOString(),
    east: enriched(east, "East"),
    south: enriched(south, "South"),
    west: enriched(west, "West"),
  }

  return NextResponse.json(result)
}

// Open-Meteo for validation/supplementary data
async function fetchOpenMeteo(lat: number, lon: number) {
  try {
    const [marineRes, weatherRes] = await Promise.all([
      fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_period,wave_direction,ocean_temperature&timezone=America/Barbados`),
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=America/Barbados`),
    ])
    const marine = await marineRes.json()
    const weather = await weatherRes.json()
    return {
      waveHeight: marine.current?.wave_height ?? 0,
      wavePeriod: marine.current?.wave_period ?? 0,
      waveDirection: marine.current?.wave_direction ?? 0,
      waterTemp: marine.current?.ocean_temperature ?? 0,
      windSpeed: weather.current?.wind_speed_10m ?? 0,
      windDirection: weather.current?.wind_direction_10m ?? 0,
      windGusts: weather.current?.wind_gusts_10m ?? 0,
    }
  } catch { return null }
}

// Build composite report from multiple sources
function buildComposite(surfline: Awaited<ReturnType<typeof getSpotForecast>>, openMeteo: any, spot: typeof BARBADOS_SPOTS[0]) {
  if (!surfline) return null

  const sl = surfline
  const om = openMeteo

  // Wave height: trust Surfline (spot-specific model)
  const waveMin = sl.wave.min
  const waveMax = sl.wave.max

  // Wind: average Surfline + Open-Meteo for better accuracy
  const windSpeedKph = om
    ? (sl.wind.speed * 1.852 + om.windSpeed) / 2 // Surfline is knots, convert
    : sl.wind.speed * 1.852
  const windGustKph = om
    ? (sl.wind.gust * 1.852 + om.windGusts) / 2
    : sl.wind.gust * 1.852

  // Swell: primary from Surfline (more detailed)
  const primarySwell = sl.wave.swells[0]

  // Water temp from Open-Meteo (Surfline doesn't always have it)
  const waterTemp = om?.waterTemp || 0

  // Rating: use Surfline's rating + our spot profile to adjust
  const rating = sl.rating.key

  return {
    waveHeight: { min: waveMin, max: waveMax, unit: "ft" },
    waveDescription: sl.wave.humanRelation,
    primarySwell: primarySwell ? {
      height: Math.round(primarySwell.height * 3.28084 * 10) / 10,
      period: primarySwell.period,
      direction: primarySwell.direction,
    } : null,
    wind: {
      speed: Math.round(windSpeedKph),
      gust: Math.round(windGustKph),
      direction: sl.wind.direction,
      type: sl.wind.directionType, // Offshore/Onshore/Cross-shore
      unit: "kph",
    },
    waterTemp: waterTemp ? { celsius: Math.round(waterTemp), fahrenheit: Math.round(waterTemp * 9 / 5 + 32) } : null,
    rating,
    tides: sl.tides,
    confidence: om ? "high" : "medium", // Higher when we have multiple sources
    sources: ["surfline", ...(om ? ["open-meteo"] : [])],
  }
}
