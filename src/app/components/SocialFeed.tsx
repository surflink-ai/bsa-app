"use client"

// Instagram shortcodes — link directly to posts
const INSTAGRAM_POSTS = [
  { shortcode: "DVQgRcmDqHE", caption: "Latest BSA action" },
  { shortcode: "DVMHalIjqw2", caption: "Competition highlights" },
  { shortcode: "DUohmGSDiRo", caption: "Barbados surf culture" },
  { shortcode: "DUek9eYDuhD", caption: "BSA community" },
  { shortcode: "DUD00OfDgjU", caption: "Event moments" },
  { shortcode: "DUBm2wpDj1S", caption: "Island waves" },
]

const SOCIAL_LINKS = [
  { platform: "Instagram", handle: "@barbadossurfingassociation", url: "https://www.instagram.com/barbadossurfingassociation/", icon: "📸" },
  { platform: "Facebook", handle: "BSA Surf", url: "https://www.facebook.com/bsasurf/", icon: "👤" },
]

export function SocialFeed() {
  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>FOLLOW US</div>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem, 4vw, 3rem)", color: "#0A2540", lineHeight: 1.15, marginBottom: 32 }}>
        Stay Connected
      </h2>

      {/* Social link cards */}
      <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
        {SOCIAL_LINKS.map(link => (
          <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 12, padding: "16px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", textDecoration: "none", transition: "transform 0.2s" }}>
            <span style={{ fontSize: 24 }}>{link.icon}</span>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: "#0A2540" }}>{link.platform}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(26,26,26,0.4)" }}>{link.handle}</div>
            </div>
          </a>
        ))}
      </div>

      {/* Instagram post grid — links to actual posts */}
      {INSTAGRAM_POSTS.length > 0 && (
        <div className="grid-responsive-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {INSTAGRAM_POSTS.map(post => (
            <a
              key={post.shortcode}
              href={`https://www.instagram.com/p/${post.shortcode}/`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                borderRadius: 12,
                overflow: "hidden",
                backgroundColor: "#0A2540",
                aspectRatio: "1",
                position: "relative",
                textDecoration: "none",
              }}
            >
              {/* Use Instagram CDN thumbnail */}
              <img
                src={`https://www.instagram.com/p/${post.shortcode}/media/?size=m`}
                alt={post.caption}
                style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9, transition: "opacity 0.2s" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                loading="lazy"
              />
              {/* Hover overlay */}
              <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: "rgba(10,37,64,0.6)", opacity: 0, transition: "opacity 0.2s",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "1" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "0" }}
              >
                <span style={{ color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14 }}>View on Instagram →</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
