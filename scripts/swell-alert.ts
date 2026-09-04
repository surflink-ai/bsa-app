#!/usr/bin/env tsx
/**
 * Swell Alert v2 — fires Telegram alerts when significant swell detected.
 * Data only, no GO/MAYBE/SKIP. Adam decides.
 *
 * Triggers (24/7):
 *   1. Buoy 41040 DPD ≥ 12s AND primary swell height ≥ 1.5ft — dedupe 12h
 *   2. Surfline Soup Bowl 48h-max up ≥ 2ft vs 6h-ago cache — dedupe by jump key
 *   3. New NHC storm within 2500nm with est_swell_period_s ≥ 12s — dedupe by storm_id
 *
 * Dedup table: swell_alerts (swell_id UNIQUE)
 */

import { spawnSync } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'

// ── env ─────────────────────────────────────────────────────────────────────
try {
  const envPath = join(process.cwd(), '.env.local')
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (!m) continue
    if (process.env[m[1]]) continue
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').replace(/\\n$/, '').trim()
  }
} catch {}

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\\n|[\r\n]/g, '').trim()
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\\n|[\r\n]/g, '').trim()
const BOT_TOKEN    = (process.env.TELEGRAM_BOT_TOKEN || '').trim()
const CHAT_ID      = (process.env.TELEGRAM_CHAT_ID || '').trim()
const DRY_RUN      = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1'

const SOUP_BOWL_ID = '5842041f4e65fad6a7708b48'

// ── helpers ──────────────────────────────────────────────────────────────────
function mToFt(m: number): number { return Math.round(m * 3.28084 * 10) / 10 }
function degToCompass(deg: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  return dirs[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16]
}

async function sbGet<T>(path: string): Promise<T[]> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  })
  if (!r.ok) throw new Error(`Supabase ${path}: ${r.status}`)
  return r.json()
}

async function sbPost(table: string, data: any, prefer = 'return=minimal') {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: prefer,
    },
    body: JSON.stringify(data),
  })
  return r
}

async function isAlerted(swellId: string): Promise<boolean> {
  const rows = await sbGet<any>(`swell_alerts?swell_id=eq.${encodeURIComponent(swellId)}&select=swell_id`)
  return rows.length > 0
}

async function recordAlert(swellId: string, alertType: string, dataJson: any) {
  await sbPost('swell_alerts', { swell_id: swellId, alert_type: alertType, data_json: dataJson })
}

async function sendAlert(text: string) {
  if (DRY_RUN || !BOT_TOKEN || !CHAT_ID) {
    console.log('[DRY_RUN ALERT]\n' + text)
    return
  }
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  })
  if (!r.ok) throw new Error(`Telegram: ${r.status} ${await r.text()}`)
}

