#!/usr/bin/env tsx
/**
 * Surf Intel v2 — Telegram report.
 * Reads from Supabase (surf_cache, buoy_readings, openmeteo_forecasts, nhc_storms, forecast_bias).
 * No LLM. No verdicts. Data only.
 *
 * Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, SUPABASE_SERVICE_ROLE_KEY
 * KIND=morning|afternoon|evening (default: morning)
 * DRY_RUN=1 → print to stdout
 */

// Self-load .env.local
import { readFileSync, existsSync, writeFileSync } from 'fs'
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
const KIND = (process.env.KIND || 'morning') as 'morning' | 'afternoon' | 'evening'

// The 4 report spots in priority order
const REPORT_SPOTS = [
  { id: '5842041f4e65fad6a7708b48', name: 'Soup Bowl',   coast: 'east'  as const },
  { id: '5842041f4e65fad6a7708c81', name: "Branden's",   coast: 'south' as const },
  { id: '584204204e65fad6a77099c0', name: 'Freights Bay', coast: 'south' as const },
  { id: '584204204e65fad6a77099c5', name: 'South Point',  coast: 'south' as const },
]

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

// ── Telegram send ─────────────────────────────────────────────────────────────
async function sendText(text: string): Promise<void> {
  if (DRY_RUN || !BOT_TOKEN) { console.log('[DRY_RUN]\n' + text); return }
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text, disable_web_page_preview: true }),
  })
  if (!res.ok) throw new Error(`Telegram: ${res.status} ${await res.text()}`)
}

async function sendPhoto(photoPath: string, caption: string): Promise<void> {
  if (DRY_RUN || !BOT_TOKEN) { console.log(`[DRY_RUN] sendPhoto: ${photoPath}`); return }
  const { createReadStream } = await import('fs')
  const { FormData } = await import('undici')
  const { Blob } = await import('buffer')
  const data = readFileSync(photoPath)
  const form = new FormData()
  form.append('chat_id', CHAT_ID)
  form.append('caption', caption.slice(0, 1024))
  form.append('photo', new Blob([data], { type: 'image/png' }), 'chart.png')
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { method: 'POST', body: form as any })
  if (!res.ok) console.warn(`⚠️  Telegram sendPhoto: ${res.status} ${await res.text()}`)
}

// ── Formatting helpers ────────────────────────────────────────────────────────
// Derive wind type from compass direction relative to coast orientation
function deriveWindType(windDir: number, coast: 'east' | 'south' | 'west'): string {
  const d = ((windDir % 360) + 360) % 360
  if (coast === 'east') {
    // East coast faces ~ESE (110°). Offshore = wind from W/WSW/NW quadrant
    if (d >= 200 && d < 315) return 'offshore'
    if (d >= 45 && d < 160) return 'onshore'
    return 'cross'
  } else if (coast === 'south') {
    // South coast faces ~SSE (170°). Offshore = wind from NNW/N/NNE
    if (d >= 315 || d < 45) return 'offshore'
    if (d >= 130 && d < 230) return 'onshore'
    return 'cross'
  } else {
    // West coast faces ~WNW (300°). Offshore = E/ENE
    if (d >= 45 && d < 135) return 'offshore'
    if (d >= 225 && d < 315) return 'onshore'
    return 'cross'
  }
}

function degToCompass(deg: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  return dirs[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16]
}

function mToFt(m: number): number { return Math.round(m * 3.28084 * 10) / 10 }

function ftRange(minFt: number, maxFt: number): string {
  const lo = Math.round(minFt)
  const hi = Math.round(maxFt)
  return lo === hi ? `${lo}ft` : `${lo}-${hi}ft`
}

function trendIcon(trend: string, changeFt: number | null): string {
  if (trend === 'rising')  return `📈 +${changeFt != null ? Math.abs(changeFt).toFixed(1) : '?'}ft/6h`
  if (trend === 'falling') return `📉 -${changeFt != null ? Math.abs(changeFt).toFixed(1) : '?'}ft/6h`
  return 'steady'
}

