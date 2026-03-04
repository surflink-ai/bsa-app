import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10')

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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}
