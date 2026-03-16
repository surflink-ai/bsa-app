'use client'

import { useState, useEffect } from 'react'
import { ScrollReveal } from '../components/ScrollReveal'
import { WaveDivider } from '../components/WaveDivider'

interface SpotData {
  spotId: string; name: string; conditions: string
  waveMin: number; waveMax: number; waveM?: number
  humanRelation?: string; swellHeight?: number; swellPeriod?: number; swellDir?: string
  windSpeed?: number; windGust?: number; windDir?: string; windType?: string
  temp?: number; coast: string
}
interface BuoyData { time: string; waveHeight: number | null; swellHeight: number | null; swellPeriod: number | null; swellDir: string | null; steepness: string | null }
interface BuoyMeta { id: string; name: string; desc: string }
interface TideData { time: string; height: number; type: string }
interface SunData { sunrise: string | null; sunset: string | null }

const conditionColors: Record<string, string> = {
  EPIC: '#8B5CF6', GOOD: '#22c55e', FAIR: '#22c55e', FAIR_TO_GOOD: '#22c55e',
  POOR_TO_FAIR: '#eab308', POOR: '#f97316', VERY_POOR: '#ef4444', FLAT: 'rgba(128,128,128,0.4)',
}
const conditionLabels: Record<string, string> = {
  EPIC: 'Epic', GOOD: 'Good', FAIR: 'Fair', FAIR_TO_GOOD: 'Fair-Good',
  POOR_TO_FAIR: 'Poor-Fair', POOR: 'Poor', VERY_POOR: 'Very Poor', FLAT: 'Flat',
}
const windTypeColors: Record<string, string> = {
  Offshore: '#22c55e', 'Cross-offshore': '#86efac', 'Cross-shore': '#eab308',
  'Cross-onshore': '#f97316', Onshore: '#ef4444',
}

const coastOrder = ['east', 'south', 'west']
const coastNames: Record<string, string> = { east: 'East Coast', south: 'South Coast', west: 'West Coast' }
const coastDescs: Record<string, string> = {
  east: 'Powerful reef breaks facing the open Atlantic. Most consistent swell, best for experienced surfers.',
  south: 'Point and reef breaks sheltered from trade winds. Works on S-SE swells, more accessible.',
  west: 'Sheltered Caribbean side. Rare NW swells light it up. Calm conditions most of the year.',
}

