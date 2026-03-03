import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { pin } = await req.json()
  if (!pin) return NextResponse.json({ error: 'PIN required' }, { status: 400 })

  const { data: judge } = await supabase
    .from('comp_judges')
    .select('id, name, role')
    .eq('pin', pin)
    .eq('active', true)
    .single()

  if (!judge) return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })

  // Return judge info (no JWT needed — PIN is the auth for beach use)
  return NextResponse.json({ judge })
}
