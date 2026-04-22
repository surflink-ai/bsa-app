#!/usr/bin/env tsx
/**
 * Deterministic Barbados surf report for Telegram.
 *
 * Accuracy priority:
 *   1. Upstream NOAA buoys (measured reality)
 *   2. Swell window + exposure (math, catches "swell doesn't reach this coast")
 *   3. Surfline LOTUS premium hourly (authoritative for size/rating at covered spots)
 *   4. Wind (Open-Meteo, ECMWF via WindGuru cross-check)
 *
 * No LLM in the loop — rules are hard-coded to avoid contradictions.
 *
 * Env required:
 *   TELEGRAM_BOT_TOKEN
 *   TELEGRAM_CHAT_ID
 *
 * Optional:
 *   DRY_RUN=1  -> print to stdout instead of sending
 *   KIND=morning | afternoon | dawn  -> affects header + horizon
 */

const API_URL = process.env.CONDITIONS_URL || 'https://bsa.surf/api/conditions'
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || ''
const DRY_RUN = process.env.DRY_RUN === '1'
const KIND = (process.env.KIND || 'morning') as 'morning' | 'afternoon' | 'dawn'

type Verdict = 'GO' | 'MAYBE' | 'SKIP'

interface Spot {
  name: string
  spotId: string
  coast: 'East' | 'South' | 'West'
  waveMin: number
  waveMax: number
  surflineWaveM?: { min: number; max: number }
  conditions: string
  windSpeed: number
  windType: string
  windDir: string
  swellHeight: number
  swellPeriod: number
  swellDir: string
  swellDirDeg: number
  swellInWindow: boolean
  swellExposure: number
  confidence: string
  consensusNote?: string
}

/** Reef-break spots that hold their shape in small surf */
const REEF_SPOTS = new Set([
  'Soup Bowl', 'Brandon\'s', 'Parlour', 'Crane Bay', 'Ragged Point',
  'South Point', 'Duppies', 'Tropicana',
])

/** Surfline-verified spots with reliable cam/rating */
const VERIFIED_SPOTS = new Set(['Soup Bowl', 'Freights Bay', 'Brandon\'s', 'Crane Bay'])

function pickSize(spot: Spot): { min: number; max: number } {
  // Surfline premium when available — that's the authoritative hourly model
  if (spot.surflineWaveM && typeof spot.surflineWaveM.min === 'number' && typeof spot.surflineWaveM.max === 'number') {
    return spot.surflineWaveM
  }
  return { min: spot.waveMin, max: spot.waveMax }
}

function scoreSpot(spot: Spot): { verdict: Verdict; reasons: string[] } {
  const { min, max } = pickSize(spot)
  const isReef = REEF_SPOTS.has(spot.name)
  const wt = (spot.windType || '').toLowerCase()
  const windOffshore = wt.includes('offshore')
  const windClean = windOffshore || (wt.includes('cross') && spot.windSpeed < 12)
  const windOnshore = wt.startsWith('onshore') || (wt.includes('cross-onshore') && spot.windSpeed >= 12)
  const rating = spot.conditions
  const reasons: string[] = []

  // HARD SKIPS (non-negotiable)
  if (!spot.swellInWindow) {
    reasons.push('swell direction wrong for this coast')
    return { verdict: 'SKIP', reasons }
  }
  if (spot.swellExposure < 30) {
    reasons.push(`only ${spot.swellExposure}% of swell reaches here`)
    return { verdict: 'SKIP', reasons }
  }
  if (max < 1) {
    reasons.push('flat')
    return { verdict: 'SKIP', reasons }
  }
  if (rating === 'VERY_POOR') {
    reasons.push('Surfline: very poor')
    return { verdict: 'SKIP', reasons }
  }
  if (rating === 'POOR' && max < 4) {
    reasons.push('Surfline: poor')
    return { verdict: 'SKIP', reasons }
  }
  if (windOnshore && spot.windSpeed >= 18) {
    reasons.push(`blown out (${spot.windType} ${Math.round(spot.windSpeed)}kph)`)
    return { verdict: 'SKIP', reasons }
  }

  // GO: Surfline says FAIR+ AND 3ft+ AND clean wind
  if ((rating === 'FAIR' || rating === 'FAIR_TO_GOOD' || rating === 'GOOD' || rating === 'EPIC') && max >= 3 && !windOnshore) {
    reasons.push(`${min}-${max}ft ${rating.replace(/_/g, ' ').toLowerCase()}, ${spot.windType?.toLowerCase()}`)
    return { verdict: 'GO', reasons }
  }
  // GO: 4ft+ reef with anything other than strong onshore
  if (isReef && max >= 4 && spot.windSpeed < 18) {
    reasons.push(`${min}-${max}ft on the reef, ${spot.windType?.toLowerCase()}`)
    return { verdict: 'GO', reasons }
  }

  // MAYBE: 3ft+ POOR_TO_FAIR reef with clean wind
  if (isReef && max >= 3 && rating === 'POOR_TO_FAIR' && windClean) {
    reasons.push(`${min}-${max}ft on the reef, wind clean`)
    return { verdict: 'MAYBE', reasons }
  }
  // MAYBE: FAIR rating but small
  if ((rating === 'FAIR' || rating === 'POOR_TO_FAIR') && max >= 2 && isReef && windClean) {
    reasons.push(`small (${min}-${max}ft) but clean on the reef`)
    return { verdict: 'MAYBE', reasons }
  }

  // Default skip
  reasons.push(`${min}-${max}ft ${rating.replace(/_/g, ' ').toLowerCase()}, not worth it`)
  return { verdict: 'SKIP', reasons }
}

