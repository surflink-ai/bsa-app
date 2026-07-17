import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refreshes the Supabase auth session on every request (writing rotated cookies
 * back to the response) and gates authenticated areas. Without this, the SSR
 * client cannot reliably refresh tokens and protected pages can serve stale
 * sessions.
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request })

  // Expose the pathname to server components (used by the admin layout).
  response.headers.set('x-pathname', request.nextUrl.pathname)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return response

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAdminArea = pathname.startsWith('/admin') && pathname !== '/admin/login'
  const isAthleteDash = pathname.startsWith('/athlete/dashboard')

  if (!user && (isAdminArea || isAthleteDash)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = isAthleteDash ? '/athlete/login' : '/admin/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    // Run on everything except static assets and image files.
    '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?)$).*)',
  ],
}
