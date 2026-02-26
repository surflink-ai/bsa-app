import Link from "next/link"

export function Footer() {
  return (
    <footer style={{ backgroundColor: "#0A2540", color: "rgba(255,255,255,0.6)", paddingBottom: 80 }} className="md:pb-0">
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 32px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 48 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <img src="https://liveheats.com/images/dbb2a21b-7566-4629-8ea5-4c08a0b2877b.webp" alt="BSA" style={{ width: 32, height: 32, borderRadius: "50%" }} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: "#fff" }}>Barbados Surfing Association</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 280 }}>The National Governing Body for Surfing in Barbados. ISA Member Federation since 1995.</p>
          </div>
          <div>
            <h4 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 20 }}>Navigate</h4>
            {[["/", "Home"], ["/events", "Events"], ["/athletes", "Athletes"], ["/rankings", "Rankings"]].map(([href, label]) => (
              <Link key={href} href={href} style={{ display: "block", textDecoration: "none", color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: 10 }}>{label}</Link>
            ))}
          </div>
          <div>
            <h4 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 20 }}>Connect</h4>
            <a href="https://instagram.com/barbadossurfing" target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none", color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: 10 }}>Instagram</a>
            <a href="https://facebook.com/BarbadosSurfingAssociation" target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none", color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: 10 }}>Facebook</a>
          </div>
          <div>
            <h4 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 20 }}>Contact</h4>
            <p style={{ fontSize: 14, lineHeight: 1.8 }}>Barbados Surfing Association<br />Bridgetown, Barbados<br />info@barbadossurfing.org</p>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 48, paddingTop: 24, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
          {new Date().getFullYear()} Barbados Surfing Association. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
