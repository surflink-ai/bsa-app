import { NextResponse } from 'next/server'
import { getOrg, getEvent, type Athlete } from '@/lib/liveheats'

export const revalidate = 3600 // 1 hour

export async function GET() {
  try {
    const org = await getOrg()
    const athleteMap = new Map<string, Athlete>()

    // Fetch all events and extract athletes from results
    const eventPromises = org.events.map(async (event) => {
      try {
        const full = await getEvent(event.id)
        for (const ed of full.eventDivisions) {
          // From rankings
          for (const r of ed.ranking || []) {
            if (r.competitor?.athlete) {
              const a = r.competitor.athlete
              if (!athleteMap.has(a.id)) athleteMap.set(a.id, a)
            }
          }
          // From heat results
          for (const heat of ed.heats || []) {
            for (const r of heat.result || []) {
              if (r.competitor?.athlete) {
                const a = r.competitor.athlete
                if (!athleteMap.has(a.id)) athleteMap.set(a.id, a)
              }
            }
          }
        }
      } catch {
        // Skip failed events
      }
    })

    await Promise.all(eventPromises)

    const athletes = Array.from(athleteMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({
      count: athletes.length,
      athletes,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch athletes' },
      { status: 500 }
    )
  }
}
