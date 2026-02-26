import { getOrg, getEvent, getPastEvents } from '@/lib/liveheats'
import { AthletesClient } from './AthletesClient'

interface AthleteAgg { id: string; name: string; image: string | null; nationality: string | null; eventCount: number }

export default async function AthletesPage() {
  const org = await getOrg()
  const past = getPastEvents(org.events).slice(0, 10)
  const athleteMap = new Map<string, AthleteAgg>()
  const results = await Promise.allSettled(past.map(e => getEvent(e.id)))
  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    for (const div of r.value.eventDivisions) {
      for (const rank of div.ranking || []) {
        const a = rank.competitor.athlete
        const ex = athleteMap.get(a.id)
        if (ex) { ex.eventCount++; if (!ex.image && a.image) ex.image = a.image }
        else athleteMap.set(a.id, { id: a.id, name: a.name, image: a.image, nationality: a.nationality, eventCount: 1 })
      }
    }
  }
  return <AthletesClient athletes={Array.from(athleteMap.values()).sort((a, b) => b.eventCount - a.eventCount)} />
}
