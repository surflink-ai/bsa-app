import { getOrg, getEvent, getPastEvents } from '@/lib/liveheats'
import { AthleteDetailClient } from './AthleteDetailClient'

export default async function AthleteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const org = await getOrg()
  const past = getPastEvents(org.events).slice(0, 15)
  let athlete: { id: string; name: string; image: string | null; nationality: string | null } | null = null
  const history: { eventId: string; eventName: string; eventDate: string; division: string; place: number; score: number }[] = []
  const results = await Promise.allSettled(past.map(e => getEvent(e.id)))
  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    const ev = r.value
    for (const div of ev.eventDivisions) {
      for (const rank of div.ranking || []) {
        if (rank.competitor.athlete.id === id) {
          if (!athlete) athlete = rank.competitor.athlete
          else if (!athlete.image && rank.competitor.athlete.image) athlete.image = rank.competitor.athlete.image
          history.push({ eventId: ev.id, eventName: ev.name, eventDate: ev.date, division: div.division.name, place: rank.place, score: rank.total })
        }
      }
    }
  }
  if (!athlete) return <div style={{ paddingTop: 128, textAlign: 'center', fontFamily: "'DM Sans', sans-serif", color: 'rgba(26,26,26,0.4)' }}>Athlete not found.</div>
  return <AthleteDetailClient athlete={athlete} history={history} />
}