function SpotCard({ spot, dark }: { spot: SpotData; dark: boolean }) {
  const color = conditionColors[spot.conditions] || 'rgba(128,128,128,0.4)'
  const wColor = windTypeColors[spot.windType || ''] || 'rgba(128,128,128,0.5)'
  return (
    <div style={{
      background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(10,37,64,0.02)',
      border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(10,37,64,0.06)'}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 10, padding: '14px 18px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, color: dark ? '#fff' : '#0A2540', marginBottom: 4 }}>
            {spot.name}
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            padding: '2px 8px', borderRadius: 6,
            background: `${color}20`, color: color,
            textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600,
          }}>
            {conditionLabels[spot.conditions] || spot.conditions}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: dark ? '#fff' : '#0A2540', lineHeight: 1 }}>
            {spot.waveMin}–{spot.waveMax}
            <span style={{ fontSize: 11, fontWeight: 400, color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(10,37,64,0.3)' }}> ft</span>
          </div>
          {spot.humanRelation && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(10,37,64,0.35)', marginTop: 2 }}>
              {spot.humanRelation}
            </div>
          )}
        </div>
      </div>
      {/* Swell + Wind row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
        {spot.swellHeight != null && spot.swellHeight > 0 && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(10,37,64,0.4)' }}>
            🌊 {spot.swellHeight}m @ {spot.swellPeriod}s {spot.swellDir}
          </div>
        )}
        {spot.windSpeed != null && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: wColor, flexShrink: 0 }} />
            <span style={{ color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(10,37,64,0.4)' }}>
              💨 {spot.windSpeed}kph {spot.windDir} · {spot.windType}
              {spot.windGust ? ` (gusts ${spot.windGust})` : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function BuoyCard({ buoyId, buoy, meta, dark }: { buoyId: string; buoy: BuoyData | null; meta: BuoyMeta; dark: boolean }) {
  if (!buoy) return null
  return (
    <div style={{
      background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(10,37,64,0.02)',
      border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(10,37,64,0.06)'}`,
      borderRadius: 10, padding: '14px 18px',
    }}>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, color: dark ? '#fff' : '#0A2540', marginBottom: 2 }}>
        ⚓ NOAA Buoy {buoyId}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(10,37,64,0.3)', marginBottom: 8 }}>
        {meta.desc}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {buoy.waveHeight != null && (
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: dark ? '#fff' : '#0A2540' }}>{buoy.waveHeight}m</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(10,37,64,0.3)', textTransform: 'uppercase' }}>wave height</div>
          </div>
        )}
        {buoy.swellHeight != null && (
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: dark ? '#fff' : '#0A2540' }}>{buoy.swellHeight}m</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(10,37,64,0.3)', textTransform: 'uppercase' }}>swell</div>
          </div>
        )}
        {buoy.swellPeriod != null && (
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: '#2BA5A0' }}>{buoy.swellPeriod}s</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(10,37,64,0.3)', textTransform: 'uppercase' }}>period {buoy.swellDir || ''}</div>
          </div>
        )}
        {buoy.steepness && (
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600, color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(10,37,64,0.6)' }}>{buoy.steepness}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(10,37,64,0.3)', textTransform: 'uppercase' }}>steepness</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SurfReportClient() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  useEffect(() => {
    async function fetchConditions() {
      try {
        const res = await fetch('/api/conditions')
        if (!res.ok) return
        const json = await res.json()
        setData(json)
        setLastUpdate(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
      } catch {} finally { setLoading(false) }
    }
    fetchConditions()
    const interval = setInterval(fetchConditions, 900000)
    return () => clearInterval(interval)
  }, [])

  const allSpots = coastOrder.flatMap(c => (data[c] || []) as SpotData[])
  const bestSpot = allSpots.reduce((best, s) => {
    const score = (s.conditions === 'EPIC' ? 5 : s.conditions === 'GOOD' ? 4 : s.conditions === 'FAIR' ? 2.5 : s.conditions === 'POOR_TO_FAIR' ? 1.5 : 1) * s.waveMax
    const bestScore = (best?.conditions === 'EPIC' ? 5 : best?.conditions === 'GOOD' ? 4 : best?.conditions === 'FAIR' ? 2.5 : best?.conditions === 'POOR_TO_FAIR' ? 1.5 : 1) * (best?.waveMax || 0)
    return score > bestScore ? s : best
  }, null as SpotData | null)

  const buoys = data.buoys || {}
  const buoyMeta = (buoys.meta || []) as BuoyMeta[]
  const tides = (data.tides || []) as TideData[]
  const sun = data.sun as SunData | null
  const sources = data.sources || []

  return (
    <div className="pb-20 md:pb-0">
      {/* Hero */}
      <section style={{ backgroundColor: '#0A2540', padding: '120px 24px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: 16 }}>SURF REPORT</div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#fff', marginBottom: 8 }}>
              Barbados Conditions
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>
              {allSpots.length || 21} surf spots · {sources.length} data sources · updated every 15 min
            </p>
            {lastUpdate && (
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                Last updated: {lastUpdate}
              </p>
            )}

            {/* Best spot callout */}
            {bestSpot && !loading && (
              <div style={{
                marginTop: 32, padding: '20px 28px',
                background: 'rgba(43,165,160,0.08)', border: '1px solid rgba(43,165,160,0.2)',
                borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 16,
              }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: conditionColors[bestSpot.conditions] || '#2BA5A0' }} />
                <div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, color: '#fff' }}>
                    Best bet right now: {bestSpot.name}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    {bestSpot.waveMin}–{bestSpot.waveMax}ft · {bestSpot.humanRelation || ''} · {conditionLabels[bestSpot.conditions]} · {bestSpot.windType || ''} winds
                  </div>
                </div>
              </div>
            )}

            {/* Tides + Sun row */}
            {(tides.length > 0 || sun) && !loading && (
              <div style={{ display: 'flex', gap: 24, marginTop: 24, flexWrap: 'wrap' }}>
                {tides.map((t, i) => (
                  <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{t.type === 'high' ? '🔺' : '🔻'}</span>
                    <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{t.type === 'high' ? 'HIGH' : 'LOW'}</span>
                    {t.time.split(' ')[1] || t.time} · {t.height.toFixed(2)}m
                  </div>
                ))}
                {sun?.sunrise && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    🌅 {new Date(sun.sunrise).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    {sun.sunset && ` — 🌇 ${new Date(sun.sunset).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                  </div>
                )}
              </div>
            )}
          </ScrollReveal>
        </div>
      </section>

      {loading ? (
        <>
          <WaveDivider color="#FFFFFF" bg="#0A2540" />
          <section style={{ backgroundColor: '#FFFFFF', padding: '80px 24px', textAlign: 'center' }}>
            <p style={{ color: 'rgba(10,37,64,0.3)', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>Loading conditions...</p>
          </section>
        </>
      ) : (
        <>
          {/* Buoy Data — white section */}
          {(buoys["41044"] || buoys["41043"]) && (
            <>
              <WaveDivider color="#FFFFFF" bg="#0A2540" />
              <section style={{ backgroundColor: '#FFFFFF', padding: '48px 24px' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                  <ScrollReveal>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(10,37,64,0.3)', marginBottom: 8 }}>NOAA BUOY DATA — MEASURED READINGS</div>
                    <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: '#0A2540', marginBottom: 16 }}>
                      Atlantic Swell Source
                    </h2>
                    <p style={{ fontSize: 13, color: 'rgba(10,37,64,0.4)', marginBottom: 20, maxWidth: 600 }}>
                      Real-time measurements from NOAA ocean buoys upstream of Barbados. This swell is what&apos;s heading your way.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
                      {buoyMeta.map(m => (
                        <BuoyCard key={m.id} buoyId={m.id} buoy={buoys[m.id]} meta={m} dark={false} />
                      ))}
                    </div>
                  </ScrollReveal>
                </div>
              </section>
            </>
          )}

          {/* East Coast — navy */}
          <WaveDivider color="#0A2540" bg="#FFFFFF" />
          <section style={{ backgroundColor: '#0A2540', padding: '64px 24px' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
              <ScrollReveal>
                <CoastSection coast="east" spots={data.east || []} dark={true} />
              </ScrollReveal>
            </div>
          </section>

          {/* South Coast — white */}
          <WaveDivider color="#FFFFFF" bg="#0A2540" />
          <section style={{ backgroundColor: '#FFFFFF', padding: '64px 24px' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
              <ScrollReveal>
                <CoastSection coast="south" spots={data.south || []} dark={false} />
              </ScrollReveal>
            </div>
          </section>

          {/* West Coast — navy */}
          <WaveDivider color="#0A2540" bg="#FFFFFF" />
          <section style={{ backgroundColor: '#0A2540', padding: '64px 24px' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
              <ScrollReveal>
                <CoastSection coast="west" spots={data.west || []} dark={true} />
              </ScrollReveal>
            </div>
          </section>

          {/* Sources + Wind Legend */}
          <WaveDivider color="#FFFFFF" bg="#0A2540" />
          <section style={{ backgroundColor: '#FFFFFF', padding: '48px 24px' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 32 }}>
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(10,37,64,0.3)', letterSpacing: '0.1em', marginBottom: 12, textTransform: 'uppercase' }}>Condition Scale</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {['FLAT', 'POOR', 'POOR_TO_FAIR', 'FAIR', 'GOOD', 'EPIC'].map(c => (
                      <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: conditionColors[c] }} />
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(10,37,64,0.5)' }}>{conditionLabels[c]}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(10,37,64,0.3)', letterSpacing: '0.1em', marginBottom: 12, textTransform: 'uppercase' }}>Wind Direction</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {['Offshore', 'Cross-offshore', 'Cross-shore', 'Cross-onshore', 'Onshore'].map(w => (
                      <div key={w} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: windTypeColors[w] }} />
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(10,37,64,0.5)' }}>{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(10,37,64,0.3)', letterSpacing: '0.1em', marginBottom: 12, textTransform: 'uppercase' }}>Data Sources</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(10,37,64,0.4)', lineHeight: 1.8 }}>
                    Open-Meteo Marine · Open-Meteo Weather · NOAA Buoy 41044 · NOAA Buoy 41043 · NOAA Tides (St. Lucia TEC4777)
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function CoastSection({ coast, spots, dark }: { coast: string; spots: SpotData[]; dark: boolean }) {
  if (spots.length === 0) return null
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, color: dark ? '#fff' : '#0A2540', marginBottom: 4 }}>
            {coastNames[coast]}
          </h2>
          <p style={{ fontSize: 13, color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(10,37,64,0.4)', maxWidth: 600 }}>{coastDescs[coast]}</p>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: dark ? 'rgba(255,255,255,0.2)' : 'rgba(10,37,64,0.2)' }}>
          {spots.length} spots
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {spots.map(spot => <SpotCard key={spot.spotId} spot={spot} dark={dark} />)}
      </div>
    </div>
  )
}
