import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function buildSupabaseClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next({ request })

  // ── Admin routes ──────────────────────────────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const supabase = buildSupabaseClient(request, response)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(new URL('/admin/login', request.url))
    return response
  }

  // ── Super Admin routes ────────────────────────────────────
  if (pathname.startsWith('/superadmin') && pathname !== '/superadmin/login') {
    const supabase = buildSupabaseClient(request, response)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.redirect(new URL('/superadmin/login', request.url))

    const superadminEmail = process.env.SUPERADMIN_EMAIL
    if (!superadminEmail || user.email !== superadminEmail) {
      return NextResponse.redirect(new URL('/superadmin/login?error=forbidden', request.url))
    }

    return response
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/superadmin/:path*'],
}
