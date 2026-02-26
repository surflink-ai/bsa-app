'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
      }}
      className="w-full text-center text-red-400 hover:text-red-300 text-sm py-3"
    >
      Sign Out
    </button>
  )
}
