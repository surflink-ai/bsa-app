'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
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
      <section className="bg-navy pt-28 pb-16 md:pt-32 md:pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn>
            <h1 className="font-heading font-bold text-4xl md:text-6xl text-white mb-4">ATHLETES</h1>
            <p className="text-white/50 text-lg">{athletes.length} athletes competing in BSA events</p>
          </FadeIn>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search athletes..."
            className="w-full max-w-md bg-white border border-dark/10 rounded-full px-6 py-3 text-dark placeholder-dark/30 focus:outline-none focus:ring-2 focus:ring-ocean/30 text-sm"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-dark/40 text-center py-20">No athletes found.</p>
        ) : (
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {filtered.map(athlete => (
              <StaggerItem key={athlete.id}>
                <ScaleCard>
                  <Link href={`/athletes/${athlete.id}`} className="block text-center group">
                    <div className="aspect-square rounded-2xl bg-sand overflow-hidden mb-3 mx-auto">
                      {athlete.image ? (
                        <Image src={athlete.image} alt={athlete.name} width={200} height={200} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-navy/20 font-heading text-3xl">
                          {athlete.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <h3 className="font-heading font-semibold text-sm text-navy group-hover:text-ocean transition-colors">{athlete.name}</h3>
                    {athlete.nationality && (
                      <p className="text-dark/40 text-xs">{athlete.nationality}</p>
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
