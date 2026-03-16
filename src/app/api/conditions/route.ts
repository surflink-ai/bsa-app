import { NextResponse } from "next/server"
import { BARBADOS_SPOTS, SUBREGIONS } from "@/lib/surfline"

// Node.js runtime
export const dynamic = "force-dynamic"

const SL_BASE = "https://services.surfline.com"

// Condition rating based on wave height and wind
function rateConditions(waveMax: number, windSpeed: number, windType: string): string {
  if (waveMax < 0.3) return "FLAT"
  if (windType === "Offshore" || windType === "Cross-shore/Offshore") {
    if (waveMax >= 1.5) return "EPIC"
    if (waveMax >= 0.9) return "GOOD"
    return "FAIR"
  }
  if (windType === "Onshore" || windType === "Cross-shore/Onshore") {
    if (windSpeed > 25) return "POOR"
    return "POOR_TO_FAIR"
  }
  // Cross-shore or light
  if (waveMax >= 1.2) return "FAIR"
  if (waveMax >= 0.6) return "POOR_TO_FAIR"
  return "POOR"
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const spotId = searchParams.get("spot")

  // Single spot detail
  if (spotId) {
    const spot = BARBADOS_SPOTS.find(s => s.id === spotId)
    if (!spot) return NextResponse.json({ error: "Spot not found" }, { status: 404 })

    try {
      const [waveRes, windRes, ratingRes] = await Promise.all([
        fetch(`${SL_BASE}/kbyg/spots/forecasts/wave?spotId=${spotId}&days=1&intervalHours=3`),
        fetch(`${SL_BASE}/kbyg/spots/forecasts/wind?spotId=${spotId}&days=1&intervalHours=3`),
        fetch(`${SL_BASE}/kbyg/spots/forecasts/rating?spotId=${spotId}&days=1&intervalHours=3`),
      ])

      const [waveData, windData, ratingData] = await Promise.all([
        waveRes.ok ? waveRes.json() : null,
        windRes.ok ? windRes.json() : null,
        ratingRes.ok ? ratingRes.json() : null,
      ])

      const now = Math.floor(Date.now() / 1000)
      const findNearest = (arr: any[]) => arr?.reduce((prev: any, curr: any) =>
        Math.abs(curr.timestamp - now) < Math.abs(prev.timestamp - now) ? curr : prev, arr[0])

      const wave = findNearest(waveData?.data?.wave || [])
      const wind = findNearest(windData?.data?.wind || [])
      const rating = findNearest(ratingData?.data?.rating || [])

      return NextResponse.json({
        spot,
        wave: wave ? { min: wave.surf?.min || 0, max: wave.surf?.max || 0, humanRelation: wave.surf?.humanRelation || "" } : null,
        wind: wind ? { speed: wind.speed || 0, direction: wind.direction || 0, directionType: wind.directionType || "", gust: wind.gust || 0 } : null,
        rating: rating ? { key: rating.rating?.key || "FLAT", value: rating.rating?.value || 0 } : null,
      }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } })
    } catch {
      return NextResponse.json({ error: "Failed to fetch forecast" }, { status: 502 })
    }
  }

  // All spots overview — fetch each spot individually
  // (Surfline region overview endpoint blocks Vercel IPs)
  try {
    const spotResults = await Promise.all(
      BARBADOS_SPOTS.map(async (spot) => {
        try {
          const [waveRes, windRes] = await Promise.all([
            fetch(`${SL_BASE}/kbyg/spots/forecasts/wave?spotId=${spot.id}&days=1&intervalHours=6`, {
              signal: AbortSignal.timeout(8000),
            }),
            fetch(`${SL_BASE}/kbyg/spots/forecasts/wind?spotId=${spot.id}&days=1&intervalHours=6`, {
              signal: AbortSignal.timeout(8000),
            }),
          ])

          if (!waveRes.ok || !windRes.ok) return null

          const [waveData, windData] = await Promise.all([
            waveRes.json(),
            windRes.json(),
          ])

          const now = Math.floor(Date.now() / 1000)
          const findNearest = (arr: any[]) =>
            arr?.length
              ? arr.reduce((prev: any, curr: any) =>
                  Math.abs(curr.timestamp - now) < Math.abs(prev.timestamp - now) ? curr : prev, arr[0])
              : null

          const wave = findNearest(waveData?.data?.wave || [])
          const wind = findNearest(windData?.data?.wind || [])

          const waveMin = wave?.surf?.min || 0
          const waveMax = wave?.surf?.max || 0
          const windSpeed = wind?.speed || 0
          const windType = wind?.directionType || ""

          // Convert meters to feet
          const toFeet = 3.28084
          return {
            spotId: spot.id,
            name: spot.name,
            conditions: rateConditions(waveMax, windSpeed, windType),
            waveMin: Math.round(waveMin * toFeet),
            waveMax: Math.round(waveMax * toFeet),
            humanRelation: wave?.surf?.humanRelation || "",
            windSpeed: Math.round(windSpeed),
            windDirection: wind?.directionType || "",
            coast: spot.coast,
          }
        } catch {
          return null
        }
      })
    )

    const valid = spotResults.filter(Boolean) as any[]

    const response: Record<string, any> = { timestamp: new Date().toISOString() }
    const coasts = ["East", "South", "West"]
    for (const coast of coasts) {
      const spots = valid
        .filter(s => s.coast === coast)
        .sort((a, b) => b.waveMax - a.waveMax)
      response[coast.toLowerCase()] = spots
    }

    return NextResponse.json(response, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" }
    })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 502 })
  }
}
