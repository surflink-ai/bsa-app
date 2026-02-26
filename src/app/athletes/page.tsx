import { getOrg, getEvent } from '@/lib/liveheats'
import type { Athlete } from '@/lib/liveheats'
import { AthleteGrid } from './athlete-grid'

export const revalidate = 300

export default async function AthletesPage() {
  const org = await getOrg()

  // Extract unique athletes from all events
  const athleteMap = new Map<string, Athlete>()

  await Promise.all(
    org.events.map(async (e) => {
      try {
        const full = await getEvent(e.id)
        for (const div of full.eventDivisions) {
          for (const heat of div.heats ?? []) {
            for (const r of heat.result ?? []) {
              const a = r.competitor.athlete
              if (a.id && !athleteMap.has(a.id)) {
                athleteMap.set(a.id, a)
              }
            }
          }
          for (const r of div.ranking ?? []) {
            const a = r.competitor.athlete
            if (a.id && !athleteMap.has(a.id)) {
              athleteMap.set(a.id, a)
            }
          }
        }
      } catch {
        // skip failed events
      }
    })
  )

  const athletes = Array.from(athleteMap.values()).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="pb-20 px-4 md:px-8 pt-8">
      <h1 className="text-3xl font-bold mb-6">Athletes</h1>
      <AthleteGrid athletes={athletes} />
    </div>
  )
}
