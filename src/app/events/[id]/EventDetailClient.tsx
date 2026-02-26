'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { FadeIn } from '../../components/AnimatedSection'
import type { EventDivisionFull, Heat, HeatResult, RideScore } from '@/lib/liveheats'

interface Props {
  event: {
    id: string; name: string; date: string; status: string
    eventDivisions: EventDivisionFull[]
  }
}

function getRides(result: HeatResult): { total: number; scoring: boolean }[] {
  const rides: { total: number; scoring: boolean }[] = []
  for (const rideList of Object.values(result.rides || {})) {
    for (const ride of rideList as RideScore[]) {
      rides.push({ total: ride.total, scoring: !!ride.scoring_ride })
    }
  }
  return rides.sort((a, b) => b.total - a.total)
}

export function EventDetailClient({ event }: Props) {
  const [selectedDivIdx, setSelectedDivIdx] = useState(0)
  const [viewTab, setViewTab] = useState<'rankings' | 'heats'>('rankings')
  const [expandedHeat, setExpandedHeat] = useState<string | null>(null)

  const division = event.eventDivisions[selectedDivIdx]
  if (!division) return <div className="min-h-screen pt-32 text-center" style={{ color: 'rgba(26,26,26,0.4)' }}>No divisions found.</div>

  const ranking = division.ranking || []
  const topThree = ranking.slice(0, 3)
  const rest = ranking.slice(3)

  const heatsByRound: Record<string, Heat[]> = {}
  for (const heat of division.heats || []) {
    const round = heat.round || 'Unknown'
    if (!heatsByRound[round]) heatsByRound[round] = []
    heatsByRound[round].push(heat)
  }
  const roundOrder = Object.entries(heatsByRound).sort((a, b) => {
    const aPos = Math.min(...a[1].map(h => h.position))
    const bPos = Math.min(...b[1].map(h => h.position))
    return aPos - bPos
  })

  return (
    <div className="pb-24 md:pb-0">
      {/* Hero */}
      <section className="pt-28 pb-12 md:pt-32 md:pb-16" style={{ backgroundColor: '#0A2540' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <Link href="/events" className="text-sm transition-colors mb-4 inline-block" style={{ color: 'rgba(255,255,255,0.3)' }}>← Events</Link>
          <FadeIn>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-mono px-3 py-1 rounded-full" style={
                event.status === 'results_published' ? { backgroundColor: 'rgba(212,148,74,0.2)', color: '#D4944A' } : { backgroundColor: 'rgba(43,165,160,0.2)', color: '#2BA5A0' }
              }>
                {event.status === 'results_published' ? 'Results' : 'Upcoming'}
              </span>
            </div>
            <h1 className="font-heading font-bold text-3xl md:text-5xl mb-4" style={{ color: '#ffffff' }}>{event.name}</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>
              {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 md:px-8 py-8">
        {/* Division Selector */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
          {event.eventDivisions.map((div, idx) => (
            <button
              key={div.id}
              onClick={() => { setSelectedDivIdx(idx); setViewTab('rankings') }}
              className="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={idx === selectedDivIdx ? { backgroundColor: '#0A2540', color: '#ffffff' } : { backgroundColor: '#F2EDE4', color: 'rgba(26,26,26,0.5)' }}
            >
              {div.division.name}
            </button>
          ))}
        </div>

        {/* View Tabs */}
        <div className="flex gap-1 rounded-full p-1 w-fit mb-8" style={{ backgroundColor: '#F2EDE4' }}>
          {(['rankings', 'heats'] as const).map(t => (
            <button
              key={t}
              onClick={() => setViewTab(t)}
              className="px-5 py-2 rounded-full text-sm font-medium transition-all capitalize"
              style={viewTab === t ? { backgroundColor: '#0A2540', color: '#ffffff' } : { color: 'rgba(26,26,26,0.4)' }}
            >
              {t}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedDivIdx}-${viewTab}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {viewTab === 'rankings' ? (
              <div>
                {/* Podium */}
                {topThree.length >= 3 && (
                  <div className="flex items-end justify-center gap-4 md:gap-8 mb-12">
                    {[1, 0, 2].map(i => {
                      const r = topThree[i]
                      if (!r) return null
                      const isFirst = i === 0
                      return (
                        <motion.div
                          key={r.competitor.athlete.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.15, duration: 0.5 }}
                          className="text-center"
                        >
                          <div
                            className={`${isFirst ? 'w-24 h-24 md:w-32 md:h-32' : 'w-20 h-20 md:w-24 md:h-24'} mx-auto mb-3 rounded-full overflow-hidden`}
                            style={{ backgroundColor: '#F2EDE4', ...(isFirst ? { boxShadow: '0 0 0 4px #D4944A' } : {}) }}
                          >
                            {r.competitor.athlete.image ? (
                              <Image src={r.competitor.athlete.image} alt={r.competitor.athlete.name} width={128} height={128} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-heading text-xl" style={{ color: 'rgba(10,37,64,0.3)' }}>{r.place}</div>
                            )}
                          </div>
                          <Link href={`/athletes/${r.competitor.athlete.id}`} className="font-heading font-semibold text-sm transition-colors" style={{ color: '#0A2540' }}>
                            {r.competitor.athlete.name}
                          </Link>
                          <p className="font-mono text-xs" style={{ color: 'rgba(26,26,26,0.4)' }}>{r.total?.toFixed(2)} pts</p>
                          <div
                            className={`${isFirst ? 'h-28 md:h-32 w-24 md:w-32' : i === 1 ? 'h-20 md:h-24 w-20 md:w-28' : 'h-16 md:h-20 w-20 md:w-28'} mx-auto mt-3 rounded-t-lg flex items-center justify-center`}
                            style={{ backgroundColor: isFirst ? 'rgba(212,148,74,0.2)' : '#F2EDE4' }}
                          >
                            <span className="font-heading font-bold text-2xl" style={{ color: isFirst ? '#D4944A' : 'rgba(10,37,64,0.3)' }}>{r.place}</span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}

                {/* Rankings table */}
                {rest.length > 0 && (
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                    {rest.map((r, i) => (
                      <motion.div
                        key={r.competitor.athlete.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-4 px-6 py-4 border-b last:border-0"
                        style={{ borderColor: 'rgba(26,26,26,0.05)' }}
                      >
                        <span className="font-mono w-8 text-sm" style={{ color: 'rgba(26,26,26,0.3)' }}>{r.place}</span>
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ backgroundColor: '#F2EDE4' }}>
                          {r.competitor.athlete.image ? (
                            <Image src={r.competitor.athlete.image} alt="" width={40} height={40} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-heading" style={{ color: 'rgba(10,37,64,0.2)' }}>{r.competitor.athlete.name.charAt(0)}</div>
                          )}
                        </div>
                        <Link href={`/athletes/${r.competitor.athlete.id}`} className="font-medium transition-colors flex-1" style={{ color: '#0A2540' }}>
                          {r.competitor.athlete.name}
                        </Link>
                        <span className="font-mono text-sm" style={{ color: 'rgba(26,26,26,0.5)' }}>{r.total?.toFixed(2)}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* HEATS VIEW */
              <div className="space-y-8">
                {roundOrder.map(([round, heats]) => (
                  <div key={round}>
                    <h3 className="font-heading font-bold text-lg mb-4" style={{ color: '#0A2540' }}>{round}</h3>
                    <div className="space-y-3">
                      {heats.sort((a, b) => a.position - b.position).map(heat => {
                        const isExpanded = expandedHeat === heat.id
                        return (
                          <div key={heat.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
                            <button
                              onClick={() => setExpandedHeat(isExpanded ? null : heat.id)}
                              className="w-full px-6 py-4 flex items-center justify-between text-left"
                            >
                              <div className="flex items-center gap-4">
                                <span className="font-mono text-xs" style={{ color: 'rgba(26,26,26,0.3)' }}>H{heat.position}</span>
                                <div className="flex gap-3">
                                  {(heat.result || []).map((r, i) => (
                                    <span key={i} className="text-sm" style={r.place === 1 ? { fontWeight: 600, color: '#0A2540' } : { color: 'rgba(26,26,26,0.5)' }}>
                                      {r.competitor?.athlete?.name || 'TBD'}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <span className="text-sm" style={{ color: 'rgba(26,26,26,0.3)' }}>{isExpanded ? '−' : '+'}</span>
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-6 pb-4 space-y-3 pt-4" style={{ borderTop: '1px solid rgba(26,26,26,0.05)' }}>
                                    {(heat.result || []).sort((a, b) => a.place - b.place).map((r) => {
                                      const rides = getRides(r)
                                      return (
                                        <div key={r.competitor?.athlete?.id || Math.random()} className="flex items-start gap-4" style={{ opacity: r.place === 1 ? 1 : 0.6 }}>
                                          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ backgroundColor: '#F2EDE4' }}>
                                            {r.competitor?.athlete?.image ? (
                                              <Image src={r.competitor.athlete.image} alt="" width={40} height={40} className="w-full h-full object-cover" />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'rgba(10,37,64,0.2)' }}>{r.place}</div>
                                            )}
                                          </div>
                                          <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="font-medium text-sm" style={{ color: '#0A2540' }}>{r.competitor?.athlete?.name}</span>
                                              <span className="font-mono text-sm font-semibold" style={{ color: '#0A2540' }}>{r.total?.toFixed(2)}</span>
                                            </div>
                                            <div className="flex gap-1.5 flex-wrap">
                                              {rides.map((ride, j) => (
                                                <span key={j} className="font-mono text-xs px-2 py-0.5 rounded" style={ride.scoring ? { backgroundColor: 'rgba(212,148,74,0.15)', color: '#D4944A', fontWeight: 500 } : { backgroundColor: 'rgba(26,26,26,0.05)', color: 'rgba(26,26,26,0.4)' }}>
                                                  {ride.total.toFixed(2)}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  )
}
