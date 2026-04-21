import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const TENANT_COOKIE = 'x-tenant-slug'

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

function extractTenantSlugFromSubdomain(hostname: string): string {
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return process.env.DEFAULT_TENANT_SLUG ?? 'default'
  }

  const appDomain = process.env.APP_DOMAIN
  if (appDomain) {
    if (hostname === appDomain) {
      return process.env.DEFAULT_TENANT_SLUG ?? 'default'
    }
    if (hostname.endsWith('.' + appDomain)) {
      return hostname.slice(0, hostname.length - appDomain.length - 1)
    }
  }

  const parts = hostname.split('.')
  if (parts.length >= 3 && parts[0] !== 'www') {
    return parts[0]
  }

  return process.env.DEFAULT_TENANT_SLUG ?? 'default'
}

/**
 * Extrae el slug del tenant:
 * 1. Si la ruta empieza con /s/[slug], lo toma de la URL y hace rewrite
 * 2. Si el subdominio coincide con un tenant, lo usa
 * 3. Si hay cookie x-tenant-slug (de una visita anterior a /s/[slug]), la usa
 */
function resolveTenant(request: NextRequest): { slug: string; rewriteTo: string | null } {
  const { pathname } = request.nextUrl

  // 1. Path-based: /s/[slug] o /s/[slug]/...
  const match = pathname.match(/^\/s\/([^/]+)(\/.*)?$/)
  if (match) {
    const slug = match[1]
    const restPath = match[2] || '/'
    return { slug, rewriteTo: restPath }
  }

  // 2. Subdominio
  const host = request.headers.get('host') || ''
  const hostname = host.split(':')[0]
  const subdomainSlug = extractTenantSlugFromSubdomain(hostname)
  const defaultSlug = process.env.DEFAULT_TENANT_SLUG ?? 'default'

  if (subdomainSlug !== defaultSlug) {
    return { slug: subdomainSlug, rewriteTo: null }
  }

  // 3. Cookie como fallback (persiste el slug después de navegar desde /s/[slug])
  const cookieSlug = request.cookies.get(TENANT_COOKIE)?.value
  if (cookieSlug) {
    return { slug: cookieSlug, rewriteTo: null }
  }

  return { slug: defaultSlug, rewriteTo: null }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { slug, rewriteTo } = resolveTenant(request)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant-slug', slug)

  // ── /admin/login?tenant=slug → guardar slug en cookie para el panel ────────
  if (pathname === '/admin/login') {
    const tenantParam = request.nextUrl.searchParams.get('tenant')
    if (tenantParam) {
      const response = NextResponse.next({ request: { headers: requestHeaders } })
      response.cookies.set(TENANT_COOKIE, tenantParam, {
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
      })
      return response
    }
  }

  // ── /s/[slug]/* → rewrite a /* y guardar slug en cookie ───────────────────
  if (rewriteTo !== null) {
    const targetUrl = request.nextUrl.clone()
    targetUrl.pathname = rewriteTo

    const response = NextResponse.rewrite(targetUrl, { request: { headers: requestHeaders } })
    response.cookies.set(TENANT_COOKIE, slug, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 horas
    })
    return response
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  // Refrescar la cookie si el slug es conocido (mantiene la sesión activa)
  const defaultSlug = process.env.DEFAULT_TENANT_SLUG ?? 'default'
  if (slug !== defaultSlug) {
    response.cookies.set(TENANT_COOKIE, slug, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    })
  }

  // ── Admin routes ──────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const supabase = buildSupabaseClient(request, response)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(new URL('/admin/login', request.url))
    return response
  }

  // ── Super Admin routes ────────────────────────────────────────────────────
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
