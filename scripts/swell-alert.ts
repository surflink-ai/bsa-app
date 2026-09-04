#!/usr/bin/env tsx
/**
 * Swell Alert — fires a Telegram message when significant swell is detected.
 * Run every 30 min (alongside cache job).
 *
 * Triggers:
 *   1. Buoy 41040: DPD ≥ 12s AND WVHT > 1.5ft AND no alert in last 12h
 *   2. Surfline Soup Bowl forecast jumps ≥ 2ft in 48h window (vs 6h ago)
 *   3. New Atlantic NHC storm within 2500nm with est. swell ≥ 4ft (12s+)
 *
 * No verdicts. Data only.
 */

// Self-load .env.local
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
try {
  const envPath = join(process.cwd(), '.env.local')
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m || process.env[m[1]]) continue
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
    }
  }
} catch {}

const SUPABASE_URL = 'https://veggfcumdveuoumrblcn.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8931202602'
const DRY_RUN = process.env.DRY_RUN === '1'
const FORCE = process.env.FORCE_ALERT === '1'
const TEST_MODE = process.env.TEST_ALERT === '1'

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function sbGet(table: string, qs: string): Promise<any[]> {
  if (!SUPABASE_KEY) return []
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    if (!res.ok) return []
    return res.json()
  } catch { return [] }
}

async function sbUpsert(table: string, row: any, conflictKeys: string): Promise<void> {
  if (!SUPABASE_KEY) return
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${conflictKeys}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify([row]),
    })
  } catch {}
}

// ── Telegram ──────────────────────────────────────────────────────────────────
async function sendText(text: string): Promise<void> {
  if (DRY_RUN || !BOT_TOKEN) { console.log('[DRY_RUN]\n' + text); return }
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text, disable_web_page_preview: true }),
  })
  if (!res.ok) console.error(`Telegram error: ${res.status} ${await res.text()}`)
}

async function sendPhoto(photoPath: string, caption: string): Promise<void> {
  if (DRY_RUN || !BOT_TOKEN) { console.log(`[DRY_RUN] photo: ${photoPath}`); return }
  try {
    const { Blob } = await import('buffer')
    const { FormData } = await import('undici')
    const data = readFileSync(photoPath)
    const form = new FormData()
    form.append('chat_id', CHAT_ID)
    form.append('caption', caption.slice(0, 1024))
    form.append('photo', new Blob([data], { type: 'image/jpeg' }), 'cam.jpg')
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { method: 'POST', body: form as any })
  } catch (e) {
    console.warn(`⚠️  sendPhoto failed: ${e}`)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function degToCompass(deg: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  return dirs[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16]
}
function mToFt(m: number): number { return Math.round(m * 3.28084 * 10) / 10 }

// Sun times
function sunriseAST(date: Date): string {
  const rad = Math.PI / 180
  const day = Math.floor((date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 0)) / 86400000)
  const B = (360 / 365) * (day - 81) * rad
  const decl = 23.45 * Math.sin(B) * rad
  const lat = 13.1, lon = -59.5
  const cosH = (Math.cos(90.833 * rad) - Math.sin(lat * rad) * Math.sin(decl)) / (Math.cos(lat * rad) * Math.cos(decl))
  const H = Math.acos(Math.max(-1, Math.min(1, cosH))) / rad
  const riseH = 12 - H / 15 - lon / 15
  const riseAST = (riseH - 4 + 24) % 24  // UTC → AST
  const tot = Math.round(riseAST * 60)
  const hh = Math.floor(tot / 60) % 24
  const mm = tot % 60
  return `${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`
}

// Find next day's sunrise label
function nextDayLabel(hoursAhead: number): string {
  const d = new Date()
  d.setHours(d.getHours() + hoursAhead)
  return d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/Barbados' })
}

// ── Alert dedup check ─────────────────────────────────────────────────────────
async function wasAlertedRecently(swellId: string, windowHours = 12): Promise<boolean> {
  if (FORCE) return false
  const cutoff = new Date(Date.now() - windowHours * 3600000).toISOString()
  const rows = await sbGet('swell_alerts', `swell_id=eq.${encodeURIComponent(swellId)}&fired_at=gte.${cutoff}&limit=1`)
  return rows.length > 0
}

async function recordAlert(swellId: string, alertType: string, data: any): Promise<void> {
  await sbUpsert('swell_alerts', {
    swell_id: swellId,
    alert_type: alertType,
    fired_at: new Date().toISOString(),
    data_json: data,
  }, 'swell_id')
}

