'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

// All 21 Barbados spots — coordinates placed at the actual breaking wave, in the water
const SPOTS = [
  // EAST COAST
  { id: '5842041f4e65fad6a7708b48', name: 'Soup Bowl', coast: 'East', lat: 13.2119, lon: -59.5215, type: 'reef', bestSwell: 'N-NE', bestSize: '4-10ft', offshoreWind: 'W-SW' },
  { id: '5842041f4e65fad6a7708c7e', name: 'Parlour', coast: 'East', lat: 13.2045, lon: -59.5180, type: 'point', bestSwell: 'N-NE', bestSize: '3-6ft', offshoreWind: 'W-SW' },
  { id: '640a28064519059fe096b71e', name: 'Crane Bay', coast: 'East', lat: 13.1028, lon: -59.4405, type: 'reef', bestSwell: 'E-NE', bestSize: '3-6ft', offshoreWind: 'W' },
  { id: '640a2802b6d769e2d74b3d07', name: 'Ragged Point', coast: 'East', lat: 13.1595, lon: -59.4248, type: 'reef', bestSwell: 'E-NE', bestSize: '3-8ft', offshoreWind: 'W' },
  { id: '640a280199dd447996fd3885', name: 'Conset Point', coast: 'East', lat: 13.1790, lon: -59.4425, type: 'reef', bestSwell: 'NE', bestSize: '3-6ft', offshoreWind: 'W' },
  { id: '640a27ffb6d769a0e34b3c63', name: 'Sand Bank', coast: 'East', lat: 13.1920, lon: -59.5075, type: 'beach', bestSwell: 'NE', bestSize: '3-6ft', offshoreWind: 'W-SW' },
  { id: '640a27fee92030d47097e32b', name: 'Tent Bay', coast: 'East', lat: 13.2095, lon: -59.5200, type: 'reef', bestSwell: 'N-NE', bestSize: '3-6ft', offshoreWind: 'W-SW' },
  { id: '5842041f4e65fad6a7708c7f', name: 'Cattle Wash', coast: 'East', lat: 13.2210, lon: -59.5230, type: 'beach', bestSwell: 'N-NE', bestSize: '2-5ft', offshoreWind: 'W-SW' },
  { id: '67f94aeca64db676f445bef3', name: 'Tabletop', coast: 'East', lat: 13.2305, lon: -59.5240, type: 'reef', bestSwell: 'N-NE', bestSize: '2-4ft', offshoreWind: 'W-SW' },
  // SOUTH COAST
  { id: '5842041f4e65fad6a7708c81', name: "Brandon's", coast: 'South', lat: 13.0730, lon: -59.6310, type: 'beach', bestSwell: 'S-SE', bestSize: '3-6ft', offshoreWind: 'N-NE' },
  { id: '584204204e65fad6a77099c0', name: 'Freights Bay', coast: 'South', lat: 13.0640, lon: -59.5500, type: 'reef', bestSwell: 'S-SW', bestSize: '3-8ft', offshoreWind: 'N-NE' },
  { id: '584204204e65fad6a77099c5', name: 'South Point', coast: 'South', lat: 13.0530, lon: -59.5300, type: 'point', bestSwell: 'S-SE', bestSize: '3-8ft', offshoreWind: 'N' },
  { id: '584204204e65fad6a77099c4', name: "Surfer's Point", coast: 'South', lat: 13.0585, lon: -59.5360, type: 'reef', bestSwell: 'S-SE', bestSize: '3-6ft', offshoreWind: 'N' },
  { id: '584204214e65fad6a7709cea', name: 'Hastings', coast: 'South', lat: 13.0715, lon: -59.6110, type: 'reef', bestSwell: 'S', bestSize: '2-4ft', offshoreWind: 'N' },
  { id: '640a27fc606c45138daaa78c', name: 'Silver Sands', coast: 'South', lat: 13.0465, lon: -59.5240, type: 'beach', bestSwell: 'S-SE', bestSize: '2-4ft', offshoreWind: 'N-NW' },
  { id: '640a2804b6d76970754b3d90', name: 'Long Beach', coast: 'South', lat: 13.0545, lon: -59.5130, type: 'beach', bestSwell: 'S-SE', bestSize: '2-5ft', offshoreWind: 'N' },
  // WEST COAST
  { id: '5842041f4e65fad6a7708c80', name: 'Duppies', coast: 'West', lat: 13.2510, lon: -59.6430, type: 'reef', bestSwell: 'N-NW', bestSize: '2-4ft', offshoreWind: 'E' },
  { id: '584204204e65fad6a77099c8', name: 'Maycocks', coast: 'West', lat: 13.2810, lon: -59.6530, type: 'beach', bestSwell: 'N-NW', bestSize: '2-5ft', offshoreWind: 'E' },
  { id: '584204204e65fad6a77099c3', name: 'Tropicana', coast: 'West', lat: 13.1910, lon: -59.6430, type: 'beach', bestSwell: 'NW', bestSize: '2-4ft', offshoreWind: 'E' },
  { id: '640a27f94519050e0a96b45a', name: 'Sandy Lane', coast: 'West', lat: 13.1710, lon: -59.6410, type: 'beach', bestSwell: 'NW', bestSize: '2-4ft', offshoreWind: 'E' },
  { id: '640a27fb451905b3a196b4bb', name: 'Batts Rock', coast: 'West', lat: 13.1310, lon: -59.6380, type: 'reef', bestSwell: 'NW-N', bestSize: '2-4ft', offshoreWind: 'E-SE' },
]

