import { createClient } from '@/lib/supabase/server'
import { getOrg } from '@/lib/liveheats'
import { RankingsClient } from './RankingsClient'
import { RankingsClientLH } from './RankingsClientLH'

export const revalidate = 300

export default async function RankingsPage() {
  // Check if BSA Compete has any completed events
  let hasCompeteData = false
  let seasons: { id: string; name: string; year: number }[] = []
  let divisions: { id: string; name: string; short_name: string }[] = []

  try {
    const supabase = await createClient()
    const { data: events } = await supabase.from('comp_events').select('id').eq('status', 'complete').limit(1)
    hasCompeteData = (events && events.length > 0) || false

    if (hasCompeteData) {
      const { data: s } = await supabase.from('comp_seasons').select('id, name, year').eq('active', true).order('year', { ascending: false })
      seasons = s || []
      const { data: d } = await supabase.from('comp_divisions').select('id, name, short_name').eq('active', true).order('sort_order')
      divisions = d || []
    }
  } catch {}

  // If BSA Compete has data, use it
  if (hasCompeteData) {
    return <RankingsClient seasons={seasons} divisions={divisions} />
  }

  // Otherwise fall back to LiveHeats
  try {
    const org = await getOrg()
    return <RankingsClientLH series={org.series} />
  } catch {
    return <RankingsClient seasons={seasons} divisions={divisions} />
  }
}
