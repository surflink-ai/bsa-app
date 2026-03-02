"use client"

// Instagram embed widget — uses Instagram's oEmbed/embed.js
// To use: add Instagram post URLs to the POSTS array below
// No API key needed — uses Instagram's public embed script

const INSTAGRAM_POSTS: string[] = [
  "https://www.instagram.com/barbadossurfingassociation/p/DVQgRcmDqHE/",
  "https://www.instagram.com/barbadossurfingassociation/p/DVMHalIjqw2/",
  "https://www.instagram.com/barbadossurfingassociation/p/DUohmGSDiRo/",
  "https://www.instagram.com/barbadossurfingassociation/p/DUek9eYDuhD/",
  "https://www.instagram.com/barbadossurfingassociation/p/DUD00OfDgjU/",
  "https://www.instagram.com/barbadossurfingassociation/p/DUBm2wpDj1S/",
]

// Fallback: manual social links when no posts are configured
const SOCIAL_LINKS = [
  { platform: "Instagram", handle: "@barbadossurfingassociation", url: "https://www.instagram.com/barbadossurfingassociation/", icon: "📸" },
  { platform: "Facebook", handle: "BSA Surf", url: "https://www.facebook.com/bsasurf/", icon: "👤" },
]

export function SocialFeed() {
  if (INSTAGRAM_POSTS.length === 0) {
    // Show social links instead of empty feed
    return (
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>FOLLOW US</div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem, 4vw, 3rem)", color: "#0A2540", lineHeight: 1.15, marginBottom: 32 }}>Stay Connected</h2>
        <div className="grid-responsive-4" style={{ display: "grid", gridTemplateColumns: `repeat(${SOCIAL_LINKS.length}, 1fr)`, gap: 16, maxWidth: 480 }}>
          {SOCIAL_LINKS.map(link => (
            <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", textDecoration: "none" }}>
              <span style={{ fontSize: 28 }}>{link.icon}</span>
              <div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, color: "#0A2540" }}>{link.platform}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(26,26,26,0.4)" }}>{link.handle}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>FROM THE FEED</div>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem, 4vw, 3rem)", color: "#0A2540", lineHeight: 1.15, marginBottom: 32 }}>Latest on Instagram</h2>
      <div className="grid-responsive-3" style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(INSTAGRAM_POSTS.length, 3)}, 1fr)`, gap: 16 }}>
        {INSTAGRAM_POSTS.slice(0, 6).map((url, i) => (
          <div key={i} style={{ borderRadius: 12, overflow: "hidden", backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <iframe
              src={`${url}embed`}
              style={{ width: "100%", minHeight: 480, border: "none", overflow: "hidden" }}
              scrolling="no"
              allowTransparency
            />
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <a href="https://www.instagram.com/barbadossurfingassociation/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 600, color: "#1478B5", textDecoration: "none" }}>Follow @barbadossurfingassociation →</a>
      </div>
    </div>
  )
}
