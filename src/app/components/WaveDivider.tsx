export function WaveDivider({ flip = false, color = '#0A2540', bg = '#FFFFFF' }: { flip?: boolean; color?: string; bg?: string }) {
  return (
    <div style={{ width: '100%', overflow: 'hidden', lineHeight: 0, transform: flip ? 'rotate(180deg)' : 'none', backgroundColor: bg, marginTop: -1, marginBottom: -1 }}>
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 'clamp(40px, 5vw, 80px)' }}>
        <path fill={color} d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z" />
      </svg>
    </div>
  )
}