// ── Cam snapshot (optional) ───────────────────────────────────────────────────
async function grabCamSnap(): Promise<string | null> {
  const camUrl = process.env.CORUS_CAM_URL || 'https://cam.corus.surf/snapshot'
  const outPath = `/tmp/cam-snap-${Date.now()}.jpg`
  try {
    const res = await fetch(camUrl, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    const { writeFileSync } = await import('fs')
    writeFileSync(outPath, buf)
    return outPath
  } catch { return null }
}

// ── Build alert text ──────────────────────────────────────────────────────────
function buildBuoyAlert(buoy: any, ref: any, premium: any): string {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Barbados' })
  const dirStr = buoy.mwd_deg != null ? degToCompass(buoy.mwd_deg) : ''
  const wvhtFt = buoy.wvht_m != null ? mToFt(buoy.wvht_m).toFixed(1) : '?'
  const refFt = ref?.wvht_m != null ? mToFt(ref.wvht_m).toFixed(1) : '?'
  const changeFt = buoy.wvht_m != null && ref?.wvht_m != null
    ? `+${mToFt(buoy.wvht_m - ref.wvht_m).toFixed(1)}ft over 6 hours`
    : ''

  const lines: string[] = [
    `🔥 SWELL ALERT — ${timeStr}`,
    '',
    `📡 Buoy 41040: ${wvhtFt}ft @ ${buoy.dpd_s}s ${dirStr}  (was ${refFt}ft @ ${ref?.dpd_s ?? '?'}s 6h ago)`,
    changeFt ? `📈 Building: ${changeFt}` : '',
    '',
  ]

  // Spot forecasts from Surfline premium
  const spots = [
    { id: '5842041f4e65fad6a7708b48', name: 'Soup Bowl' },
    { id: '5842041f4e65fad6a7708c81', name: "Branden's" },
    { id: '584204204e65fad6a77099c0', name: 'Freights Bay' },
    { id: '584204204e65fad6a77099c5', name: 'South Point' },
  ]
  for (const spot of spots) {
    const pd = premium?.[spot.id]
    const peakWave = pd?.waves?.slice(0, 48)?.reduce((best: any, w: any) => (!best || (w.max ?? 0) > (best.max ?? 0)) ? w : best, null)
    if (peakWave) {
      const lo = Math.round(mToFt(peakWave.min ?? 0))
      const hi = Math.round(mToFt(peakWave.max ?? 0))
      const ts = peakWave.ts ? new Date(peakWave.ts * 1000).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', hour12: true, timeZone: 'America/Barbados' }) : ''
      lines.push(`${spot.name}: ${lo}-${hi}ft${ts ? ' by ' + ts : ''}`)
    }
  }

  // First light
  const sunrise = sunriseAST(new Date())
  lines.push('')
  lines.push(`🌅 First light ${nextDayLabel(12)} ${sunrise}`)

  return lines.filter(l => l !== undefined).join('\n')
}

function buildSurflineJumpAlert(spotName: string, oldFt: number, newFt: number, when: string): string {
  const timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Barbados' })
  return [
    `🔥 FORECAST JUMP — ${timeStr}`,
    '',
    `📈 ${spotName}: forecast climbed from ${Math.round(oldFt)}-${Math.round(oldFt + 1)}ft → ${Math.round(newFt)}-${Math.round(newFt + 1)}ft`,
    `   Expected: ${when}`,
    '',
    'Check Surfline for updated detail.',
  ].join('\n')
}

function buildStormAlert(storm: any): string {
  const timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Barbados' })
  const classLabel = storm.classification === 'HU' ? `Cat ${storm.category} Hurricane` : 'Tropical Storm'
  const eta = storm.est_eta_hours ? `~${storm.est_eta_hours}h (${nextDayLabel(storm.est_eta_hours)})` : 'TBD'
  return [
    `🔥 TROPICAL SWELL ALERT — ${timeStr}`,
    '',
    `🌀 ${classLabel} ${storm.name}`,
    `   Position: ${Math.abs(storm.lat).toFixed(1)}°${storm.lat >= 0 ? 'N' : 'S'} ${Math.abs(storm.lon).toFixed(1)}°${storm.lon < 0 ? 'W' : 'E'}`,
    `   Max winds: ${storm.max_winds_kt}kt · Distance: ${storm.distance_nm.toLocaleString()}nm`,
    '',
    `📡 Projected swell: ${storm.est_swell_period_s}s period`,
    `   ETA to Barbados: ${eta}`,
  ].join('\n')
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const now = Date.now()

  // Load data
  const [buoyRows, cacheRows, stormRows] = await Promise.all([
    sbGet('buoy_readings', 'buoy_id=eq.41040&order=timestamp.desc&limit=15'),
    sbGet('surf_cache', 'key=eq.latest&select=data&limit=1'),
    sbGet('nhc_storms', `fetched_at=gte.${new Date(now - 3600000).toISOString()}&order=distance_nm&limit=10`),
  ])

  const premium = cacheRows[0]?.data?.premium || {}
  const buoyCurrent = buoyRows[0]
  const buoy6hAgo = buoyRows[12] // ~6h ago at 30min intervals

  let fired = false

  // ── TEST_MODE: send a demo alert to verify format ──────────────────────────
  if (TEST_MODE) {
    const fakeBuoy = { buoy_id: '41040', wvht_m: 1.28, dpd_s: 14, mwd_deg: 68, trend: 'rising', change_6h_m: 0.4 }
    const fakeRef = { wvht_m: 0.91, dpd_s: 9 }
    console.log('🧪 TEST MODE: sending demo alert')
    await sendText(buildBuoyAlert(fakeBuoy, fakeRef, premium))
    console.log('✅ Test alert sent.')
    return
  }

  // ── Trigger 1: Long-period buoy swell ────────────────────────────────────
  if (buoyCurrent?.dpd_s != null && buoyCurrent?.wvht_m != null) {
    const wvhtFt = mToFt(buoyCurrent.wvht_m)
    if (buoyCurrent.dpd_s >= 12 && wvhtFt > 1.5) {
      const swellId = `buoy41040_${Math.floor(now / (12 * 3600000))}` // unique per 12h window
      if (!await wasAlertedRecently(swellId)) {
        console.log(`🔥 Trigger 1: Buoy 41040 ${wvhtFt}ft @ ${buoyCurrent.dpd_s}s`)
        const text = buildBuoyAlert(buoyCurrent, buoy6hAgo, premium)
        await sendText(text)
        await recordAlert(swellId, 'buoy_long_period', { wvht_m: buoyCurrent.wvht_m, dpd_s: buoyCurrent.dpd_s })
        fired = true
      }
    }
  }

  // ── Trigger 2: Surfline forecast jump ≥ 2ft ───────────────────────────────
  // Compare current 48h max vs cached max from 6h ago
  if (!fired) {
    const soupData = premium['5842041f4e65fad6a7708b48']
    if (soupData?.waves?.length) {
      // Current peak in 48h window
      const peak48 = soupData.waves.slice(0, 48).reduce((best: any, w: any) => (!best || (w.max ?? 0) > (best.max ?? 0)) ? w : best, null)
      // Load last cached value from swell_alerts for comparison
      const prevAlerts = await sbGet('swell_alerts', `alert_type=eq.surfline_jump&order=fired_at.desc&limit=1`)
      const currentMax = peak48?.max != null ? mToFt(peak48.max) : 0
      if (!prevAlerts.length) {
        // Cold start: record baseline without alerting
        const initId = `slump_init_${Math.floor(now / (12 * 3600000))}`
        await recordAlert(initId, 'surfline_jump', { peak_ft: currentMax, prev_peak_ft: 0, init: true })
        console.log(`  ℹ️  Surfline jump baseline set: ${currentMax}ft`)
      } else {
        const prevMax = prevAlerts[0]?.data_json?.peak_ft ?? 0
        if (currentMax - prevMax >= 2 && currentMax > 2) {
          const when = peak48?.ts ? new Date(peak48.ts * 1000).toLocaleString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', hour12: true, timeZone: 'America/Barbados',
          }) : 'upcoming'
          const swellId = `slump_${Math.floor(now / (12 * 3600000))}`
          if (!await wasAlertedRecently(swellId)) {
            console.log(`🔥 Trigger 2: Surfline jump ${prevMax}→${currentMax}ft`)
            await sendText(buildSurflineJumpAlert('Soup Bowl', prevMax, currentMax, when))
            await recordAlert(swellId, 'surfline_jump', { peak_ft: currentMax, prev_peak_ft: prevMax })
            fired = true
          }
        }
      }
    }
  }

  // ── Trigger 3: New NHC Atlantic storm within 2500nm ───────────────────────
  for (const storm of stormRows) {
    if (storm.distance_nm > 2500) continue
    // Estimated swell ≥ 4ft → need period ≥ 12s (proxy: distance implies period)
    if (!storm.est_swell_period_s || storm.est_swell_period_s < 12) continue
    const swellId = `nhc_${storm.storm_id}`
    if (await wasAlertedRecently(swellId, 24)) continue
    console.log(`🔥 Trigger 3: Storm ${storm.name} ${storm.distance_nm}nm away`)
    const text = buildStormAlert(storm)
    // Try cam snapshot for storm alerts
    const camPath = await grabCamSnap()
    if (camPath) {
      await sendPhoto(camPath, text)
    } else {
      await sendText(text)
    }
    await recordAlert(swellId, 'nhc_storm', { storm_id: storm.storm_id, distance_nm: storm.distance_nm })
    fired = true
  }

  if (!fired) console.log('✅ No alert conditions met.')
  else console.log('✅ Alert(s) sent.')
}

main().catch(err => { console.error(err); process.exit(1) })
