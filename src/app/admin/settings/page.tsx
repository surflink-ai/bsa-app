'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown>>({})
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
      setSettings(map)

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

  if (loading) return <p className="text-gray-400 text-sm p-8">Loading...</p>

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0A2540]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Site-wide configuration</p>
      </div>

      <div className="max-w-2xl space-y-8">
        {/* Social Links */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Social Links
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Instagram</label>
              <input type="url" value={instagram} onChange={e => setInstagram(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Facebook</label>
              <input type="url" value={facebook} onChange={e => setFacebook(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">YouTube</label>
              <input type="url" value={youtube} onChange={e => setYoutube(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Twitter / X</label>
              <input type="url" value={twitter} onChange={e => setTwitter(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Contact Info
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Phone</label>
              <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
            </div>
          </div>
        </div>

        {/* General */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            General
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">About Text</label>
              <textarea value={aboutText} onChange={e => setAboutText(e.target.value)} rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Registration Link</label>
              <input type="url" value={registrationLink} onChange={e => setRegistrationLink(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2BA5A0]" />
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="bg-[#2BA5A0] text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-[#2BA5A0]/90 disabled:opacity-50 transition-colors">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
