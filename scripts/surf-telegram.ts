#!/usr/bin/env tsx
/**
 * Surf Intel v2 — data-only Telegram report for Barbados.
 *
 * Reads: Supabase surf_cache (Surfline premium), buoy_readings,
 *        openmeteo_forecasts, nhc_storms, forecast_bias
 * Sends: Telegram Bot API (HTML parse mode)
 *
 * Flags:
 *   --dry-run   print to stdout, no send
 *   --outlook   append 7-day outlook + generate + send chart PNG (Phase C)
 *
 * No GO/MAYBE/SKIP — data only. Adam decides.
 */

import { execSync, spawnSync } from 'child_process'
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
} catch { /* rely on real env */ }

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\\n|[\r\n]/g, '').trim()
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\\n|[\r\n]/g, '').trim()
const BOT_TOKEN    = (process.env.TELEGRAM_BOT_TOKEN || '').trim()
const CHAT_ID      = (process.env.TELEGRAM_CHAT_ID || '').trim()
const DRY_RUN      = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1'
const OUTLOOK      = process.argv.includes('--outlook')
// --full: always send the complete per-spot report (skip the flat-day collapse).
// Used for explicit on-demand requests (/surf) — Adam asked, Adam gets everything.
const FULL         = process.argv.includes('--full')

// ── constants ────────────────────────────────────────────────────────────────
const SPOTS = [
  { id: '5842041f4e65fad6a7708b48', name: 'Soup Bowl',   coast: 'east'  as const },
  { id: '5842041f4e65fad6a7708c81', name: "Branden's",   coast: 'south' as const },
  { id: '584204204e65fad6a77099c0', name: 'Freights Bay', coast: 'south' as const },
  { id: '584204204e65fad6a77099c5', name: 'South Point', coast: 'south' as const },
]

// ── helpers ──────────────────────────────────────────────────────────────────
function degToCompass(deg: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  return dirs[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16]
}

function mToFt(m: number): number { return Math.round(m * 3.28084 * 10) / 10 }

function sparkline(values: number[]): string {
  const bars = ['▁','▂','▃','▄','▅','▆','▇','█']
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  return values.map(v => bars[Math.min(7, Math.floor((v - min) / range * 7.99))]).join('')
}

function hoursFromNow(ms: number): number {
  return (ms - Date.now()) / 3600000
}

function formatHHMM(d: Date): string {
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: 'America/Barbados',
  })
}

// Glassoff: first hour wind < 10kt OR direction offshore
// East coast: offshore = W ± 60° (240–360 or 0–60 deg)
// South coast: offshore = N ± 60° (300–360 or 0–60 deg)
function isOffshoreWind(dirDeg: number, coast: 'east' | 'south'): boolean {
  const d = ((dirDeg % 360) + 360) % 360
  if (coast === 'east')  return (d >= 240 && d <= 360) || d <= 60
  if (coast === 'south') return d >= 300 || d <= 60
  return false
}

// ── Supabase fetch helpers ───────────────────────────────────────────────────
async function sbGet<T>(path: string): Promise<T[]> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Accept': 'application/json',
    },
  })
  if (!r.ok) throw new Error(`Supabase ${path}: ${r.status}`)
  return r.json()
}

// ── Telegram ─────────────────────────────────────────────────────────────────
async function sendText(text: string) {
  if (DRY_RUN || !BOT_TOKEN || !CHAT_ID) { console.log('[DRY_RUN]\n' + text); return }
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  })
  if (!r.ok) throw new Error(`Telegram send: ${r.status} ${await r.text()}`)
}

