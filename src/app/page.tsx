import { getOrg, getEvent, getUpcomingEvents, getPastEvents } from '@/lib/liveheats'
import type { BSAEvent } from '@/lib/liveheats'
import Image from 'next/image'
import Link from 'next/link'
import { CountdownTimer } from './countdown-timer'

export const revalidate = 300

export default async function HomePage() {
  const org = await getOrg()
  const upcoming = getUpcomingEvents(org.events)
  const past = getPastEvents(org.events)
  const nextEvent = upcoming[0] ?? null
  const recentEvents = past.slice(0, 3)

  // Fetch top 3 for recent events (Open Mens)
  const recentResults = await Promise.all(
    recentEvents.map(async (e) => {
      try {
        const full = await getEvent(e.id)
        const openMens = full.eventDivisions.find(
          (d) => d.division.name.toLowerCase().includes('open') && d.division.name.toLowerCase().includes('men') && !d.division.name.toLowerCase().includes('women')
        )
        return {
          event: e,
          top3: openMens?.ranking?.slice(0, 3) ?? [],
        }
      } catch {
        return { event: e, top3: [] }
      }
    })
  )

  // SOTY standings - find latest series
  const latestSeries = org.series[org.series.length - 1]
  let sotyTop5: { place: number; total: number; competitor: { athlete: { id: string; name: string; image: string | null } } }[] = []
  if (latestSeries && latestSeries.events.length > 0) {
    // Get the latest completed event in the series for standings
    const seriesEventIds = latestSeries.events.map((e) => e.id)
    const completedSeriesEvents = past.filter((e) => seriesEventIds.includes(e.id))
    if (completedSeriesEvents.length > 0) {
      try {
        const latestSeriesEvent = await getEvent(completedSeriesEvents[0].id)
        const openMens = latestSeriesEvent.eventDivisions.find(
          (d) => d.division.name.toLowerCase().includes('open') && d.division.name.toLowerCase().includes('men') && !d.division.name.toLowerCase().includes('women')
        )
        sotyTop5 = openMens?.ranking?.slice(0, 5) ?? []
      } catch {
        // ignore
      }
    }
  }

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-16 pb-12">
        <div className="absolute inset-0 bg-gradient-to-b from-ocean/20 to-transparent pointer-events-none" />
        <div className="relative z-10">
          {org.logo && (
            <Image
              src={org.logo}
              alt="BSA Logo"
              width={96}
              height={96}
              className="mx-auto mb-6 rounded-2xl"
            />
          )}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
            Barbados Surfing Association
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-md mx-auto">
            The official home of Barbados surfing
          </p>
        </div>
      </section>

      {/* Next Event */}
      {nextEvent && (
        <section className="px-4 md:px-8 mb-10">
          <Link href={`/events/${nextEvent.id}`} className="block">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-colors">
              <p className="text-teal text-sm font-semibold uppercase tracking-wider mb-2">Next Event</p>
              <h2 className="text-2xl font-bold mb-2">{nextEvent.name}</h2>
              {nextEvent.location && (
                <p className="text-white/50 text-sm mb-4">📍 {nextEvent.location.formattedAddress}</p>
              )}
              <CountdownTimer targetDate={nextEvent.date} />
            </div>
          </Link>
        </section>
      )}

      {/* Latest Results */}
      {recentResults.length > 0 && (
        <section className="px-4 md:px-8 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Latest Results</h2>
            <Link href="/events" className="text-ocean text-sm font-medium hover:text-ocean/80">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentResults.map(({ event, top3 }) => (
              <Link key={event.id} href={`/events/${event.id}`} className="block">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/8 transition-colors">
                  <h3 className="font-semibold mb-1">{event.name}</h3>
                  <p className="text-white/40 text-xs mb-3">
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {event.location && ` · ${event.location.formattedAddress}`}
                  </p>
                  {top3.length > 0 && (
                    <div className="space-y-1.5">
                      {top3.map((r, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <span className={`w-5 text-center font-bold ${i === 0 ? 'text-amber' : 'text-white/50'}`}>
                            {r.place}
                          </span>
                          {r.competitor.athlete.image && (
                            <Image
                              src={r.competitor.athlete.image}
                              alt={r.competitor.athlete.name}
                              width={24}
                              height={24}
                              className="rounded-full object-cover w-6 h-6"
                            />
                          )}
                          <span className="flex-1">{r.competitor.athlete.name}</span>
                          <span className="text-white/40 font-mono text-xs">{r.total.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SOTY Standings */}
      {sotyTop5.length > 0 && latestSeries && (
        <section className="px-4 md:px-8 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">SOTY Standings</h2>
            <Link href="/rankings" className="text-ocean text-sm font-medium hover:text-ocean/80">
              Full rankings →
            </Link>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-white/40 text-xs mb-3">{latestSeries.name} · Open Mens</p>
            <div className="space-y-2">
              {sotyTop5.map((r, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className={`w-5 text-center font-bold ${i === 0 ? 'text-amber' : 'text-white/50'}`}>
                    {r.place}
                  </span>
                  {r.competitor.athlete.image && (
                    <Image
                      src={r.competitor.athlete.image}
                      alt={r.competitor.athlete.name}
                      width={24}
                      height={24}
                      className="rounded-full object-cover w-6 h-6"
                    />
                  )}
                  <span className="flex-1">{r.competitor.athlete.name}</span>
                  <span className="text-white/40 font-mono text-xs">{r.total.toFixed(2)} pts</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="text-center text-white/30 text-xs py-8 px-4">
        <p>Powered by <a href="https://liveheats.com" className="text-ocean/60 hover:text-ocean" target="_blank" rel="noopener noreferrer">LiveHeats</a></p>
        <p className="mt-1">© {new Date().getFullYear()} Barbados Surfing Association</p>
      </footer>
    </div>
  )
}
