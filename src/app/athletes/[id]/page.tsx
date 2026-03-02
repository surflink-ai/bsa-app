import { getOrg, getEvent } from '@/lib/liveheats'
import { AthleteDetailClient } from './AthleteDetailClient'
export const revalidate = 300

interface HeatEntry {
  eid: string
  ename: string
  date: string
  div: string
  round: string
  heatPos: number
  place: number
  total: number
  waves: number[]
  opponents: { name: string; total: number; place: number }[]
}

interface ResultEntry {
  eid: string
  ename: string
  date: string
  div: string
  place: number
  total: number
  fieldSize: number
}

export default async function AthleteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let name = '', img: string | null = null
  const results: ResultEntry[] = []
  const heats: HeatEntry[] = []
  const rivals: Record<string, { name: string; wins: number; losses: number; heats: number }> = {}

  try {
    const org = await getOrg()
    const past = org.events.filter(e => e.status === 'results_published').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const res = await Promise.allSettled(past.slice(0, 20).map(e => getEvent(e.id)))

    for (const r of res) {
      if (r.status !== 'fulfilled') continue
      const ev = r.value

      for (const d of ev.eventDivisions) {
        // Check ranking for this athlete
        const rk = (d.ranking || []).find(r => r.competitor.athlete.id === id)
        if (!rk) continue

        if (!name) name = rk.competitor.athlete.name
        if (!img && rk.competitor.athlete.image) img = rk.competitor.athlete.image

        results.push({
          eid: ev.id, ename: ev.name, date: ev.date, div: d.division.name,
          place: rk.place, total: rk.total,
          fieldSize: d.ranking?.length || 0
        })

        // Extract heat-level data
        for (const heat of d.heats || []) {
          const myResult = heat.result?.find(hr => hr.competitor.athlete.id === id)
          if (!myResult) continue

          // Extract wave scores
          const waves: number[] = []
          if (myResult.rides) {
            for (const rideSet of Object.values(myResult.rides)) {
              for (const ride of rideSet) {
                waves.push(ride.total)
              }
            }
          }
          waves.sort((a, b) => b - a)

          // Opponents in this heat
          const opponents = heat.result
            .filter(hr => hr.competitor.athlete.id !== id)
            .map(hr => ({ name: hr.competitor.athlete.name, total: hr.total, place: hr.place }))

          // Track rivals
          for (const opp of opponents) {
            if (!rivals[opp.name]) rivals[opp.name] = { name: opp.name, wins: 0, losses: 0, heats: 0 }
            rivals[opp.name].heats++
            if (myResult.place < opp.place) rivals[opp.name].wins++
            else if (myResult.place > opp.place) rivals[opp.name].losses++
          }

          heats.push({
            eid: ev.id, ename: ev.name, date: ev.date, div: d.division.name,
            round: heat.round, heatPos: heat.position,
            place: myResult.place, total: myResult.total,
            waves, opponents
          })
        }
      }
    }
  } catch {}

  if (!name) return <div style={{ paddingTop: '8rem', textAlign: 'center', color: 'rgba(26,26,26,0.4)' }}>Athlete not found.</div>

  // Top rivals (min 2 heats together)
  const topRivals = Object.values(rivals)
    .filter(r => r.heats >= 2)
    .sort((a, b) => b.heats - a.heats)
    .slice(0, 6)

  return (
    <AthleteDetailClient
      athlete={{ id, name, image: img }}
      results={results}
      heats={heats}
      rivals={topRivals}
    />
  )
}
