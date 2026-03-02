// Historical champions data — sourced from LiveHeats API (verified)

export interface Champion {
  year: number
  division: string
  name: string
  image?: string
}

const champions: Champion[] = [
  // SOTY 2025 — Nationals at Soup Bowl, Nov 14, 2025
  { year: 2025, division: "Open Mens", name: "Jacob Burke" },
  { year: 2025, division: "Open Womens", name: "Chelsea Tuach", image: "https://res.cloudinary.com/liveheats-com/image/facebook/w_128,h_128/10214917126259821.webp" },
  { year: 2025, division: "Pro Mens", name: "Joshua Burke" },
  { year: 2025, division: "Pro Womens", name: "Chelsea Roett" },
  { year: 2025, division: "Pro Juniors", name: "Tommaso Layson", image: "https://liveheats.com/images/32d43121-8611-42de-a466-1302418c68d0.webp" },
  { year: 2025, division: "Under 18 Boys", name: "Tommaso Layson", image: "https://liveheats.com/images/32d43121-8611-42de-a466-1302418c68d0.webp" },
  { year: 2025, division: "Under 18 Girls", name: "Amy Godson" },
  { year: 2025, division: "Under 16 Boys", name: "Daniel Banfield", image: "https://liveheats.com/images/81310334-d256-4025-823b-35aaaaea58ed.webp" },
  { year: 2025, division: "Under 16 Girls", name: "Amy Godson" },
  { year: 2025, division: "Under 14 Boys", name: "Daniel Banfield", image: "https://liveheats.com/images/81310334-d256-4025-823b-35aaaaea58ed.webp" },
  { year: 2025, division: "Grand Masters", name: "Christopher Clarke" },
  { year: 2025, division: "Longboard Open", name: "Jacob Burke" },

  // SOTY 2024 — Nationals at Soup Bowl, Nov 23, 2024
  { year: 2024, division: "Open Mens", name: "Joshua Burke" },
  { year: 2024, division: "Open Womens", name: "Chelsea Tuach", image: "https://res.cloudinary.com/liveheats-com/image/facebook/w_128,h_128/10214917126259821.webp" },
  { year: 2024, division: "Pro Mens", name: "Bruce Mackie", image: "https://liveheats.com/images/0984f8b1-0bad-4290-b497-ca2951188ca1.webp" },
  { year: 2024, division: "Pro Womens", name: "Chelsea Tuach", image: "https://res.cloudinary.com/liveheats-com/image/facebook/w_128,h_128/10214917126259821.webp" },
  { year: 2024, division: "Pro Juniors", name: "Tommaso Layson", image: "https://liveheats.com/images/32d43121-8611-42de-a466-1302418c68d0.webp" },
  { year: 2024, division: "Under 18 Boys", name: "Tommaso Layson", image: "https://liveheats.com/images/32d43121-8611-42de-a466-1302418c68d0.webp" },
  { year: 2024, division: "Under 18 Girls", name: "Hayley Godson" },
  { year: 2024, division: "Under 16 Boys", name: "Tommaso Layson", image: "https://liveheats.com/images/32d43121-8611-42de-a466-1302418c68d0.webp" },
  { year: 2024, division: "Under 14 Boys", name: "Trent Corbin" },
  { year: 2024, division: "Under 12", name: "Hugo Vermeulen", image: "https://liveheats.com/images/aef7fff5-7d90-4573-9a79-4be2fdf0d36f.webp" },
  { year: 2024, division: "Grand Masters", name: "Richard Gooding" },
  { year: 2024, division: "Longboard Open", name: "Jacob Burke" },

  // SOTY 2023 — Nationals at Soup Bowl, Dec 16, 2023
  { year: 2023, division: "Open Mens", name: "Warren Povey", image: "https://liveheats.com/images/7b45d9c3-5a0c-4e7a-bd04-66f67fe62487.webp" },
  { year: 2023, division: "Open Womens", name: "Chelsea Tuach", image: "https://res.cloudinary.com/liveheats-com/image/facebook/w_128,h_128/10214917126259821.webp" },
  { year: 2023, division: "Pro Mens", name: "Caleb Rapson" },
  { year: 2023, division: "Pro Womens", name: "Chelsea Tuach", image: "https://res.cloudinary.com/liveheats-com/image/facebook/w_128,h_128/10214917126259821.webp" },
  { year: 2023, division: "Under 18 Boys", name: "Rafe Gooding", image: "https://liveheats.com/images/35421c79-62cb-4288-94da-7ecff8263391.webp" },
  { year: 2023, division: "Under 18 Girls", name: "Hayley Godson" },
  { year: 2023, division: "Under 16 Boys", name: "Rafe Gooding", image: "https://liveheats.com/images/35421c79-62cb-4288-94da-7ecff8263391.webp" },
  { year: 2023, division: "Under 14 Boys", name: "Trent Corbin" },
  { year: 2023, division: "Under 12", name: "Daniel Banfield", image: "https://liveheats.com/images/81310334-d256-4025-823b-35aaaaea58ed.webp" },
  { year: 2023, division: "Longboard Open", name: "Noah Campbell", image: "https://res.cloudinary.com/liveheats-com/image/facebook/w_128,h_128/2375589579121920.webp" },
  { year: 2023, division: "Masters 40+", name: "Richard Gooding" },

  // SOTY 2022 — Nationals at Soup Bowl, Nov 26, 2022
  { year: 2022, division: "Open Mens", name: "Joshua Burke" },
  { year: 2022, division: "Open Womens", name: "Chelsea Tuach", image: "https://res.cloudinary.com/liveheats-com/image/facebook/w_128,h_128/10214917126259821.webp" },
  { year: 2022, division: "Under 18 Boys", name: "Warren Povey", image: "https://liveheats.com/images/7b45d9c3-5a0c-4e7a-bd04-66f67fe62487.webp" },
  { year: 2022, division: "Under 16 Boys", name: "Rafe Gooding", image: "https://liveheats.com/images/35421c79-62cb-4288-94da-7ecff8263391.webp" },
  { year: 2022, division: "Under 14 Boys", name: "Tommaso Layson", image: "https://liveheats.com/images/32d43121-8611-42de-a466-1302418c68d0.webp" },
  { year: 2022, division: "Under 12", name: "Christian Stoute", image: "https://liveheats.com/images/6f6deace-d3a5-46f7-ad32-b3776d49df68.webp" },
  { year: 2022, division: "Longboard Open", name: "Kai St.George" },
  { year: 2022, division: "Masters 35+", name: "Simon Coles", image: "https://res.cloudinary.com/liveheats-com/image/facebook/w_128,h_128/3648051408848679.webp" },
]