function emoji(v: Verdict) {
  return v === 'GO' ? '🟢' : v === 'MAYBE' ? '🟡' : '🔴'
}

function verdictLabel(v: Verdict) {
  return v === 'GO' ? 'GO' : v === 'MAYBE' ? 'maybe' : 'skip'
}

function nextOpportunity(data: any): string | null {
  // Scan ECMWF WAM forecast for a peak above 2m swell from an easterly direction
  const wg = data?.windguru?.['64149']
  if (!wg?.waveHeight || !wg?.hours) return null
  const init = wg.initDate ? new Date(wg.initDate.replace(' ', 'T') + 'Z') : new Date()
  const currentMax = wg.waveHeight.slice(0, 4).reduce((a: number, b: number) => Math.max(a, b), 0)
  let bestPeakH = currentMax
  let bestIdx = -1
  for (let i = 6; i < wg.waveHeight.length && i < 72; i++) {
    if (wg.waveHeight[i] > bestPeakH + 0.3) {
      bestPeakH = wg.waveHeight[i]
      bestIdx = i
    }
  }
  if (bestIdx === -1) return null
  const peakTime = new Date(init.getTime() + wg.hours[bestIdx] * 3600000)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const day = days[peakTime.getDay()]
  const dateNum = peakTime.getDate()
  const monthShort = peakTime.toLocaleDateString('en-US', { month: 'short' })
  const hr = peakTime.getHours()
  const tod = hr < 10 ? 'AM' : hr < 15 ? 'midday' : 'PM'
  const ft = Math.round(bestPeakH * 3.28 / 2) // rough: WAM total height → dominant swell face
  return `${day} ${dateNum} ${monthShort} ${tod}, ~${ft - 1}-${ft}ft ESE`
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false, timeZone: 'America/Barbados' })
}

function formatTideShort(t: any): string {
  const d = new Date(t.time.replace(' ', 'T') + '-04:00')
  const hhmm = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Barbados' })
  return `${t.type === 'high' ? 'Hi' : 'Lo'} ${hhmm} (${t.height.toFixed(2)}m)`
}

