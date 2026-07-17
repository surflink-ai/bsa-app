import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsApp } from '@/lib/twilio'
import { requireApiAdmin } from '@/lib/supabase/admin'
import { MAX_BLAST_RECIPIENTS } from '@/lib/blasts'

// POST: send a blast to all pending recipients
export async function POST(req: NextRequest) {
  const gate = await requireApiAdmin()
  if (gate instanceof NextResponse) return gate
  const user = gate
  const supabase = await createClient()

  const parsed = await req.json().catch(() => null)
  const blast_id = parsed?.blast_id
  if (!blast_id || typeof blast_id !== 'string') {
    return NextResponse.json({ error: 'blast_id required' }, { status: 400 })
  }

  // Get blast
  const { data: blast, error: bErr } = await supabase
    .from('blast_messages')
    .select('*')
    .eq('id', blast_id)
    .single()

  if (bErr || !blast) return NextResponse.json({ error: 'Blast not found' }, { status: 404 })

  // Get pending recipients
  const { data: recipients, error: rErr } = await supabase
    .from('blast_recipients')
    .select('*')
    .eq('blast_id', blast_id)
    .eq('status', 'pending')

  if (rErr) return NextResponse.json({ error: 'Failed to load recipients' }, { status: 500 })
  if (!recipients?.length) {
    await supabase.from('blast_messages').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', blast_id)
    return NextResponse.json({ sent: 0, failed: 0, message: 'No pending recipients' })
  }
  if (recipients.length > MAX_BLAST_RECIPIENTS) {
    await supabase.from('blast_messages').update({ status: 'failed', error_message: 'recipient cap exceeded' }).eq('id', blast_id)
    return NextResponse.json({ error: `Recipient count exceeds the ${MAX_BLAST_RECIPIENTS} cap` }, { status: 422 })
  }

  // Update blast status
  await supabase.from('blast_messages').update({ status: 'sending' }).eq('id', blast_id)

  let sent = 0, failed = 0

  for (const r of recipients) {
    const body = r.personalized_body || blast.body
    const result = await sendWhatsApp(r.phone, body)

    if (result.success) {
      sent++
      await supabase.from('blast_recipients').update({
        status: 'sent',
        wa_message_sid: result.sid,
        sent_at: new Date().toISOString(),
      }).eq('id', r.id)
    } else {
      failed++
      await supabase.from('blast_recipients').update({
        status: 'failed',
        error_message: result.error,
      }).eq('id', r.id)
    }

    // Rate limit: 1 msg/sec
    if (recipients.indexOf(r) < recipients.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1100))
    }
  }

  // Update blast final status
  await supabase.from('blast_messages').update({
    status: failed === recipients.length ? 'failed' : 'sent',
    sent_at: new Date().toISOString(),
    error_message: failed > 0 ? `${failed}/${recipients.length} failed` : null,
  }).eq('id', blast_id)

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'blast_sent',
    entity_type: 'blast_message',
    entity_id: blast_id,
    details: { title: blast.title, sent, failed, total: recipients.length },
  })

  return NextResponse.json({ sent, failed, total: recipients.length })
}