async function sendPhoto(photoPath: string, caption: string) {
  if (DRY_RUN || !BOT_TOKEN || !CHAT_ID) { console.log(`[DRY_RUN] photo: ${photoPath}`); return }
  spawnSync('curl', [
    '-s', '-X', 'POST',
    `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
    '-F', `chat_id=${CHAT_ID}`,
    '-F', `photo=@${photoPath}`,
    '-F', `caption=${caption}`,
  ], { encoding: 'utf8', timeout: 20000 })
}

function formatHHMM(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Barbados' })
}

// Try to grab a cam frame
async function tryCamFrame(): Promise<string | null> {
  try {
    // Get HLS URL
    const apiRes = await fetch('https://cam.corus.surf/api/live', { signal: AbortSignal.timeout(8000) })
    if (!apiRes.ok) return null
    const apiData = await apiRes.json()
    const hlsUrl = apiData?.hlsUrl
    if (!hlsUrl) return null

    const result = spawnSync('ffmpeg', [
      '-y', '-i', hlsUrl, '-frames:v', '1', '-q:v', '3', '/tmp/cam.jpg'
    ], { timeout: 20000, encoding: 'utf8' })
    if (result.status === 0) return '/tmp/cam.jpg'
  } catch {}
  return null
}

// ── checks ───────────────────────────────────────────────────────────────────
async function checkBuoy41040(buoyRows: any[], prevBuoyRows: any[]): Promise<void> {
  const latest = buoyRows[0]
  if (!latest) return

  const dpd = latest.dpd_s
  const swellHm = latest.primary_swell_json?.height_m
  if (!dpd || dpd < 12 || !swellHm || swellHm < 0.457) return // < 1.5ft = 0.457m

  const dateKey = new Date(latest.timestamp).toISOString().slice(0, 10)
  const swellId = `buoy-${Math.round(dpd)}s-${dateKey}`

  // Check 12h dedupe window
  const twelveHAgo = new Date(Date.now() - 12 * 3600000).toISOString()
  const existing = await sbGet<any>(`swell_alerts?swell_id=eq.${encodeURIComponent(swellId)}&fired_at=gte.${twelveHAgo}`)
  if (existing.length > 0) { console.log(`  ⏭ Buoy alert already fired: ${swellId}`); return }

  const prevLatest = prevBuoyRows.find((r: any) => {
    return Math.abs(new Date(r.timestamp).getTime() - new Date(latest.timestamp).getTime()) > 5 * 3600000
  })
  const prevStr = prevLatest
    ? `was ${mToFt(prevLatest.wvht_m)}ft @ ${prevLatest.dpd_s || '?'}s six hours ago`
    : ''

  const now = new Date()
  const timeStr = formatHHMM(now)

  const lines = [
    `🔥 <b>SWELL ALERT — ${timeStr}</b>`,
    `📡 41040: ${mToFt(latest.wvht_m)}ft @ ${dpd}s ${latest.mwd_deg !== null ? degToCompass(latest.mwd_deg) : ''} (${prevStr})`,
  ]

  // Add Soup Bowl 48h peak from Surfline cache
  const cacheRows = await sbGet<any>('surf_cache?key=eq.latest&select=data')
  const premium = cacheRows[0]?.data?.premium || {}
  const soupWaves = premium[SOUP_BOWL_ID]?.waves || []
  const nowTs = Math.floor(Date.now() / 3600000) * 3600
  const next48 = soupWaves.filter((w: any) => {
    const h = (w.ts * 1000 - Date.now()) / 3600000
    return h >= 0 && h <= 48
  })
  if (next48.length) {
    const peak = next48.reduce((best: any, w: any) => (w.max || 0) > (best?.max || 0) ? w : best, null)
    if (peak) {
      const peakDate = new Date(peak.ts * 1000)
      const dayName = peakDate.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/Barbados' })
      const timeStr = formatHHMM(peakDate)
      lines.push(`Soup Bowl next 48h: peaks ${peak.min}-${peak.max}ft ${dayName} ~${timeStr}`)
    }
  }

  // Other key south coast spots
  const SOUTH_SPOTS = [
    { id: '5842041f4e65fad6a7708c81', name: "Branden's" },
    { id: '584204204e65fad6a77099c0', name: 'Freights' },
    { id: '584204204e65fad6a77099c5', name: 'South Pt' },
  ]
  const southParts: string[] = []
  for (const s of SOUTH_SPOTS) {
    const sp = premium[s.id]
    const nowWave = sp?.waves?.find((w: any) => Math.abs(w.ts - nowTs) < 7200)
    if (nowWave) southParts.push(`${s.name}: ${nowWave.min}-${nowWave.max}ft`)
  }
  if (southParts.length) lines.push(southParts.join(' · '))

  // First light tomorrow
  const tomorrow = new Date(now.getTime() + 24 * 3600000)
  const sunriseH = 5
  const sunriseM = 52
  const firstLight = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), sunriseH, sunriseM)
  const dayName = firstLight.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/Barbados' })
  lines.push(`🌅 First light ${dayName} ${sunriseH}:${String(sunriseM).padStart(2,'0')} AM`)

  const text = lines.join('\n')

  if (DRY_RUN) {
    console.log('[DRY_RUN ALERT] Would fire:\n' + text)
    return
  }

  // Try cam frame
  const camPath = await tryCamFrame()

  await sendAlert(text)
  if (camPath) await sendPhoto(camPath, 'Surf cam at alert time')

  await recordAlert(swellId, 'buoy_long_period', {
    dpd_s: dpd, wvht_m: latest.wvht_m, timestamp: latest.timestamp
  })
  console.log(`🔥 Buoy alert fired: ${swellId}`)
}

async function checkSurflineJump(cacheRows: any[]): Promise<void> {
  // Compare current Soup Bowl max vs 6h old — need two snapshots
  // Since we only have the latest surf_cache row, we check the historical premium
  // by comparing today's date with tomorrow's peak (a significant jump)
  // Simple heuristic: if 48h max is 2+ft above current, flag it

  const premium = cacheRows[0]?.data?.premium || {}
  const soupWaves = premium[SOUP_BOWL_ID]?.waves || []
  const nowTs = Math.floor(Date.now() / 3600000) * 3600

  const currentWave = soupWaves.find((w: any) => Math.abs(w.ts - nowTs) < 7200)
  const currentMax = currentWave?.max || 0

  const next48 = soupWaves.filter((w: any) => {
    const h = (w.ts * 1000 - Date.now()) / 3600000
    return h >= 6 && h <= 48
  })
  if (!next48.length) return

  const futureMax = Math.max(...next48.map((w: any) => w.max || 0))
  if (futureMax < currentMax + 2) return // no jump

  const dateKey = new Date().toISOString().slice(0, 10)
  const swellId = `jump-${dateKey}-${Math.round(futureMax)}`
  if (await isAlerted(swellId)) { console.log(`  ⏭ Jump alert already fired: ${swellId}`); return }

  const peakWave = next48.reduce((best: any, w: any) => (w.max || 0) > (best?.max || 0) ? w : best, null)
  const peakDate = new Date(peakWave.ts * 1000)
  const dayName = peakDate.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/Barbados' })
  const timeStr = formatHHMM(peakDate)

  const now = new Date()
  const alertTime = formatHHMM(now)

  const text = [
    `🔥 <b>SWELL ALERT — ${alertTime}</b>`,
    `📈 Soup Bowl: ${currentMax}ft now → ${peakWave.min}-${peakWave.max}ft by ${dayName} ~${timeStr}`,
    `Jump: +${Math.round((futureMax - currentMax) * 10) / 10}ft forecast in 48h`,
  ].join('\n')

  if (DRY_RUN) { console.log('[DRY_RUN]\n' + text); return }
  await sendAlert(text)
  await recordAlert(swellId, 'surfline_jump', { currentMax, futureMax, peakTs: peakWave.ts })
  console.log(`🔥 Surfline jump alert fired: ${swellId}`)
}

async function checkNHC(): Promise<void> {
  const recent = await sbGet<any>(
    `nhc_storms?fetched_at=gte.${new Date(Date.now() - 2*3600000).toISOString()}&est_swell_period_s=gte.12&order=fetched_at.desc`
  )

  for (const storm of recent) {
    const swellId = `nhc-${storm.storm_id}`
    if (await isAlerted(swellId)) { console.log(`  ⏭ NHC alert already fired: ${swellId}`); continue }

    const cat = storm.classification === 'HU' ? ` Cat${storm.category}` : ''
    const etaDays = storm.est_eta_hours ? (storm.est_eta_hours / 24).toFixed(1) + 'd' : ''
    const moveDir = storm.movement_dir_deg !== null ? degToCompass(storm.movement_dir_deg) : ''

    const now = new Date()
    const text = [
      `🌀 <b>STORM ALERT — ${formatHHMM(now)}</b>`,
      `<b>${storm.name}</b>${cat} · ${storm.distance_nm}nm away`,
      `Position: ${Math.abs(storm.lat).toFixed(1)}°${storm.lat >= 0 ? 'N' : 'S'} ${Math.abs(storm.lon).toFixed(1)}°${storm.lon <= 0 ? 'W' : 'E'}`,
      `Moving: ${moveDir} @ ${storm.movement_speed_kt || '?'}kt · Winds: ${storm.max_winds_kt}kt`,
      `Est swell: ~${storm.est_swell_period_s}s · ETA: ${etaDays}`,
    ].join('\n')

    if (DRY_RUN) { console.log('[DRY_RUN]\n' + text); continue }
    await sendAlert(text)
    await recordAlert(swellId, 'nhc_storm', storm)
    console.log(`🌀 NHC storm alert fired: ${swellId}`)
  }
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔍 Checking swell alert conditions...')

  const [buoy40Rows, prevBuoy40, cacheRows] = await Promise.all([
    sbGet<any>('buoy_readings?buoy_id=eq.41040&order=timestamp.desc&limit=3'),
    sbGet<any>('buoy_readings?buoy_id=eq.41040&order=timestamp.desc&limit=30'),
    sbGet<any>('surf_cache?key=eq.latest&select=data'),
  ])

  await Promise.all([
    checkBuoy41040(buoy40Rows, prevBuoy40),
    checkSurflineJump(cacheRows),
    checkNHC(),
  ])

  console.log('✅ Swell alert check complete')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
