import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTenantBySlug, getTenantSlugFromRequest } from '@/lib/tenant'
import { revalidateTag } from 'next/cache'

const ALLOWED_KEYS = ['primary_color', 'store_name', 'welcome_title', 'welcome_subtitle', 'footer_text']

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantSlug = getTenantSlugFromRequest(request)
  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const body: Record<string, unknown> = await request.json()

  const upserts = Object.entries(body)
    .filter(([key, value]) => ALLOWED_KEYS.includes(key) && value !== undefined)
    .map(([key, value]) => ({
      key,
      tenant_id: tenant.id,
      value: String(value),
      updated_at: new Date().toISOString(),
    }))

  if (upserts.length === 0) return NextResponse.json({ success: true })

  const { error } = await supabase
    .from('store_settings')
    .upsert(upserts, { onConflict: 'key,tenant_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidateTag('tenants', {})
  return NextResponse.json({ success: true })
}
