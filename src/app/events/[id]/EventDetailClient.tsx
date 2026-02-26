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
  if (!division) return <div className="min-h-screen pt-32 text-center text-dark/40">No divisions found.</div>

  const ranking = division.ranking || []
  const topThree = ranking.slice(0, 3)
  const rest = ranking.slice(3)

  // Group heats by round
  const heatsByRound: Record<string, Heat[]> = {}
  for (const heat of division.heats || []) {
    const round = heat.round || 'Unknown'
    if (!heatsByRound[round]) heatsByRound[round] = []
    heatsByRound[round].push(heat)
  }
  // Sort rounds by position
  const roundOrder = Object.entries(heatsByRound).sort((a, b) => {
    const aPos = Math.min(...a[1].map(h => h.position))
    const bPos = Math.min(...b[1].map(h => h.position))
    return aPos - bPos
  })

  return (
    <div className="pb-24 md:pb-0">
      {/* Hero */}
      <section className="bg-navy pt-28 pb-12 md:pt-32 md:pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/events" className="text-white/30 text-sm hover:text-white/50 transition-colors mb-4 inline-block">← Events</Link>
          <FadeIn>
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs font-mono px-3 py-1 rounded-full ${
                event.status === 'results_published' ? 'bg-amber/20 text-amber' : 'bg-teal/20 text-teal'
              }`}>
                {event.status === 'results_published' ? 'Results' : 'Upcoming'}
              </span>
            </div>
            <h1 className="font-heading font-bold text-3xl md:text-5xl text-white mb-4">{event.name}</h1>
            <p className="text-white/50">
              {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-8">
        {/* Division Selector */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
          {event.eventDivisions.map((div, idx) => (
            <button
              key={div.id}
              onClick={() => { setSelectedDivIdx(idx); setViewTab('rankings') }}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
                idx === selectedDivIdx ? 'bg-navy text-white' : 'bg-sand text-dark/50 hover:text-dark/70'
              }`}
            >
              {div.division.name}
            </button>
          ))}
        </div>

        {/* View Tabs */}
        <div className="flex gap-1 bg-sand rounded-full p-1 w-fit mb-8">
          {(['rankings', 'heats'] as const).map(t => (
            <button
              key={t}
              onClick={() => setViewTab(t)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                viewTab === t ? 'bg-navy text-white' : 'text-dark/40'
              }`}
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
                          <div className={`${isFirst ? 'w-24 h-24 md:w-32 md:h-32 ring-4 ring-amber' : 'w-20 h-20 md:w-24 md:h-24'} mx-auto mb-3 rounded-full bg-sand overflow-hidden`}>
                            {r.competitor.athlete.image ? (
                              <Image src={r.competitor.athlete.image} alt={r.competitor.athlete.name} width={128} height={128} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-navy/30 font-heading text-xl">{r.place}</div>
                            )}
                          </div>
                          <Link href={`/athletes/${r.competitor.athlete.id}`} className="font-heading font-semibold text-sm text-navy hover:text-ocean transition-colors">
                            {r.competitor.athlete.name}
                          </Link>
                          <p className="font-mono text-xs text-dark/40">{r.total?.toFixed(2)} pts</p>
                          <div className={`${isFirst ? 'bg-amber/20 h-28 md:h-32 w-24 md:w-32' : i === 1 ? 'bg-sand h-20 md:h-24 w-20 md:w-28' : 'bg-sand h-16 md:h-20 w-20 md:w-28'} mx-auto mt-3 rounded-t-lg flex items-center justify-center`}>
                            <span className={`font-heading font-bold text-2xl ${isFirst ? 'text-amber' : 'text-navy/30'}`}>{r.place}</span>
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
                        className="flex items-center gap-4 px-6 py-4 border-b border-dark/5 last:border-0"
                      >
                        <span className="font-mono text-dark/30 w-8 text-sm">{r.place}</span>
                        <div className="w-10 h-10 rounded-full bg-sand overflow-hidden shrink-0">
                          {r.competitor.athlete.image ? (
                            <Image src={r.competitor.athlete.image} alt="" width={40} height={40} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-navy/20 text-sm font-heading">{r.competitor.athlete.name.charAt(0)}</div>
                          )}
                        </div>
                        <Link href={`/athletes/${r.competitor.athlete.id}`} className="font-medium text-navy hover:text-ocean transition-colors flex-1">
                          {r.competitor.athlete.name}
                        </Link>
                        <span className="font-mono text-sm text-dark/50">{r.total?.toFixed(2)}</span>
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
                    <h3 className="font-heading font-bold text-navy text-lg mb-4">{round}</h3>
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
                                <span className="font-mono text-xs text-dark/30">H{heat.position}</span>
                                <div className="flex gap-3">
                                  {(heat.result || []).map((r, i) => (
                                    <span key={i} className={`text-sm ${r.place === 1 ? 'font-semibold text-navy' : 'text-dark/50'}`}>
                                      {r.competitor?.athlete?.name || 'TBD'}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <span className="text-dark/30 text-sm">{isExpanded ? '−' : '+'}</span>
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
                                  <div className="px-6 pb-4 space-y-3 border-t border-dark/5 pt-4">
                                    {(heat.result || []).sort((a, b) => a.place - b.place).map((r) => {
                                      const rides = getRides(r)
                                      return (
                                        <div key={r.competitor?.athlete?.id || Math.random()} className={`flex items-start gap-4 ${r.place === 1 ? '' : 'opacity-60'}`}>
                                          <div className="w-10 h-10 rounded-full bg-sand overflow-hidden shrink-0">
                                            {r.competitor?.athlete?.image ? (
                                              <Image src={r.competitor.athlete.image} alt="" width={40} height={40} className="w-full h-full object-cover" />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-navy/20 text-xs">{r.place}</div>
                                            )}
                                          </div>
                                          <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="font-medium text-sm text-navy">{r.competitor?.athlete?.name}</span>
                                              <span className="font-mono text-sm font-semibold text-navy">{r.total?.toFixed(2)}</span>
                                            </div>
                                            <div className="flex gap-1.5 flex-wrap">
                                              {rides.map((ride, j) => (
                                                <span key={j} className={`font-mono text-xs px-2 py-0.5 rounded ${ride.scoring ? 'bg-amber/15 text-amber font-medium' : 'bg-dark/5 text-dark/40'}`}>
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