async function sendPhoto(photoPath: string, caption: string) {
  if (DRY_RUN) { console.log(`[DRY_RUN] would send photo: ${photoPath}\nCaption: ${caption}`); return }
  if (!BOT_TOKEN || !CHAT_ID) return
  const result = spawnSync('curl', [
    '-s', '-X', 'POST',
    `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
    '-F', `chat_id=${CHAT_ID}`,
    '-F', `photo=@${photoPath}`,
    '-F', `caption=${caption}`,
  ], { encoding: 'utf8', timeout: 30000 })
  if (result.status !== 0) throw new Error(`sendPhoto curl error: ${result.stderr}`)
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  // ── 1. Load all data sources ────────────────────────────────────────────
  const [cacheRows, buoy40Rows, buoy43Rows, omEastRows, omSouthRows, nhcRows, biasRows] = await Promise.all([
    sbGet<any>('surf_cache?key=eq.latest&select=data,updated_at'),
    sbGet<any>(`buoy_readings?buoy_id=eq.41040&order=timestamp.desc&limit=24`),
    sbGet<any>(`buoy_readings?buoy_id=eq.41043&order=timestamp.desc&limit=24`),
    sbGet<any>(`openmeteo_forecasts?coast=eq.east&timestamp=gte.${new Date().toISOString().slice(0,13)}:00:00Z&order=timestamp.asc&limit=168`),
    sbGet<any>(`openmeteo_forecasts?coast=eq.south&timestamp=gte.${new Date().toISOString().slice(0,13)}:00:00Z&order=timestamp.asc&limit=168`),
    sbGet<any>(`nhc_storms?fetched_at=gte.${new Date(Date.now() - 2*3600000).toISOString()}&order=fetched_at.desc`),
    sbGet<any>(`forecast_bias?select=source,coast,error_ft,forecast_date&order=forecast_date.desc&limit=60`),
  ])

  const cache = cacheRows[0]?.data || {}
  const premium = cache.premium || {}

  // ── 2. Buoy summary ─────────────────────────────────────────────────────
  const buoy40 = buoy40Rows[0]
  const buoy43 = buoy43Rows[0]

  function buoyLine(buoy: any, label: string): string {
    if (!buoy) return ''
    const ht = buoy.wvht_m !== null ? `${mToFt(buoy.wvht_m)}ft` : '?ft'
    const per = buoy.dpd_s ? `@ ${buoy.dpd_s}s ` : ''
    const dir = buoy.mwd_deg !== null ? degToCompass(buoy.mwd_deg) : ''
    const trendIcon = buoy.trend === 'rising' ? '📈' : buoy.trend === 'falling' ? '📉' : '→'
    const changeStr = buoy.change_6h_m !== null
      ? ` ${buoy.change_6h_m >= 0 ? '+' : ''}${mToFt(buoy.change_6h_m)}ft/6h`
      : ''
    return `📡 Buoy ${label}: ${ht} ${per}${dir} · ${trendIcon}${changeStr}`
  }

  // ── 3. Model consensus ──────────────────────────────────────────────────
  function modelConsensus(): string {
    // Soup Bowl current-hour Surfline
    const soupPremium = premium['5842041f4e65fad6a7708b48']
    const nowHour = Math.floor(Date.now() / 3600000) * 3600
    const slWave = soupPremium?.waves?.find((w: any) => Math.abs(w.ts - nowHour) < 7200)
    const slFt = slWave ? `${Math.round(slWave.min)}-${Math.round(slWave.max)}ft` : null

    // Open-Meteo current-ish (first row is ~now)
    const omCurrent = omEastRows[0]
    const omFt = omCurrent?.swell_height_m != null
      ? `${Math.round(mToFt(omCurrent.swell_height_m))}ft`
      : null

    // WindGuru: first WVHT entry
    const wg = cache.windguru?.['64149']
    const wgFt = wg?.waveHeight?.[0] != null
      ? `${Math.round(mToFt(wg.waveHeight[0]))}ft`
      : null

    const parts = [
      slFt ? `Surfline ${slFt}` : null,
      omFt ? `ECMWF ${omFt}` : null,
      wgFt ? `WindGuru ${wgFt}` : null,
    ].filter(Boolean) as string[]

    if (!parts.length) return ''

    // Simple agreement check — all within 1ft of each other
    const nums = parts.map(p => parseFloat(p.split(' ')[1]))
    const spread = Math.max(...nums) - Math.min(...nums)

    if (spread <= 1) {
      return `🤝 Models: ${parts.join(' · ')} ✓agree`
    } else {
      const buoyFt = buoy40?.wvht_m != null ? `buoy says ${mToFt(buoy40.wvht_m)}ft` : ''
      return `⚠️ Split: ${parts.join(' / ')}${buoyFt ? ' — ' + buoyFt : ''}`
    }
  }

  // ── 4. Per-spot blocks ──────────────────────────────────────────────────
  function buildSpotBlock(spot: typeof SPOTS[0]): string {
    const sp = premium[spot.id]
    if (!sp) return `🌊 <b>${spot.name}</b> (${spot.coast})\n<i>No data</i>`

    // Current conditions (hour closest to now)
    const nowTs = Math.floor(Date.now() / 3600000) * 3600
    const currentWave = sp.waves?.reduce((best: any, w: any) =>
      Math.abs(w.ts - nowTs) < Math.abs((best?.ts || 0) - nowTs) ? w : best, null)

    // surf.min/max come from Surfline in feet; round to integers
    const size = currentWave
      ? `${Math.round(currentWave.min ?? 0)}-${Math.round(currentWave.max ?? 0)}ft`
      : '?ft'

    // Rating (closest to now)
    const currentRating = sp.ratings?.reduce((best: any, r: any) =>
      Math.abs(r.ts - nowTs) < Math.abs((best?.ts || 0) - nowTs) ? r : best, null)
    const ratingStr = currentRating?.key
      ? currentRating.key.replace(/_/g, ' ')
      : ''

    // Primary + secondary swell
    // swells[].h is in feet from Surfline aggregate endpoint
    const swells = currentWave?.swells?.filter((s: any) => s.h > 0.5) || []
    const swellStr = swells.slice(0, 2).map((s: any) => {
      const ht = Math.round(s.h * 10) / 10
      return `${ht}ft @ ${s.p}s ${degToCompass(s.d)}`
    }).join(' + ')

    // Wind (current or nearest)
    const currentWind = sp.winds?.reduce((best: any, w: any) =>
      Math.abs(w.ts - nowTs) < Math.abs((best?.ts || 0) - nowTs) ? w : best, null)
    const windStr = currentWind
      ? `${degToCompass(currentWind.dir)} ${Math.round(currentWind.speed)}kt`
      : ''

    // Glass-off: scan next 14h of winds
    const next14hWinds = (sp.winds || []).filter((w: any) => {
      const h = hoursFromNow(w.ts * 1000)
      return h >= 0 && h <= 14
    })
    let glassOff = 'onshore all day'
    for (const w of next14hWinds) {
      if (w.speed < 10 || isOffshoreWind(w.dir, spot.coast)) {
        const glassTime = new Date(w.ts * 1000)
        glassOff = `lightens ~${formatHHMM(glassTime)}`
        break
      }
    }

    // Tide — from Surfline tide cache (sunriseSunsetTimes / tides on overview)
    const eastOverview = cache.surfline?.east || []
    const spotOverview = eastOverview.find((s: any) => s.spotId === spot.id)
      || (cache.surfline?.south || []).find((s: any) => s.spotId === spot.id)
    // Tides usually come from the overview tides field or need separate fetch
    // Use next high/low from Surfline if available
    const tideStr = '' // Surfline tides not in current cache payload — placeholder

    // Sparkline: next 48h hourly surf max from premium waves
    const next48 = (sp.waves || []).filter((w: any) => {
      const h = hoursFromNow(w.ts * 1000)
      return h >= 0 && h <= 48
    })
    let sparkStr = ''
    let peakNote = ''
    if (next48.length >= 8) {
      // Downsample to 8 chars
      const step = Math.floor(next48.length / 8)
      const sampled = Array.from({ length: 8 }, (_, i) => next48[i * step]?.max || 0)
      sparkStr = '\n48h: ' + sparkline(sampled)
      // Peak time
      const peakIdx = next48.reduce((best, w, i) => (w.max || 0) > (next48[best]?.max || 0) ? i : best, 0)
      const peakWave = next48[peakIdx]
      if (peakWave) {
        const peakDate = new Date(peakWave.ts * 1000)
        const dayName = peakDate.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/Barbados' })
        const tod = peakDate.getHours() < 12 ? 'AM' : 'PM'
        peakNote = ` (peak ${dayName} ${tod})`
      }
    }

    // Buoy cross-check for Soup Bowl (east buoy 41040)
    let buoyCheck = ''
    if (spot.id === '5842041f4e65fad6a7708b48' && buoy40?.wvht_m !== null && currentWave) {
      const buoyFt = mToFt(buoy40.wvht_m)
      const inRange = buoyFt >= (currentWave.min - 0.5) && buoyFt <= (currentWave.max + 0.5)
      buoyCheck = inRange
        ? `\n📡 Buoy 41040: ${buoyFt}ft ✓ within range`
        : `\n📡 Buoy 41040: ${buoyFt}ft ← Surfline says ${size}`
    }

    const lines = [
      `🌊 <b>${spot.name}</b> (${spot.coast})`,
      `Size: ${size}${ratingStr ? ' · Surfline: ' + ratingStr.toUpperCase() : ''}`,
      swellStr ? `Swell: ${swellStr}` : '',
      `Wind: ${windStr} ${glassOff}`,
      buoyCheck,
      sparkStr + peakNote,
    ].filter(Boolean)

    return lines.join('\n')
  }

  // ── 5. Bias footer ──────────────────────────────────────────────────────
  function biasFooter(): string {
    const slBias = biasRows.filter((r: any) => r.source === 'surfline' && r.coast === 'east')
    const omBias = biasRows.filter((r: any) => r.source === 'openmeteo' && r.coast === 'east')
    if (slBias.length < 5 && omBias.length < 5) return ''

    const parts: string[] = []
    if (slBias.length >= 5) {
      const avg = slBias.reduce((s: number, r: any) => s + r.error_ft, 0) / slBias.length
      const pct = Math.round(avg * 100 / 3) // rough % relative to ~3ft avg
      parts.push(`Surfline ${pct > 0 ? '+' : ''}${pct}% ${pct > 5 ? 'hot 🔥' : pct < -5 ? 'cold ❄️' : 'ok'}`)
    }
    if (omBias.length >= 5) {
      const avg = omBias.reduce((s: number, r: any) => s + r.error_ft, 0) / omBias.length
      const pct = Math.round(avg * 100 / 3)
      parts.push(`ECMWF ${pct > 0 ? '+' : ''}${pct}%`)
    }
    return parts.length ? `📊 30d bias: ${parts.join(' · ')}` : ''
  }

  // ── 6. NHC storm block ──────────────────────────────────────────────────
  function nhcBlock(): string {
    if (!nhcRows.length) return ''
    const lines = nhcRows.slice(0, 3).map((s: any) => {
      const cat = s.classification === 'HU' ? ` Cat${s.category}` : ''
      const pos = `${Math.abs(s.lat).toFixed(1)}°${s.lat >= 0 ? 'N' : 'S'} ${Math.abs(s.lon).toFixed(1)}°${s.lon >= 0 ? 'E' : 'W'}`
      const etaDays = s.est_eta_hours ? (s.est_eta_hours / 24).toFixed(1) + 'd' : ''
      return `🌀 <b>${s.name}</b>${cat} · ${pos} · ${s.distance_nm}nm · ${s.est_swell_period_s}s est · ETA swell ${etaDays}`
    })
    return lines.join('\n')
  }

  // ── 7. 7-day outlook ────────────────────────────────────────────────────
  function buildOutlook(): { text: string; chartData: any } {
    const soupPremium = premium['5842041f4e65fad6a7708b48']
    const now = new Date()
    const nowTs = Math.floor(Date.now() / 3600000) * 3600

    // Build daily summaries from Surfline premium east + ECMWF
    const dayMap = new Map<string, { maxFt: number; minFt: number; periods: number[]; winds: number[] }>()

    for (const w of (soupPremium?.waves || [])) {
      const h = hoursFromNow(w.ts * 1000)
      if (h < 0 || h > 7 * 24) continue
      const d = new Date(w.ts * 1000).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/Barbados' })
      if (!dayMap.has(d)) dayMap.set(d, { maxFt: 0, minFt: 99, periods: [], winds: [] })
      const entry = dayMap.get(d)!
      if (w.max) entry.maxFt = Math.max(entry.maxFt, w.max)
      if (w.min) entry.minFt = Math.min(entry.minFt, w.min)
      if (w.swells?.[0]?.p) entry.periods.push(w.swells[0].p)
    }
    for (const w of (soupPremium?.winds || [])) {
      const h = hoursFromNow(w.ts * 1000)
      if (h < 0 || h > 7 * 24) continue
      const d = new Date(w.ts * 1000).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/Barbados' })
      if (!dayMap.has(d)) dayMap.set(d, { maxFt: 0, minFt: 99, periods: [], winds: [] })
      if (w.speed) dayMap.get(d)!.winds.push(w.speed)
    }

    const days = [...dayMap.entries()].slice(0, 7)
    const maxFts = days.map(([, v]) => v.maxFt)
    const peakIdx = maxFts.indexOf(Math.max(...maxFts))

    const outlookLines = ['', '<b>📅 7-DAY OUTLOOK</b>']
    const chartDays: any[] = []

    days.forEach(([dayName, v], i) => {
      const period = v.periods.length ? Math.round(v.periods.reduce((a, b) => a + b, 0) / v.periods.length) : null
      const wind = v.winds.length ? Math.round(v.winds.reduce((a, b) => a + b, 0) / v.winds.length) : null
      const minFt = v.minFt === 99 ? 0 : Math.round(v.minFt)
      const maxFt = Math.round(v.maxFt)
      const periodStr = period ? `@ ${period}s` : ''
      const marker = i === peakIdx ? ' ← peak' : (i > 0 && maxFts[i] > maxFts[i-1] ? ' ← building' : '')
      outlookLines.push(`${dayName}: ${minFt}-${maxFt}ft ${periodStr}${marker}`)
      chartDays.push({ date: dayName, minFt, maxFt, periodS: period || 8, windKt: wind || 12 })
    })

    return { text: outlookLines.join('\n'), chartData: { days: chartDays } }
  }

  // ── 8. Flat check ───────────────────────────────────────────────────────
  function isFlat(): boolean {
    let allFlat = true
    for (const spot of SPOTS) {
      const sp = premium[spot.id]
      const nowTs = Math.floor(Date.now() / 3600000) * 3600
      const w = sp?.waves?.find((w: any) => Math.abs(w.ts - nowTs) < 7200)
      if (w && w.max >= 2) { allFlat = false; break }
    }
    return allFlat
  }

  // ── 9. Assemble message ─────────────────────────────────────────────────
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    timeZone: 'America/Barbados',
  })
  const timeStr = formatHHMM(now)

  // Sunrise/sunset from Surfline cache overview
  const sunData = cache.surfline?.east?.[0]
  const sunriseStr = sunData?.sunrise ? formatHHMM(new Date(sunData.sunrise)) : null
  const sunsetStr = sunData?.sunset ? formatHHMM(new Date(sunData.sunset)) : null
  const sunLine = [sunriseStr ? `🌅 ${sunriseStr}` : null, sunsetStr ? `🌇 ${sunsetStr}` : null]
    .filter(Boolean).join('  ')

  const lines: string[] = []
  lines.push(`🌊 <b>SURF INTEL — ${dateStr}, ${timeStr}</b>`)
  lines.push('')

  const b40 = buoyLine(buoy40, '41040')
  const b43 = buoyLine(buoy43, '41043')
  if (b40) lines.push(b40)
  if (b43) lines.push(b43)

  const consensus = modelConsensus()
  if (consensus) lines.push(consensus)
  if (sunLine) lines.push(sunLine)

  const nhc = nhcBlock()
  if (nhc) { lines.push(''); lines.push(nhc) }

  if (isFlat() && !FULL) {
    lines.push('')
    lines.push('📉 <i>Flat — under 2ft everywhere.</i>')
    if (OUTLOOK) {
      const { text: outlookText } = buildOutlook()
      lines.push(outlookText)
    }
    await sendText(lines.join('\n'))
    console.log('Sent flat-day report.')
    return
  }

  lines.push('')

  for (const spot of SPOTS) {
    lines.push(buildSpotBlock(spot))
    lines.push('')
  }

  const bias = biasFooter()
  if (bias) lines.push(bias)

  if (OUTLOOK) {
    const { text: outlookText, chartData } = buildOutlook()
    lines.push(outlookText)

    // Generate + send chart (Phase C)
    try {
      const chartJson = JSON.stringify(chartData)
      const result = spawnSync('python3', [join(__dirname, 'surf-chart.py')], {
        input: chartJson,
        encoding: 'utf8',
        timeout: 30000,
        env: { ...process.env },
      })
      if (result.status === 0) {
        const chartPath = '/tmp/surf-outlook.png'
        const { statSync } = await import('fs')
        const stat = statSync(chartPath)
        if (stat.size > 20000) {
          await sendText(lines.join('\n'))
          await sendPhoto(chartPath, `Barbados 7-day surf outlook · ${dateStr}`)
          console.log(`Sent report + chart (${stat.size} bytes)`)
          return
        }
      } else {
        console.warn('Chart generation failed:', result.stderr)
      }
    } catch (e: any) {
      console.warn('Chart error:', e.message)
    }
  }

  await sendText(lines.join('\n'))
  console.log(`Sent surf report for ${SPOTS.length} spots`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
