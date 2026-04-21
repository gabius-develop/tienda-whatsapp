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

function extractTenantSlug(request: NextRequest): string {
  const host = request.headers.get('host') || ''
  const hostname = host.split(':')[0] // quitar puerto

  // En local dev: localhost → usa DEFAULT_TENANT_SLUG
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return process.env.DEFAULT_TENANT_SLUG ?? 'default'
  }

  // Si APP_DOMAIN está configurado, usarlo para detectar subdominios de forma precisa
  // Ej: APP_DOMAIN=tienda-whatsapp-production-099c.up.railway.app
  const appDomain = process.env.APP_DOMAIN
  if (appDomain) {
    // El dominio principal → tenant por defecto
    if (hostname === appDomain) {
      return process.env.DEFAULT_TENANT_SLUG ?? 'default'
    }
    // Subdominio del dominio principal → es el slug del tenant
    if (hostname.endsWith('.' + appDomain)) {
      return hostname.slice(0, hostname.length - appDomain.length - 1)
    }
  }

  // Fallback: heurística por número de partes
  // (funciona para dominios custom tipo cliente.miapp.com)
  const parts = hostname.split('.')
  if (parts.length >= 3 && parts[0] !== 'www') {
    return parts[0]
  }

  // Sin subdominio o www → tenant por defecto
  return process.env.DEFAULT_TENANT_SLUG ?? 'default'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Inyectar x-tenant-slug en todos los requests
  const tenantSlug = extractTenantSlug(request)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant-slug', tenantSlug)

  const response = NextResponse.next({ request: { headers: requestHeaders } })

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
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
}