interface SpotCondition {
  spotId: string
  name: string
  conditions: string
  waveMin: number
  waveMax: number
  coast: string
}

const conditionColors: Record<string, string> = {
  EPIC: '#8B5CF6', GOOD: '#22c55e', FAIR: '#4ade80', FAIR_TO_GOOD: '#22c55e',
  POOR_TO_FAIR: '#eab308', POOR: '#f97316', VERY_POOR: '#ef4444', FLAT: '#64748B',
}
const conditionLabels: Record<string, string> = {
  EPIC: 'Epic', GOOD: 'Good', FAIR: 'Fair', FAIR_TO_GOOD: 'Fair-Good',
  POOR_TO_FAIR: 'Poor-Fair', POOR: 'Poor', VERY_POOR: 'Very Poor', FLAT: 'Flat',
}
const conditionScore: Record<string, number> = {
  EPIC: 6, GOOD: 5, FAIR_TO_GOOD: 4, FAIR: 3, POOR_TO_FAIR: 2, POOR: 1, VERY_POOR: 0, FLAT: -1,
}

const coastViews: Record<string, { center: [number, number]; zoom: number; bearing: number; pitch: number }> = {
  all: { center: [-59.55, 13.16], zoom: 10.8, bearing: 0, pitch: 0 },
  East: { center: [-59.49, 13.19], zoom: 12, bearing: 0, pitch: 0 },
  South: { center: [-59.56, 13.06], zoom: 12.5, bearing: 0, pitch: 0 },
  West: { center: [-59.64, 13.21], zoom: 11.8, bearing: 0, pitch: 0 },
}

type CoastFilter = 'all' | 'East' | 'South' | 'West'

