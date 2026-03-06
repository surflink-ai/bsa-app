import { requireAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { DashboardV2 } from '@/components/admin/DashboardV2'

export default async function AdminDashboard() {
  const admin = await requireAdmin()
  const supabase = await createClient()

  const [
    articlesRes, sponsorsRes, athletesRes, contactsRes,
    blastsRes, streamRes, recentBlastsRes, auditRes,
  ] = await Promise.all([
    supabase.from('articles').select('id, title, published, category, published_at, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('sponsors').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('athletes').select('id', { count: 'exact', head: true }),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('blast_messages').select('id, title, recipient_count, status, sent_at').eq('status', 'sent').order('sent_at', { ascending: false }).limit(3),
    supabase.from('stream_config').select('active').limit(1).single(),
    supabase.from('blast_messages').select('id, title, recipient_count, status, sent_at, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('audit_log').select('id, action, entity_type, details, created_at').order('created_at', { ascending: false }).limit(8),
  ])

  // Count contacts with phone
  const { count: contactsWithPhone } = await supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('active', true).not('phone', 'is', null)

  // Count total blast recipients sent
  const { count: totalMessagesSent } = await supabase.from('blast_recipients').select('id', { count: 'exact', head: true }).eq('status', 'sent')

  return (
    <DashboardV2
      adminName={admin.full_name || admin.email || 'Admin'}
      articles={articlesRes.data || []}
      stats={{
        athletes: athletesRes.count || 0,
        contacts: contactsRes.count || 0,
        contactsWithPhone: contactsWithPhone || 0,
        sponsors: sponsorsRes.count || 0,
        blastsSent: blastsRes.data?.length || 0,
        messagesSent: totalMessagesSent || 0,
      }}
      streamActive={streamRes.data?.active || false}
      recentBlasts={recentBlastsRes.data || []}
      auditLog={auditRes.data || []}
    />
  )
}
