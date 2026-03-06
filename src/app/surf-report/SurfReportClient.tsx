'use client'

import { useState, useEffect } from 'react'
import { ScrollReveal } from '../components/ScrollReveal'
import { WaveDivider } from '../components/WaveDivider'

interface SpotData {
  spotId: string
  name: string
  conditions: string
  waveMin: number
  waveMax: number
  coast: string
}

const conditionColors: Record<string, string> = {
  EPIC: '#8B5CF6', GOOD: '#22c55e', FAIR: '#22c55e', FAIR_TO_GOOD: '#22c55e',
  POOR_TO_FAIR: '#eab308', POOR: '#f97316', VERY_POOR: '#ef4444', FLAT: 'rgba(128,128,128,0.4)',
}
const conditionLabels: Record<string, string> = {
  EPIC: 'Epic', GOOD: 'Good', FAIR: 'Fair', FAIR_TO_GOOD: 'Fair-Good',
  POOR_TO_FAIR: 'Poor-Fair', POOR: 'Poor', VERY_POOR: 'Very Poor', FLAT: 'Flat',
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
  return (
    <div style={{
      background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(10,37,64,0.02)',
      border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(10,37,64,0.06)'}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 10, padding: '16px 20px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
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
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: dark ? '#fff' : '#0A2540' }}>
          {spot.waveMin}–{spot.waveMax}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(10,37,64,0.3)' }}>ft</div>
      </div>
    </div>
  )
}

export default function SurfReportClient() {
  const [data, setData] = useState<Record<string, SpotData[]>>({})
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

  const allSpots = coastOrder.flatMap(c => data[c] || [])
  const totalSpots = allSpots.length
  const bestSpot = allSpots.reduce((best, s) => {
    const score = (s.conditions === 'EPIC' ? 5 : s.conditions === 'GOOD' ? 4 : s.conditions === 'FAIR_TO_GOOD' ? 3 : s.conditions === 'FAIR' ? 2.5 : s.conditions === 'POOR_TO_FAIR' ? 1.5 : 1) * s.waveMax
    const bestScore = (best?.conditions === 'EPIC' ? 5 : best?.conditions === 'GOOD' ? 4 : best?.conditions === 'FAIR_TO_GOOD' ? 3 : best?.conditions === 'FAIR' ? 2.5 : best?.conditions === 'POOR_TO_FAIR' ? 1.5 : 1) * (best?.waveMax || 0)
    return score > bestScore ? s : best
  }, null as SpotData | null)

  // Alternating: east = white, south = navy, west = white
  const coastTheme = { east: false, south: true, west: false } as Record<string, boolean> // false = white, true = dark

  return (
    <div className="pb-20 md:pb-0">
      {/* Hero — navy */}
      <section style={{ backgroundColor: '#0A2540', padding: '120px 24px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2BA5A0', marginBottom: 16 }}>SURF REPORT</div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#fff', marginBottom: 8 }}>
              Barbados Conditions
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>
              All {totalSpots || 21} surf spots across the island, updated every 15 minutes.
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
                    {bestSpot.waveMin}–{bestSpot.waveMax}ft &middot; {conditionLabels[bestSpot.conditions] || bestSpot.conditions} &middot; {bestSpot.coast}
                  </div>
                </div>
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
          {/* East Coast — white */}
          <WaveDivider color="#FFFFFF" bg="#0A2540" />
          <section style={{ backgroundColor: '#FFFFFF', padding: '64px 24px' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
              <ScrollReveal>
                <CoastSection coast="east" spots={data.east || []} dark={false} />
              </ScrollReveal>
            </div>
          </section>

          {/* South Coast — navy */}
          <WaveDivider color="#0A2540" bg="#FFFFFF" />
          <section style={{ backgroundColor: '#0A2540', padding: '64px 24px' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
              <ScrollReveal>
                <CoastSection coast="south" spots={data.south || []} dark={true} />
              </ScrollReveal>
            </div>
          </section>

          {/* West Coast — white */}
          <WaveDivider color="#FFFFFF" bg="#0A2540" />
          <section style={{ backgroundColor: '#FFFFFF', padding: '64px 24px' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
              <ScrollReveal>
                <CoastSection coast="west" spots={data.west || []} dark={false} />
              </ScrollReveal>
            </div>
          </section>

          {/* Legend — navy */}
          <WaveDivider color="#0A2540" bg="#FFFFFF" />
          <section style={{ backgroundColor: '#0A2540', padding: '48px 24px' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', marginBottom: 12, textTransform: 'uppercase' }}>Condition Scale</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {['FLAT', 'POOR', 'POOR_TO_FAIR', 'FAIR', 'FAIR_TO_GOOD', 'GOOD', 'EPIC'].map(c => (
                  <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: conditionColors[c] }} />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{conditionLabels[c]}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.15)', marginTop: 16 }}>
                Conditions are computer-modeled forecasts, not live observations
              </p>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {spots.map(spot => <SpotCard key={spot.spotId} spot={spot} dark={dark} />)}
      </div>
    </div>
  )
}
