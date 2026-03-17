'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface VODEntry { id: string; title: string; youtube_id: string; date: string; thumbnail?: string }
interface StreamProps {
  active: boolean
  title: string | null
  streamUrl: string | null
  embedCode: string | null
  sourceType: string
  youtubeVideoId: string | null
  overlayEnabled: boolean
  vodEnabled: boolean
  vodPlaylist: VODEntry[]
  scheduledTime: string | null
  scheduledTitle: string | null
}

function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  const diff = Math.max(0, new Date(target).getTime() - now)
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  const unit = (v: number, l: string) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, color: '#fff' }}>{String(v).padStart(2, '0')}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{l}</div>
    </div>
  )
  return (
    <div style={{ display: 'flex', gap: 'clamp(16px, 4vw, 40px)', justifyContent: 'center' }}>
      {unit(d, 'Days')}{unit(h, 'Hours')}{unit(m, 'Minutes')}{unit(s, 'Seconds')}
    </div>
  )
}

export function StreamClient({ config }: { config: StreamProps | null }) {
  const [selectedVOD, setSelectedVOD] = useState<VODEntry | null>(null)

  // ── LIVE ──
  if (config?.active && config.embedCode) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0A2540' }}>
        {/* Live indicator bar */}
        <div style={{
          backgroundColor: '#EF4444', padding: '8px 24px', textAlign: 'center',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600,
          color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#fff', animation: 'pulse 1.5s infinite' }} />
          LIVE NOW — {config.title || 'BSA Live Stream'}
        </div>

        {/* Player */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
          <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' }}>
            {config.sourceType === 'custom' ? (
              <div dangerouslySetInnerHTML={{ __html: config.embedCode }} style={{ position: 'absolute', inset: 0 }} />
            ) : (
              <iframe
                src={config.embedCode}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>

          {config.overlayEnabled && (
            <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 8, backgroundColor: 'rgba(43,165,160,0.08)', border: '1px solid rgba(43,165,160,0.2)' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#2BA5A0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Score overlay active — scores update in real-time</span>
            </div>
          )}
        </div>

        <style jsx>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      </div>
    )
  }

  // ── VOD PLAYER (selected video) ──
  if (selectedVOD) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0A2540', padding: '24px 16px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <button onClick={() => setSelectedVOD(null)} style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'rgba(255,255,255,0.4)',
            background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16, padding: 0,
          }}>← Back to Library</button>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 16 }}>{selectedVOD.title}</h2>
          <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' }}>
            <iframe
              src={`https://www.youtube.com/embed/${selectedVOD.youtube_id}?autoplay=1`}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    )
  }

  // ── OFFLINE with Countdown or VOD Library ──
  const hasSchedule = config?.scheduledTime && new Date(config.scheduledTime) > new Date()
  const hasVOD = config?.vodEnabled && (config.vodPlaylist || []).length > 0
  const vodList = config?.vodPlaylist || []

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A2540' }}>
      {/* Hero */}
      <div style={{
        padding: hasSchedule ? '80px 24px 60px' : '120px 24px', textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: hasVOD ? 'auto' : '60vh',
      }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#2BA5A0', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 16 }}>
          {hasSchedule ? 'NEXT LIVE STREAM' : 'BSA LIVE'}
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 3rem)', fontWeight: 700, color: '#fff', marginBottom: 16, maxWidth: 600 }}>
          {hasSchedule
            ? config?.scheduledTitle || 'Upcoming Event'
            : 'No Live Stream Right Now'
          }
        </h1>

        {hasSchedule && config?.scheduledTime && (
          <>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>
              {new Date(config.scheduledTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              {' at '}
              {new Date(config.scheduledTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </div>
            <Countdown target={config.scheduledTime} />
          </>
        )}

        {!hasSchedule && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: 'rgba(255,255,255,0.4)', maxWidth: 400 }}>
            Check back during BSA events for live competition coverage with real-time scoring.
          </p>
        )}

        <Link href="/" style={{
          marginTop: 32, fontFamily: "'Space Grotesk', sans-serif", fontSize: 14,
          fontWeight: 600, color: '#2BA5A0', textDecoration: 'none',
        }}>
          ← Back to bsa.surf
        </Link>
      </div>

      {/* VOD Library */}
      {hasVOD && (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 80px' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#2BA5A0',
            textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 24,
          }}>
            Event Replays
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {vodList.map(vod => (
              <button key={vod.id} onClick={() => setSelectedVOD(vod)} style={{
                display: 'block', textAlign: 'left', cursor: 'pointer',
                backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
                transition: 'all 0.2s', padding: 0, width: '100%',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(43,165,160,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ position: 'relative', paddingBottom: '56.25%', backgroundColor: '#111' }}>
                  {vod.thumbnail && <img src={vod.thumbnail} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 0, height: 0, borderLeft: '16px solid #fff', borderTop: '10px solid transparent', borderBottom: '10px solid transparent', marginLeft: 4 }} />
                    </div>
                  </div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{vod.title}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{vod.date}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