// ▁▂▃▄▅▆▇█  — 8 blocks scaled to max
function sparkline(values: number[]): string {
  const bars = '▁▂▃▄▅▆▇█'
  if (!values.length) return '—'
  const max = Math.max(...values)
  if (max === 0) return bars[0].repeat(values.length)
  return values.map(v => bars[Math.min(7, Math.round((v / max) * 7))]).join('')
}

// Summarize sparkline trend in words
function sparkTrend(values: number[]): string {
  if (values.length < 4) return ''
  const first = values.slice(0, Math.ceil(values.length / 3))
  const last = values.slice(Math.floor(values.length * 2 / 3))
  const avgFirst = first.reduce((a, b) => a + b, 0) / first.length
  const avgLast = last.reduce((a, b) => a + b, 0) / last.length
  const delta = avgLast - avgFirst
  if (delta > 0.15) return 'building'
  if (delta < -0.15) return 'dropping'
  return 'steady'
}

// Find first glass-off from wind data (speed < ~18kph ≈ 10kt, or offshore)
function glassOffTime(winds: any[], nowTs: number): string {
  const offshore = winds.find(w => {
    if (!w.ts || !w.wind) return false
    const wts = (w.ts * 1000)
    if (wts < nowTs) return false
    const { speed, dirType } = w.wind
    return dirType === 'Offshore' || (speed != null && speed < 18)
  })
  if (!offshore) return 'stays onshore'
  const d = new Date(offshore.ts * 1000)
  return '~' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Barbados' })
}

// Detect high/low extrema from Surfline's hourly tide data (all typed 'normal')
function findTideExtrema(tides: any[]): any[] {
  const extrema: any[] = []
  for (let i = 1; i < tides.length - 1; i++) {
    const prev = tides[i - 1].height
    const curr = tides[i].height
    const next = tides[i + 1].height
    if (curr > prev && curr > next) extrema.push({ ...tides[i], type: 'high' })
    else if (curr < prev && curr < next) extrema.push({ ...tides[i], type: 'low' })
  }
  return extrema
}

// Format tide: ↓ Low 2:41 PM (0.3m) ↑ High 8:52 PM (1.1m)
function formatTides(tides: any[], nowTs: number): string {
  const extrema = findTideExtrema(tides)
  const upcoming = extrema
    .filter(t => t.ts * 1000 > nowTs)
    .sort((a, b) => a.ts - b.ts)
    .slice(0, 2)
  if (!upcoming.length) return ''
  return upcoming.map(t => {
    const d = new Date(t.ts * 1000)
    const hhmm = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Barbados' })
    const arrow = t.type === 'high' ? '↑' : '↓'
    const label = t.type === 'high' ? 'High' : 'Low'
    return `${arrow} ${label} ${hhmm} (${t.height?.toFixed(1)}m)`
  }).join('  ')
}

// Sunrise/sunset by latitude (approximate, good to ±5 min)
function sunTimes(date: Date, lat = 13.1, lon = -59.5): { sunrise: string; sunset: string } {
  const rad = Math.PI / 180
  const day = Math.floor((date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 0)) / 86400000)
  const B = (360 / 365) * (day - 81) * rad
  const decl = 23.45 * Math.sin(B) * rad
  const cosH = (Math.cos(90.833 * rad) - Math.sin(lat * rad) * Math.sin(decl)) / (Math.cos(lat * rad) * Math.cos(decl))
  const H = Math.acos(Math.max(-1, Math.min(1, cosH))) / rad
  const lonCorr = lon / 15
  const riseH = 12 - H / 15 - lonCorr
  const setH = 12 + H / 15 - lonCorr
  const fmt = (h: number) => {
    const tot = Math.round(h * 60)
    const hh = Math.floor(tot / 60) % 24
    const mm = tot % 60
    const ampm = hh < 12 ? 'AM' : 'PM'
    return `${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${ampm}`
  }
  // Convert UTC to AST (UTC-4)
  const riseAST = (riseH - 4 + 24) % 24
  const setAST = (setH - 4 + 24) % 24
  return { sunrise: fmt(riseAST), sunset: fmt(setAST) }
}

