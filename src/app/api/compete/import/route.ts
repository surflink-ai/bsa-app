import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST { event_division_id, csv: string }
// CSV format: Name,Email,Phone,Emergency Contact
// First row is header (skipped)
export async function POST(request: NextRequest) {
  try {
    const { event_division_id, csv } = await request.json()
    if (!event_division_id || !csv) return NextResponse.json({ error: 'event_division_id and csv required' }, { status: 400 })

    const lines = csv.trim().split('\n')
    if (lines.length < 2) return NextResponse.json({ error: 'CSV must have header + at least 1 row' }, { status: 400 })

    // Parse header
    const header = lines[0].toLowerCase().split(',').map((h: string) => h.trim().replace(/"/g, ''))
    const nameIdx = header.findIndex((h: string) => h.includes('name'))
    const emailIdx = header.findIndex((h: string) => h.includes('email'))
    const phoneIdx = header.findIndex((h: string) => h.includes('phone'))
    const emergencyIdx = header.findIndex((h: string) => h.includes('emergency'))

    if (nameIdx === -1) return NextResponse.json({ error: 'CSV must have a "Name" column' }, { status: 400 })

    let imported = 0, skipped = 0, errors = 0

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c: string) => c.trim().replace(/^"|"$/g, ''))
      const name = cols[nameIdx]
      if (!name) continue

      // Check duplicate
      const { data: existing } = await supabase
        .from('comp_registrations')
        .select('id')
        .eq('event_division_id', event_division_id)
        .ilike('athlete_name', name)
        .single()

      if (existing) { skipped++; continue }

      // Try to find athlete in registry
      let athleteId: string | null = null
      const { data: athletes } = await supabase
        .from('athletes')
        .select('id')
        .ilike('name', name)
        .limit(1)

      if (athletes?.length) athleteId = athletes[0].id

      const { error } = await supabase.from('comp_registrations').insert({
        event_division_id,
        athlete_id: athleteId,
        athlete_name: name,
        email: emailIdx >= 0 ? cols[emailIdx] || null : null,
        phone: phoneIdx >= 0 ? cols[phoneIdx] || null : null,
        emergency_contact: emergencyIdx >= 0 ? cols[emergencyIdx] || null : null,
        status: 'confirmed',
        payment_status: 'free',
      })

      if (error) errors++
      else imported++
    }

    return NextResponse.json({
      message: `Imported ${imported}, skipped ${skipped} duplicates, ${errors} errors`,
      imported, skipped, errors,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
