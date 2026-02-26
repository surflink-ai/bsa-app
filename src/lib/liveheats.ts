const GRAPHQL_URL = 'https://liveheats.com/api/graphql'
const BSA_ORG_ID = '223'
const BSA_SHORT_NAME = 'BarbadosSurfingAssociation'

const HEADERS = {
  'Content-Type': 'application/json',
  'Origin': 'https://liveheats.com',
  'Referer': 'https://liveheats.com/',
}

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 300 }, // 5 min ISR
  })
  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0].message)
  return json.data
}

// Types
export interface BSAOrg {
  id: string
  name: string
  shortName: string
  logo: string | null
  facebook: string | null
  instagram: string | null
  contactEmail: string
  sportType: string
}

export interface BSAEvent {
  id: string
  name: string
  date: string
  status: string
  location?: { formattedAddress: string } | null
  eventDivisions: EventDivision[]
}

export interface EventDivision {
  id: string
  division: { id: string; name: string }
  status: string
}

export interface Athlete {
  id: string
  name: string
  nationality: string | null
  image: string | null
}

export interface HeatResult {
  place: number
  total: number
  needs: number | null
  winBy: number | null
  rides: Record<string, RideScore[]>
  competitor: {
    athlete: Athlete
    bib: string | null
  }
}

export interface RideScore {
  scores: Record<string, number>
  total: number
  modified_total: number
  modifier: string | null
  scoring_ride?: boolean
}

export interface Heat {
  id: string
  position: number
  round: string
  startTime: string | null
  endTime: string | null
  config: {
    totalCountingRides: number
    maxRideScore: number
  }
  result: HeatResult[]
}

export interface EventDivisionFull extends EventDivision {
  heats: Heat[]
  ranking: {
    place: number
    total: number
    competitor: { athlete: Athlete }
  }[]
}

export interface SeriesInfo {
  id: string
  name: string
  events: { id: string; name: string; date: string; status: string }[]
}

// Queries

export async function getOrg(): Promise<BSAOrg & { events: BSAEvent[]; series: SeriesInfo[] }> {
  const data = await gql<{ organisationByShortName: BSAOrg & { events: BSAEvent[]; series: SeriesInfo[] } }>(`{
    organisationByShortName(shortName: "${BSA_SHORT_NAME}") {
      id name shortName logo facebook instagram contactEmail sportType
      events {
        id name date status
        location { formattedAddress }
        eventDivisions { id division { id name } status }
      }
      series { id name events { id name date status } }
    }
  }`)
  return data.organisationByShortName
}

export async function getEvent(id: string): Promise<{
  id: string; name: string; date: string; status: string
  eventDivisions: EventDivisionFull[]
}> {
  const data = await gql<{ event: { id: string; name: string; date: string; status: string; eventDivisions: EventDivisionFull[] } }>(`{
    event(id: "${id}") {
      id name date status
      eventDivisions {
        id
        division { id name }
        status
        heats {
          id position round startTime endTime
          config { totalCountingRides maxRideScore }
          result {
            place total needs winBy rides
            competitor { athlete { id name nationality image } bib }
          }
        }
        ranking {
          place total
          competitor { athlete { id name nationality image } }
        }
      }
    }
  }`)
  return data.event
}

export async function getSeries(id: string): Promise<SeriesInfo> {
  const data = await gql<{ series: SeriesInfo }>(`{
    series(id: "${id}") {
      id name
      events { id name date status }
    }
  }`)
  return data.series
}

// Helpers
export function sortEventsByDate(events: BSAEvent[]) {
  return [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getUpcomingEvents(events: BSAEvent[]) {
  return events.filter(e => e.status === 'upcoming').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export function getPastEvents(events: BSAEvent[]) {
  return events.filter(e => e.status === 'results_published').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getBestWaves(rides: Record<string, RideScore[]>): { total: number; scoring: boolean }[] {
  const allRides: { total: number; scoring: boolean }[] = []
  for (const athleteRides of Object.values(rides)) {
    for (const ride of athleteRides) {
      allRides.push({ total: ride.total, scoring: !!ride.scoring_ride })
    }
  }
  return allRides.sort((a, b) => b.total - a.total)
}
