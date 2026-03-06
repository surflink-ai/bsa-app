'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AthleteLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/athlete/dashboard')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A2540', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: '#fff' }}>BSA</div>
          </Link>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#2BA5A0', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 8 }}>Athlete Portal</div>
        </div>

        <form onSubmit={handleLogin} style={{
          backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: '32px 28px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 24 }}>Sign In</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'block' }}>Email</label>
              <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'block' }}>Password</label>
              <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
          </div>

          {error && <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 12 }}>{error}</div>}

          <button type="submit" disabled={loading} style={{
            width: '100%', marginTop: 20, padding: '14px', borderRadius: 10, border: 'none',
            backgroundColor: '#2BA5A0', color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          Don&apos;t have an account? <Link href="/athlete/signup" style={{ color: '#2BA5A0', textDecoration: 'none' }}>Sign up</Link>
        </p>
      </div>
    </div>
  )
}
