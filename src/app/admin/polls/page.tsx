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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Fan Polls</h1>
          <p className="text-[12px] text-[#0A2540]/30 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{polls.length} polls</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="text-[12px] font-medium text-white px-4 py-2 transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#0A2540', borderRadius: '4px' }}>
          Create Poll
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <PollCreator onSubmit={handleCreate} onCancel={() => setShowForm(false)} loading={saving} />
        </div>
      )}

      {loading ? (
        <p className="text-[13px] text-[#0A2540]/30">Loading...</p>
      ) : polls.length === 0 ? (
        <p className="text-[13px] text-[#0A2540]/30 py-12 text-center">No polls yet. Create your first one.</p>
      ) : (
        <div className="space-y-0">
          {polls.map((poll, idx) => {
            const total = getTotalVotes(poll.id)
            const counts = voteCounts[poll.id] || []

            return (
              <div key={poll.id}>
                {idx > 0 && <div className="h-px bg-[#0A2540]/[0.04] my-5" />}
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-[15px] font-medium text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{poll.title}</h3>
                      {poll.description && <p className="text-[12px] text-[#0A2540]/35 mt-1">{poll.description}</p>}
                      <p className="text-[10px] text-[#0A2540]/20 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {total} vote{total !== 1 ? 's' : ''} &middot; {new Date(poll.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <button onClick={() => handleToggle(poll)}
                        className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] transition-colors cursor-pointer"
                        style={{ fontFamily: "'JetBrains Mono', monospace", color: poll.active ? '#22C55E' : '#9CA3AF' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: poll.active ? '#22C55E' : '#D1D5DB' }} />
                        {poll.active ? 'Active' : 'Closed'}
                      </button>
                      <button onClick={() => handleDelete(poll.id)}
                        className="text-[12px] text-[#DC2626]/50 hover:text-[#DC2626] transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Results */}
                  <div className="space-y-2 max-w-[500px]">
                    {(poll.options as { id: string; label: string }[]).map(opt => {
                      const count = counts.find(c => c.option_label === opt.label)?.count || 0
                      const pct = total > 0 ? (count / total) * 100 : 0

                      return (
                        <div key={opt.id} className="flex items-center gap-3">
                          <span className="text-[12px] text-[#0A2540]/50 w-[140px] flex-shrink-0 truncate">{opt.label}</span>
                          <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(10,37,64,0.04)' }}>
                            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: '#2BA5A0' }} />
                          </div>
                          <span className="text-[10px] text-[#0A2540]/25 w-[60px] text-right flex-shrink-0"
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {count} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
