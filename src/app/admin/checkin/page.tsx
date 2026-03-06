'use client'
import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface CheckinResult {
  athlete_name: string
  division: string | null
  success: boolean
  message: string
  time: string
}

export default function CheckinScannerPage() {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('event') || ''
  const [manualCode, setManualCode] = useState('')
  const [results, setResults] = useState<CheckinResult[]>([])
  const [scanning, setScanning] = useState(false)
  const [lastScan, setLastScan] = useState<CheckinResult | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  async function checkIn(qrCode: string) {
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code: qrCode }),
      })
      const data = await res.json()
      const result: CheckinResult = {
        athlete_name: data.checkin?.athlete_name || 'Unknown',
        division: data.checkin?.division || null,
        success: res.ok,
        message: data.message || data.error || 'Error',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      }
      setLastScan(result)
      setResults(prev => [result, ...prev])
      return result
    } catch {
      const result: CheckinResult = { athlete_name: 'Error', division: null, success: false, message: 'Network error', time: new Date().toLocaleTimeString() }
      setLastScan(result)
      setResults(prev => [result, ...prev])
      return result
    }
  }

  async function handleManual() {
    if (!manualCode.trim()) return
    await checkIn(manualCode.trim())
    setManualCode('')
  }

  // Camera-based QR scanning
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setScanning(true)
        scanLoop()
      }
    } catch (err) {
      alert('Camera access denied. Use manual entry instead.')
    }
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
    setScanning(false)
  }

  async function scanLoop() {
    // Uses BarcodeDetector API (available on modern browsers)
    if (!('BarcodeDetector' in window)) return

    const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
    const interval = setInterval(async () => {
      if (!videoRef.current || !scanning) { clearInterval(interval); return }
      try {
        const barcodes = await detector.detect(videoRef.current)
        if (barcodes.length > 0) {
          const code = barcodes[0].rawValue
          if (code?.startsWith('BSA-')) {
            clearInterval(interval)
            await checkIn(code)
            // Resume after 2 seconds
            setTimeout(() => { if (scanning) scanLoop() }, 2000)
          }
        }
      } catch {}
    }, 500)
  }

  useEffect(() => { return () => stopCamera() }, [])

  const successCount = results.filter(r => r.success).length

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A2540', color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/admin" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: '#fff', textDecoration: 'none' }}>BSA</Link>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2BA5A0', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Check-in</span>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          {successCount} checked in
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px' }}>
        {/* Last scan result */}
        {lastScan && (
          <div style={{
            padding: '20px', borderRadius: 16, marginBottom: 24, textAlign: 'center',
            backgroundColor: lastScan.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `2px solid ${lastScan.success ? '#10B981' : '#EF4444'}`,
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{lastScan.success ? '✓' : '✗'}</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: lastScan.success ? '#10B981' : '#EF4444' }}>
              {lastScan.success ? lastScan.athlete_name : 'Error'}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
              {lastScan.message}
            </div>
            {lastScan.division && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{lastScan.division}</div>
            )}
          </div>
        )}

        {/* Camera */}
        <div style={{
          borderRadius: 16, overflow: 'hidden', marginBottom: 24,
          backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {scanning ? (
            <div style={{ position: 'relative' }}>
              <video ref={videoRef} style={{ width: '100%', display: 'block' }} playsInline muted />
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{ width: 200, height: 200, border: '2px solid #2BA5A0', borderRadius: 12 }} />
              </div>
              <button onClick={stopCamera} style={{
                position: 'absolute', top: 12, right: 12, padding: '8px 16px', borderRadius: 8,
                backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12,
              }}>Stop Camera</button>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <button onClick={startCamera} style={{
                padding: '14px 28px', borderRadius: 10, border: 'none',
                backgroundColor: '#2BA5A0', color: '#fff', fontSize: 16, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
              }}>
                Start Camera Scanner
              </button>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 12 }}>
                Point camera at athlete&apos;s QR code
              </div>
            </div>
          )}
        </div>

        {/* Manual entry */}
        <div style={{
          display: 'flex', gap: 8, padding: '16px', borderRadius: 12,
          backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 24,
        }}>
          <input
            value={manualCode}
            onChange={e => setManualCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManual()}
            placeholder="Manual QR code entry..."
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, outline: 'none',
            }}
          />
          <button onClick={handleManual} style={{
            padding: '10px 20px', borderRadius: 8, border: 'none',
            backgroundColor: '#1478B5', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500, flexShrink: 0,
          }}>Check In</button>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* History */}
        {results.length > 0 && (
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>Recent Check-ins</div>
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
              {results.slice(0, 20).map((r, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                  borderBottom: i < Math.min(results.length, 20) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: r.success ? '#10B981' : '#EF4444',
                  }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{r.athlete_name}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{r.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
