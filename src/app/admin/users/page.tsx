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
    super_admin: '#8B5CF6',
    editor: '#2BA5A0',
    event_manager: '#1478B5',
  }

  const isSuperAdmin = currentUserRole === 'super_admin'

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Admin Users</h1>
        <p className="text-sm text-gray-400 mt-1">{users.length} admin users</p>
      </div>

      {!isSuperAdmin && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg p-3 text-sm mb-6">
          Only Super Admins can manage user roles.
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
          <p className="text-gray-400 text-sm">No admin users found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>User</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400 hidden md:table-cell" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Role</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400 hidden md:table-cell" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Joined</th>
                {isSuperAdmin && (
                  <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                          {(u.full_name || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-700">{u.full_name || 'Unnamed'}</p>
                        {u.id === currentUserId && <span className="text-[10px] text-gray-400">(you)</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs font-medium px-2 py-0.5 rounded"
                      style={{ backgroundColor: `${roleColors[u.role] || '#999'}15`, color: roleColors[u.role] || '#999' }}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  {isSuperAdmin && (
                    <td className="px-4 py-3 text-right">
                      {u.id !== currentUserId && (
                        <select
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-[#2BA5A0]"
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
        </div>
      )}
    </div>
  )
}
