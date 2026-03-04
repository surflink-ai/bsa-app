import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/compete/export?event_id=xxx&type=registrations|results|heats
export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get('event_id')
  const type = request.nextUrl.searchParams.get('type') || 'registrations'

  if (!eventId) return NextResponse.json({ error: 'event_id required' }, { status: 400 })

  if (type === 'registrations') {
    const { data: eds } = await supabase
      .from('comp_event_divisions')
      .select(`
        division:comp_divisions(name),
        registrations:comp_registrations(athlete_name, seed_rank, status, payment_status, email, phone, emergency_contact, created_at)
      `)
      .eq('event_id', eventId)

    if (!eds) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const rows = ['Division,Seed,Athlete,Status,Payment,Email,Phone,Emergency Contact,Registered']
    for (const ed of eds) {
      const divName = (ed.division as any)?.name || ''
      for (const reg of (ed.registrations as any[]) || []) {
        rows.push([
          divName, reg.seed_rank || '', reg.athlete_name, reg.status, reg.payment_status,
          reg.email || '', reg.phone || '', reg.emergency_contact || '',
          reg.created_at ? new Date(reg.created_at).toISOString().split('T')[0] : '',
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      }
    }

    return new NextResponse(rows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="registrations-${eventId}.csv"`,
      },
    })
  }

  if (type === 'results') {
    const { data: eds } = await supabase
      .from('comp_event_divisions')
      .select(`
        division:comp_divisions(name),
        rounds:comp_rounds(
          name,
          heats:comp_heats(
            heat_number, status,
            athletes:comp_heat_athletes(athlete_name, jersey_color, result_position, seed_position)
          )
        )
      `)
      .eq('event_id', eventId)

    if (!eds) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const rows = ['Division,Round,Heat,Athlete,Jersey,Seed,Result']
    for (const ed of eds) {
      const divName = (ed.division as any)?.name || ''
      for (const round of (ed.rounds as any[]) || []) {
        for (const heat of round.heats || []) {
          for (const a of heat.athletes || []) {
            rows.push([
              divName, round.name, heat.heat_number, a.athlete_name,
              a.jersey_color || '', a.seed_position || '', a.result_position || '',
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
          }
        }
      }
    }

    return new NextResponse(rows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="results-${eventId}.csv"`,
      },
    })
  }

  return NextResponse.json({ error: 'Invalid type. Use registrations or results.' }, { status: 400 })
}
