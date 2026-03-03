'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { FormField, Button, inputStyle } from '@/components/admin/ui'

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
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/admin')
    router.refresh()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--admin-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '0.03em' }}>BSA</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.2em', color: 'var(--admin-teal)', textTransform: 'uppercase', marginTop: 6 }}>Admin</div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ background: '#fff', borderRadius: 'var(--admin-radius)', padding: '32px 28px', border: '1px solid var(--admin-border)' }}>
            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: 'var(--admin-danger)', borderRadius: 6, padding: '10px 14px', fontSize: 13, marginBottom: 20 }}>{error}</div>
            )}
            <FormField label="Email">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} placeholder="you@example.com"
                onFocus={e => e.currentTarget.style.borderColor = 'var(--admin-teal)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(10,37,64,0.12)'} />
            </FormField>
            <FormField label="Password">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--admin-teal)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(10,37,64,0.12)'} />
            </FormField>
            <Button variant="primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 4 }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.06em' }}>bsa.surf</div>
      </div>
    </div>
  )
}
