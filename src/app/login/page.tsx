'use client'

import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/profile'
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } })
        if (error) throw error
        router.push(redirect)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push(redirect)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-white border border-dark/10 rounded-xl px-4 py-3 text-dark placeholder-dark/30 focus:outline-none focus:ring-2 focus:ring-ocean/30 text-base"

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2 text-navy">{isSignUp ? 'Create Account' : 'Sign In'}</h1>
        <p className="text-dark/50">{isSignUp ? 'Join the BSA community' : 'Welcome back'}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <label className="block text-sm text-dark/50 mb-1">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Your name" required />
          </div>
        )}
        <div>
          <label className="block text-sm text-dark/50 mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" required />
        </div>
        <div>
          <label className="block text-sm text-dark/50 mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" required minLength={6} />
        </div>
        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">{error}</div>}
        <button type="submit" disabled={loading} className="w-full bg-ocean hover:bg-ocean/80 text-white font-semibold rounded-xl px-4 py-3 transition-colors disabled:opacity-50">
          {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>
      <p className="text-center text-dark/40 mt-6 text-sm">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button onClick={() => { setIsSignUp(!isSignUp); setError('') }} className="text-ocean hover:underline">
          {isSignUp ? 'Sign in' : 'Sign up'}
        </button>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pb-20 bg-warm-white">
      <Suspense fallback={<div className="text-dark/30">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
