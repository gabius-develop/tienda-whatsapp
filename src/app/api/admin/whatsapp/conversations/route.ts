import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTenantBySlug, getTenantSlugFromRequest } from '@/lib/tenant'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { sendTextMessage } from '@/lib/whatsapp-cloud'
import { saveMessage } from '@/lib/whatsapp-bot'

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

/**
 * POST /api/admin/whatsapp/conversations
 * Body: { to: string, message: string }
 * Envía un mensaje desde el bot al número indicado
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantSlug = getTenantSlugFromRequest(request)
  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const { to, message } = await request.json()
  if (!to || !message?.trim()) {
    return NextResponse.json({ error: 'to y message son requeridos' }, { status: 400 })
  }

  const db = srvClient()

  // Obtener credenciales del bot
  const { data: cfg } = await db
    .from('whatsapp_bot_config')
    .select('phone_number_id, access_token, is_active')
    .eq('tenant_id', tenant.id)
    .single()

  if (!cfg || !cfg.is_active) {
    return NextResponse.json({ error: 'El bot no está activo o no está configurado' }, { status: 400 })
  }

  // Enviar el mensaje
  const ok = await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, message.trim())
  if (!ok) {
    return NextResponse.json({ error: 'Error al enviar el mensaje por WhatsApp' }, { status: 500 })
  }

  // Guardar en historial
  await saveMessage(db, tenant.id, to, 'outbound', message.trim())

  return NextResponse.json({ success: true })
}