export default function SurfMapClient() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [conditions, setConditions] = useState<Record<string, SpotCondition>>({})
  const [activeCoast, setActiveCoast] = useState<CoastFilter>('all')
  const [selectedSpot, setSelectedSpot] = useState<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [lastUpdate, setLastUpdate] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editedCoords, setEditedCoords] = useState<Record<string, { lat: number; lon: number }>>({})
  const editedCoordsRef = useRef<Record<string, { lat: number; lon: number }>>({})
  const [showExport, setShowExport] = useState(false)

  // Fetch conditions
  useEffect(() => {
    async function fetchConditions() {
      try {
        const res = await fetch('/api/conditions')
        if (!res.ok) return
        const json = await res.json()
        const map: Record<string, SpotCondition> = {}
        for (const coast of ['east', 'south', 'west']) {
          for (const spot of json[coast] || []) {
            map[spot.spotId] = spot
          }
        }
        setConditions(map)
        setLastUpdate(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
      } catch {}
    }
    fetchConditions()
    const interval = setInterval(fetchConditions, 900000)
    return () => clearInterval(interval)
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const script = document.createElement('script')
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js'
    script.onload = () => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css'
      document.head.appendChild(link)

      const mapboxgl = (window as any).mapboxgl
      mapboxgl.accessToken = MAPBOX_TOKEN

      const map = new mapboxgl.Map({
        container: mapRef.current!,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [-59.55, 13.16],
        zoom: 10.8,
        pitch: 0,
        bearing: 0,
        antialias: true,
        maxBounds: [[-59.9, 12.9], [-59.3, 13.45]],
      })

      map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right')

      map.on('style.load', () => {
        setMapLoaded(true)
      })

      mapInstance.current = map
    }
    document.head.appendChild(script)

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [])

  // Update markers when conditions or edit mode change
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return
    const mapboxgl = (window as any).mapboxgl
    const map = mapInstance.current

    // Clear existing markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    SPOTS.forEach(spot => {
      const cond = conditions[spot.id]
      const condKey = cond?.conditions || 'FLAT'
      const color = conditionColors[condKey] || '#64748B'
      const waveMax = cond?.waveMax || 0
      const score = conditionScore[condKey] || 0
      const isGood = score >= 4
      const size = editMode ? 20 : 16

      // Use edited coordinates if available
      const coords = editedCoordsRef.current[spot.id] || { lat: spot.lat, lon: spot.lon }

      // Create marker element
      const el = document.createElement('div')
      el.style.cssText = `
        width: ${size}px; height: ${size}px;
        background: ${editMode ? '#FF3B30' : color};
        border: 2px solid ${editMode ? '#fff' : 'rgba(255,255,255,0.9)'};
        border-radius: 50%;
        cursor: ${editMode ? 'grab' : 'pointer'};
        box-shadow: 0 2px 8px rgba(0,0,0,0.4)${isGood && !editMode ? `, 0 0 12px ${color}` : ''};
        pointer-events: auto;
        ${editMode ? 'z-index: 100;' : ''}
      `

      // Add label in edit mode
      if (editMode) {
        const label = document.createElement('div')
        label.style.cssText = `
          position: absolute; top: -28px; left: 50%; transform: translateX(-50%);
          background: rgba(0,0,0,0.85); color: #fff; padding: 2px 8px; border-radius: 4px;
          font-size: 10px; font-family: 'JetBrains Mono', monospace; white-space: nowrap;
          pointer-events: none;
        `
        label.textContent = spot.name
        el.style.position = 'relative'
        el.appendChild(label)
      }

      // Popup content
      const popupHTML = `
        <div style="font-family: 'Space Grotesk', system-ui, sans-serif; min-width: 220px; padding: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div>
              <div style="font-size: 16px; font-weight: 700; color: #0A2540;">${spot.name}</div>
              <div style="font-size: 11px; color: #64748B; margin-top: 2px;">${spot.coast} Coast &middot; ${spot.type}</div>
            </div>
            <div style="background: ${color}; color: #fff; font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 6; letter-spacing: 0.04em; text-transform: uppercase;">
              ${conditionLabels[condKey] || condKey}
            </div>
          </div>
          ${cond ? `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
              <div style="background: #F8FAFC; border-radius: 8px; padding: 8px 10px;">
                <div style="font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 700; color: #0A2540;">${cond.waveMin}-${cond.waveMax}</div>
                <div style="font-size: 10px; color: #94A3B8;">ft wave height</div>
              </div>
              <div style="background: #F8FAFC; border-radius: 8px; padding: 8px 10px;">
                <div style="font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600; color: #0A2540;">
                  ${spot.bestSwell}
                </div>
                <div style="font-size: 10px; color: #94A3B8;">best swell dir</div>
              </div>
            </div>
          ` : '<div style="font-size: 12px; color: #94A3B8; margin-bottom: 8px;">No live data</div>'}
          <div style="display: flex; gap: 12px; font-size: 11px; color: #64748B; border-top: 1px solid #F1F5F9; padding-top: 8px;">
            <span>Size: ${spot.bestSize}</span>
            <span>Offshore: ${spot.offshoreWind}</span>
          </div>
        </div>
      `

      const popup = new mapboxgl.Popup({
        offset: [0, -(size / 2 + 4)],
        closeButton: true,
        maxWidth: '280px',
      }).setHTML(popupHTML)

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center', draggable: editMode })
        .setLngLat([coords.lon, coords.lat])
        .setPopup(editMode ? undefined : popup)
        .addTo(map)

      if (editMode) {
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat()
          const newCoord = { lat: Math.round(lngLat.lat * 10000) / 10000, lon: Math.round(lngLat.lng * 10000) / 10000 }
          editedCoordsRef.current = { ...editedCoordsRef.current, [spot.id]: newCoord }
          setEditedCoords(prev => ({ ...prev, [spot.id]: newCoord }))
        })
      } else {
        el.addEventListener('click', () => {
          setSelectedSpot(spot.id)
          map.flyTo({
            center: [coords.lon, coords.lat],
            zoom: 14,
            pitch: 55,
            bearing: map.getBearing(),
            duration: 1500,
            essential: true,
          })
        })
      }

      markersRef.current.push(marker)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, conditions, editMode])

  // Coast filter → fly camera
  const flyToCoast = useCallback((coast: CoastFilter) => {
    setActiveCoast(coast)
    setSelectedSpot(null)
    if (!mapInstance.current) return
    const view = coastViews[coast]
    mapInstance.current.flyTo({
      center: view.center,
      zoom: view.zoom,
      bearing: view.bearing,
      pitch: view.pitch,
      duration: 2000,
      essential: true,
    })
  }, [])

  // Filtered spots for list
  const filteredSpots = SPOTS.filter(s => activeCoast === 'all' || s.coast === activeCoast)
    .map(s => ({ ...s, cond: conditions[s.id] }))
    .sort((a, b) => {
      const scoreA = conditionScore[a.cond?.conditions || 'FLAT'] || 0
      const scoreB = conditionScore[b.cond?.conditions || 'FLAT'] || 0
      return scoreB - scoreA || (b.cond?.waveMax || 0) - (a.cond?.waveMax || 0)
    })

  const bestSpot = filteredSpots[0]

  return (
    <div className="pb-20 md:pb-0" style={{ minHeight: '100vh', background: '#0A2540' }}>
      {/* Inject pulse animation */}
      <style>{`
        .mapboxgl-popup-content { border-radius: 12px !important; padding: 16px !important; box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important; }
        .mapboxgl-popup-close-button { font-size: 18px; padding: 4px 8px; color: #94A3B8; }
        .mapboxgl-ctrl-group { border-radius: 10px !important; box-shadow: 0 2px 12px rgba(0,0,0,0.3) !important; }
        .mapboxgl-canvas { cursor: grab; }
        .mapboxgl-canvas:active { cursor: grabbing; }
      `}</style>

      {/* Header bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: 'rgba(10,37,64,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto', padding: '0 24px',
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <img src="https://liveheats.com/images/dbb2a21b-7566-4629-8ea5-4c08a0b2877b.webp" alt="BSA" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: '#fff' }}>BSA</span>
            </Link>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2BA5A0', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Surf Report</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {lastUpdate && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                Updated {lastUpdate}
              </span>
            )}
            <button
              onClick={() => { setEditMode(!editMode); setShowExport(false) }}
              style={{
                padding: '6px 14px', border: 'none', borderRadius: 6, cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600,
                background: editMode ? '#FF3B30' : 'rgba(255,255,255,0.08)',
                color: editMode ? '#fff' : 'rgba(255,255,255,0.5)',
                letterSpacing: '0.06em',
              }}
            >
              {editMode ? 'EXIT EDIT' : 'EDIT SPOTS'}
            </button>
          </div>
        </div>
      </div>

      {/* Edit mode banner */}
      {editMode && (
        <div style={{
          background: '#FF3B30', padding: '10px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: '#fff' }}>
            Edit Mode — Drag markers to the exact break location. {Object.keys(editedCoords).length} spot{Object.keys(editedCoords).length !== 1 ? 's' : ''} moved.
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowExport(!showExport)}
              disabled={Object.keys(editedCoords).length === 0}
              style={{
                padding: '6px 14px', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 6,
                cursor: Object.keys(editedCoords).length > 0 ? 'pointer' : 'default',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600,
                background: 'rgba(255,255,255,0.15)', color: '#fff',
                opacity: Object.keys(editedCoords).length > 0 ? 1 : 0.4,
              }}
            >
              {showExport ? 'HIDE' : 'SHOW'} COORDINATES
            </button>
            <button
              onClick={() => { editedCoordsRef.current = {}; setEditedCoords({}); setEditMode(false); setShowExport(false) }}
              style={{
                padding: '6px 14px', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 6,
                cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                fontWeight: 600, background: 'rgba(255,255,255,0.15)', color: '#fff',
              }}
            >
              RESET ALL
            </button>
          </div>
        </div>
      )}

      {/* Export panel */}
      {showExport && Object.keys(editedCoords).length > 0 && (
        <div style={{
          background: '#1a1a1a', padding: '16px 24px', maxHeight: 300, overflow: 'auto',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#2BA5A0' }}>Updated coordinates — copy and send to Aimi</span>
            <button
              onClick={() => {
                const text = SPOTS.map(s => {
                  const c = editedCoords[s.id]
                  if (!c) return null
                  return `${s.name}: lat ${c.lat}, lon ${c.lon}`
                }).filter(Boolean).join('\n')
                navigator.clipboard.writeText(text)
              }}
              style={{
                padding: '4px 12px', border: '1px solid #2BA5A0', borderRadius: 4,
                cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                background: 'transparent', color: '#2BA5A0',
              }}
            >
              COPY ALL
            </button>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#ccc', lineHeight: 1.8 }}>
            {SPOTS.map(s => {
              const c = editedCoords[s.id]
              if (!c) return null
              return (
                <div key={s.id}>
                  <span style={{ color: '#F59E0B' }}>{s.name}</span>: lat <span style={{ color: '#2BA5A0' }}>{c.lat}</span>, lon <span style={{ color: '#2BA5A0' }}>{c.lon}</span>
                  <span style={{ color: '#666', marginLeft: 8 }}>(was {s.lat}, {s.lon})</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Map container */}
      <div style={{ position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '70vh', minHeight: 500 }} />

        {/* Coast filter pills — floating over map */}
        <div style={{
          position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 6, zIndex: 10,
          background: 'rgba(10,37,64,0.8)', backdropFilter: 'blur(12px)',
          borderRadius: 12, padding: 4, border: '1px solid rgba(255,255,255,0.1)',
        }}>
          {(['all', 'East', 'South', 'West'] as CoastFilter[]).map(coast => (
            <button key={coast} onClick={() => flyToCoast(coast)} style={{
              padding: '8px 18px', border: 'none', borderRadius: 8, cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600,
              background: activeCoast === coast ? '#2BA5A0' : 'transparent',
              color: activeCoast === coast ? '#fff' : 'rgba(255,255,255,0.5)',
              transition: 'all 0.2s',
            }}>
              {coast === 'all' ? 'All Spots' : `${coast} Coast`}
            </button>
          ))}
        </div>

        {/* Best spot callout — bottom left of map */}
        {bestSpot?.cond && (
          <div style={{
            position: 'absolute', bottom: 24, left: 24, zIndex: 10,
            background: 'rgba(10,37,64,0.85)', backdropFilter: 'blur(12px)',
            borderRadius: 12, padding: '14px 20px',
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
          }} onClick={() => {
            setSelectedSpot(bestSpot.id)
            mapInstance.current?.flyTo({
              center: [bestSpot.lon, bestSpot.lat], zoom: 14, pitch: 55, duration: 1500,
            })
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: conditionColors[bestSpot.cond.conditions] || '#64748B' }} />
              <div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: '#fff' }}>
                  Best right now: {bestSpot.name}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                  {bestSpot.cond.waveMin}-{bestSpot.cond.waveMax}ft &middot; {conditionLabels[bestSpot.cond.conditions]}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legend — bottom right of map */}
        <div style={{
          position: 'absolute', bottom: 24, right: 24, zIndex: 10,
          background: 'rgba(10,37,64,0.85)', backdropFilter: 'blur(12px)',
          borderRadius: 10, padding: '10px 14px',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {['FLAT', 'POOR', 'POOR_TO_FAIR', 'FAIR', 'GOOD', 'EPIC'].map(c => (
              <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: conditionColors[c] }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>{conditionLabels[c]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spot list below map */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2BA5A0', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
              {activeCoast === 'all' ? 'ALL SPOTS' : `${activeCoast.toUpperCase()} COAST`}
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: '#fff' }}>
              {filteredSpots.length} Surf Spots
            </div>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
            Sorted by conditions
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {filteredSpots.map(spot => {
            const condKey = spot.cond?.conditions || 'FLAT'
            const color = conditionColors[condKey] || '#64748B'
            const isSelected = selectedSpot === spot.id
            return (
              <div
                key={spot.id}
                onClick={() => {
                  setSelectedSpot(spot.id)
                  mapInstance.current?.flyTo({
                    center: [spot.lon, spot.lat], zoom: 14, pitch: 55, duration: 1500,
                  })
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                style={{
                  background: isSelected ? 'rgba(43,165,160,0.08)' : 'rgba(255,255,255,0.03)',
                  border: isSelected ? '1px solid rgba(43,165,160,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  borderLeft: `3px solid ${color}`,
                  borderRadius: 10, padding: '16px 20px',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, color: '#fff' }}>
                      {spot.name}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                      {spot.coast} Coast &middot; {spot.type}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600,
                    padding: '3px 8px', borderRadius: 6,
                    background: `${color}20`, color: color,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    {conditionLabels[condKey]}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: '#fff' }}>
                        {spot.cond ? `${spot.cond.waveMin}-${spot.cond.waveMax}` : '--'}
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>ft</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                      {spot.bestSize}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>
                      offshore: {spot.offshoreWind}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>
            Data: Surfline &middot; Updated every 15 minutes
          </span>
        </div>
      </section>
    </div>
  )
}
