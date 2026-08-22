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

/**
 * GET /api/admin/whatsapp/contacts
 * Retorna mapa { phone: alias } guardado en store_settings
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantSlug = getTenantSlugFromRequest(request)
  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const db = srvClient()
  const { data } = await db
    .from('store_settings')
    .select('value')
    .eq('tenant_id', tenant.id)
    .eq('key', 'whatsapp_contacts')
    .single()

  const contacts: Record<string, string> = data?.value ? JSON.parse(data.value) : {}
  return NextResponse.json(contacts)
}

/**
 * PUT /api/admin/whatsapp/contacts
 * Body: { phone: string, alias: string }
 * Guarda o actualiza un alias. Si alias está vacío, elimina el contacto.
 */
export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantSlug = getTenantSlugFromRequest(request)
  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const { phone, alias } = await request.json()
  if (!phone) return NextResponse.json({ error: 'phone es requerido' }, { status: 400 })

  const db = srvClient()

  // Leer contactos actuales
  const { data: existing } = await db
    .from('store_settings')
    .select('value')
    .eq('tenant_id', tenant.id)
    .eq('key', 'whatsapp_contacts')
    .single()

  const contacts: Record<string, string> = existing?.value ? JSON.parse(existing.value) : {}

  if (alias?.trim()) {
    contacts[phone] = alias.trim()
  } else {
    delete contacts[phone]
  }

  const { error } = await db
    .from('store_settings')
    .upsert(
      {
        key: 'whatsapp_contacts',
        tenant_id: tenant.id,
        value: JSON.stringify(contacts),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key,tenant_id' },
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, contacts })
}
