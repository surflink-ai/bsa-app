'use client'


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
  const lineData = heatTotals.map((total, i) => ({ heat: i + 1, total: Number(total.toFixed(2)) }))

  const buckets: Record<string, number> = {}
  for (const t of heatTotals) {
    const bucket = `${Math.floor(t)}-${Math.floor(t) + 1}`
    buckets[bucket] = (buckets[bucket] || 0) + 1
  }
  const barData = Object.entries(buckets).map(([range, count]) => ({ range, count })).sort((a, b) => a.range.localeCompare(b.range))

  return (
    <div className="pb-24 md:pb-0">
      {/* Hero */}
      <section className="pt-28 pb-12 md:pt-32 md:pb-16" style={{ backgroundColor: '#0A2540' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <Link href="/athletes" className="text-sm transition-colors mb-6 inline-block" style={{ color: 'rgba(255,255,255,0.3)' }}>← Athletes</Link>
          <FadeIn>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                {athlete.image ? (
                  <img src={athlete.image} alt={athlete.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-heading text-4xl" style={{ color: 'rgba(255,255,255,0.2)' }}>{athlete.name.charAt(0)}</div>
                )}
              </div>
              <div>
                <h1 className="font-heading font-bold text-3xl md:text-5xl mb-2" style={{ color: '#ffffff' }}>{athlete.name}</h1>
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>{athlete.nationality || 'Barbados'}</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 md:px-8 py-8">
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
                <div className="font-mono font-bold text-2xl" style={{ color: '#0A2540' }}>{s.value}</div>
                <div className="text-xs uppercase tracking-wider mt-1" style={{ color: 'rgba(26,26,26,0.4)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Charts */}
        {lineData.length > 2 && (
          <FadeIn>
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-heading font-semibold mb-4" style={{ color: '#0A2540' }}>Heat Totals Over Time</h3>
                <ResponsiveContainer width="100%">
                  <LineChart data={lineData}>
                    <XAxis dataKey="heat" tick={{ fontSize: 10 }} stroke="#1A1A1A40" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#1A1A1A40" />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#1478B5" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-heading font-semibold mb-4" style={{ color: '#0A2540' }}>Score Distribution</h3>
                <ResponsiveContainer width="100%">
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
          <h2 className="font-heading font-bold text-xl mb-6" style={{ color: '#0A2540' }}>Competition History</h2>
        </FadeIn>
        <StaggerContainer className="space-y-3">
          {competitions.map((comp) => (
            <StaggerItem key={`${comp.eventId}-${comp.divisionName}`}>
              <Link href={`/events/${comp.eventId}`} className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-semibold text-sm" style={{ color: '#0A2540' }}>{comp.eventName}</h3>
                    <p className="text-xs mt-1" style={{ color: 'rgba(26,26,26,0.4)' }}>
                      {new Date(comp.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      {' • '}{comp.divisionName}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-lg" style={{ color: comp.place <= 3 ? '#D4944A' : '#0A2540' }}>
                      {comp.place === 1 ? '🥇' : comp.place === 2 ? '🥈' : comp.place === 3 ? '🥉' : `#${comp.place}`}
                    </div>
                    <div className="font-mono text-xs" style={{ color: 'rgba(26,26,26,0.4)' }}>{comp.total?.toFixed(2)} pts</div>
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
