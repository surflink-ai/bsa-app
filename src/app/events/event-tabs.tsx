'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { BSAEvent } from '@/lib/liveheats'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    upcoming: { label: 'Upcoming', cls: 'bg-teal/20 text-teal' },
    live: { label: 'Live', cls: 'bg-red-500/20 text-red-400' },
    results_published: { label: 'Completed', cls: 'bg-white/10 text-white/60' },
  }
  const s = map[status] ?? { label: status, cls: 'bg-white/10 text-white/40' }
  return <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
}

function EventCard({ event }: { event: BSAEvent }) {
  return (
    <Link href={`/events/${event.id}`} className="block">
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/8 transition-colors">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold">{event.name}</h3>
          <StatusBadge status={event.status} />
        </div>
        <p className="text-white/40 text-sm mb-1">
          {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        {event.location && (
          <p className="text-white/30 text-xs">📍 {event.location.formattedAddress}</p>
        )}
        {event.eventDivisions.length > 0 && (
          <p className="text-white/30 text-xs mt-1">{event.eventDivisions.length} division{event.eventDivisions.length !== 1 ? 's' : ''}</p>
        )}
      </div>
    </Link>
  )
}

export function EventTabs({ upcoming, past }: { upcoming: BSAEvent[]; past: BSAEvent[] }) {
  const [tab, setTab] = useState<'upcoming' | 'past'>(upcoming.length > 0 ? 'upcoming' : 'past')
  const events = tab === 'upcoming' ? upcoming : past

  return (
    <>
      <div className="flex gap-1 bg-white/5 rounded-lg p-1 mb-6">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === t ? 'bg-ocean text-white' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {t === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
          </button>
        ))}
      </div>
      {events.length === 0 ? (
        <p className="text-white/40 text-center py-12">No {tab} events</p>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </>
  )
}
