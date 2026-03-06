import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BSA Live — Barbados Surfing Association',
  description: 'Watch live surf competitions from the Barbados Surfing Association',
}

export default function StreamPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0A2540', color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Embed HeatSync stream in an iframe */}
      <iframe
        src="https://heatsync.ai/stream"
        style={{
          width: '100%',
          height: '100vh',
          border: 'none',
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </div>
  )
}
