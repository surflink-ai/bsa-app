import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAdmin } from '@/lib/supabase/admin'

const CONTACT_TYPES = ['athlete', 'parent', 'coach', 'sponsor', 'committee', 'other']

// GET: list contacts with optional filters
export async function GET(req: NextRequest) {
  const gate = await requireApiAdmin()
  if (gate instanceof NextResponse) return gate
  const supabase = await createClient()

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const tag = searchParams.get('tag')
  const search = searchParams.get('search')

  let query = supabase.from('contacts').select('*').eq('active', true).order('name')

  if (type) query = query.eq('type', type)
  if (tag) query = query.contains('tags', [tag])
  if (search) query = query.ilike('name', `%${search.slice(0, 100)}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to load contacts' }, { status: 500 })
  return NextResponse.json({ contacts: data })
}

// POST: create contact
export async function POST(req: NextRequest) {
  const gate = await requireApiAdmin()
  if (gate instanceof NextResponse) return gate
  const supabase = await createClient()

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { name, phone, email, type, division_ids, tags, notes } = body

  if (!name || typeof name !== 'string' || name.length > 200) {
    return NextResponse.json({ error: 'Valid name required' }, { status: 400 })
  }
  if (type && !CONTACT_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid contact type' }, { status: 400 })
  }

  // Normalize phone to E.164. Barbados numbers use the +1 country code (NANP).
  let normalizedPhone: string | null = null
  if (phone && typeof phone === 'string') {
    const digits = phone.replace(/[\s\-()]/g, '')
    normalizedPhone = digits.startsWith('+') ? digits : `+1${digits}`
    if (!/^\+\d{7,15}$/.test(normalizedPhone)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }
  }

  const { data, error } = await supabase.from('contacts').insert({
    name, phone: normalizedPhone, email: email || null, type: type || 'athlete',
    division_ids: Array.isArray(division_ids) ? division_ids : [],
    tags: Array.isArray(tags) ? tags : [], notes: notes || null,
  }).select().single()

  if (error) return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  return NextResponse.json({ contact: data })
}
