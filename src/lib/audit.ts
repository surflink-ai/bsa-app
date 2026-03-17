import { SupabaseClient } from '@supabase/supabase-js'

export async function logAudit(
  supabase: SupabaseClient,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, any>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('audit_log').insert({
      user_id: user?.id || null,
      action,
      entity_type: entityType || null,
      entity_id: entityId || null,
      details: details || {},
    })
  } catch {
    // Silent fail — audit should never break the app
  }
}
