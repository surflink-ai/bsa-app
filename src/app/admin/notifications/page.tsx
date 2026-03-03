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
  { label: 'Heat Starting', title: 'Heat Starting Now! 🏄', body: 'The next heat is about to begin. Tune in live!', type: 'heat' },
  { label: 'Finals Live', title: 'Finals Are LIVE! 🏆', body: 'The finals are underway. Don\'t miss the action!', type: 'event' },
  { label: 'Results Posted', title: 'Results Are In! 📊', body: 'Final results have been posted. Check them out!', type: 'event' },
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
    conditions: '#eab308',
    announcement: '#0A2540',
    custom: '#8B5CF6',
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Notifications</h1>
        <p className="text-sm text-gray-400 mt-1">Send push notifications to subscribers</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Compose
          </h2>
          <NotificationComposer onSend={handleSend} loading={sending} templates={TEMPLATES} />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            History
          </h2>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center shadow-sm">
              <p className="text-gray-400 text-sm">No notifications sent yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-700 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{n.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{n.body}</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ml-2"
                      style={{ fontFamily: "'JetBrains Mono', monospace", backgroundColor: `${typeColors[n.type] || '#999'}15`, color: typeColors[n.type] || '#999' }}>
                      {n.type}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-300 mt-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {new Date(n.sent_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
