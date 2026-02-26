'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

interface Props {
  user: User
  profile: { display_name: string; email: string; role: string } | null
  claims: { id: string; athlete_name: string; status: string; created_at: string }[]
  athleteProfile: {
    liveheats_id: string; name: string; bio: string | null
    stance: string | null; home_break: string | null
    instagram: string | null; twitter: string | null; photo_url: string | null
  } | null
}

export default function ProfileClient({ user, profile, claims, athleteProfile }: Props) {
  const supabase = createClient()
  const router = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 pt-24 md:pt-28">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-2xl font-bold text-navy">Profile</h1>
        <button onClick={handleSignOut} className="text-sm text-dark/40 hover:text-dark">
          Sign Out
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold text-navy mb-4">Account</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-dark/50">Name</span>
            <span className="text-dark">{profile?.display_name || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dark/50">Email</span>
            <span className="text-dark">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dark/50">Role</span>
            <span className="capitalize text-dark">{profile?.role || 'user'}</span>
          </div>
        </div>
      </div>

      {athleteProfile ? (
        <AthleteProfileEditor profile={athleteProfile} />
      ) : (
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold text-navy mb-2">Athlete Profile</h2>
          <p className="text-dark/50 text-sm mb-4">
            Are you a BSA competitor? Claim your athlete profile to add your bio, photos, and more.
          </p>
          <a
            href="/profile/claim"
            className="inline-block bg-ocean hover:bg-ocean/80 text-white font-semibold rounded-xl px-4 py-2 text-sm transition-colors"
          >
            Claim Your Profile
          </a>
        </div>
      )}

      {claims.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold text-navy mb-4">Claim Requests</h2>
          <div className="space-y-3">
            {claims.map((claim) => (
              <div key={claim.id} className="flex items-center justify-between text-sm">
                <span className="text-dark">{claim.athlete_name}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  claim.status === 'approved' ? 'bg-teal/10 text-teal' :
                  claim.status === 'rejected' ? 'bg-red-100 text-red-600' :
                  'bg-amber/10 text-amber'
                }`}>
                  {claim.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AthleteProfileEditor({ profile }: { profile: NonNullable<Props['athleteProfile']> }) {
  const supabase = createClient()
  const [bio, setBio] = useState(profile.bio || '')
  const [stance, setStance] = useState(profile.stance || 'unknown')
  const [homeBreak, setHomeBreak] = useState(profile.home_break || '')
  const [instagram, setInstagram] = useState(profile.instagram || '')
  const [twitter, setTwitter] = useState(profile.twitter || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    await supabase
      .from('athlete_profiles')
      .update({
        bio, stance, home_break: homeBreak,
        instagram, twitter, updated_at: new Date().toISOString(),
      })
      .eq('liveheats_id', profile.liveheats_id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputClass = "w-full bg-warm-white border border-dark/10 rounded-xl px-4 py-3 text-dark placeholder-dark/30 focus:outline-none focus:ring-2 focus:ring-ocean/30 text-sm"

  return (
    <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-lg font-semibold text-navy">Athlete Profile — {profile.name}</h2>
        <span className="text-xs bg-teal/10 text-teal px-2 py-0.5 rounded-full">Claimed</span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-dark/50 mb-1">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={inputClass + ' resize-none'} placeholder="Tell people about yourself..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-dark/50 mb-1">Stance</label>
            <select value={stance} onChange={(e) => setStance(e.target.value)} className={inputClass}>
              <option value="unknown">Not set</option>
              <option value="regular">Regular</option>
              <option value="goofy">Goofy</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-dark/50 mb-1">Home Break</label>
            <input type="text" value={homeBreak} onChange={(e) => setHomeBreak(e.target.value)} className={inputClass} placeholder="e.g. Soup Bowl" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-dark/50 mb-1">Instagram</label>
            <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} className={inputClass} placeholder="@username" />
          </div>
          <div>
            <label className="block text-sm text-dark/50 mb-1">Twitter / X</label>
            <input type="text" value={twitter} onChange={(e) => setTwitter(e.target.value)} className={inputClass} placeholder="@username" />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-ocean hover:bg-ocean/80 text-white font-semibold rounded-xl px-6 py-2 text-sm transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}