const tierOrder: Record<string, number> = {
  "Open Mens": 0, "Open Womens": 1, "Pro Mens": 2, "Pro Womens": 3, "Pro Juniors": 4,
  "Under 18 Boys": 5, "Under 18 Girls": 6, "Under 16 Boys": 7, "Under 16 Girls": 8,
  "Under 14 Boys": 9, "Under 12": 10, "Grand Masters": 11, "Masters 40+": 11, "Masters 35+": 11,
  "Longboard Open": 12,
}

export function getChampionsByYear(): Record<number, Champion[]> {
  const grouped: Record<number, Champion[]> = {}
  for (const c of champions) {
    if (!grouped[c.year]) grouped[c.year] = []
    grouped[c.year].push(c)
  }
  // Sort divisions within each year
  for (const year of Object.keys(grouped)) {
    grouped[Number(year)].sort((a, b) => (tierOrder[a.division] ?? 99) - (tierOrder[b.division] ?? 99))
  }
  return grouped
}

export function getYears(): number[] {
  return [...new Set(champions.map(c => c.year))].sort((a, b) => b - a)
}

export function getAllChampions(): Champion[] {
  return [...champions].sort((a, b) => b.year - a.year || (tierOrder[a.division] ?? 99) - (tierOrder[b.division] ?? 99))
}
