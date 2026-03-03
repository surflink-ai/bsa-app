'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  full_name: string | null
  role: string
  avatar_url: string | null
  created_at: string
}

const inputStyle = {
  border: '1px solid rgba(10,37,64,0.12)',
  borderRadius: '4px',
  padding: '5px 8px',
  fontSize: '12px',
  color: '#0A2540',
  outline: 'none',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

  const fetchUsers = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)

    const { data } = await supabase.from('profiles').select('*')
      .in('role', ['super_admin', 'editor', 'event_manager'])
      .order('created_at')
    setUsers(data || [])

    if (user) {
      const profile = (data || []).find(p => p.id === user.id)
      setCurrentUserRole(profile?.role || null)
    }
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (userId === currentUserId) {
      alert("You can't change your own role.")
      return
    }
    const supabase = createClient()
    await supabase.from('profiles').update({ role: newRole, updated_at: new Date().toISOString() }).eq('id', userId)
    fetchUsers()
  }

  const roleColors: Record<string, string> = {
    super_admin: '#7C3AED',
    editor: '#2BA5A0',
    event_manager: '#1478B5',
  }

  const isSuperAdmin = currentUserRole === 'super_admin'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Admin Users</h1>
        <p className="text-[12px] text-[#0A2540]/30 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{users.length} admin users</p>
      </div>

      {!isSuperAdmin && (
        <div className="mb-5 text-[13px]" style={{ color: '#CA8A04', padding: '10px 12px', backgroundColor: '#FEFCE8', border: '1px solid #FDE68A', borderRadius: '4px' }}>
          Only Super Admins can manage user roles.
        </div>
      )}

      {loading ? (
        <p className="text-[13px] text-[#0A2540]/30">Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-[13px] text-[#0A2540]/30 py-12 text-center">No admin users found.</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(10,37,64,0.06)' }}>
              <th className="text-left pb-2.5 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(10,37,64,0.2)' }}>User</th>
              <th className="text-left pb-2.5 font-medium hidden md:table-cell" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(10,37,64,0.2)' }}>Role</th>
              <th className="text-left pb-2.5 font-medium hidden md:table-cell" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(10,37,64,0.2)' }}>Joined</th>
              {isSuperAdmin && (
                <th className="text-right pb-2.5 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(10,37,64,0.2)', width: '140px' }}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(10,37,64,0.015)' }}>
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-3">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-medium text-[#0A2540]/30"
                        style={{ backgroundColor: 'rgba(10,37,64,0.04)' }}>
                        {(u.full_name || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-[13px] text-[#0A2540]/70">{u.full_name || 'Unnamed'}</p>
                      {u.id === currentUserId && (
                        <span className="text-[10px] text-[#0A2540]/20" style={{ fontFamily: "'JetBrains Mono', monospace" }}>you</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-2.5 pr-4 hidden md:table-cell">
                  <span className="text-[10px] uppercase tracking-[0.1em] font-medium"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: roleColors[u.role] || '#999' }}>
                    {u.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-2.5 pr-4 hidden md:table-cell">
                  <span className="text-[11px] text-[#0A2540]/25" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </span>
                </td>
                {isSuperAdmin && (
                  <td className="py-2.5 text-right">
                    {u.id !== currentUserId && (
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = '#2BA5A0')}
                        onBlur={e => (e.target.style.borderColor = 'rgba(10,37,64,0.12)')}
                      >
                        <option value="super_admin">Super Admin</option>
                        <option value="editor">Editor</option>
                        <option value="event_manager">Event Manager</option>
                      </select>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
