"use client"
import { useState } from "react"

interface Photo {
  src: string
  alt?: string
  credit?: string
}

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [selected, setSelected] = useState<number | null>(null)

  if (!photos || photos.length === 0) return null

  return (
    <>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>PHOTOS</div>
      <div className="gallery-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {photos.map((photo, i) => (
          <div
            key={i}
            onClick={() => setSelected(i)}
            style={{
              cursor: "pointer",
              borderRadius: 8,
              overflow: "hidden",
              aspectRatio: i === 0 ? "16/10" : "1",
              gridColumn: i === 0 ? "span 2" : undefined,
              gridRow: i === 0 ? "span 2" : undefined,
            }}
          >
            <img
              src={photo.src}
              alt={photo.alt || `Event photo ${i + 1}`}
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s ease" }}
              onMouseOver={e => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")}
            />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selected !== null && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            backgroundColor: "rgba(0,0,0,0.9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24, cursor: "pointer",
          }}
        >
          <button
            onClick={e => { e.stopPropagation(); setSelected(null) }}
            style={{ position: "absolute", top: 20, right: 20, color: "#fff", background: "none", border: "none", fontSize: 28, cursor: "pointer", fontFamily: "sans-serif", zIndex: 101 }}
          >
            ✕
          </button>
          {selected > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setSelected(selected - 1) }}
              style={{ position: "absolute", left: 20, color: "#fff", background: "rgba(255,255,255,0.1)", border: "none", fontSize: 24, cursor: "pointer", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ‹
            </button>
          )}
          {selected < photos.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); setSelected(selected + 1) }}
              style={{ position: "absolute", right: 20, color: "#fff", background: "rgba(255,255,255,0.1)", border: "none", fontSize: 24, cursor: "pointer", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ›
            </button>
          )}
          <div style={{ maxWidth: "90vw", maxHeight: "85vh", position: "relative" }}>
            <img
              src={photos[selected].src}
              alt={photos[selected].alt || ""}
              style={{ maxWidth: "100%", maxHeight: "85vh", objectFit: "contain", borderRadius: 4 }}
            />
            {photos[selected].credit && (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 8 }}>
                📷 {photos[selected].credit}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
