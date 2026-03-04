import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getOrg, getEvent } from '@/lib/liveheats'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    const org = await getOrg()
    const past = org.events
      .filter(e => e.status === 'results_published')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const athleteMap = new Map<string, {
      liveheats_id: string
      name: string
      image_url: string | null
      nationality: string | null
    }>()

    // Fetch last 15 events for comprehensive athlete list
    const results = await Promise.allSettled(
      past.slice(0, 15).map(e => getEvent(e.id))
    )

    for (const r of results) {
      if (r.status !== 'fulfilled') continue
      for (const d of r.value.eventDivisions) {
        for (const rk of d.ranking || []) {
          const a = rk.competitor.athlete
          if (!athleteMap.has(a.id)) {
            athleteMap.set(a.id, {
              liveheats_id: a.id,
              name: a.name,
              image_url: a.image || null,
              nationality: a.nationality || 'Barbados',
            })
          } else if (a.image && !athleteMap.get(a.id)!.image_url) {
            athleteMap.get(a.id)!.image_url = a.image
          }
        }
        // Also check heat results for athletes not in rankings
        if ('heats' in d) {
          for (const heat of (d as any).heats || []) {
            for (const hr of heat.result || []) {
              const a = hr.competitor.athlete
              if (!athleteMap.has(a.id)) {
                athleteMap.set(a.id, {
                  liveheats_id: a.id,
                  name: a.name,
                  image_url: a.image || null,
                  nationality: a.nationality || 'Barbados',
                })
              }
            }
          }
        }
      }
    }

    const athletes = [...athleteMap.values()]

    // Upsert — skip existing (by liveheats_id)
    let imported = 0
    let skipped = 0

    for (const athlete of athletes) {
      const { data: existing } = await supabase
        .from('athletes')
        .select('id')
        .eq('liveheats_id', athlete.liveheats_id)
        .single()

      if (existing) {
        // Update image if we have one and they don't
        if (athlete.image_url) {
          await supabase
            .from('athletes')
            .update({ image_url: athlete.image_url, updated_at: new Date().toISOString() })
            .eq('id', existing.id)
            .is('image_url', null)
        }
        skipped++
      } else {
        await supabase.from('athletes').insert(athlete)
        imported++
      }
    }

    return NextResponse.json({
      success: true,
      total: athletes.length,
      imported,
      skipped,
      message: `Imported ${imported} new athletes, ${skipped} already existed`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
