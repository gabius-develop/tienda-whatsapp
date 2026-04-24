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
 * GET /api/admin/whatsapp/conversations
 * Sin ?phone → lista de conversaciones agrupadas por teléfono
 * Con ?phone=XXX → mensajes de esa conversación
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantSlug = getTenantSlugFromRequest(request)
  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const db = srvClient()
  const phone = request.nextUrl.searchParams.get('phone')

  if (phone) {
    const { data, error } = await db
      .from('whatsapp_messages')
      .select('id, direction, content, created_at')
      .eq('tenant_id', tenant.id)
      .eq('customer_phone', phone)
      .order('created_at', { ascending: true })
      .limit(200)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  }

  // Lista de conversaciones: traer todos los mensajes recientes y agrupar por teléfono
  const { data, error } = await db
    .from('whatsapp_messages')
    .select('customer_phone, content, direction, created_at')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .limit(1000)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Agrupar por teléfono, quedarse con el mensaje más reciente
  const byPhone = new Map<string, {
    customer_phone: string
    last_message: string
    last_direction: string
    last_at: string
    message_count: number
  }>()

  for (const msg of (data ?? [])) {
    if (!byPhone.has(msg.customer_phone)) {
      byPhone.set(msg.customer_phone, {
        customer_phone: msg.customer_phone,
        last_message: msg.content,
        last_direction: msg.direction,
        last_at: msg.created_at,
        message_count: 1,
      })
    } else {
      byPhone.get(msg.customer_phone)!.message_count++
    }
  }

  return NextResponse.json(Array.from(byPhone.values()))
}
