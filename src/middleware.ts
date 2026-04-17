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
    const token = request.cookies.get('superadmin_auth')?.value
    const superadminPassword = process.env.SUPERADMIN_PASSWORD

    if (!token || !superadminPassword) {
      return NextResponse.redirect(new URL('/superadmin/login', request.url))
    }

    // Verificar que el token coincide con el hash de la contraseña
    const encoder = new TextEncoder()
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(superadminPassword))
    const expectedToken = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    if (token !== expectedToken) {
      return NextResponse.redirect(new URL('/superadmin/login', request.url))
    }

    return response
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/superadmin/:path*'],
}
