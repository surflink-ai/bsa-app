import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: list contacts with optional filters
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const tag = searchParams.get('tag')
  const search = searchParams.get('search')

  let query = supabase.from('contacts').select('*').eq('active', true).order('name')
  
  if (type) query = query.eq('type', type)
  if (tag) query = query.contains('tags', [tag])
  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contacts: data })
}

// POST: create contact
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, phone, email, type, division_ids, tags, notes } = body

  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  // Normalize phone to E.164
  let normalizedPhone = phone?.replace(/[\s\-\(\)]/g, '') || null
  if (normalizedPhone && !normalizedPhone.startsWith('+')) {
    normalizedPhone = `+1${normalizedPhone}` // default US/Canada
  }

  const { data, error } = await supabase.from('contacts').insert({
    name, phone: normalizedPhone, email, type: type || 'athlete',
    division_ids: division_ids || [], tags: tags || [], notes,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contact: data })
}
