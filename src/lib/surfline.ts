// Surfline API wrapper
// All 21 Barbados spots organized by coast

export interface SurflineSpot {
  id: string
  name: string
  coast: "East" | "South" | "West"
  lat: number
  lon: number
  // Spot profile: what conditions does this break need?
  bestSwell: string    // e.g. "N-NE"
  bestSize: string     // e.g. "4-8ft"
  offshoreWind: string // e.g. "W-NW"
  type: string         // e.g. "reef", "point", "beach"
}

export const BARBADOS_SPOTS: SurflineSpot[] = [
  // EAST COAST — best for big swells, reef breaks, most consistent
  { id: "5842041f4e65fad6a7708b48", name: "Soup Bowl", coast: "East", lat: 13.2117, lon: -59.5233, bestSwell: "N-NE", bestSize: "4-10ft", offshoreWind: "W-SW", type: "reef" },
  { id: "5842041f4e65fad6a7708c7e", name: "Parlour", coast: "East", lat: 13.2050, lon: -59.5200, bestSwell: "N-NE", bestSize: "3-6ft", offshoreWind: "W-SW", type: "point" },
  { id: "640a28064519059fe096b71e", name: "Crane Bay", coast: "East", lat: 13.1036, lon: -59.4421, bestSwell: "E-NE", bestSize: "3-6ft", offshoreWind: "W", type: "reef" },
  { id: "640a2802b6d769e2d74b3d07", name: "Ragged Point", coast: "East", lat: 13.1603, lon: -59.4270, bestSwell: "E-NE", bestSize: "3-8ft", offshoreWind: "W", type: "reef" },
  { id: "640a280199dd447996fd3885", name: "Conset Point", coast: "East", lat: 13.1800, lon: -59.4450, bestSwell: "NE", bestSize: "3-6ft", offshoreWind: "W", type: "reef" },
  { id: "640a27ffb6d769a0e34b3c63", name: "Sand Bank", coast: "East", lat: 13.1930, lon: -59.5100, bestSwell: "NE", bestSize: "3-6ft", offshoreWind: "W-SW", type: "beach" },
  { id: "640a27fee92030d47097e32b", name: "Tent Bay", coast: "East", lat: 13.2100, lon: -59.5220, bestSwell: "N-NE", bestSize: "3-6ft", offshoreWind: "W-SW", type: "reef" },
  { id: "5842041f4e65fad6a7708c7f", name: "Cattle Wash", coast: "East", lat: 13.2200, lon: -59.5250, bestSwell: "N-NE", bestSize: "2-5ft", offshoreWind: "W-SW", type: "beach" },
  { id: "67f94aeca64db676f445bef3", name: "Tabletop", coast: "East", lat: 13.2300, lon: -59.5260, bestSwell: "N-NE", bestSize: "2-4ft", offshoreWind: "W-SW", type: "reef" },

  // SOUTH COAST — point/reef breaks, works on S-SE swells
  { id: "5842041f4e65fad6a7708c81", name: "Brandon's", coast: "South", lat: 13.0750, lon: -59.6300, bestSwell: "S-SE", bestSize: "3-6ft", offshoreWind: "N-NE", type: "beach" },
  { id: "584204204e65fad6a77099c0", name: "Freights Bay", coast: "South", lat: 13.0656, lon: -59.5492, bestSwell: "S-SW", bestSize: "3-8ft", offshoreWind: "N-NE", type: "reef" },
  { id: "584204204e65fad6a77099c5", name: "South Point", coast: "South", lat: 13.0542, lon: -59.5289, bestSwell: "S-SE", bestSize: "3-8ft", offshoreWind: "N", type: "point" },
  { id: "584204204e65fad6a77099c4", name: "Surfer's Point", coast: "South", lat: 13.0600, lon: -59.5350, bestSwell: "S-SE", bestSize: "3-6ft", offshoreWind: "N", type: "reef" },
  { id: "584204214e65fad6a7709cea", name: "Hastings", coast: "South", lat: 13.0730, lon: -59.6100, bestSwell: "S", bestSize: "2-4ft", offshoreWind: "N", type: "reef" },
  { id: "640a27fc606c45138daaa78c", name: "Silver Sands", coast: "South", lat: 13.0480, lon: -59.5230, bestSwell: "S-SE", bestSize: "2-4ft", offshoreWind: "N-NW", type: "beach" },
  { id: "640a2804b6d76970754b3d90", name: "Long Beach", coast: "South", lat: 13.0560, lon: -59.5150, bestSwell: "S-SE", bestSize: "2-5ft", offshoreWind: "N", type: "beach" },

  // WEST COAST — sheltered, works on N-NW swells (rare)
  { id: "5842041f4e65fad6a7708c80", name: "Duppies", coast: "West", lat: 13.2500, lon: -59.6400, bestSwell: "N-NW", bestSize: "2-4ft", offshoreWind: "E", type: "reef" },
  { id: "584204204e65fad6a77099c8", name: "Maycocks", coast: "West", lat: 13.2800, lon: -59.6500, bestSwell: "N-NW", bestSize: "2-5ft", offshoreWind: "E", type: "beach" },
  { id: "584204204e65fad6a77099c3", name: "Tropicana", coast: "West", lat: 13.1900, lon: -59.6400, bestSwell: "NW", bestSize: "2-4ft", offshoreWind: "E", type: "beach" },
  { id: "640a27f94519050e0a96b45a", name: "Sandy Lane", coast: "West", lat: 13.1700, lon: -59.6380, bestSwell: "NW", bestSize: "2-4ft", offshoreWind: "E", type: "beach" },
  { id: "640a27fb451905b3a196b4bb", name: "Batts Rock", coast: "West", lat: 13.1300, lon: -59.6350, bestSwell: "NW-N", bestSize: "2-4ft", offshoreWind: "E-SE", type: "reef" },
]

