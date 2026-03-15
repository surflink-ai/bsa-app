import { NextResponse } from "next/server"
import { BARBADOS_SPOTS, SUBREGIONS } from "@/lib/surfline"

// Node.js runtime — edge was returning empty results from Surfline
export const dynamic = "force-dynamic"

const SL_BASE = "https://services.surfline.com"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const spotId = searchParams.get("spot")

  // Single spot detail
  if (spotId) {
    const spot = BARBADOS_SPOTS.find(s => s.id === spotId)
    if (!spot) return NextResponse.json({ error: "Spot not found" }, { status: 404 })

    const token = process.env.SURFLINE_ACCESS_TOKEN || ""
    const params = token ? `&accesstoken=${token}` : ""

    try {
      const [waveRes, windRes, ratingRes] = await Promise.all([
        fetch(`${SL_BASE}/kbyg/spots/forecasts/wave?spotId=${spotId}&days=1&intervalHours=3${params}`),
        fetch(`${SL_BASE}/kbyg/spots/forecasts/wind?spotId=${spotId}&days=1&intervalHours=3${params}`),
        fetch(`${SL_BASE}/kbyg/spots/forecasts/rating?spotId=${spotId}&days=1&intervalHours=3${params}`),
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
    } catch (err) {
      return NextResponse.json({ error: "Failed to fetch forecast" }, { status: 502 })
    }
  }

  // All spots overview — proxy Surfline region overview
  try {
    const results = await Promise.all(
      Object.entries(SUBREGIONS).map(async ([coast, subregionId]) => {
        try {
          const res = await fetch(`${SL_BASE}/kbyg/regions/overview?subregionId=${subregionId}`)
          if (!res.ok) return { coast, spots: [] }
          const data = await res.json()
          // Check units — Surfline returns M from some regions, FT from US IPs
          const units = data?.associated?.units?.waveHeight || "FT"
          const toFeet = units === "M" ? 3.28084 : 1
          const spots = (data?.data?.spots || []).map((s: any) => ({
            spotId: s._id,
            name: s.name,
            conditions: s.conditions?.value || "FLAT",
            waveMin: Math.round((s.waveHeight?.min || 0) * toFeet),
            waveMax: Math.round((s.waveHeight?.max || 0) * toFeet),
            coast: coast.charAt(0).toUpperCase() + coast.slice(1),
          }))
          spots.sort((a: any, b: any) => b.waveMax - a.waveMax)
          return { coast, spots }
        } catch { return { coast, spots: [] } }
      })
    )

    const response: Record<string, any> = { timestamp: new Date().toISOString() }
    for (const r of results) response[r.coast] = r.spots

    return NextResponse.json(response, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" }
    })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 502 })
  }
}
