"use client"
import { useState } from "react"

const HLS_URL = "https://customer-bu7i05hdb1yap6n8.cloudflarestream.com/56faab67dc45517018581598cd48b03a/iframe"

export function LiveCam() {
  const [isLive, setIsLive] = useState(true)

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#ef4444", display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
        LIVE CAM
      </div>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem, 4vw, 3rem)", color: "#fff", lineHeight: 1.15, marginBottom: 8 }}>Soup Bowl, Bathsheba</h2>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 32 }}>Live surf conditions from Barbados&rsquo; premier break</p>
      <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", borderRadius: 12, overflow: "hidden", backgroundColor: "rgba(0,0,0,0.3)" }}>
        <iframe
          src={HLS_URL}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <a href="https://cam.corus.surf" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 600, color: "#2BA5A0", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
          Full Screen View →
        </a>
      </div>
    </div>
  )
}
