/**
 * Lightweight rate limiting for public API routes.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are
 * set (correct across serverless instances). Otherwise falls back to a
 * best-effort in-memory limiter — good enough to blunt bursts from a single
 * instance, with no extra services required. Pair with CDN caching
 * (s-maxage) on cacheable routes so most traffic never reaches the origin.
 */

type Result = { success: boolean; remaining: number }

const memoryBuckets = new Map<string, { count: number; resetAt: number }>()

function memoryLimit(key: string, limit: number, windowMs: number): Result {
  const now = Date.now()
  const bucket = memoryBuckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }
  bucket.count += 1
  if (bucket.count > limit) return { success: false, remaining: 0 }
  return { success: true, remaining: limit - bucket.count }
}

// Occasionally evict stale buckets to bound memory.
function sweep() {
  if (memoryBuckets.size < 5000) return
  const now = Date.now()
  for (const [k, v] of memoryBuckets) if (v.resetAt < now) memoryBuckets.delete(k)
}

async function upstashLimit(key: string, limit: number, windowMs: number): Promise<Result | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  try {
    // INCR then set expiry on first hit (pipeline in one round-trip).
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', key],
        ['PEXPIRE', key, String(windowMs), 'NX'],
      ]),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = (await res.json()) as Array<{ result: number }>
    const count = data?.[0]?.result ?? 0
    return { success: count <= limit, remaining: Math.max(0, limit - count) }
  } catch {
    return null
  }
}

export function clientKey(req: Request, scope: string): string {
  const fwd = req.headers.get('x-forwarded-for') || ''
  const ip = fwd.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'
  return `ratelimit:${scope}:${ip}`
}

/**
 * Returns { success } — when false, the caller should return HTTP 429.
 */
export async function rateLimit(
  req: Request,
  scope: string,
  limit = 30,
  windowMs = 60_000
): Promise<Result> {
  const key = clientKey(req, scope)
  const viaUpstash = await upstashLimit(key, limit, windowMs)
  if (viaUpstash) return viaUpstash
  sweep()
  return memoryLimit(key, limit, windowMs)
}

export function tooMany(remainingRetryMs = 60_000): Response {
  return new Response(JSON.stringify({ error: 'Too many requests' }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(Math.ceil(remainingRetryMs / 1000)),
    },
  })
}
