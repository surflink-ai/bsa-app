import { getEvent } from '@/lib/liveheats'
import type { EventDivisionFull, Heat, HeatResult, RideScore } from '@/lib/liveheats'
import Image from 'next/image'
import { EventDetailClient } from './event-detail-client'

export const revalidate = 300

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await getEvent(id)

  return (
    <div className="pb-20 px-4 md:px-8 pt-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-white/40 text-sm mb-1">
          {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
        <div className="flex items-center gap-2 text-sm text-white/50">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
            event.status === 'upcoming' ? 'bg-teal/20 text-teal' :
            event.status === 'live' ? 'bg-red-500/20 text-red-400' :
            'bg-white/10 text-white/60'
          }`}>
            {event.status === 'results_published' ? 'Completed' : event.status}
          </span>
        </div>
      </div>

      <EventDetailClient divisions={event.eventDivisions} />
    </div>
  )
}
