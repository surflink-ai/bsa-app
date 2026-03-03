'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#0A2540', fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="w-full max-w-[360px] px-4">
        {/* Wordmark */}
        <div className="text-center mb-10">
          <h1
            className="text-[18px] font-semibold text-white tracking-[0.12em] uppercase"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Barbados Surfing Association
          </h1>
          <div className="w-8 h-[1px] bg-white/10 mx-auto mt-4" />
        </div>

        {/* Login card */}
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid rgba(10,37,64,0.06)',
            borderRadius: '6px',
            padding: '32px 28px',
          }}
        >
          {error && (
            <div
              className="mb-5 text-[13px]"
              style={{
                color: '#DC2626',
                padding: '10px 12px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '4px',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label
                className="block text-[10px] uppercase tracking-[0.15em] mb-2"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(10,37,64,0.4)' }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full text-[14px] outline-none transition-colors"
                style={{
                  border: '1px solid rgba(10,37,64,0.12)',
                  borderRadius: '4px',
                  padding: '10px 12px',
                  color: '#0A2540',
                }}
                onFocus={e => (e.target.style.borderColor = '#2BA5A0')}
                onBlur={e => (e.target.style.borderColor = 'rgba(10,37,64,0.12)')}
                placeholder="admin@bsa.surf"
              />
            </div>

            <div className="mb-6">
              <label
                className="block text-[10px] uppercase tracking-[0.15em] mb-2"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(10,37,64,0.4)' }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full text-[14px] outline-none transition-colors"
                style={{
                  border: '1px solid rgba(10,37,64,0.12)',
                  borderRadius: '4px',
                  padding: '10px 12px',
                  color: '#0A2540',
                }}
                onFocus={e => (e.target.style.borderColor = '#2BA5A0')}
                onBlur={e => (e.target.style.borderColor = 'rgba(10,37,64,0.12)')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-[13px] font-medium text-white transition-opacity disabled:opacity-50"
              style={{
                backgroundColor: '#0A2540',
                borderRadius: '4px',
                padding: '11px 0',
                letterSpacing: '0.03em',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
