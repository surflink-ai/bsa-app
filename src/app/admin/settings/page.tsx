'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, Card, FormField, Button, SectionLabel, inputStyle } from '@/components/admin/ui'
import { logAudit } from '@/lib/audit'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({ instagram: '', facebook: '', twitter: '', youtube: '', contact_email: '', contact_address: '', registration_link: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    (async () => {
      const { data } = await createClient().from('site_settings').select('*')
      if (data) {
        const s: Record<string, string> = { ...settings }
        data.forEach(d => { if (typeof d.value === 'string') s[d.key] = d.value; else if (d.value && typeof d.value === 'object' && 'value' in (d.value as Record<string, unknown>)) s[d.key] = (d.value as Record<string, string>).value })
        setSettings(s)
      }
      setLoading(false)
    })()
  }, [])

  const save = async () => {
    setSaving(true)
    const sb = createClient()
    for (const [key, value] of Object.entries(settings)) {
      await sb.from('site_settings').upsert({ key, value: { value } }, { onConflict: 'key' })
    }
    logAudit(sb, 'Updated settings', 'site_settings')
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--admin-text-muted)', fontSize: 13 }}>Loading...</div>

  return (
    <div>
      <PageHeader title="Settings" subtitle="Site configuration" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <Card>
          <SectionLabel>Social Links</SectionLabel>
          <FormField label="Instagram"><input value={settings.instagram} onChange={e => setSettings({ ...settings, instagram: e.target.value })} style={inputStyle} placeholder="https://instagram.com/..." /></FormField>
          <FormField label="Facebook"><input value={settings.facebook} onChange={e => setSettings({ ...settings, facebook: e.target.value })} style={inputStyle} /></FormField>
          <FormField label="Twitter / X"><input value={settings.twitter} onChange={e => setSettings({ ...settings, twitter: e.target.value })} style={inputStyle} /></FormField>
          <FormField label="YouTube"><input value={settings.youtube} onChange={e => setSettings({ ...settings, youtube: e.target.value })} style={inputStyle} /></FormField>
        </Card>
        <Card>
          <SectionLabel>Contact</SectionLabel>
          <FormField label="Email"><input value={settings.contact_email} onChange={e => setSettings({ ...settings, contact_email: e.target.value })} style={inputStyle} /></FormField>
          <FormField label="Address"><textarea value={settings.contact_address} onChange={e => setSettings({ ...settings, contact_address: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></FormField>
          <FormField label="Registration Link"><input value={settings.registration_link} onChange={e => setSettings({ ...settings, registration_link: e.target.value })} style={inputStyle} /></FormField>
        </Card>
      </div>
      <div style={{ marginTop: 24, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
        {saved && <span style={{ fontSize: 12, color: 'var(--admin-success)', fontWeight: 500 }}>Saved</span>}
      </div>
    </div>
  )
}