// ── Model agreement check ─────────────────────────────────────────────────────
function modelAgreementLine(slFt: number, omFt: number | null, wgFt: number | null): string {
  const parts = [`Surfline ${Math.round(slFt)}ft`]
  if (omFt != null) parts.push(`Open-Meteo ${Math.round(omFt)}ft`)
  if (wgFt != null) parts.push(`WindGuru ${Math.round(wgFt)}ft`)
  // Agreement: all within 1ft of each other
  const all = [slFt, omFt, wgFt].filter(v => v != null) as number[]
  const spread = Math.max(...all) - Math.min(...all)
  const agree = spread <= 1 ? '  ✓' : `  (±${spread.toFixed(0)}ft spread)`
  return `📡 MODEL AGREEMENT: ${parts.join(' · ')}${agree}`
}

// ── 7-day outlook from Open-Meteo ─────────────────────────────────────────────
function sevenDayOutlook(omRows: any[]): string[] {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  // Group by day (east coast)
  const byDay = new Map<string, number[]>()
  for (const row of omRows) {
    if (row.coast !== 'east') continue
    const day = row.timestamp.split('T')[0]
    if (day <= today) continue
    if (!byDay.has(day)) byDay.set(day, [])
    if (row.wave_height_m != null) byDay.get(day)!.push(row.wave_height_m)
  }

  const days = [...byDay.keys()].sort().slice(0, 7)
  const lines: string[] = []
  let prevMaxFt = 0
  for (const day of days) {
    const heights = byDay.get(day) || []
    if (!heights.length) continue
    const minFt = mToFt(Math.min(...heights))
    const maxFt = mToFt(Math.max(...heights))
    const d = new Date(day + 'T12:00:00-04:00')
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/Barbados' })
    const dateNum = d.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'America/Barbados' })
    let suffix = ''
    if (maxFt > prevMaxFt + 1) suffix = '  ← building'
    else if (maxFt >= prevMaxFt - 0.5 && maxFt <= prevMaxFt + 0.5 && lines.length > 0) suffix = ''
    // Find dominant swell period for the day
    const omEastRows = omRows.filter(r => r.coast === 'east' && r.timestamp.startsWith(day))
    const periods = omEastRows.map((r: any) => r.swell_period_s).filter(Boolean)
    const dirs = omEastRows.map((r: any) => r.swell_dir_deg).filter((v: any) => v != null)
    const avgPeriod = periods.length ? Math.round(periods.reduce((a: number, b: number) => a + b, 0) / periods.length) : null
    const avgDir = dirs.length ? Math.round(dirs.reduce((a: number, b: number) => a + b, 0) / dirs.length) : null
    const periodStr = avgPeriod ? ` @ ${avgPeriod}s` : ''
    const dirStr = avgDir != null ? ` ${degToCompass(avgDir)}` : ''
    lines.push(`${dayName} ${dateNum}:  ${ftRange(minFt, maxFt)}${dirStr}${periodStr}${suffix}`)
    prevMaxFt = maxFt
  }
  return lines
}

// ── NHC storm section ─────────────────────────────────────────────────────────
function stormSection(storms: any[]): string[] {
  const nearby = storms.filter(s => s.distance_nm <= 2500)
  if (!nearby.length) return []
  const lines: string[] = ['']
  for (const s of nearby) {
    const classLabel = s.classification === 'HU' ? (s.category >= 1 ? `Cat ${s.category}` : 'Hurricane') : s.classification === 'TS' ? 'Tropical Storm' : 'Tropical Depression'
    const bearingStr = degToCompass(s.bearing_deg)
    const etaLine = s.est_eta_hours ? `Projected: ${s.est_swell_period_s}s swell · ETA ~${s.est_eta_hours}h` : 'No swell projection'
    const movDir = s.movement_dir_deg != null ? degToCompass(s.movement_dir_deg) : '?'
    lines.push(
      `🌀 TS WATCH: ${classLabel} ${s.name}`,
      `   Position: ${Math.abs(s.lat).toFixed(1)}°${s.lat >= 0 ? 'N' : 'S'} ${Math.abs(s.lon).toFixed(1)}°${s.lon < 0 ? 'W' : 'E'} · ${classLabel} · ${s.movement_speed_kt ?? '?'}kt ${movDir}`,
      `   Distance: ${s.distance_nm.toLocaleString()}nm · Bearing: ${bearingStr}`,
      `   ${etaLine}`,
    )
  }
  return lines
}

