// Sponsor data
export interface Sponsor {
  name: string
  logo?: string
  url?: string
  tier: "platinum" | "gold" | "silver" | "bronze" | "supporter"
}

const sponsors: Sponsor[] = [
  // Example:
  // { name: "Corus", logo: "https://example.com/corus-logo.png", url: "https://corus.surf", tier: "platinum" },
  // { name: "Soup Bowl Surf Shop", tier: "gold" },
]

const tierOrder: Record<string, number> = { platinum: 0, gold: 1, silver: 2, bronze: 3, supporter: 4 }
const tierLabels: Record<string, string> = { platinum: "Platinum Partners", gold: "Gold Sponsors", silver: "Silver Sponsors", bronze: "Bronze Sponsors", supporter: "Supporters" }
const tierColors: Record<string, string> = { platinum: "#8B5CF6", gold: "#eab308", silver: "#94a3b8", bronze: "#b45309", supporter: "#2BA5A0" }

export function getSponsorsByTier(): { tier: string; label: string; color: string; sponsors: Sponsor[] }[] {
  const grouped: Record<string, Sponsor[]> = {}
  for (const s of sponsors) {
    if (!grouped[s.tier]) grouped[s.tier] = []
    grouped[s.tier].push(s)
  }
  return Object.entries(grouped)
    .sort(([a], [b]) => (tierOrder[a] ?? 99) - (tierOrder[b] ?? 99))
    .map(([tier, list]) => ({ tier, label: tierLabels[tier] || tier, color: tierColors[tier] || "#999", sponsors: list }))
}

export function hasSponsors(): boolean {
  return sponsors.length > 0
}
