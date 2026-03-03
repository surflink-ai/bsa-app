import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface AdminUser {
  id: string
  email: string
  full_name: string | null
  role: 'super_admin' | 'editor' | 'event_manager'
  avatar_url: string | null
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'editor', 'event_manager'].includes(profile.role)) {
    return null
  }

  return {
    id: user.id,
    email: user.email || '',
    full_name: profile.full_name,
    role: profile.role,
    avatar_url: profile.avatar_url,
  }
}

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser()
  if (!admin) redirect('/admin/login')
  return admin
}

export async function requireSuperAdmin(): Promise<AdminUser> {
  const admin = await requireAdmin()
  if (admin.role !== 'super_admin') redirect('/admin')
  return admin
}

export async function getAllAdminUsers(): Promise<AdminUser[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['super_admin', 'editor', 'event_manager'])
    .order('created_at')
  if (error) throw error
  return (data || []).map(p => ({
    id: p.id,
    email: '',
    full_name: p.full_name,
    role: p.role,
    avatar_url: p.avatar_url,
  }))
}

export async function updateUserRole(userId: string, role: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw error
}
