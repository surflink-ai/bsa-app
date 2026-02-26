'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Athlete } from '@/lib/liveheats'

export function AthleteGrid({ athletes }: { athletes: Athlete[] }) {
  const [search, setSearch] = useState('')

  const filtered = athletes.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.nationality ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <input
        type="text"
        placeholder="Search athletes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-ocean mb-6"
      />
      <p className="text-white/40 text-xs mb-4">{filtered.length} athletes</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((a) => (
          <Link key={a.id} href={`/athletes/${a.id}`} className="block">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/8 transition-colors text-center">
              {a.image ? (
                <Image src={a.image} alt={a.name} width={64} height={64} className="w-16 h-16 rounded-full object-cover mx-auto mb-3" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/10 mx-auto mb-3 flex items-center justify-center text-2xl">
                  🏄
                </div>
              )}
              <p className="font-medium text-sm truncate">{a.name}</p>
              {a.nationality && (
                <p className="text-white/40 text-xs mt-0.5">{a.nationality}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-white/40 text-center py-12">No athletes found</p>
      )}
    </>
  )
}
