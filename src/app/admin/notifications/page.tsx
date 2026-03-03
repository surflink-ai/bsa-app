'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NotificationComposer } from '@/components/admin/NotificationComposer'

interface Notification {
  id: string
  title: string
  body: string
  type: string
  sent_at: string
  recipient_count: number
}

const TEMPLATES = [
  { label: 'Heat Starting', title: 'Heat Starting Now', body: 'The next heat is about to begin. Tune in live!', type: 'heat' },
  { label: 'Finals Live', title: 'Finals Are LIVE', body: 'The finals are underway. Don\'t miss the action!', type: 'event' },
  { label: 'Results Posted', title: 'Results Are In', body: 'Final results have been posted. Check them out!', type: 'event' },
]

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const fetchNotifications = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('notifications').select('*').order('sent_at', { ascending: false }).limit(50)
    setNotifications(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchNotifications() }, [])

  const handleSend = async (data: { title: string; body: string; type: string }) => {
    setSending(true)
    const supabase = createClient()
    await supabase.from('notifications').insert({
      title: data.title,
      body: data.body,
      type: data.type,
      recipient_count: 0,
    })
    setSending(false)
    fetchNotifications()
    alert('Notification logged successfully!')
  }

  const typeColors: Record<string, string> = {
    event: '#2BA5A0',
    heat: '#1478B5',
    conditions: '#CA8A04',
    announcement: '#0A2540',
    custom: '#7C3AED',
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Notifications</h1>
        <p className="text-[12px] text-[#0A2540]/30 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Send push notifications to subscribers</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.15em] text-[#0A2540]/30 mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Compose
          </h2>
          <NotificationComposer onSend={handleSend} loading={sending} templates={TEMPLATES} />
        </div>

        <div>
          <h2 className="text-[10px] uppercase tracking-[0.15em] text-[#0A2540]/30 mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            History
          </h2>
          {loading ? (
            <p className="text-[13px] text-[#0A2540]/30">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="text-[13px] text-[#0A2540]/30 py-8 text-center">No notifications sent yet.</p>
          ) : (
            <div>
              {notifications.map((n, i) => (
                <div key={n.id}>
                  {i > 0 && <div className="h-px bg-[#0A2540]/[0.04] my-3" />}
                  <div className="py-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[#0A2540]/70" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{n.title}</p>
                        <p className="text-[12px] text-[#0A2540]/30 mt-0.5 truncate">{n.body}</p>
                      </div>
                      <span className="text-[9px] uppercase tracking-[0.1em] flex-shrink-0 mt-0.5"
                        style={{ fontFamily: "'JetBrains Mono', monospace", color: typeColors[n.type] || '#999' }}>
                        {n.type}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#0A2540]/15 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {new Date(n.sent_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
