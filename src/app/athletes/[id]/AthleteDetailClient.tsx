'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FadeIn, StaggerContainer, StaggerItem } from '../../components/AnimatedSection'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts'

interface Props {
  athlete: { id: string; name: string; nationality: string | null; image: string | null }
  competitions: {
    eventId: string; eventName: string; eventDate: string
    divisionName: string; place: number; total: number
    heatTotals: number[]
  }[]
  stats: { events: number; heats: number; bestScore: number; avgHeatTotal: number }
  heatTotals: number[]
}

export function AthleteDetailClient({ athlete, competitions, stats, heatTotals }: Props) {
  // Chart data: heat totals over time
  const lineData = heatTotals.map((total, i) => ({ heat: i + 1, total: Number(total.toFixed(2)) }))

  // Score distribution for bar chart
  const buckets: Record<string, number> = {}
  for (const t of heatTotals) {
    const bucket = `${Math.floor(t)}-${Math.floor(t) + 1}`
    buckets[bucket] = (buckets[bucket] || 0) + 1
  }
  const barData = Object.entries(buckets).map(([range, count]) => ({ range, count })).sort((a, b) => a.range.localeCompare(b.range))

  return (
    <div className="pb-24 md:pb-0">
      {/* Hero */}
      <section className="bg-navy pt-28 pb-12 md:pt-32 md:pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/athletes" className="text-white/30 text-sm hover:text-white/50 transition-colors mb-6 inline-block">← Athletes</Link>
          <FadeIn>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/10 overflow-hidden shrink-0">
                {athlete.image ? (
                  <Image src={athlete.image} alt={athlete.name} width={128} height={128} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20 font-heading text-4xl">{athlete.name.charAt(0)}</div>
                )}
              </div>
              <div>
                <h1 className="font-heading font-bold text-3xl md:text-5xl text-white mb-2">{athlete.name}</h1>
                <p className="text-white/50">{athlete.nationality || 'Barbados'}</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: 'Events', value: stats.events.toString() },
              { label: 'Heats', value: stats.heats.toString() },
              { label: 'Best Score', value: stats.bestScore.toFixed(2) },
              { label: 'Avg Heat Total', value: stats.avgHeatTotal.toFixed(2) },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm text-center">
                <div className="font-mono font-bold text-2xl text-navy">{s.value}</div>
                <div className="text-dark/40 text-xs uppercase tracking-wider mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Charts */}
        {lineData.length > 2 && (
          <FadeIn>
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-heading font-semibold text-navy mb-4">Heat Totals Over Time</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={lineData}>
                    <XAxis dataKey="heat" tick={{ fontSize: 10 }} stroke="#1A1A1A40" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#1A1A1A40" />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#1478B5" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-heading font-semibold text-navy mb-4">Score Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData}>
                    <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="#1A1A1A40" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#1A1A1A40" />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2BA5A0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </FadeIn>
        )}

        {/* Competition History */}
        <FadeIn>
          <h2 className="font-heading font-bold text-xl text-navy mb-6">Competition History</h2>
        </FadeIn>
        <StaggerContainer className="space-y-3">
          {competitions.map((comp, i) => (
            <StaggerItem key={`${comp.eventId}-${comp.divisionName}`}>
              <Link href={`/events/${comp.eventId}`} className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-semibold text-navy text-sm">{comp.eventName}</h3>
                    <p className="text-dark/40 text-xs mt-1">
                      {new Date(comp.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      {' • '}{comp.divisionName}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono font-bold text-lg ${comp.place <= 3 ? 'text-amber' : 'text-navy'}`}>
                      {comp.place === 1 ? '🥇' : comp.place === 2 ? '🥈' : comp.place === 3 ? '🥉' : `#${comp.place}`}
                    </div>
                    <div className="font-mono text-xs text-dark/40">{comp.total?.toFixed(2)} pts</div>
                  </div>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>
    </div>
  )
}
