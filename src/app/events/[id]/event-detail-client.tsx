'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { EventDivisionFull, Heat, HeatResult, RideScore } from '@/lib/liveheats'

function RideScores({ rides, competitorId }: { rides: Record<string, RideScore[]>; competitorId: string }) {
  const athleteRides = rides[competitorId] ?? []
  if (athleteRides.length === 0) return <span className="text-white/30">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {athleteRides.map((r, i) => (
        <span
          key={i}
          className={`text-xs px-1.5 py-0.5 rounded font-mono ${
            r.scoring_ride ? 'bg-amber/20 text-amber font-bold' : 'bg-white/5 text-white/50'
          }`}
        >
          {r.total.toFixed(1)}
        </span>
      ))}
    </div>
  )
}

function HeatCard({ heat }: { heat: Heat }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white/3 border border-white/5 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
        <span className="text-sm font-medium">Heat {heat.position}</span>
        <span className="text-white/30 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2">
          {heat.result.map((r, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className={`w-5 text-center font-bold ${r.place === 1 ? 'text-amber' : 'text-white/40'}`}>
                {r.place}
              </span>
              {r.competitor.athlete.image ? (
                <Image src={r.competitor.athlete.image} alt="" width={24} height={24} className="rounded-full w-6 h-6 object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-white/10" />
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate">{r.competitor.athlete.name}</p>
                <RideScores rides={r.rides ?? {}} competitorId={r.competitor.athlete.id} />
              </div>
              <span className="font-mono text-white/60 text-xs">{r.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function EventDetailClient({ divisions }: { divisions: EventDivisionFull[] }) {
  const [activeDivIdx, setActiveDivIdx] = useState(0)
  const div = divisions[activeDivIdx]

  if (!divisions.length) return <p className="text-white/40">No divisions</p>

  // Group heats by round
  const rounds = new Map<string, Heat[]>()
  for (const h of div?.heats ?? []) {
    const list = rounds.get(h.round) ?? []
    list.push(h)
    rounds.set(h.round, list)
  }

  return (
    <>
      {/* Division tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {divisions.map((d, i) => (
          <button
            key={d.id}
            onClick={() => setActiveDivIdx(i)}
            className={`whitespace-nowrap px-3 py-1.5 text-sm rounded-full border transition-colors ${
              i === activeDivIdx
                ? 'bg-ocean text-white border-ocean'
                : 'border-white/10 text-white/50 hover:text-white/80'
            }`}
          >
            {d.division.name}
          </button>
        ))}
      </div>

      {/* Rankings */}
      {div?.ranking && div.ranking.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">Rankings</h2>
          <div className="space-y-2">
            {div.ranking.map((r, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3 text-sm">
                <span className={`w-6 text-center font-bold ${r.place <= 3 ? 'text-amber' : 'text-white/40'}`}>
                  {r.place}
                </span>
                {r.competitor.athlete.image ? (
                  <Image src={r.competitor.athlete.image} alt="" width={32} height={32} className="rounded-full w-8 h-8 object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10" />
                )}
                <span className="flex-1 font-medium">{r.competitor.athlete.name}</span>
                <span className="font-mono text-white/60">{r.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Heats */}
      {rounds.size > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-3">Heats</h2>
          {Array.from(rounds.entries()).map(([round, heats]) => (
            <div key={round} className="mb-4">
              <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-2">{round}</h3>
              <div className="space-y-2">
                {heats
                  .sort((a, b) => a.position - b.position)
                  .map((h) => (
                    <HeatCard key={h.id} heat={h} />
                  ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </>
  )
}
