import { createClient } from '@/lib/supabase/server'
import { LiveResultsClient } from './LiveResultsClient'

export const revalidate = 0

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('comp_events').select('name').eq('id', id).single()
  return {
    title: data ? `${data.name} — Live Results` : 'Live Results — BSA',
    description: 'Real-time surf competition scores from the Barbados Surfing Association',
  }
}

export default async function LiveResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <LiveResultsClient eventId={id} />
}
