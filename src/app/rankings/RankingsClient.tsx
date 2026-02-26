'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { FadeIn } from '../components/AnimatedSection'

interface SeriesData {
  id: string; name: string
  divisions: {
    name: string
    rankings: { place: number; total: number; athleteId: string; athleteName: string; athleteImage: string | null }[]
  }[]
}

export function RankingsClient({ series }: { series: SeriesData[] }) {
  const [selectedSeries, setSelectedSeries] = useState(series.length - 1)
  const [selectedDiv, setSelectedDiv] = useState(0)

  const currentSeries = series[selectedSeries]
  const currentDivision = currentSeries?.divisions[selectedDiv]
  const maxPoints = currentDivision?.rankings[0]?.total || 1

  return (
    <div className="pb-24 md:pb-0">
      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-32 md:pb-20" style={{ backgroundColor: '#0A2540' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <FadeIn>
            <h1 className="font-heading font-bold text-4xl md:text-6xl mb-4" style={{ color: '#ffffff' }}>RANKINGS</h1>
            <p className="text-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>SOTY Championship Standings</p>
          </FadeIn>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 md:px-8 py-8">
        {/* Series Selector */}
        {series.length > 1 && (
          <div className="mb-6">
            <select
              value={selectedSeries}
              onChange={e => { setSelectedSeries(Number(e.target.value)); setSelectedDiv(0) }}
              className="bg-white rounded-full px-5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2"
              style={{ border: '1px solid rgba(26,26,26,0.1)', color: '#0A2540' }}
            >
              {series.map((s, i) => (
                <option key={s.id} value={i}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Division tabs */}
        {currentSeries && currentSeries.divisions.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8">
            {currentSeries.divisions.map((div, idx) => (
              <button
                key={div.name}
                onClick={() => setSelectedDiv(idx)}
                className="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={idx === selectedDiv ? { backgroundColor: '#0A2540', color: '#ffffff' } : { backgroundColor: '#F2EDE4', color: 'rgba(26,26,26,0.5)' }}
              >
                {div.name}
              </button>
            ))}
          </div>
        )}

        {/* Rankings */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedSeries}-${selectedDiv}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {!currentDivision || currentDivision.rankings.length === 0 ? (
              <p className="text-center py-20" style={{ color: 'rgba(26,26,26,0.4)' }}>No rankings available for this series.</p>
            ) : (
              <div className="space-y-3">
                {currentDivision.rankings.map((r, i) => (
                  <motion.div
                    key={r.athleteId}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className="bg-white rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-mono font-bold w-8 text-center" style={{ color: r.place <= 3 ? '#D4944A' : 'rgba(26,26,26,0.3)' }}>
                        {r.place}
                      </span>
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ backgroundColor: '#F2EDE4' }}>
                        {r.athleteImage ? (
                          <Image src={r.athleteImage} alt="" width={40} height={40} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-heading" style={{ color: 'rgba(10,37,64,0.2)' }}>{r.athleteName.charAt(0)}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/athletes/${r.athleteId}`} className="font-heading font-semibold text-sm transition-colors block truncate" style={{ color: '#0A2540' }}>
                          {r.athleteName}
                        </Link>
                        <div className="mt-1.5 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F2EDE4' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(r.total / maxPoints) * 100}%` }}
                            transition={{ delay: i * 0.05 + 0.3, duration: 0.6, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: r.place === 1 ? '#D4944A' : r.place <= 3 ? '#1478B5' : 'rgba(43,165,160,0.5)' }}
                          />
                        </div>
                      </div>
                      <span className="font-mono text-sm font-semibold" style={{ color: '#0A2540' }}>{r.total.toFixed(2)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  )
}
