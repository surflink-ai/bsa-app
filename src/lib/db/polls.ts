import { createClient } from '@/lib/supabase/server'

export interface PollOption {
  id: string
  label: string
}

export interface FanPoll {
  id: string
  title: string
  description: string | null
  options: PollOption[]
  event_id: string | null
  active: boolean
  closes_at: string | null
  created_at: string
  created_by: string | null
}

export interface VoteCount {
  option_label: string
  count: number
}

export async function getActivePolls(): Promise<FanPoll[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('fan_polls')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getPollsByEvent(eventId: string): Promise<FanPoll[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('fan_polls')
    .select('*')
    .eq('event_id', eventId)
    .eq('active', true)
  if (error) throw error
  return data || []
}

export async function getPollById(id: string): Promise<FanPoll | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('fan_polls')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function getAllPollsAdmin(): Promise<FanPoll[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('fan_polls')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getVoteCounts(pollId: string): Promise<VoteCount[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('fan_votes')
    .select('option_label')
    .eq('poll_id', pollId)
  if (error) throw error
  const counts: Record<string, number> = {}
  for (const v of data || []) {
    counts[v.option_label] = (counts[v.option_label] || 0) + 1
  }
  return Object.entries(counts).map(([option_label, count]) => ({ option_label, count }))
}

export async function createPoll(poll: Omit<FanPoll, 'id' | 'created_at'>): Promise<FanPoll> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('fan_polls')
    .insert(poll)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePoll(id: string, updates: Partial<FanPoll>): Promise<FanPoll> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('fan_polls')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePoll(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('fan_polls').delete().eq('id', id)
  if (error) throw error
}

export async function castVote(pollId: string, optionLabel: string, fingerprint: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('fan_votes')
    .insert({ poll_id: pollId, option_label: optionLabel, voter_fingerprint: fingerprint })
  if (error) {
    if (error.code === '23505') return false // duplicate vote
    throw error
  }
  return true
}
