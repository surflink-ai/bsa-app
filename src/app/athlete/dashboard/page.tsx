'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AthleteProfile {
  id: string; name: string; image_url: string | null; bio: string | null
  social_links: { instagram?: string; facebook?: string; tiktok?: string; youtube?: string }
  sponsor_names: string[]; claim_status: string; verified: boolean
  phone: string | null; email: string | null
}

export default function AthleteDashboardPage() {
  const [athlete, setAthlete] = useState<AthleteProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ bio: '', instagram: '', facebook: '', tiktok: '', youtube: '', sponsors: '' })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/athlete/login'); return }

      // Find claimed athlete
      const { data } = await supabase
        .from('athletes')
        .select('id, name, image_url, bio, social_links, sponsor_names, claim_status, verified, phone, email')
        .eq('claimed_by', user.id)
        .single()

      if (data) {
        setAthlete(data)
        setForm({
          bio: data.bio || '',
          instagram: data.social_links?.instagram || '',
          facebook: data.social_links?.facebook || '',
          tiktok: data.social_links?.tiktok || '',
          youtube: data.social_links?.youtube || '',
          sponsors: (data.sponsor_names || []).join(', '),
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    if (!athlete) return
    setSaving(true)
    await supabase.from('athletes').update({
      bio: form.bio || null,
      social_links: {
        instagram: form.instagram || undefined,
        facebook: form.facebook || undefined,
        tiktok: form.tiktok || undefined,
        youtube: form.youtube || undefined,
      },
      sponsor_names: form.sponsors ? form.sponsors.split(',').map(s => s.trim()).filter(Boolean) : [],
      updated_at: new Date().toISOString(),
    }).eq('id', athlete.id)
    setSaving(false)
    setEditing(false)
    // Reload
    const { data } = await supabase.from('athletes').select('*').eq('id', athlete.id).single()
    if (data) setAthlete(data)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/athlete/login')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 13, outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0A2540', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A2540' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: '#fff' }}>BSA</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2BA5A0', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Athlete Portal</span>
        </Link>
        <button onClick={handleSignOut} style={{
          fontSize: 12, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer',
        }}>Sign out</button>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        {!athlete ? (
          /* No claimed profile */
          <div style={{
            textAlign: 'center', padding: '60px 24px',
            backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 8 }}>No Profile Linked</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>
              Your account isn&apos;t linked to an athlete profile yet. If you&apos;ve submitted a claim, it&apos;s pending admin approval.
            </p>
            <Link href="/athletes" style={{
              display: 'inline-block', padding: '12px 24px', borderRadius: 10,
              backgroundColor: '#2BA5A0', color: '#fff', fontSize: 14, fontWeight: 600,
              textDecoration: 'none',
            }}>Browse Athletes</Link>
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
              <div style={{
                width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                border: athlete.verified ? '3px solid #2BA5A0' : '3px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {athlete.image_url ? (
                  <img src={athlete.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 32, color: 'rgba(255,255,255,0.08)', fontWeight: 700 }}>{athlete.name.split(' ').map(n => n[0]).join('')}</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>{athlete.name}</h1>
                  {athlete.verified && (
                    <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 10, backgroundColor: 'rgba(43,165,160,0.15)', color: '#2BA5A0', fontWeight: 600 }}>✓ Verified</span>
                  )}
                  {athlete.claim_status === 'pending' && (
                    <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 10, backgroundColor: 'rgba(245,158,11,0.15)', color: '#F59E0B', fontWeight: 600 }}>Pending Approval</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <Link href={`/athletes/${athlete.id}`} style={{ fontSize: 12, color: '#2BA5A0', textDecoration: 'none' }}>View Public Profile</Link>
                  <a href={`/api/athletes/${athlete.id}/card`} download style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Download Stat Card</a>
                  <a href={`https://wa.me/?text=${encodeURIComponent(`Check out my BSA profile!\nhttps://bsa.surf/athletes/${athlete.id}`)}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Share on WhatsApp</a>
                </div>
              </div>
              <button onClick={() => setEditing(!editing)} style={{
                padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: editing ? '#2BA5A0' : 'transparent',
                color: editing ? '#fff' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer', fontSize: 13, fontWeight: 500,
              }}>
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {/* Edit form */}
            {editing && (
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: '24px',
                border: '1px solid rgba(255,255,255,0.06)', marginBottom: 24,
              }}>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 20 }}>Edit Profile</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'block' }}>Bio</label>
                    <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell the surf community about yourself..." />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'block' }}>Instagram</label>
                      <input style={inputStyle} value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} placeholder="@username" />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'block' }}>Facebook</label>
                      <input style={inputStyle} value={form.facebook} onChange={e => setForm({ ...form, facebook: e.target.value })} placeholder="URL or username" />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'block' }}>TikTok</label>
                      <input style={inputStyle} value={form.tiktok} onChange={e => setForm({ ...form, tiktok: e.target.value })} placeholder="@username" />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'block' }}>YouTube</label>
                      <input style={inputStyle} value={form.youtube} onChange={e => setForm({ ...form, youtube: e.target.value })} placeholder="Channel URL" />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'block' }}>Sponsors (comma separated)</label>
                    <input style={inputStyle} value={form.sponsors} onChange={e => setForm({ ...form, sponsors: e.target.value })} placeholder="Billabong, Quiksilver" />
                  </div>
                  <button onClick={handleSave} disabled={saving} style={{
                    padding: '12px 24px', borderRadius: 10, border: 'none',
                    backgroundColor: '#2BA5A0', color: '#fff', fontSize: 14, fontWeight: 600,
                    cursor: saving ? 'wait' : 'pointer', width: 'fit-content',
                  }}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Profile cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Bio */}
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: '20px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <h3 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>Bio</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                  {athlete.bio || 'No bio yet. Edit your profile to add one.'}
                </p>
              </div>

              {/* Social Links */}
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: '20px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <h3 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>Social Links</h3>
                {Object.entries(athlete.social_links || {}).filter(([, v]) => v).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Object.entries(athlete.social_links || {}).filter(([, v]) => v).map(([platform, url]) => (
                      <a key={platform} href={String(url).startsWith('http') ? String(url) : `https://${url}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 13, color: '#2BA5A0', textDecoration: 'none', textTransform: 'capitalize' }}>
                        {platform}: {String(url)}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>No social links added yet.</p>
                )}
              </div>

              {/* Sponsors */}
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: '20px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <h3 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>Sponsors</h3>
                {(athlete.sponsor_names || []).length > 0 ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {athlete.sponsor_names.map(s => (
                      <span key={s} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>{s}</span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>No sponsors listed.</p>
                )}
              </div>

              {/* Quick Actions */}
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: '20px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <h3 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>Share</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <a href={`/api/athletes/${athlete.id}/card`} download={`${athlete.name.replace(/\s+/g, '-').toLowerCase()}-bsa.png`}
                    style={{ display: 'block', padding: '10px 14px', borderRadius: 8, backgroundColor: 'rgba(43,165,160,0.08)', border: '1px solid rgba(43,165,160,0.15)', color: '#2BA5A0', fontSize: 13, fontWeight: 500, textDecoration: 'none', textAlign: 'center' }}>
                    Download Stat Card
                  </a>
                  <button onClick={() => { navigator.clipboard?.writeText(`https://bsa.surf/athletes/${athlete.id}`); alert('Link copied!') }}
                    style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer' }}>
                    Copy Profile Link
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
