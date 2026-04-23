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

/** GET /api/admin/whatsapp — Lee la configuración del bot para el tenant actual */
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
    .select('*')
    .eq('tenant_id', tenant.id)
    .single()

  // Ocultar el access_token completo en la respuesta (mostrar solo los últimos 6 chars)
  if (data?.access_token) {
    data.access_token_preview = `...${data.access_token.slice(-6)}`
  }

  return NextResponse.json(data ?? null)
}

/** PUT /api/admin/whatsapp — Guarda o actualiza la configuración del bot */
export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantSlug = getTenantSlugFromRequest(request)
  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const body = await request.json()

  const {
    phone_number_id,
    access_token,
    verify_token,
    is_active,
    welcome_message,
    menu_header,
    orders_ask_phone,
    support_message,
    no_orders_message,
  } = body

  if (!phone_number_id || !verify_token) {
    return NextResponse.json({ error: 'phone_number_id y verify_token son requeridos' }, { status: 400 })
  }

  const db = srvClient()

  // Si no se envía access_token (campo vacío = no cambiar), recuperar el existente
  let tokenToSave = access_token
  if (!tokenToSave) {
    const { data: existing } = await db
      .from('whatsapp_bot_config')
      .select('access_token')
      .eq('tenant_id', tenant.id)
      .single()
    tokenToSave = existing?.access_token ?? ''
  }

  const { error } = await db.from('whatsapp_bot_config').upsert(
    {
      tenant_id:        tenant.id,
      phone_number_id,
      access_token:     tokenToSave,
      verify_token,
      is_active:        is_active ?? false,
      welcome_message:  welcome_message ?? '¡Hola! 👋 Bienvenido a nuestra tienda. ¿En qué te puedo ayudar?',
      menu_header:      menu_header      ?? '¿Qué deseas hacer?',
      orders_ask_phone: orders_ask_phone ?? 'Por favor, ingresa el número de teléfono que usaste al hacer tu pedido:',
      support_message:  support_message  ?? '¡Gracias por contactarnos! Un agente te atenderá en breve. 🙏',
      no_orders_message:no_orders_message?? 'No encontramos pedidos con ese número. Verifica que sea el correcto.',
      updated_at:       new Date().toISOString(),
    },
    { onConflict: 'tenant_id' },
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
