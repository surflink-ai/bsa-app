import { createClient } from '@/lib/supabase/server'

export interface Notification {
  id: string
  title: string
  body: string
  type: 'event' | 'heat' | 'conditions' | 'announcement' | 'custom'
  sent_at: string
  sent_by: string | null
  recipient_count: number
}

export async function getNotifications(limit?: number): Promise<Notification[]> {
  const supabase = await createClient()
  let query = supabase
    .from('notifications')
    .select('*')
    .order('sent_at', { ascending: false })
  if (limit) query = query.limit(limit)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function createNotification(notification: Omit<Notification, 'id' | 'sent_at'>): Promise<Notification> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteNotification(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('notifications').delete().eq('id', id)
  if (error) throw error
}

export const NOTIFICATION_TEMPLATES = [
  { label: 'Heat Starting', title: 'Heat Starting Now!', body: 'The next heat is about to begin. Tune in live!', type: 'heat' as const },
  { label: 'Finals Live', title: 'Finals Are LIVE! 🏆', body: 'The finals are underway. Don\'t miss the action!', type: 'event' as const },
  { label: 'Results Posted', title: 'Results Are In!', body: 'Final results have been posted. Check them out!', type: 'event' as const },
]
