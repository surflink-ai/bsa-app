'use client'

import { usePathname } from 'next/navigation'

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/stream')) return null
  return <>{children}</>
}
