import { getOrg, getEvent, getUpcomingEvents, getPastEvents } from '@/lib/liveheats'
import { HomeClient } from './HomeClient'

export const revalidate = 300

export default async function HomePage() {
  try {
    const org = await getOrg()
    const upcoming = getUpcomingEvents(org.events)
    const past = getPastEvents(org.events)

    let latestEvent = null
    if (past.length > 0) {
      try {
        latestEvent = await getEvent(past[0].id)
      } catch { /* skip */ }
    }

    const latestSeries = org.series.length > 0 ? org.series[org.series.length - 1] : null

    const featuredNames = ['Chelsea Tuach', 'Joshua Burke', 'Tommaso Layson', 'Rafe Gooding']
    const featuredAthletes: { id: string; name: string; image: string | null }[] = []

    if (latestEvent) {
      for (const div of latestEvent.eventDivisions) {
        for (const r of div.ranking || []) {
          if (featuredNames.some(n => r.competitor.athlete.name.toLowerCase().includes(n.toLowerCase())) && !featuredAthletes.find(a => a.id === r.competitor.athlete.id)) {
            featuredAthletes.push({ id: r.competitor.athlete.id, name: r.competitor.athlete.name, image: r.competitor.athlete.image })
          }
        }
      }
    }

    return (
      <HomeClient
        org={org}
        upcoming={upcoming}
        past={past}
        latestEvent={latestEvent}
        latestSeries={latestSeries}
        featuredAthletes={featuredAthletes}
      />
    )
  } catch (error) {
    console.error('Failed to fetch data:', error)
    // Fallback with empty data
    return (
      <HomeClient
        org={{
          id: '223', name: 'Barbados Surfing Association', shortName: 'BarbadosSurfingAssociation',
          logo: 'https://liveheats.com/images/dbb2a21b-7566-4629-8ea5-4c08a0b2877b.webp',
          facebook: 'https://www.facebook.com/bsasurf', instagram: 'https://www.instagram.com/barbadossurfingassociation/',
          contactEmail: 'barbadossurfingassociation@gmail.com', sportType: 'surf',
          events: [], series: []
        }}
        upcoming={[]}
        past={[]}
        latestEvent={null}
        latestSeries={null}
        featuredAthletes={[]}
      />
    )
  }
}
