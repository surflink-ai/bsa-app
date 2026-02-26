'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface AthleteResult {
  id: string
  name: string
  nationality: string | null
  image: string | null
}

export default function ClaimPage() {
  const [search, setSearch] = useState('')
  const [athletes, setAthletes] = useState<AthleteResult[]>([])
  const [allAthletes, setAllAthletes] = useState<AthleteResult[]>([])
  const [selected, setSelected] = useState<AthleteResult | null>(null)
  const [proof, setProof] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetch('/api/athletes')
      .then(r => r.json())
      .then(data => { setAllAthletes(data.athletes || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!search.trim()) { setAthletes([]); return }
    const q = search.toLowerCase()
    setAthletes(allAthletes.filter(a => a.name.toLowerCase().includes(q)).slice(0, 20))
  }, [search, allAthletes])

  async function handleClaim() {
    if (!selected) return
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    await supabase.from('athlete_claims').insert({
      user_id: user.id,
      liveheats_athlete_id: selected.id,
      athlete_name: selected.name,
      proof,
    })
    setSubmitted(true)
    setTimeout(() => router.push('/profile'), 2000)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-warm-white">
        <div className="text-center">
          <div className="text-4xl mb-4">🤙</div>
          <h1 className="font-heading text-2xl font-bold text-navy mb-2">Claim Submitted</h1>
          <p className="text-dark/50">A BSA admin will review your request. Redirecting...</p>
        </div>
      </div>
    )
  }

  const inputClass = "w-full bg-white border border-dark/10 rounded-xl px-4 py-3 text-dark placeholder-dark/30 focus:outline-none focus:ring-2 focus:ring-ocean/30"

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 pt-24 md:pt-28">
      <a href="/profile" className="text-ocean text-sm hover:underline mb-4 inline-block">← Back to Profile</a>
      <h1 className="font-heading text-2xl font-bold text-navy mb-2">Claim Your Athlete Profile</h1>
      <p className="text-dark/50 text-sm mb-6">
        Search for your name and claim your profile to add your bio, photos, and more.
      </p>

      {!selected ? (
        <>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClass + ' text-base mb-4'}
            placeholder="Search by name..."
            autoFocus
          />

          {loading ? (
            <div className="text-dark/40 text-sm">Loading athletes...</div>
          ) : athletes.length > 0 ? (
            <div className="space-y-2">
              {athletes.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className="w-full flex items-center gap-3 bg-white hover:bg-sand rounded-xl px-4 py-3 transition-colors text-left shadow-sm"
                >
                  {a.image ? (
                    <Image src={a.image} alt={a.name} width={40} height={40} className="rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-sand flex items-center justify-center text-navy/30 text-sm font-medium">
                      {a.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-navy">{a.name}</div>
                    {a.nationality && <div className="text-xs text-dark/40">{a.nationality}</div>}
                  </div>
                </button>
              ))}
            </div>
          ) : search.trim() ? (
            <div className="text-dark/40 text-sm">No athletes found matching &ldquo;{search}&rdquo;</div>
          ) : null}
        </>
      ) : (
        <div>
          <div className="bg-white rounded-xl p-4 mb-6 flex items-center gap-4 shadow-sm">
            {selected.image ? (
              <Image src={selected.image} alt={selected.name} width={48} height={48} className="rounded-full" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-sand flex items-center justify-center text-lg font-medium text-navy/30">
                {selected.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="font-semibold text-navy">{selected.name}</div>
              {selected.nationality && <div className="text-xs text-dark/40">{selected.nationality}</div>}
            </div>
            <button onClick={() => setSelected(null)} className="ml-auto text-sm text-dark/40 hover:text-dark">Change</button>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-dark/50 mb-1">How can we verify this is you? (optional)</label>
            <textarea
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              rows={3}
              className={inputClass + ' text-sm resize-none'}
              placeholder="e.g. your Instagram handle, phone number, or any info that helps verify your identity"
            />
          </div>

          <button
            onClick={handleClaim}
            disabled={submitting}
            className="bg-ocean hover:bg-ocean/80 text-white font-semibold rounded-xl px-6 py-3 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Claim'}
          </button>
        </div>
      )}
    </div>
  )
}