async function send(text: string) {
  if (DRY_RUN || !BOT_TOKEN || !CHAT_ID) {
    console.log('[DRY_RUN]\n' + text)
    return
  }
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Telegram send failed: ${res.status} ${body}`)
  }
}

async function main() {
  const res = await fetch(API_URL, { cache: 'no-store' })
  if (!res.ok) throw new Error(`API fetch failed: ${res.status}`)
  const data = await res.json()

  const all: Spot[] = [...(data.east || []), ...(data.south || []), ...(data.west || [])]
  if (!all.length) throw new Error('No spots returned')

  const scored = all.map(s => ({ spot: s, ...scoreSpot(s) }))
  const goers = scored.filter(x => x.verdict !== 'SKIP')

  // Upstream buoy quick check
  const buoy = data.buoys?.['41044']
  const buoyLine = buoy && data.analysis?.buoySignal
    ? `Buoy 41044: ${buoy.swellHeight?.toFixed(1)}m @ ${buoy.swellPeriod?.toFixed(1)}s ${buoy.swellDir} (${data.analysis.buoySignal.signal})`
    : ''

  // Exposure-by-coast
  const eastExp = Math.round((data.east?.[0]?.swellExposure) || 0)
  const southExp = Math.round((data.south?.[0]?.swellExposure) || 0)
  const westExp = Math.round((data.west?.[0]?.swellExposure) || 0)
  const expLine = `Swell reaching: East ${eastExp}% · South ${southExp}% · West ${westExp}%`

  // Tides — pick next high and low after now
  const nowMs = Date.now()
  const upcomingTides = (data.tides || [])
    .map((t: any) => ({ ...t, ms: new Date(t.time.replace(' ', 'T') + '-04:00').getTime() }))
    .filter((t: any) => t.ms > nowMs)
    .slice(0, 2)
  const tideLine = upcomingTides.length
    ? `Tide: ${upcomingTides.map(formatTideShort).join(' · ')}`
    : ''

  const sun = data.sun || {}
  const sunLine = KIND === 'afternoon'
    ? `Sunset ${sun.sunset ? formatTime(sun.sunset) : '?'}`
    : `Sunrise ${sun.sunrise ? formatTime(sun.sunrise) : '?'}`

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    timeZone: 'America/Barbados',
  }).toUpperCase()

  const headerEmoji = KIND === 'dawn' ? '🌅' : KIND === 'afternoon' ? '🌊' : '🏄'
  const headerLabel = KIND === 'dawn' ? 'DAWN PATROL' : KIND === 'afternoon' ? 'AFTERNOON' : 'MORNING'

  const lines: string[] = []
  lines.push(`${headerEmoji} <b>BARBADOS · ${dateStr} · ${headerLabel}</b>`)
  lines.push('')
  if (buoyLine) lines.push(buoyLine)
  lines.push(expLine)
  lines.push([sunLine, tideLine].filter(Boolean).join(' · '))
  lines.push('')

  // ----- Flat-case: one-liner, no spot listing -----
  if (goers.length === 0) {
    lines.push('<i>Nothing worth paddling out for today.</i>')
    const next = nextOpportunity(data)
    if (next) lines.push('')
    if (next) lines.push(`Next bump: <b>${next}</b>`)
    await send(lines.join('\n'))
    console.log('Sent flat-day one-liner.')
    return
  }

  // ----- Normal case: show only TOP spots -----
  // Dedupe by coast/rating — spots on the same coast with the same rating usually share conditions
  const sortedGoers = goers.sort((a, b) => {
    const order = { GO: 0, MAYBE: 1, SKIP: 2 }
    if (order[a.verdict] !== order[b.verdict]) return order[a.verdict] - order[b.verdict]
    // Prefer Surfline-verified spots
    const aVer = VERIFIED_SPOTS.has(a.spot.name) ? 0 : 1
    const bVer = VERIFIED_SPOTS.has(b.spot.name) ? 0 : 1
    if (aVer !== bVer) return aVer - bVer
    const aMax = pickSize(a.spot).max
    const bMax = pickSize(b.spot).max
    return bMax - aMax
  }).slice(0, 4) // never more than 4 spots in a report

  for (const { spot, verdict, reasons } of sortedGoers) {
    const sz = pickSize(spot)
    const heightTxt = sz.min === sz.max ? `${sz.min}ft` : `${sz.min}-${sz.max}ft`
    const windTxt = `${spot.windType} ${Math.round(spot.windSpeed)}kph`
    const verified = VERIFIED_SPOTS.has(spot.name) ? ' ✓' : ''
    lines.push(`${emoji(verdict)} <b>${spot.name}${verified}</b> · ${heightTxt} ${spot.conditions.replace(/_/g, ' ').toLowerCase()}`)
    lines.push(`   ${windTxt} · ${spot.swellPeriod?.toFixed(1)}s ${spot.swellDir} · exposure ${spot.swellExposure}%`)
    lines.push(`   ${verdictLabel(verdict)} — ${reasons[0]}`)
    lines.push('')
  }

  // Footer: confidence + Surfline cam link for best spot
  const confLow = scored.filter(x => x.spot.confidence === 'low').length > scored.length / 2
  if (confLow) lines.push('<i>Low confidence — models disagree. Check the cam before heading out.</i>')
  lines.push('')
  lines.push('<a href="https://www.surfline.com/surf-report/soup-bowl/5842041f4e65fad6a7708b48">Surfline → Soup Bowl</a>')

  await send(lines.join('\n'))
  console.log(`Sent report with ${sortedGoers.length} spot(s).`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
