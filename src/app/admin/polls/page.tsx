'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PollCreator } from '@/components/admin/PollCreator'

interface Poll {
  id: string
  title: string
  description: string | null
  options: { id: string; label: string }[]
  event_id: string | null
  active: boolean
  closes_at: string | null
  created_at: string
}

interface VoteCount {
  option_label: string
  count: number
}

export default function AdminPollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [voteCounts, setVoteCounts] = useState<Record<string, VoteCount[]>>({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchPolls = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('fan_polls').select('*').order('created_at', { ascending: false })
    setPolls(data || [])
    setLoading(false)

    // Fetch vote counts for each poll
    if (data) {
      for (const poll of data) {
        const { data: votes } = await supabase.from('fan_votes').select('option_label').eq('poll_id', poll.id)
        const counts: Record<string, number> = {}
        for (const v of votes || []) {
          counts[v.option_label] = (counts[v.option_label] || 0) + 1
        }
        setVoteCounts(prev => ({
          ...prev,
          [poll.id]: Object.entries(counts).map(([option_label, count]) => ({ option_label, count })),
        }))
      }
    }
  }

  useEffect(() => { fetchPolls() }, [])

  const handleCreate = async (data: { title: string; description: string; options: { id: string; label: string }[]; event_id: string; closes_at: string }) => {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('fan_polls').insert({
      title: data.title,
      description: data.description || null,
      options: data.options,
      event_id: data.event_id || null,
      closes_at: data.closes_at ? new Date(data.closes_at).toISOString() : null,
      active: true,
    })
    setShowForm(false)
    setSaving(false)
    fetchPolls()
  }

  const handleToggle = async (poll: Poll) => {
    const supabase = createClient()
    await supabase.from('fan_polls').update({ active: !poll.active }).eq('id', poll.id)
    fetchPolls()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this poll and all its votes?')) return
    const supabase = createClient()
    await supabase.from('fan_polls').delete().eq('id', id)
    setPolls(prev => prev.filter(p => p.id !== id))
  }

  const getTotalVotes = (pollId: string): number => {
    return (voteCounts[pollId] || []).reduce((sum, vc) => sum + vc.count, 0)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Fan Polls</h1>
          <p className="text-sm text-gray-400 mt-1">{polls.length} polls</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-[#2BA5A0] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#2BA5A0]/90 transition-colors">
          + Create Poll
        </button>
      </div>

      {showForm && (
        <div className="mb-8">
          <PollCreator onSubmit={handleCreate} onCancel={() => setShowForm(false)} loading={saving} />
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : polls.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
          <p className="text-gray-400 text-sm">No polls yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map(poll => {
            const total = getTotalVotes(poll.id)
            const counts = voteCounts[poll.id] || []

            return (
              <div key={poll.id} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{poll.title}</h3>
                    {poll.description && <p className="text-sm text-gray-400 mt-1">{poll.description}</p>}
                    <p className="text-[10px] text-gray-300 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {total} vote{total !== 1 ? 's' : ''} · Created {new Date(poll.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggle(poll)}
                      className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full ${
                        poll.active ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'
                      }`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {poll.active ? 'Active' : 'Closed'}
                    </button>
                    <button onClick={() => handleDelete(poll.id)} className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors">Delete</button>
                  </div>
                </div>

                {/* Results bar chart */}
                <div className="space-y-2">
                  {(poll.options as { id: string; label: string }[]).map(opt => {
                    const count = counts.find(c => c.option_label === opt.label)?.count || 0
                    const pct = total > 0 ? (count / total) * 100 : 0

                    return (
                      <div key={opt.id}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">{opt.label}</span>
                          <span className="text-gray-400">{count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#2BA5A0] rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
