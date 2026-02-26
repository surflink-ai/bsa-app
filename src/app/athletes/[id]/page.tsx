import { getOrg, getEvent } from '@/lib/liveheats'
import type { Athlete } from '@/lib/liveheats'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'

export const revalidate = 300

interface CompetitionEntry {
  eventName: string
  eventId: string
  division: string
  round: string
  heatPosition: number
  score: number
  place: number
}

export default async function AthleteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const org = await getOrg()

  let athlete: Athlete | null = null
  const history: CompetitionEntry[] = []
  const allScores: number[] = []
  const eventIds = new Set<string>()

  await Promise.all(
    org.events.map(async (e) => {
      try {
        const full = await getEvent(e.id)
        for (const div of full.eventDivisions) {
          for (const heat of div.heats ?? []) {
            for (const r of heat.result ?? []) {
              if (r.competitor.athlete.id === id) {
                if (!athlete) athlete = r.competitor.athlete
                eventIds.add(e.id)
                allScores.push(r.total)
                history.push({
                  eventName: full.name,
                  eventId: full.id,
                  division: div.division.name,
                  round: heat.round,
                  heatPosition: heat.position,
                  score: r.total,
                  place: r.place,
                })
              }
            }
          }
        }
      } catch {
        // skip
      }
    })
  )

  if (!athlete) {
    return (
      <div className="pb-20 px-4 pt-16 text-center">
        <p className="text-white/40">Athlete not found</p>
      </div>
    )
  }

  const a: Athlete = athlete
  const bestScore = allScores.length > 0 ? Math.max(...allScores) : 0
  const avgScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0

  // Fetch enriched profile from Supabase
  let enriched: { bio?: string; stance?: string; home_break?: string; instagram?: string; claimed_by?: string } | null = null
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('athlete_profiles')
      .select('bio, stance, home_break, instagram, claimed_by')
      .eq('liveheats_id', id)
      .single()
    enriched = data
  } catch {
    // Supabase not configured yet — ignore
  }

  return (
    <div className="pb-20 px-4 md:px-8 pt-8">
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-8">
        {a.image ? (
          <Image src={a.image} alt={a.name} width={80} height={80} className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-3xl">🏄</div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{a.name}</h1>
          {a.nationality && <p className="text-white/50">{a.nationality}</p>}
          {enriched?.stance && enriched.stance !== 'unknown' && (
            <p className="text-white/40 text-sm">{enriched.stance} · {enriched.home_break ?? ''}</p>
          )}
        </div>
      </div>

      {/* Enriched bio */}
      {enriched?.bio && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <p className="text-sm text-white/70">{enriched.bio}</p>
          {enriched.instagram && (
            <a href={`https://instagram.com/${enriched.instagram}`} target="_blank" rel="noopener noreferrer" className="text-ocean text-xs mt-2 inline-block hover:text-ocean/80">
              @{enriched.instagram}
            </a>
          )}
        </div>
      )}

      {/* Claim CTA */}
      {!enriched?.claimed_by && (
        <Link href="/profile/claim" className="block text-center text-ocean text-sm hover:text-ocean/80 mb-6">
          Are you {a.name}? Claim this profile →
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Events', value: eventIds.size.toString() },
          { label: 'Best Score', value: bestScore.toFixed(2) },
          { label: 'Avg Heat', value: avgScore.toFixed(2) },
        ].map((s) => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-xl font-bold font-mono">{s.value}</div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Competition History */}
      <h2 className="text-lg font-bold mb-3">Competition History</h2>
      {history.length === 0 ? (
        <p className="text-white/40">No competition data</p>
      ) : (
        <div className="space-y-2">
          {history.map((h, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{h.eventName}</span>
                <span className={`font-bold ${h.place <= 3 ? 'text-amber' : 'text-white/40'}`}>#{h.place}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span>{h.division}</span>
                <span>·</span>
                <span>{h.round} H{h.heatPosition}</span>
                <span className="ml-auto font-mono text-white/60">{h.score.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
