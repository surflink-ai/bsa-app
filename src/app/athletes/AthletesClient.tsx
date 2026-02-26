'use client'

import { useState, useMemo } from 'react'

import Link from 'next/link'
import { FadeIn, StaggerContainer, StaggerItem, ScaleCard } from '../components/AnimatedSection'

interface Athlete {
  id: string
  name: string
  nationality: string | null
  image: string | null
}

export function AthletesClient({ athletes }: { athletes: Athlete[] }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return athletes
    const q = search.toLowerCase()
    return athletes.filter(a => a.name.toLowerCase().includes(q))
  }, [search, athletes])

  return (
    <div className="pb-24 md:pb-0">
      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-32 md:pb-20" style={{ backgroundColor: '#0A2540' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <FadeIn>
            <h1 className="font-heading font-bold text-4xl md:text-6xl mb-4" style={{ color: '#ffffff' }}>ATHLETES</h1>
            <p className="text-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>{athletes.length} athletes competing in BSA events</p>
          </FadeIn>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 md:px-8 py-8">
        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search athletes..."
            className="w-full max-w-md bg-white rounded-full px-6 py-3 text-sm focus:outline-none focus:ring-2"
            style={{ border: '1px solid rgba(26,26,26,0.1)', color: '#1A1A1A' }}
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-center py-20" style={{ color: 'rgba(26,26,26,0.4)' }}>No athletes found.</p>
        ) : (
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {filtered.map(athlete => (
              <StaggerItem key={athlete.id}>
                <ScaleCard>
                  <Link href={`/athletes/${athlete.id}`} className="block text-center group">
                    <div className="aspect-square rounded-2xl overflow-hidden mb-3 mx-auto" style={{ backgroundColor: '#F2EDE4' }}>
                      {athlete.image ? (
                        <img src={athlete.image} alt={athlete.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-heading text-3xl" style={{ color: 'rgba(10,37,64,0.2)' }}>
                          {athlete.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <h3 className="font-heading font-semibold text-sm transition-colors" style={{ color: '#0A2540' }}>{athlete.name}</h3>
                    {athlete.nationality && (
                      <p className="text-xs" style={{ color: 'rgba(26,26,26,0.4)' }}>{athlete.nationality}</p>
                    )}
                  </Link>
                </ScaleCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </section>
    </div>
  )
}
