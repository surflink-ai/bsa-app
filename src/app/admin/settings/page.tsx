'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const inputStyle = {
  border: '1px solid rgba(10,37,64,0.12)',
  borderRadius: '4px',
  padding: '9px 12px',
  fontSize: '13px',
  color: '#0A2540',
  width: '100%',
  outline: 'none',
}

const labelStyle = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '10px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.15em',
  color: 'rgba(10,37,64,0.35)',
  display: 'block',
  marginBottom: '6px',
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [instagram, setInstagram] = useState('')
  const [facebook, setFacebook] = useState('')
  const [youtube, setYoutube] = useState('')
  const [twitter, setTwitter] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [aboutText, setAboutText] = useState('')
  const [registrationLink, setRegistrationLink] = useState('')

  useEffect(() => {
    const fetchSettings = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('site_settings').select('*')
      const map: Record<string, unknown> = {}
      for (const row of data || []) {
        map[row.key] = row.value
      }

      const social = (map.social_links || {}) as Record<string, string>
      setInstagram(social.instagram || '')
      setFacebook(social.facebook || '')
      setYoutube(social.youtube || '')
      setTwitter(social.twitter || '')

      const contact = (map.contact_info || {}) as Record<string, string>
      setContactEmail(contact.email || '')
      setContactPhone(contact.phone || '')

      setAboutText(typeof map.about_text === 'string' ? map.about_text : '')
      setRegistrationLink(typeof map.registration_link === 'string' ? map.registration_link : '')

      setLoading(false)
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const now = new Date().toISOString()

    await Promise.all([
      supabase.from('site_settings').upsert({ key: 'social_links', value: { instagram, facebook, youtube, twitter }, updated_at: now }),
      supabase.from('site_settings').upsert({ key: 'contact_info', value: { email: contactEmail, phone: contactPhone }, updated_at: now }),
      supabase.from('site_settings').upsert({ key: 'about_text', value: aboutText, updated_at: now }),
      supabase.from('site_settings').upsert({ key: 'registration_link', value: registrationLink, updated_at: now }),
    ])

    setSaving(false)
    alert('Settings saved!')
  }

  const focusHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor = '#2BA5A0' }
  const blurHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor = 'rgba(10,37,64,0.12)' }

  if (loading) return <p className="text-[13px] text-[#0A2540]/30 py-8">Loading...</p>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Settings</h1>
        <p className="text-[12px] text-[#0A2540]/30 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Site-wide configuration</p>
      </div>

      <div className="max-w-[560px] space-y-6">
        {/* Social Links */}
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.15em] text-[#0A2540]/30 mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Social Links
          </h2>
          <div className="space-y-3">
            <div>
              <label style={labelStyle}>Instagram</label>
              <input type="url" value={instagram} onChange={e => setInstagram(e.target.value)}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
            <div>
              <label style={labelStyle}>Facebook</label>
              <input type="url" value={facebook} onChange={e => setFacebook(e.target.value)}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
            <div>
              <label style={labelStyle}>YouTube</label>
              <input type="url" value={youtube} onChange={e => setYoutube(e.target.value)}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
            <div>
              <label style={labelStyle}>Twitter / X</label>
              <input type="url" value={twitter} onChange={e => setTwitter(e.target.value)}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
          </div>
        </div>

        <div className="h-px bg-[#0A2540]/[0.04]" />

        {/* Contact Info */}
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.15em] text-[#0A2540]/30 mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Contact Info
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
          </div>
        </div>

        <div className="h-px bg-[#0A2540]/[0.04]" />

        {/* General */}
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.15em] text-[#0A2540]/30 mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            General
          </h2>
          <div className="space-y-3">
            <div>
              <label style={labelStyle}>About Text</label>
              <textarea value={aboutText} onChange={e => setAboutText(e.target.value)} rows={3}
                style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties}
                onFocus={focusHandler} onBlur={blurHandler} />
            </div>
            <div>
              <label style={labelStyle}>Registration Link</label>
              <input type="url" value={registrationLink} onChange={e => setRegistrationLink(e.target.value)}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button onClick={handleSave} disabled={saving}
            className="text-[13px] font-medium text-white px-6 py-2.5 transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#0A2540', borderRadius: '4px' }}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