// ── 30-day bias section ───────────────────────────────────────────────────────
async function biasSummary(): Promise<string[]> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const rows = await sbGet('forecast_bias', `created_at=gte.${cutoff.toISOString()}&select=source,coast,error_ft&order=created_at.desc&limit=90`)
  if (!rows.length) return []
  const bySource = new Map<string, number[]>()
  for (const r of rows) {
    const k = `${r.source}:${r.coast}`
    if (!bySource.has(k)) bySource.set(k, [])
    if (r.error_ft != null) bySource.get(k)!.push(r.error_ft)
  }
  const lines: string[] = ['', '📊 30-DAY MODEL BIAS']
  const labels: Record<string, string> = {
    'surfline:east': 'Surfline E coast',
    'surfline:south': 'Surfline S coast',
    'openmeteo:east': 'Open-Meteo',
    'windguru:east': 'WindGuru',
  }
  for (const [key, errors] of bySource.entries()) {
    if (!errors.length) continue
    const avg = errors.reduce((a, b) => a + b, 0) / errors.length
    const pct = Math.round(avg * 100) / 100
    const note = Math.abs(pct) < 0.3 ? 'accurate' : pct > 0 ? 'runs hot' : 'runs cold'
    const label = labels[key] || key
    lines.push(`${label}: ${pct > 0 ? '+' : ''}${pct.toFixed(1)}ft (${note})`)
  }
  return lines.length > 2 ? lines : []
}

// ── Chart (Phase C) ───────────────────────────────────────────────────────────
async function generateChart(omRows: any[], windguru: any): Promise<string | null> {
  try {
    const { createCanvas } = await import('canvas')
    const W = 800, H = 350
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')

    // Background
    ctx.fillStyle = '#0a1628'
    ctx.fillRect(0, 0, W, H)

    const padL = 55, padR = 80, padT = 50, padB = 55
    const plotW = W - padL - padR
    const plotH = H - padT - padB

    // Collect data: 7-day east coast, 6h resolution
    const now = new Date()
    const east = omRows.filter(r => r.coast === 'east').sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    const subset: any[] = []
    for (let i = 0; i < east.length; i += 6) subset.push(east[i]) // every 6h
    subset.splice(28) // max 7 days × 4 points/day = 28

    if (!subset.length) return null

    const heights = subset.map(r => r.wave_height_m ?? 0)
    const periods = subset.map(r => r.swell_period_s ?? 0)
    const swellMin = subset.map(r => r.swell_height_m ?? 0)
    const swellMax = subset.map(r => (r.wave_height_m ?? 0))

    const maxH = Math.max(...heights, 1)
    const maxP = Math.max(...periods, 1)

    const xScale = (i: number) => padL + (i / (subset.length - 1)) * plotW
    const yScaleH = (v: number) => padT + plotH - (v / maxH) * plotH
    const yScaleP = (v: number) => padT + plotH - (v / maxP) * plotH

    // Grid lines
    ctx.strokeStyle = '#1a2a44'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = padT + (i / 4) * plotH
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke()
      const val = ((4 - i) / 4) * maxH
      ctx.fillStyle = '#6080a0'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(mToFt(val).toFixed(0) + 'ft', padL - 6, y + 4)
    }

    // Wave height filled area (swell band min–max)
    ctx.beginPath()
    ctx.moveTo(xScale(0), yScaleH(swellMax[0]))
    for (let i = 1; i < subset.length; i++) ctx.lineTo(xScale(i), yScaleH(swellMax[i]))
    for (let i = subset.length - 1; i >= 0; i--) ctx.lineTo(xScale(i), yScaleH(swellMin[i]))
    ctx.closePath()
    ctx.fillStyle = 'rgba(26,108,245,0.6)'
    ctx.fill()

    // Wave height outline
    ctx.beginPath()
    ctx.moveTo(xScale(0), yScaleH(heights[0]))
    for (let i = 1; i < subset.length; i++) ctx.lineTo(xScale(i), yScaleH(heights[i]))
    ctx.strokeStyle = '#1a6cf5'
    ctx.lineWidth = 2
    ctx.stroke()

    // Period line (gold, right axis)
    ctx.beginPath()
    ctx.moveTo(xScale(0), yScaleP(periods[0]))
    for (let i = 1; i < subset.length; i++) ctx.lineTo(xScale(i), yScaleP(periods[i]))
    ctx.strokeStyle = '#f5a623'
    ctx.lineWidth = 2
    ctx.stroke()

    // Right axis labels (period)
    ctx.fillStyle = '#f5a623'
    ctx.textAlign = 'left'
    ctx.font = '11px sans-serif'
    for (let i = 0; i <= 4; i++) {
      const y = padT + (i / 4) * plotH
      const val = ((4 - i) / 4) * maxP
      ctx.fillText(val.toFixed(0) + 's', padL + plotW + 6, y + 4)
    }

    // X axis day labels
    ctx.fillStyle = '#9ab0cc'
    ctx.textAlign = 'center'
    ctx.font = '11px sans-serif'
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    let lastDay = ''
    for (let i = 0; i < subset.length; i++) {
      const d = new Date(subset[i].timestamp)
      const day = dayNames[d.getDay()]
      if (day !== lastDay) {
        ctx.fillText(day, xScale(i), H - padB + 18)
        // Tick mark
        ctx.strokeStyle = '#2a3a55'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(xScale(i), padT + plotH)
        ctx.lineTo(xScale(i), padT + plotH + 5)
        ctx.stroke()
        lastDay = day
      }
    }

    // Legend
    ctx.font = '12px sans-serif'
    ctx.fillStyle = '#1a6cf5'; ctx.fillRect(padL, 14, 16, 3)
    ctx.fillStyle = '#a0c0e0'; ctx.fillText('Wave Height', padL + 22, 20)
    ctx.fillStyle = '#f5a623'; ctx.fillRect(padL + 140, 14, 16, 3)
    ctx.fillStyle = '#a0c0e0'; ctx.fillText('Swell Period', padL + 162, 20)

    // Title
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Barbados' }).toUpperCase()
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`BARBADOS SURF OUTLOOK · ${dateStr}`, W - padR, 22)

    // Save
    const outPath = `/tmp/surf-chart-${Date.now()}.png`
    const buf = canvas.toBuffer('image/png')
    writeFileSync(outPath, buf)
    return outPath
  } catch (e) {
    console.warn(`⚠️  Chart generation failed: ${e}`)
    return null
  }
}

