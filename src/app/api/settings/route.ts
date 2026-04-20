import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_SETTINGS, StoreSettings } from '@/lib/settings'
import { getTenantBySlug, getTenantSlugFromRequest } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  try {
    const tenantSlug = getTenantSlugFromRequest(request)
    const tenant = await getTenantBySlug(tenantSlug)

    const supabase = await createClient()

    let settingsData: Record<string, string> = {}

    if (tenant) {
      const { data } = await supabase
        .from('store_settings')
        .select('key, value')
        .eq('tenant_id', tenant.id)

      data?.forEach(({ key, value }) => {
        if (value !== null) settingsData[key] = value
      })
    }

    const merged: StoreSettings = {
      ...DEFAULT_SETTINGS,
      ...settingsData,
      whatsapp_phone: tenant?.whatsapp_phone ?? DEFAULT_SETTINGS.whatsapp_phone,
      feature_live: tenant?.feature_live ?? false,
      feature_competencia: tenant?.feature_competencia ?? false,
    }

    return NextResponse.json(merged)
  } catch {
    return NextResponse.json(DEFAULT_SETTINGS)
  }
}

async function verifySuperadminCookie(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('superadmin_auth')?.value
  const superadminPassword = process.env.SUPERADMIN_PASSWORD
  if (!token || !superadminPassword) return false

  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(superadminPassword))
  const expectedToken = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return token === expectedToken
}

export async function PUT(request: NextRequest) {
  const authorized = await verifySuperadminCookie(request)
  if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const tenantSlug = getTenantSlugFromRequest(request)
  const tenant = await getTenantBySlug(tenantSlug)

  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const supabase = await createClient()
  const body: Partial<StoreSettings> = await request.json()

  // Excluir campos que van en la tabla tenants, no en store_settings
  const { whatsapp_phone: _, feature_live: __, feature_competencia: ___, ...settingsOnly } = body

  const upserts = Object.entries(settingsOnly).map(([key, value]) => ({
    key,
    tenant_id: tenant.id,
    value: String(value),
    updated_at: new Date().toISOString(),
  }))

  if (upserts.length > 0) {
    const { error } = await supabase
      .from('store_settings')
      .upsert(upserts, { onConflict: 'key,tenant_id' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
