'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AthleteSignupPage() {
  const [step, setStep] = useState<'signup' | 'claim'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState<{ id: string; name: string; image_url: string | null }[]>([])
  const [selectedAthlete, setSelectedAthlete] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Create auth user
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })
      if (authErr) throw authErr

      // Search for matching athlete records
      const { data: athleteMatches } = await supabase
        .from('athletes')
        .select('id, name, image_url')
        .eq('claim_status', 'unclaimed')
        .ilike('name', `%${name.split(' ').pop()}%`) // match by last name
        .limit(10)

      if (athleteMatches && athleteMatches.length > 0) {
        setMatches(athleteMatches)
        setStep('claim')
      } else {
        // No matches — go straight to dashboard
        router.push('/athlete/dashboard')
      }
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  async function handleClaim() {
    if (!selectedAthlete) return
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')

      // Request claim (pending admin approval)
      const { error: claimErr } = await supabase
        .from('athletes')
        .update({ claimed_by: user.id, claim_status: 'pending', phone: phone || null })
        .eq('id', selectedAthlete)
        .eq('claim_status', 'unclaimed')

      if (claimErr) throw claimErr
      router.push('/athlete/dashboard')
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A2540', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: '#fff' }}>BSA</div>
          </Link>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#2BA5A0', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 8 }}>Athlete Portal</div>
        </div>

        {step === 'signup' && (
          <form onSubmit={handleSignup}>
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: '32px 28px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Create Your Account</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>Sign up to claim your athlete profile, view stats, and share your results.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'block' }}>Full Name</label>
                  <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Joshua Burke" required />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'block' }}>Email</label>
                  <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="josh@example.com" required />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'block' }}>Password</label>
                  <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'block' }}>Phone (WhatsApp)</label>
                  <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1246..." />
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>Optional — for competition notifications</div>
                </div>
              </div>

              {error && <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 12 }}>{error}</div>}

              <button type="submit" disabled={loading} style={{
                width: '100%', marginTop: 20, padding: '14px', borderRadius: 10, border: 'none',
                backgroundColor: '#2BA5A0', color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>
            </div>

            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
              Already have an account? <Link href="/athlete/login" style={{ color: '#2BA5A0', textDecoration: 'none' }}>Sign in</Link>
            </p>
          </form>
        )}

        {step === 'claim' && (
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: '32px 28px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Claim Your Profile</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>We found {matches.length} athlete{matches.length !== 1 ? 's' : ''} matching your name. Select yours to claim it.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {matches.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedAthlete(m.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12,
                    border: selectedAthlete === m.id ? '2px solid #2BA5A0' : '1px solid rgba(255,255,255,0.06)',
                    backgroundColor: selectedAthlete === m.id ? 'rgba(43,165,160,0.08)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                    backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {m.image_url ? (
                      <img src={m.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.1)', fontWeight: 700 }}>{m.name.split(' ').map(n => n[0]).join('')}</span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600, color: '#fff' }}>{m.name}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>BSA Athlete</div>
                  </div>
                </button>
              ))}
            </div>

            {error && <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 12 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleClaim} disabled={!selectedAthlete || loading} style={{
                flex: 1, padding: '14px', borderRadius: 10, border: 'none',
                backgroundColor: '#2BA5A0', color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: !selectedAthlete || loading ? 'not-allowed' : 'pointer',
                opacity: !selectedAthlete || loading ? 0.5 : 1,
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                {loading ? 'Claiming...' : 'Claim This Profile'}
              </button>
              <button onClick={() => router.push('/athlete/dashboard')} style={{
                padding: '14px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 14,
                cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
              }}>
                Skip
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 12, textAlign: 'center' }}>
              Claims require admin approval before your profile is linked.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
