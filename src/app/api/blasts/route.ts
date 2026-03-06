import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: list blasts
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('blast_messages')
    .select('*, blast_recipients(count)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ blasts: data })
}

// POST: create & optionally send a blast
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, body: messageBody, audience_filter, scheduled_at, send_now } = body

  if (!title || !messageBody) {
    return NextResponse.json({ error: 'Title and body required' }, { status: 400 })
  }

  // Build recipient list based on audience filter
  let contactQuery = supabase.from('contacts').select('*').eq('active', true).eq('opted_out', false)
  
  if (audience_filter?.types?.length) {
    contactQuery = contactQuery.in('type', audience_filter.types)
  }
  if (audience_filter?.tags?.length) {
    contactQuery = contactQuery.overlaps('tags', audience_filter.tags)
  }
  if (audience_filter?.custom_ids?.length) {
    contactQuery = contactQuery.in('id', audience_filter.custom_ids)
  }

  const { data: contacts, error: cErr } = await contactQuery
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })

  // Filter to only contacts with phone numbers
  const withPhone = (contacts || []).filter(c => c.phone)

  // Create blast record
  const { data: blast, error: bErr } = await supabase.from('blast_messages').insert({
    title,
    body: messageBody,
    audience_filter: audience_filter || {},
    recipient_count: withPhone.length,
    status: send_now ? 'sending' : (scheduled_at ? 'scheduled' : 'draft'),
    scheduled_at: scheduled_at || null,
    sent_by: user.id,
  }).select().single()

  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 })

  // Create recipient records
  if (withPhone.length > 0) {
    const recipients = withPhone.map(c => ({
      blast_id: blast.id,
      contact_id: c.id,
      phone: c.phone,
      personalized_body: messageBody.replace(/\{\{name\}\}/g, c.name.split(' ')[0]),
      status: 'pending',
    }))

    await supabase.from('blast_recipients').insert(recipients)
  }

  // If send_now, trigger the send
  if (send_now && withPhone.length > 0) {
    // Fire and forget — the send endpoint handles actual delivery
    fetch(new URL('/api/blasts/send', req.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': req.headers.get('cookie') || '' },
      body: JSON.stringify({ blast_id: blast.id }),
    }).catch(() => {})
  }

  return NextResponse.json({ blast, recipient_count: withPhone.length })
}