// ── Main report builder ───────────────────────────────────────────────────────
async function main() {
  const now = new Date()
  const nowTs = now.getTime()
  const nowAst = now.toLocaleString('en-US', { timeZone: 'America/Barbados' })

  // Load all data sources
  const [cacheRows, buoy40Rows, buoy43Rows, omRows, stormRows] = await Promise.all([
    sbGet('surf_cache', 'key=eq.latest&select=data,updated_at&limit=1'),
    sbGet('buoy_readings', 'buoy_id=eq.41040&order=timestamp.desc&limit=48'),
    sbGet('buoy_readings', 'buoy_id=eq.41043&order=timestamp.desc&limit=48'),
    sbGet('openmeteo_forecasts', `timestamp=gte.${now.toISOString()}&order=timestamp&limit=700`),
    sbGet('nhc_storms', 'fetched_at=gte.' + new Date(nowTs - 3600000).toISOString() + '&order=distance_nm&limit=10'),
  ])

  const cache = cacheRows[0]?.data || {}
  const premium: Record<string, any> = cache.premium || {}
  const windguru: Record<number, any> = cache.windguru || {}

  // ── Header ──
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    timeZone: 'America/Barbados',
  })
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Barbados',
  })
  const { sunrise, sunset } = sunTimes(now)

  const lines: string[] = []
  lines.push(`🌊 SURF INTEL — ${dateStr}, ${timeStr} AST`)
  lines.push('')

  // ── Buoys ──
  const buoy40 = buoy40Rows[0]
  const buoy43 = buoy43Rows[0]
  if (buoy40) {
    const wvhtFt = buoy40.wvht_m != null ? mToFt(buoy40.wvht_m).toFixed(1) : '??'
    const dirStr = buoy40.mwd_deg != null ? degToCompass(buoy40.mwd_deg) : ''
    const changeFt = buoy40.change_6h_m != null ? mToFt(buoy40.change_6h_m) : null
    lines.push(`🌊 BUOY 41040  |  ${wvhtFt}ft @ ${buoy40.dpd_s ?? '?'}s ${dirStr}  |  ${trendIcon(buoy40.trend, changeFt)}`)
  }
  if (buoy43) {
    const wvhtFt = buoy43.wvht_m != null ? mToFt(buoy43.wvht_m).toFixed(1) : '??'
    const dirStr = buoy43.mwd_deg != null ? degToCompass(buoy43.mwd_deg) : ''
    lines.push(`🌊 BUOY 41043  |  ${wvhtFt}ft @ ${buoy43.dpd_s ?? '?'}s ${dirStr}  |  ${trendIcon(buoy43.trend, buoy43.change_6h_m != null ? mToFt(buoy43.change_6h_m) : null)}`)
  }
  if (!buoy40 && !buoy43) lines.push('🌊 BUOY DATA: unavailable (run cache first)')
  lines.push('')

  // ── Model agreement (east coast, current) ──
  const eastOM = omRows.find(r => r.coast === 'east')
  const omFt = eastOM?.wave_height_m != null ? mToFt(eastOM.wave_height_m) : null
  // Surfline: Soup Bowl current
  const soupData = premium['5842041f4e65fad6a7708b48']
  const soupNowWave = soupData?.waves?.[0]
  // surf.min/max from Surfline are in meters; convert to ft for comparison
  const slFt = soupNowWave ? mToFt((soupNowWave.min + soupNowWave.max) / 2) : null
  // WindGuru: spot 64150 (north, closest to east coast)
  const wg = windguru[64150] || windguru[64149]
  const wgFt = wg?.waveHeight?.[0] != null ? mToFt(wg.waveHeight[0]) : null
  if (slFt != null) lines.push(modelAgreementLine(slFt, omFt, wgFt))
  lines.push('')

  // ── Check for flat day ──
  const allFlat = REPORT_SPOTS.every(spot => {
    const pd = premium[spot.id]
    const wave = pd?.waves?.[0]
    return !wave || (wave.max ?? 0) < 0.61 // < 2ft
  })

  const divider = '━━━━━━━━━━━━━━━━━━━━━━━━'

  if (allFlat) {
    lines.push('📉 FLAT — surf is under 2ft everywhere.')
    if (KIND === 'evening') {
      lines.push('')
      lines.push('📅 7-DAY OUTLOOK')
      sevenDayOutlook(omRows).forEach(l => lines.push(l))
    }
    lines.push('')
    lines.push(`🌅 Sunrise ${sunrise}  ·  Sunset ${sunset}`)
    await sendText(lines.join('\n'))
    console.log('Sent flat-day report.')
    return
  }

  // ── Per-spot sections ──
  for (const spot of REPORT_SPOTS) {
    const pd = premium[spot.id]
    if (!pd) {
      lines.push(divider)
      lines.push(`🏄 ${spot.name.toUpperCase()} (${spot.coast === 'east' ? 'East' : 'South'})`)
      lines.push(divider)
      lines.push('Data unavailable — run cache first')
      lines.push('')
      continue
    }

    const wave = pd.waves?.[0]
    const rating = pd.ratings?.[0]
    const tides = pd.tides || []

    // Size
    const minFt = wave ? mToFt(wave.min ?? 0) : 0
    const maxFt = wave ? mToFt(wave.max ?? 0) : 0
    const ratingStr = rating?.key ? rating.key.replace(/_/g, ' ') : '—'
    const sizeLine = `Size:  ${ftRange(minFt, maxFt)}  (Surfline: ${ratingStr})`

    // Swell — primary + secondary
    // Surfline swell[].h is in feet (surf height in meters, swell height in feet)
    const swells: any[] = wave?.swells || []
    let swellLine = 'Swell: —'
    if (swells.length >= 1) {
      const s0 = swells[0]
      const h0 = s0.h != null ? s0.h.toFixed(1) : '?'  // already in ft
      const dir0 = s0.d != null ? degToCompass(s0.d) : '?'
      swellLine = `Swell: ${h0}ft @ ${s0.p ?? '?'}s ${dir0}`
      if (swells.length >= 2) {
        const s1 = swells[1]
        const h1 = s1.h != null ? s1.h.toFixed(1) : '?'  // already in ft
        const dir1 = s1.d != null ? degToCompass(s1.d) : '?'
        const label = (s1.p ?? 0) < 9 ? 'windswell' : ''
        swellLine += `  +  ${h1}ft @ ${s1.p ?? '?'}s ${dir1}${label ? ' ' + label : ''}`
      }
    }

    // Wind + glass-off
    const windNow = wave?.wind
    const windDirStr = windNow?.dir != null ? degToCompass(windNow.dir) : ''
    const windSpeedKt = windNow?.speed != null ? Math.round(windNow.speed * 0.539957) : null // kph → kt
    const windTypeStr = windNow?.dir != null ? deriveWindType(windNow.dir, spot.coast) : ''
    const glassOff = glassOffTime(pd.waves || [], nowTs)
    const windLine = `Wind:  ${windDirStr} ${windSpeedKt ?? '?'}kt ${windTypeStr} → glassing ${glassOff}`

    // Tides
    const tidesStr = formatTides(tides, nowTs)
    const tidesLine = tidesStr ? `Tides: ${tidesStr}` : ''

    // Buoy vs model (east coast only)
    let buoyVsModel = ''
    if (spot.coast === 'east' && buoy40) {
      const buoyFt = buoy40.wvht_m != null ? mToFt(buoy40.wvht_m).toFixed(1) : '?'
      const slRangeStr = `${Math.round(minFt)}-${Math.round(maxFt)}ft`
      const match = buoy40.wvht_m != null && Math.abs(buoy40.wvht_m * 3.28084 - (minFt + maxFt) / 2) < 1 ? '✓' : '△'
      buoyVsModel = `Buoy vs model: 41040 says ${buoyFt}ft — Surfline ${slRangeStr} ${match}`
    }

    // 48h sparkline from Open-Meteo
    const next48 = omRows
      .filter(r => r.coast === spot.coast)
      .slice(0, 48)
      .map(r => r.wave_height_m ?? 0)
    const spark = sparkline(next48.filter((_, i) => i % 6 === 0)) // hourly → every 6h = 8 chars
    const trend48 = sparkTrend(next48)
    const sparkLine = `48h: ${spark} (${trend48})`

    lines.push(divider)
    lines.push(`🏄 ${spot.name.toUpperCase()} (${spot.coast === 'east' ? 'East' : 'South'})`)
    lines.push(divider)
    lines.push(sizeLine)
    lines.push(swellLine)
    lines.push(windLine)
    if (tidesLine) lines.push(tidesLine)
    if (buoyVsModel) lines.push(buoyVsModel)
    lines.push('')
    lines.push(sparkLine)
    lines.push('')
  }

  // ── Active storm warnings ──
  const stormLines = stormSection(stormRows)
  stormLines.forEach(l => lines.push(l))

  // ── Bias summary ──
  const biasLines = await biasSummary()
  biasLines.forEach(l => lines.push(l))

  // ── Sun ──
  lines.push('')
  lines.push(`🌅 Sunrise ${sunrise}  ·  Sunset ${sunset}`)

  // ── 9 PM: 7-day outlook ──
  if (KIND === 'evening') {
    const outlookLines = sevenDayOutlook(omRows)
    if (outlookLines.length) {
      lines.push('')
      lines.push(divider)
      lines.push('📅 7-DAY OUTLOOK')
      outlookLines.forEach(l => lines.push(l))
    }
  }

  await sendText(lines.join('\n'))
  console.log(`✅ Report sent (${lines.length} lines)`)

  // ── 9 PM: Chart image ──
  if (KIND === 'evening') {
    console.log('📊 Generating 7-day chart...')
    const chartPath = await generateChart(omRows, windguru)
    if (chartPath) {
      await sendPhoto(chartPath, `BARBADOS SURF OUTLOOK · ${dateStr}`)
      console.log('✅ Chart sent')
    } else {
      console.warn('⚠️  Chart not generated — canvas may not be installed (npm i canvas)')
    }
  }
}

main().catch(err => { console.error(err); process.exit(1) })
