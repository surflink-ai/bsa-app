'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface RankingEntry {
  place: number
  total: number
  athlete: { id: string; name: string; image: string | null }
}

interface DivisionRanking {
  divisionName: string
  rankings: RankingEntry[]
}

interface SeriesRankingData {
  seriesId: string
  seriesName: string
  divisions: DivisionRanking[]
}

export function RankingsClient({ seriesData }: { seriesData: SeriesRankingData[] }) {
  const [seriesIdx, setSeriesIdx] = useState(seriesData.length - 1)
  const [divIdx, setDivIdx] = useState(0)

  const series = seriesData[seriesIdx]
  const division = series?.divisions[divIdx]

  return (
    <>
      {/* Series selector */}
      <select
        value={seriesIdx}
        onChange={(e) => { setSeriesIdx(Number(e.target.value)); setDivIdx(0) }}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-ocean mb-4 appearance-none"
      >
        {seriesData.map((s, i) => (
          <option key={s.seriesId} value={i} className="bg-navy">{s.seriesName}</option>
        ))}
      </select>

      {/* Division tabs */}
      {series && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {series.divisions.map((d, i) => (
            <button
              key={d.divisionName}
              onClick={() => setDivIdx(i)}
              className={`whitespace-nowrap px-3 py-1.5 text-sm rounded-full border transition-colors ${
                i === divIdx
                  ? 'bg-ocean text-white border-ocean'
                  : 'border-white/10 text-white/50 hover:text-white/80'
              }`}
            >
              {d.divisionName}
            </button>
          ))}
        </div>
      )}

      {/* Rankings table */}
      {division && (
        <div className="space-y-2">
          {division.rankings.map((r) => (
            <Link key={`${r.athlete.id}-${r.place}`} href={`/athletes/${r.athlete.id}`} className="block">
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm hover:bg-white/8 transition-colors">
                <span className={`w-6 text-center font-bold ${r.place <= 3 ? 'text-amber' : 'text-white/40'}`}>
                  {r.place}
                </span>
                {r.athlete.image ? (
                  <Image src={r.athlete.image} alt="" width={32} height={32} className="rounded-full w-8 h-8 object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10" />
                )}
                <span className="flex-1 font-medium">{r.athlete.name}</span>
                <span className="font-mono text-white/60">{r.total.toFixed(2)} pts</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
