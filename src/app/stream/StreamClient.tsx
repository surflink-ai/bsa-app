'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
import Link from 'next/link'

interface StreamStatus {
  live: boolean
  hlsUrl: string
  currentVideo: string | null
}

interface StreamConfig {
  active: boolean
  title: string | null
  event_id: string | null
}

interface HeatScore {
  athleteName: string
  athleteImage: string | null
  scores: number[]
  total: number
  position: number
  needsScore: number
  priority: boolean
}

interface HeatData {
  heatName: string
  divisionName: string
  roundName: string
  status: string
  scores: HeatScore[]
  nextHeat: string | null
}

interface VODVideo {
  uid: string
  thumbnail: string
  title: string
  duration: number
  hlsUrl: string
}

interface AdminVideo {
  id: string
  title: string
  url: string
  source: string
  thumbnail_url: string | null
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m?.[1] || null
}

export function StreamClient({ initialStatus, streamConfig, vodVideos = [] }: {
  initialStatus: StreamStatus
  streamConfig: StreamConfig
  vodVideos?: AdminVideo[]
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [status, setStatus] = useState(initialStatus)
  const [heat, setHeat] = useState<HeatData | null>(null)
  const [videos, setVideos] = useState<VODVideo[]>([])
  const [currentVod, setCurrentVod] = useState<string | null>(null)
  const [currentYouTube, setCurrentYouTube] = useState<string | null>(null)
  const [showOverlay, setShowOverlay] = useState(true)
  const [playerError, setPlayerError] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Poll stream status every 8 seconds
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/stream/status')
        const data = await res.json()
        setStatus(data)
      } catch {}
    }
    const interval = setInterval(poll, 8000)
    return () => clearInterval(interval)
  }, [])

  // Poll LiveHeats scores every 10 seconds when live + event configured
  useEffect(() => {
    if (!status.live || !streamConfig.event_id) return
    const poll = async () => {
      try {
        const res = await fetch(`/api/event/${streamConfig.event_id}`)
        const event = await res.json()
        if (event?.eventDivisions) {
          // Find active heat
          for (const div of event.eventDivisions) {
            for (const round of div.rounds || []) {
              for (const h of round.heats || []) {
                if (h.status === 'active' || h.status === 'in_progress') {
                  const scores: HeatScore[] = (h.athletes || []).map((a: Record<string, unknown>, i: number) => {
                    const waveScores = ((a.waves || []) as Record<string, number>[]).map(w => w.score).filter(Boolean).sort((x, y) => y - x)
                    const best2 = waveScores.slice(0, 2)
                    return {
                      athleteName: (a.athlete as Record<string, string>)?.name || `Athlete ${i + 1}`,
                      athleteImage: (a.athlete as Record<string, string>)?.image || null,
                      scores: best2,
                      total: best2.reduce((s, v) => s + v, 0),
                      position: i + 1,
                      needsScore: Math.max(0, 2 - best2.length),
                      priority: !!(a.priority),
                    }
                  }).sort((a: HeatScore, b: HeatScore) => b.total - a.total)
                  scores.forEach((s, i) => { s.position = i + 1 })

                  setHeat({
                    heatName: h.name || `Heat ${h.position || ''}`,
                    divisionName: div.division?.name || '',
                    roundName: round.name || '',
                    status: h.status,
                    scores,
                    nextHeat: null,
                  })
                  return
                }
              }
            }
          }
        }
      } catch {}
    }
    poll()
    const interval = setInterval(poll, 10000)
    return () => clearInterval(interval)
  }, [status.live, streamConfig.event_id])

  // Load VOD library
  useEffect(() => {
    if (status.live) return
    fetch('/api/stream/videos').then(r => r.json()).then(d => setVideos(d.videos || [])).catch(() => {})
  }, [status.live])

  // HLS player setup
  const loadHls = useCallback((url: string) => {
    const video = videoRef.current
    if (!video || !url) return

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    setPlayerError(false)

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url
      video.play().catch(() => {})
    } else if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 30 })
      hls.loadSource(url)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}) })
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) { setPlayerError(true); hls.destroy() }
      })
      hlsRef.current = hls
    }
  }, [])

  // Auto-load stream when live, or VOD when selected
  useEffect(() => {
    if (status.live && status.hlsUrl) loadHls(status.hlsUrl)
    else if (currentVod) loadHls(currentVod)
  }, [status.live, status.hlsUrl, currentVod, loadHls])

  // Clean up on unmount
  useEffect(() => { return () => { hlsRef.current?.destroy() } }, [])

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A2540', color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="https://liveheats.com/images/dbb2a21b-7566-4629-8ea5-4c08a0b2877b.webp" alt="BSA" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: '0.05em' }}>BSA</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {status.live && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: '#DC2626', display: 'inline-block',
                animation: 'pulse 1.5s ease-in-out infinite',
                boxShadow: '0 0 0 3px rgba(220,38,38,0.2)',
              }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#DC2626', textTransform: 'uppercase' }}>Live</span>
            </div>
          )}
          <Link href="/" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            bsa.surf
          </Link>
        </div>
      </div>

      {/* Event title bar */}
      {streamConfig.title && status.live && (
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 12px' }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: '#fff' }}>
            {streamConfig.title}
          </div>
          {heat && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginTop: 4 }}>
              {heat.divisionName} — {heat.roundName} — {heat.heatName}
            </div>
          )}
        </div>
      )}

      {/* Player Area */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ position: 'relative', background: '#000', borderRadius: 8, overflow: 'hidden', aspectRatio: '16/9' }}>
          <video
            ref={videoRef}
            style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
            controls
            playsInline
            muted={false}
          />

          {/* Score overlay on video */}
          {status.live && heat && showOverlay && heat.scores.length > 0 && (
            <div style={{
              position: 'absolute', bottom: 60, left: 0, right: 0,
              background: 'linear-gradient(transparent, rgba(10,37,64,0.9))',
              padding: '24px 20px 12px',
              display: 'flex', justifyContent: 'center', gap: 4,
              pointerEvents: 'none',
            }}>
              {heat.scores.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: i === 0 ? 'rgba(43,165,160,0.25)' : 'rgba(255,255,255,0.08)',
                  borderRadius: 6, padding: '6px 14px',
                  border: i === 0 ? '1px solid rgba(43,165,160,0.4)' : '1px solid rgba(255,255,255,0.06)',
                  minWidth: 160,
                }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: i === 0 ? '#2BA5A0' : 'rgba(255,255,255,0.5)', width: 16 }}>
                    {s.position}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.athleteName}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: i === 0 ? '#2BA5A0' : '#fff' }}>
                    {s.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* YouTube embed overlay */}
          {!status.live && currentYouTube && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
              <iframe
                src={`https://www.youtube.com/embed/${currentYouTube}?autoplay=1&rel=0&modestbranding=1`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* Offline state */}
          {!status.live && !currentVod && !currentYouTube && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', background: 'rgba(10,37,64,0.95)',
            }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 8 }}>BSA</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 24 }}>
                Stream Offline
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', maxWidth: 340, textAlign: 'center', lineHeight: 1.6 }}>
                No live broadcast right now. Check back during events or watch replays below.
              </div>
            </div>
          )}

          {/* Error state */}
          {playerError && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(10,37,64,0.95)',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>Stream unavailable</div>
                <button onClick={() => { setPlayerError(false); if (status.hlsUrl) loadHls(status.hlsUrl) }}
                  style={{ fontSize: 13, fontWeight: 600, color: '#2BA5A0', background: 'none', border: '1px solid rgba(43,165,160,0.3)', borderRadius: 6, padding: '8px 20px', cursor: 'pointer' }}>
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Overlay toggle */}
          {status.live && heat && (
            <button onClick={() => setShowOverlay(!showOverlay)} style={{
              position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', border: 'none',
              borderRadius: 4, padding: '6px 10px', cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.6)',
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              Scores {showOverlay ? 'On' : 'Off'}
            </button>
          )}
        </div>
      </div>

      {/* Score Panel (below player, when live) */}
      {status.live && heat && heat.scores.length > 0 && (
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 24px 0' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            {/* Heat header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600 }}>{heat.heatName}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', marginLeft: 12 }}>
                  {heat.divisionName} — {heat.roundName}
                </span>
              </div>
              {heat.nextHeat && (
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em' }}>
                  Next: {heat.nextHeat}
                </span>
              )}
            </div>

            {/* Athletes */}
            {heat.scores.map((s, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '32px 1fr 200px 80px',
                alignItems: 'center', padding: '12px 20px',
                borderBottom: i < heat.scores.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                background: i === 0 ? 'rgba(43,165,160,0.06)' : 'transparent',
              }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: i === 0 ? '#2BA5A0' : 'rgba(255,255,255,0.3)' }}>
                  {s.position}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {s.athleteImage && (
                    <img src={s.athleteImage} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                  )}
                  <span style={{ fontSize: 14, fontWeight: i === 0 ? 600 : 400 }}>{s.athleteName}</span>
                  {s.priority && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: '0.1em', color: '#D97706', textTransform: 'uppercase', background: 'rgba(217,119,6,0.15)', padding: '2px 6px', borderRadius: 3 }}>P</span>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {s.scores.map((sc, j) => (
                    <span key={j} style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                      color: j === 0 ? '#fff' : 'rgba(255,255,255,0.5)',
                      background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '3px 10px',
                    }}>
                      {sc.toFixed(2)}
                    </span>
                  ))}
                  {Array.from({ length: s.needsScore }).map((_, j) => (
                    <span key={`need-${j}`} style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                      color: 'rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)',
                      borderRadius: 4, padding: '3px 10px',
                    }}>—</span>
                  ))}
                </div>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700,
                  color: i === 0 ? '#2BA5A0' : '#fff', textAlign: 'right',
                }}>
                  {s.total.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Library (when not live) */}
      {!status.live && (vodVideos.length > 0 || videos.length > 0) && (
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px 0' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 16 }}>
            Videos
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {/* Admin-added videos (YouTube + CF) */}
            {vodVideos.map(v => {
              const ytId = extractYouTubeId(v.url)
              const thumb = v.thumbnail_url || (ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null)
              const isSelected = ytId ? currentYouTube === ytId : currentVod === v.url
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    if (ytId) { setCurrentYouTube(ytId); setCurrentVod(null) }
                    else { setCurrentVod(v.url); setCurrentYouTube(null) }
                  }}
                  style={{
                    background: isSelected ? 'rgba(43,165,160,0.1)' : 'rgba(255,255,255,0.03)',
                    border: isSelected ? '1px solid rgba(43,165,160,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8, overflow: 'hidden', cursor: 'pointer', textAlign: 'left',
                    padding: 0, transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{ aspectRatio: '16/9', background: '#111', overflow: 'hidden', position: 'relative' }}>
                    {thumb && <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} onError={e => (e.currentTarget.style.display = 'none')} />}
                    {ytId && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(220,38,38,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 0, height: 0, borderLeft: '16px solid #fff', borderTop: '10px solid transparent', borderBottom: '10px solid transparent', marginLeft: 4 }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {v.source}
                    </div>
                  </div>
                </button>
              )
            })}

            {/* Cloudflare Stream recordings */}
            {videos.map(v => (
              <button
                key={v.uid}
                onClick={() => { setCurrentVod(v.hlsUrl); setCurrentYouTube(null) }}
                style={{
                  background: currentVod === v.hlsUrl ? 'rgba(43,165,160,0.1)' : 'rgba(255,255,255,0.03)',
                  border: currentVod === v.hlsUrl ? '1px solid rgba(43,165,160,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8, overflow: 'hidden', cursor: 'pointer', textAlign: 'left',
                  padding: 0, transition: 'border-color 0.15s',
                }}
              >
                <div style={{ aspectRatio: '16/9', background: '#111', overflow: 'hidden' }}>
                  <img src={v.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                    onError={e => (e.currentTarget.style.display = 'none')} />
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                    {formatDuration(v.duration)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '48px 24px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.15)' }}>
          Barbados Surfing Association
        </div>
      </div>
    </div>
  )
}
