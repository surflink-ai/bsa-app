import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, tooMany } from '@/lib/rate-limit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Must match the contact_submissions.category CHECK constraint.
const CATEGORIES = ['general', 'compete', 'sponsor', 'coaching', 'membership', 'media', 'juniors']

export async function POST(req: NextRequest) {
  // Public form — throttle to curb spam / DB flooding.
  const limited = await rateLimit(req, 'contact', 5, 60_000)
  if (!limited.success) return tooMany()

  try {
    const body = await req.json()
    const { name, email, subject, message, category } = body || {}

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 })
    }
    if (typeof email !== 'string' || !EMAIL_RE.test(email) || email.length > 200) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
    }
    if (String(name).length > 200 || String(message).length > 5000 || String(subject || '').length > 300) {
      return NextResponse.json({ error: 'One or more fields are too long.' }, { status: 400 })
    }
    const safeCategory = CATEGORIES.includes(category) ? category : 'general'

    const supabase = await createClient()
    const { error } = await supabase.from('contact_submissions').insert({
      name, email, subject: subject || null, message, category: safeCategory,
    })

    if (error) return NextResponse.json({ error: 'Could not submit your message.' }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
