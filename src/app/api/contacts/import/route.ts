import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: import athletes from existing athletes table as contacts
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get all athletes
  const { data: athletes, error: athErr } = await supabase
    .from('athletes')
    .select('id, name, email, phone, image_url')
    .order('name')

  if (athErr) return NextResponse.json({ error: athErr.message }, { status: 500 })
  if (!athletes?.length) return NextResponse.json({ imported: 0, skipped: 0 })

  // Get existing contacts to avoid duplicates (by athlete_id)
  const { data: existing } = await supabase.from('contacts').select('athlete_id').not('athlete_id', 'is', null)
  const existingIds = new Set((existing || []).map(c => c.athlete_id))

  const toInsert = athletes
    .filter(a => !existingIds.has(a.id))
    .map(a => ({
      name: a.name,
      phone: a.phone || null,
      email: a.email || null,
      type: 'athlete' as const,
      athlete_id: a.id,
      active: true,
    }))

  if (toInsert.length === 0) {
    return NextResponse.json({ imported: 0, skipped: athletes.length })
  }

  const { error: insErr } = await supabase.from('contacts').insert(toInsert)
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  return NextResponse.json({ imported: toInsert.length, skipped: athletes.length - toInsert.length })
}
