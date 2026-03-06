import { getSponsorsByTier, hasSponsors } from "@/lib/sponsors"

export async function SponsorsSection() {
  const hasSp = await hasSponsors()
  if (!hasSp) return null

  const tiers = await getSponsorsByTier()

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#2BA5A0", marginBottom: 16 }}>OUR PARTNERS</div>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "clamp(1.875rem, 4vw, 3rem)", color: "#0A2540", lineHeight: 1.15, marginBottom: 48 }}>Sponsors</h2>
      {tiers.map(tier => (
        <div key={tier.tier} style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: tier.color, marginBottom: 16 }}>{tier.label}</div>
          <div className="grid-responsive-4" style={{ display: "grid", gridTemplateColumns: tier.tier === "platinum" ? "repeat(2, 1fr)" : tier.tier === "gold" ? "repeat(3, 1fr)" : "repeat(4, 1fr)", gap: 16 }}>
            {tier.sponsors.map(s => (
              <a key={s.name} href={s.url || "#"} target={s.url ? "_blank" : undefined} rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderRadius: 12, padding: "24px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", textDecoration: "none", minHeight: tier.tier === "platinum" ? 120 : 80, border: `1px solid ${tier.color}15` }}>
                {s.logo ? (
                  <img src={s.logo} alt={s.name} style={{ maxHeight: tier.tier === "platinum" ? 60 : 40, maxWidth: "80%", objectFit: "contain" }} />
                ) : (
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: tier.tier === "platinum" ? 18 : 14, color: "#0A2540" }}>{s.name}</span>
                )}
              </a>
            ))}
          </div>
        </div>
      ))}
      <div style={{ textAlign: "center", marginTop: 32 }}>
        <a href="mailto:admin@bsa.surf" style={{ fontSize: 14, fontWeight: 600, color: "#1478B5", textDecoration: "none" }}>Become a Sponsor →</a>
      </div>
    </div>
  )
}
