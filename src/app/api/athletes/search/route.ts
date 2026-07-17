import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Public athlete read — the athletes table is public-read via RLS, so use the
// anon key (never the service role) for this endpoint.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim().slice(0, 100)
  const limit = Math.min(Math.max(parseInt(request.nextUrl.searchParams.get('limit') || '10', 10) || 10, 1), 50)

  if (!q || q.length < 1) {
    return NextResponse.json([])
  }

  // Search by name using ilike for case-insensitive partial match
  const { data, error } = await supabase
    .from('athletes')
    .select('id, name, image_url, nationality, gender')
    .eq('active', true)
    .ilike('name', `%${q}%`)
    .order('name')
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }

  return NextResponse.json(data || [])
}
