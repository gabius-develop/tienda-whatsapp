import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTenantBySlug, getTenantSlugFromRequest } from '@/lib/tenant'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function srvClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/** GET /api/admin/whatsapp/forward-phone — Lee el número de reenvío actual */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantSlug = getTenantSlugFromRequest(request)
  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const db = srvClient()
  const { data } = await db
    .from('whatsapp_bot_config')
    .select('forward_phone')
    .eq('tenant_id', tenant.id)
    .single()

  return NextResponse.json({ forward_phone: data?.forward_phone ?? null })
}

/** PUT /api/admin/whatsapp/forward-phone — Guarda solo el número de reenvío */
export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantSlug = getTenantSlugFromRequest(request)
  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const body = await request.json()
  const forward_phone: string | null = body.forward_phone ?? null

  const db = srvClient()

  // Verificar que ya existe una config para este tenant
  const { data: existing } = await db
    .from('whatsapp_bot_config')
    .select('id')
    .eq('tenant_id', tenant.id)
    .single()

  if (!existing) {
    return NextResponse.json(
      { error: 'Primero configura las credenciales del bot antes de activar el reenvío.' },
      { status: 400 },
    )
  }

  const { error } = await db
    .from('whatsapp_bot_config')
    .update({ forward_phone, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenant.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, forward_phone })
}
