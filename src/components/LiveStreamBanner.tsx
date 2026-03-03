'use client'

interface LiveStreamBannerProps {
  title?: string | null
  streamUrl?: string | null
  embedCode?: string | null
}

export function LiveStreamBanner({ title, streamUrl, embedCode }: LiveStreamBannerProps) {
  const displayTitle = title || '🔴 LIVE NOW'

  return (
    <div style={{
      background: 'linear-gradient(135deg, #dc2626, #991b1b)',
      color: 'white',
      padding: '12px 24px',
      textAlign: 'center',
      position: 'relative',
      zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-block',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: 'white',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
        <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '16px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {displayTitle}
        </span>
        {streamUrl && (
          <a
            href={streamUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              padding: '6px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              fontFamily: 'Space Grotesk, sans-serif',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
          >
            Watch Stream →
          </a>
        )}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
