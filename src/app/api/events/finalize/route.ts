import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: post-event automation — generate results article draft + queue blast
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { event_id, event_name, results_summary } = await req.json()
  if (!event_id || !event_name) return NextResponse.json({ error: 'event_id and event_name required' }, { status: 400 })

  const actions: string[] = []

  // 1. Create draft article
  const { data: article, error: artErr } = await supabase.from('articles').insert({
    title: `Results: ${event_name}`,
    content: results_summary || `Results from ${event_name} are now available. Check the full rankings at bsa.surf/rankings.`,
    category: 'competition',
    published: false,
    author_id: user.id,
  }).select().single()

  if (article) actions.push(`Draft article created: "${article.title}"`)

  // 2. Queue WhatsApp blast
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, phone')
    .eq('active', true)
    .eq('opted_out', false)
    .not('phone', 'is', null)

  if (contacts && contacts.length > 0) {
    const blastBody = `Results are in for ${event_name}! Check your ranking at bsa.surf/rankings`

    const { data: blast } = await supabase.from('blast_messages').insert({
      title: `Results: ${event_name}`,
      body: blastBody,
      audience_filter: { types: ['athlete'] },
      recipient_count: contacts.length,
      status: 'draft',
      sent_by: user.id,
    }).select().single()

    if (blast) {
      const recipients = contacts.map(c => ({
        blast_id: blast.id,
        contact_id: c.id,
        phone: c.phone,
        personalized_body: blastBody,
        status: 'pending',
      }))
      await supabase.from('blast_recipients').insert(recipients)
      actions.push(`WhatsApp blast drafted for ${contacts.length} contacts`)
    }
  }

  // 3. Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'event_finalized',
    entity_type: 'event',
    entity_id: event_id,
    details: { event_name, actions },
  })

  return NextResponse.json({ success: true, actions })
}
