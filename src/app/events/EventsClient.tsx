'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { FadeIn, StaggerContainer, StaggerItem, ScaleCard } from '../components/AnimatedSection'
import type { BSAEvent } from '@/lib/liveheats'

export function EventsClient({ upcoming, past }: { upcoming: BSAEvent[]; past: BSAEvent[] }) {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const events = tab === 'upcoming' ? upcoming : past

  return (
    <div className="pb-24 md:pb-0">
      {/* Hero */}
      <section className="bg-navy pt-28 pb-16 md:pt-32 md:pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn>
            <h1 className="font-heading font-bold text-4xl md:text-6xl text-white mb-4">EVENTS</h1>
            <p className="text-white/50 text-lg">Competition calendar and results</p>
          </FadeIn>
        </div>
      </section>

      {/* Tabs */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-1 bg-sand rounded-full p-1 w-fit mb-8">
          {(['upcoming', 'past'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                tab === t ? 'bg-navy text-white' : 'text-dark/40 hover:text-dark/70'
              }`}
            >
              {t === 'upcoming' ? 'Upcoming' : 'Past Results'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {events.length === 0 ? (
              <p className="text-dark/40 text-center py-20">No {tab} events found.</p>
            ) : (
              <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map(event => (
                  <StaggerItem key={event.id}>
                    <ScaleCard>
                      <Link href={`/events/${event.id}`} className="block bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <span className={`text-xs font-mono px-3 py-1 rounded-full ${
                            event.status === 'upcoming' ? 'bg-teal/10 text-teal' :
                            event.status === 'registration_open' ? 'bg-green-100 text-green-600' :
                            'bg-amber/10 text-amber'
                          }`}>
                            {event.status === 'results_published' ? 'Results' : event.status === 'registration_open' ? 'Registration Open' : 'Upcoming'}
                          </span>
                        </div>
                        <h3 className="font-heading font-bold text-navy text-lg mb-2">{event.name}</h3>
                        <p className="text-dark/40 text-sm mb-4">
                          {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {event.eventDivisions.slice(0, 4).map(div => (
                            <span key={div.id} className="text-xs text-dark/30 bg-sand px-2 py-1 rounded">
                              {div.division.name}
                            </span>
                          ))}
                          {event.eventDivisions.length > 4 && (
                            <span className="text-xs text-dark/30">+{event.eventDivisions.length - 4}</span>
                          )}
                        </div>
                      </Link>
                    </ScaleCard>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  )
}
