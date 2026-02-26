import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: claims } = await supabase
    .from('athlete_claims')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: athleteProfile } = await supabase
    .from('athlete_profiles')
    .select('*')
    .eq('claimed_by', user.id)
    .single()

  return (
    <ProfileClient
      user={user}
      profile={profile}
      claims={claims || []}
      athleteProfile={athleteProfile}
    />
  )
}
