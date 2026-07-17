import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAdmin } from '@/lib/supabase/admin'
import { MAX_BLAST_RECIPIENTS } from '@/lib/blasts'

// GET: list blasts
export async function GET() {
  const gate = await requireApiAdmin()
  if (gate instanceof NextResponse) return gate
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('blast_messages')
    .select('*, blast_recipients(count)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: 'Failed to load blasts' }, { status: 500 })
  return NextResponse.json({ blasts: data })
}

// POST: create & optionally send a blast
export async function POST(req: NextRequest) {
  const gate = await requireApiAdmin()
  if (gate instanceof NextResponse) return gate
  const user = gate
  const supabase = await createClient()

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { title, body: messageBody, audience_filter, scheduled_at, send_now } = body

  if (!title || !messageBody || typeof title !== 'string' || typeof messageBody !== 'string') {
    return NextResponse.json({ error: 'Title and body required' }, { status: 400 })
  }
  if (title.length > 200 || messageBody.length > 2000) {
    return NextResponse.json({ error: 'Title or body too long' }, { status: 400 })
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
  if (cErr) return NextResponse.json({ error: 'Failed to load contacts' }, { status: 500 })

  // Filter to only contacts with phone numbers
  const withPhone = (contacts || []).filter(c => c.phone)

  // Guard against accidental/abusive mass sends (and Twilio cost overrun).
  if (withPhone.length > MAX_BLAST_RECIPIENTS) {
    return NextResponse.json(
      { error: `Recipient list (${withPhone.length}) exceeds the ${MAX_BLAST_RECIPIENTS} cap. Narrow the audience.` },
      { status: 422 }
    )
  }

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

  if (bErr) return NextResponse.json({ error: 'Failed to create blast' }, { status: 500 })

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
