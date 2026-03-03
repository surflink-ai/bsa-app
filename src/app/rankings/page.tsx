import { createClient } from '@/lib/supabase/server'
import { RankingsClient } from './RankingsClient'

export const revalidate = 300

export default async function RankingsPage() {
  let seasons: { id: string; name: string; year: number }[] = []
  let divisions: { id: string; name: string; short_name: string }[] = []

  try {
    const supabase = await createClient()
    const { data: s } = await supabase.from('comp_seasons').select('id, name, year').eq('active', true).order('year', { ascending: false })
    seasons = s || []
    const { data: d } = await supabase.from('comp_divisions').select('id, name, short_name').eq('active', true).order('sort_order')
    divisions = d || []
  } catch {}

  return <RankingsClient seasons={seasons} divisions={divisions} />
}