const SL_BASE = "https://services.surfline.com"

function getToken(): string {
  return process.env.SURFLINE_ACCESS_TOKEN || ""
}

export interface SurflineForecast {
  wave: {
    min: number
    max: number
    humanRelation: string
    optimalScore: number
    power: number
    swells: { height: number; period: number; direction: number; impact: number }[]
  }
  wind: {
    speed: number
    direction: number
    directionType: string
    gust: number
  }
  rating: {
    key: string
    value: number
  }
  tides: { type: string; height: number; timestamp: number }[]
}

export async function getSpotForecast(spotId: string): Promise<SurflineForecast | null> {
  const token = getToken()
  const params = `accesstoken=${token}`

  try {
    const [waveRes, windRes, ratingRes, tideRes] = await Promise.all([
      fetch(`${SL_BASE}/kbyg/spots/forecasts/wave?spotId=${spotId}&days=1&intervalHours=3&${params}`, { next: { revalidate: 900 } }),
      fetch(`${SL_BASE}/kbyg/spots/forecasts/wind?spotId=${spotId}&days=1&intervalHours=3&${params}`, { next: { revalidate: 900 } }),
      fetch(`${SL_BASE}/kbyg/spots/forecasts/rating?spotId=${spotId}&days=1&intervalHours=3&${params}`, { next: { revalidate: 900 } }),
      fetch(`${SL_BASE}/kbyg/spots/forecasts/tides?spotId=${spotId}&days=1&${params}`, { next: { revalidate: 900 } }),
    ])

    const [waveData, windData, ratingData, tideData] = await Promise.all([
      waveRes.json(), windRes.json(), ratingRes.json(), tideRes.json(),
    ])

    // Get current/nearest forecast entry
    const now = Math.floor(Date.now() / 1000)
    const findNearest = (arr: any[]) => arr?.reduce((prev: any, curr: any) =>
      Math.abs(curr.timestamp - now) < Math.abs(prev.timestamp - now) ? curr : prev, arr[0])

    const wave = findNearest(waveData?.data?.wave || [])
    const wind = findNearest(windData?.data?.wind || [])
    const rating = findNearest(ratingData?.data?.rating || [])

    if (!wave) return null

    return {
      wave: {
        min: wave.surf?.min || 0,
        max: wave.surf?.max || 0,
        humanRelation: wave.surf?.humanRelation || "",
        optimalScore: wave.surf?.optimalScore || 0,
        power: wave.power || 0,
        swells: (wave.swells || []).filter((s: any) => s.height > 0.1).map((s: any) => ({
          height: s.height,
          period: s.period,
          direction: s.direction,
          impact: s.impact,
        })),
      },
      wind: {
        speed: wind?.speed || 0,
        direction: wind?.direction || 0,
        directionType: wind?.directionType || "",
        gust: wind?.gust || 0,
      },
      rating: {
        key: rating?.rating?.key || "FLAT",
        value: rating?.rating?.value || 0,
      },
      tides: (tideData?.data?.tides || []).slice(0, 8).map((t: any) => ({
        type: t.type,
        height: t.height,
        timestamp: t.timestamp,
      })),
    }
  } catch (err) {
    console.error(`Surfline fetch failed for ${spotId}:`, err)
    return null
  }
}

// Get overview for all spots in a subregion (lighter call)
export async function getRegionOverview(subregionId: string): Promise<{ spotId: string; name: string; conditions: string; waveMin: number; waveMax: number }[]> {
  try {
    const token = getToken()
    const url = token
      ? `${SL_BASE}/kbyg/regions/overview?subregionId=${subregionId}&accesstoken=${token}`
      : `${SL_BASE}/kbyg/regions/overview?subregionId=${subregionId}`
    const res = await fetch(url, { next: { revalidate: 900 } })
    const data = await res.json()
    return (data?.data?.spots || []).map((s: any) => ({
      spotId: s._id,
      name: s.name,
      conditions: s.conditions?.value || "FLAT",
      waveMin: s.waveHeight?.min || 0,
      waveMax: s.waveHeight?.max || 0,
    }))
  } catch { return [] }
}

export const SUBREGIONS = {
  east: "58581a836630e24c44878fe9",
  south: "58581a836630e24c44879149",
  west: "58581a836630e24c44879148",
}
