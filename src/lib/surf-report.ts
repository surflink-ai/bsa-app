/**
 * Deterministic Barbados surf report (Telegram). No LLM — hard-coded rules
 * avoid contradictions. Shared by the Vercel Cron route and the CLI script.
 *
 * Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, optional CONDITIONS_URL.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type ReportKind = 'morning' | 'afternoon' | 'dawn'
type Verdict = 'GO' | 'MAYBE' | 'SKIP'

interface Spot {
  name: string
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
}

const REEF_SPOTS = new Set([
  'Soup Bowl', "Branden's", 'Parlour', 'Crane Bay', 'Ragged Point', 'South Point', 'Duppies', 'Tropicana',
])
const VERIFIED_SPOTS = new Set(['Soup Bowl', 'Freights Bay', "Branden's", 'Crane Bay'])

function pickSize(spot: Spot): { min: number; max: number } {
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

  if (!spot.swellInWindow) return { verdict: 'SKIP', reasons: ['swell direction wrong for this coast'] }
  if (spot.swellExposure < 30) return { verdict: 'SKIP', reasons: [`only ${spot.swellExposure}% of swell reaches here`] }
  if (max < 1) return { verdict: 'SKIP', reasons: ['flat'] }
  if (rating === 'VERY_POOR') return { verdict: 'SKIP', reasons: ['Surfline: very poor'] }
  if (rating === 'POOR' && max < 4) return { verdict: 'SKIP', reasons: ['Surfline: poor'] }
  if (windOnshore && spot.windSpeed >= 18) return { verdict: 'SKIP', reasons: [`blown out (${spot.windType} ${Math.round(spot.windSpeed)}kph)`] }

  if ((rating === 'FAIR' || rating === 'FAIR_TO_GOOD' || rating === 'GOOD' || rating === 'EPIC') && max >= 3 && !windOnshore) {
    reasons.push(`${min}-${max}ft ${rating.replace(/_/g, ' ').toLowerCase()}, ${spot.windType?.toLowerCase()}`)
    return { verdict: 'GO', reasons }
  }
  if (isReef && max >= 4 && spot.windSpeed < 18) {
    reasons.push(`${min}-${max}ft on the reef, ${spot.windType?.toLowerCase()}`)
    return { verdict: 'GO', reasons }
  }
  if (isReef && max >= 3 && rating === 'POOR_TO_FAIR' && windClean) {
    reasons.push(`${min}-${max}ft on the reef, wind clean`)
    return { verdict: 'MAYBE', reasons }
  }
  if ((rating === 'FAIR' || rating === 'POOR_TO_FAIR') && max >= 2 && isReef && windClean) {
    reasons.push(`small (${min}-${max}ft) but clean on the reef`)
    return { verdict: 'MAYBE', reasons }
  }
  return { verdict: 'SKIP', reasons: [`${min}-${max}ft ${rating.replace(/_/g, ' ').toLowerCase()}, not worth it`] }
}

const emoji = (v: Verdict) => (v === 'GO' ? '🟢' : v === 'MAYBE' ? '🟡' : '🔴')
const verdictLabel = (v: Verdict) => (v === 'GO' ? 'GO' : v === 'MAYBE' ? 'maybe' : 'skip')

function nextOpportunity(data: any): string | null {
  const wg = data?.windguru?.['64149']
  if (!wg?.waveHeight || !wg?.hours) return null
  const init = wg.initDate ? new Date(wg.initDate.replace(' ', 'T') + 'Z') : new Date()
  const currentMax = wg.waveHeight.slice(0, 4).reduce((a: number, b: number) => Math.max(a, b), 0)
  let bestPeakH = currentMax
  let bestIdx = -1
  for (let i = 6; i < wg.waveHeight.length && i < 72; i++) {
    if (wg.waveHeight[i] > bestPeakH + 0.3) { bestPeakH = wg.waveHeight[i]; bestIdx = i }
  }
  if (bestIdx === -1) return null
  const peakTime = new Date(init.getTime() + wg.hours[bestIdx] * 3600000)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const hr = peakTime.getHours()
  const tod = hr < 10 ? 'AM' : hr < 15 ? 'midday' : 'PM'
  const ft = Math.round((bestPeakH * 3.28) / 2)
  return `${days[peakTime.getDay()]} ${peakTime.getDate()} ${peakTime.toLocaleDateString('en-US', { month: 'short' })} ${tod}, ~${ft - 1}-${ft}ft ESE`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false, timeZone: 'America/Barbados' })
}
function formatTideShort(t: any): string {
  const d = new Date(t.time.replace(' ', 'T') + '-04:00')
  const hhmm = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Barbados' })
  return `${t.type === 'high' ? 'Hi' : 'Lo'} ${hhmm} (${t.height.toFixed(2)}m)`
}

async function fetchWithRetry(url: string, tries = 4): Promise<any> {
  let lastErr: any
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { cache: 'no-store' })
      if (res.ok) return await res.json()
      lastErr = new Error(`HTTP ${res.status}`)
    } catch (e) { lastErr = e }
    if (i < tries - 1) await new Promise((r) => setTimeout(r, [3000, 8000, 20000][i] || 20000))
  }
  throw new Error(`API unreachable after ${tries} attempts: ${lastErr?.message || lastErr}`)
}

export function buildSurfReport(data: any, kind: ReportKind): string {
  const all: Spot[] = [...(data.east || []), ...(data.south || []), ...(data.west || [])]
  if (!all.length) throw new Error('No spots returned')

  const scored = all.map((s) => ({ spot: s, ...scoreSpot(s) }))
  const goers = scored.filter((x) => x.verdict !== 'SKIP')

  const buoy = data.buoys?.['41044']
  const buoyLine = buoy && data.analysis?.buoySignal
    ? `Buoy 41044: ${buoy.swellHeight?.toFixed(1)}m @ ${buoy.swellPeriod?.toFixed(1)}s ${buoy.swellDir} (${data.analysis.buoySignal.signal})`
    : ''

  const eastExp = Math.round(data.east?.[0]?.swellExposure || 0)
  const southExp = Math.round(data.south?.[0]?.swellExposure || 0)
  const westExp = Math.round(data.west?.[0]?.swellExposure || 0)
  const expLine = `Swell reaching: East ${eastExp}% · South ${southExp}% · West ${westExp}%`

  const nowMs = Date.now()
  const upcomingTides = (data.tides || [])
    .map((t: any) => ({ ...t, ms: new Date(t.time.replace(' ', 'T') + '-04:00').getTime() }))
    .filter((t: any) => t.ms > nowMs)
    .slice(0, 2)
  const tideLine = upcomingTides.length ? `Tide: ${upcomingTides.map(formatTideShort).join(' · ')}` : ''

  const sun = data.sun || {}
  const sunLine = kind === 'afternoon'
    ? `Sunset ${sun.sunset ? formatTime(sun.sunset) : '?'}`
    : `Sunrise ${sun.sunrise ? formatTime(sun.sunrise) : '?'}`

  const dateStr = new Date()
    .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'America/Barbados' })
    .toUpperCase()

  const headerEmoji = kind === 'dawn' ? '🌅' : kind === 'afternoon' ? '🌊' : '🏄'
  const headerLabel = kind === 'dawn' ? 'DAWN PATROL' : kind === 'afternoon' ? 'AFTERNOON' : 'MORNING'

  const sources: string[] = Array.isArray(data.sources) ? data.sources : []
  const hasSurfline = sources.includes('surfline-lotus') || sources.includes('surfline-premium')
  const cacheStale = data.cache?.stale !== false
  const premiumLive = hasSurfline && !cacheStale
  const cacheAge = data.cache?.surflineAge || null
  const sourceLine = premiumLive
    ? null
    : `⚠️ <i>Premium models offline — running on GFS/buoy fallback${cacheAge ? ` (cache ${cacheAge})` : ''}. Sizes approximate.</i>`

  const lines: string[] = []
  lines.push(`${headerEmoji} <b>BARBADOS · ${dateStr} · ${headerLabel}</b>`)
  lines.push('')
  if (buoyLine) lines.push(buoyLine)
  lines.push(expLine)
  lines.push([sunLine, tideLine].filter(Boolean).join(' · '))
  if (sourceLine) lines.push(sourceLine)
  lines.push('')

  if (goers.length === 0) {
    lines.push('<i>Nothing worth paddling out for today.</i>')
    const next = nextOpportunity(data)
    if (next) { lines.push(''); lines.push(`Next bump: <b>${next}</b>`) }
    return lines.join('\n')
  }

  const sortedGoers = goers
    .sort((a, b) => {
      const order = { GO: 0, MAYBE: 1, SKIP: 2 }
      if (order[a.verdict] !== order[b.verdict]) return order[a.verdict] - order[b.verdict]
      const aVer = VERIFIED_SPOTS.has(a.spot.name) ? 0 : 1
      const bVer = VERIFIED_SPOTS.has(b.spot.name) ? 0 : 1
      if (aVer !== bVer) return aVer - bVer
      return pickSize(b.spot).max - pickSize(a.spot).max
    })
    .slice(0, 4)

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

  const confLow = scored.filter((x) => x.spot.confidence === 'low').length > scored.length / 2
  if (confLow) lines.push('<i>Low confidence — models disagree. Check the cam before heading out.</i>')
  lines.push('')
  lines.push('<a href="https://www.surfline.com/surf-report/soup-bowl/5842041f4e65fad6a7708b48">Surfline → Soup Bowl</a>')
  return lines.join('\n')
}

async function sendTelegram(text: string, dryRun: boolean): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || ''
  const chatId = process.env.TELEGRAM_CHAT_ID || ''
  if (dryRun || !botToken || !chatId) {
    console.log('[surf-report DRY_RUN]\n' + text)
    return
  }
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  })
  if (!res.ok) throw new Error(`Telegram send failed: ${res.status} ${await res.text()}`)
}

export async function sendSurfReport(opts: { kind?: ReportKind; dryRun?: boolean; conditionsUrl?: string } = {}) {
  const kind = opts.kind || 'morning'
  const conditionsUrl = opts.conditionsUrl || process.env.CONDITIONS_URL || 'https://bsa.surf/api/conditions'
  const data = await fetchWithRetry(conditionsUrl)
  const text = buildSurfReport(data, kind)
  await sendTelegram(text, opts.dryRun ?? false)
  return { kind, length: text.length }
}
