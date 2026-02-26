import { AthletesClient } from './AthletesClient'

export const revalidate = 3600

export default async function AthletesPage() {
  // Fetch athletes from our API route at build/request time
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  let athletes: { id: string; name: string; nationality: string | null; image: string | null }[] = []
  try {
    const res = await fetch(`${baseUrl}/api/athletes`, { next: { revalidate: 3600 } })
    const data = await res.json()
    athletes = data.athletes || []
  } catch {
    // Fallback: fetch directly
    const { getOrg, getEvent } = await import('@/lib/liveheats')
    const org = await getOrg()
    const athleteMap = new Map<string, { id: string; name: string; nationality: string | null; image: string | null }>()
    for (const event of org.events.slice(0, 5)) {
      try {
        const full = await getEvent(event.id)
        for (const ed of full.eventDivisions) {
          for (const r of ed.ranking || []) {
            const a = r.competitor?.athlete
            if (a && !athleteMap.has(a.id)) athleteMap.set(a.id, a)
          }
        }
      } catch { /* skip */ }
    }
    athletes = Array.from(athleteMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }

  return <AthletesClient athletes={athletes} />
}
