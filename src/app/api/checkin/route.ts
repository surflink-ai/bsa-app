import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

// GET: list checkins for an event
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const eventId = new URL(req.url).searchParams.get('event_id')
  if (!eventId) return NextResponse.json({ error: 'event_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('event_checkins')
    .select('*')
    .eq('event_id', eventId)
    .order('athlete_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ checkins: data })
}

// POST: generate checkin QR codes for an event, or check in a single athlete
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Check in by QR code
  if (body.qr_code) {
    const { data: checkin, error } = await supabase
      .from('event_checkins')
      .update({ checked_in: true, checked_in_at: new Date().toISOString(), checked_in_by: user.id })
      .eq('qr_code', body.qr_code)
      .eq('checked_in', false)
      .select()
      .single()

    if (error || !checkin) return NextResponse.json({ error: 'QR code not found or already checked in' }, { status: 404 })
    return NextResponse.json({ checkin, message: `${checkin.athlete_name} checked in!` })
  }

  // Generate QR codes for event registrations
  if (body.event_id && body.generate) {
    // Get registered athletes (from contacts or athletes table)
    const { data: athletes } = await supabase.from('athletes').select('id, name').order('name')
    if (!athletes?.length) return NextResponse.json({ generated: 0 })

    // Check existing
    const { data: existing } = await supabase.from('event_checkins').select('athlete_id').eq('event_id', body.event_id)
    const existingIds = new Set((existing || []).map(c => c.athlete_id))

    const toInsert = athletes
      .filter(a => !existingIds.has(a.id))
      .map(a => ({
        event_id: body.event_id,
        athlete_id: a.id,
        athlete_name: a.name,
        qr_code: `BSA-${body.event_id}-${nanoid(8)}`,
      }))

    if (toInsert.length > 0) {
      await supabase.from('event_checkins').insert(toInsert)
    }

    return NextResponse.json({ generated: toInsert.length, total: athletes.length })
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}
