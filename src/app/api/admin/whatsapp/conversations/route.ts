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
 * Sin ?phone → lista de conversaciones con estado
 * Con ?phone=XXX → { messages, state } de esa conversación
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
    const [{ data: messages, error }, { data: conv }] = await Promise.all([
      db
        .from('whatsapp_messages')
        .select('id, direction, content, created_at')
        .eq('tenant_id', tenant.id)
        .eq('customer_phone', phone)
        .order('created_at', { ascending: true })
        .limit(200),
      db
        .from('whatsapp_conversations')
        .select('state')
        .eq('tenant_id', tenant.id)
        .eq('customer_phone', phone)
        .single(),
    ])

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ messages: messages ?? [], state: conv?.state ?? 'idle' })
  }

  // Lista de conversaciones
  const [{ data: msgs, error: msgsError }, { data: convStates }] = await Promise.all([
    db
      .from('whatsapp_messages')
      .select('customer_phone, content, direction, created_at')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
      .limit(1000),
    db
      .from('whatsapp_conversations')
      .select('customer_phone, state')
      .eq('tenant_id', tenant.id),
  ])

  if (msgsError) return NextResponse.json({ error: msgsError.message }, { status: 500 })

  // Mapa de estados por teléfono
  const stateMap = new Map<string, string>()
  for (const c of (convStates ?? [])) {
    stateMap.set(c.customer_phone, c.state)
  }

  const byPhone = new Map<string, {
    customer_phone: string
    last_message: string
    last_direction: string
    last_at: string
    last_inbound_at: string | null
    message_count: number
    state: string
  }>()

  // Mensajes vienen ordenados DESC → el primero de cada teléfono es el más reciente
  for (const msg of (msgs ?? [])) {
    if (!byPhone.has(msg.customer_phone)) {
      byPhone.set(msg.customer_phone, {
        customer_phone: msg.customer_phone,
        last_message: msg.content,
        last_direction: msg.direction,
        last_at: msg.created_at,
        last_inbound_at: msg.direction === 'inbound' ? msg.created_at : null,
        message_count: 1,
        state: stateMap.get(msg.customer_phone) ?? 'idle',
      })
    } else {
      const entry = byPhone.get(msg.customer_phone)!
      entry.message_count++
      // Guardar el inbound más reciente (el primero que encontramos en orden DESC)
      if (msg.direction === 'inbound' && entry.last_inbound_at === null) {
        entry.last_inbound_at = msg.created_at
      }
    }
  }

  return NextResponse.json(Array.from(byPhone.values()))
}

/**
 * POST /api/admin/whatsapp/conversations
 * Body: { to, message } — envía mensaje manual desde el admin
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

  const { data: cfg } = await db
    .from('whatsapp_bot_config')
    .select('phone_number_id, access_token, is_active')
    .eq('tenant_id', tenant.id)
    .single()

  if (!cfg || !cfg.is_active) {
    return NextResponse.json({ error: 'El bot no está activo o no está configurado' }, { status: 400 })
  }

  const ok = await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, message.trim())
  if (!ok) {
    return NextResponse.json({ error: 'Error al enviar el mensaje por WhatsApp' }, { status: 500 })
  }

  await saveMessage(db, tenant.id, to, 'outbound', message.trim())

  return NextResponse.json({ success: true })
}

/**
 * PATCH /api/admin/whatsapp/conversations
 * Body: { phone, state } — cambia el estado de la conversación
 * state: 'idle' = bot activo | 'support' = bot pausado
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantSlug = getTenantSlugFromRequest(request)
  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const { phone, state } = await request.json()
  if (!phone || !['idle', 'support'].includes(state)) {
    return NextResponse.json({ error: 'phone y state (idle|support) son requeridos' }, { status: 400 })
  }

  const db = srvClient()
  const { error } = await db
    .from('whatsapp_conversations')
    .upsert(
      {
        tenant_id: tenant.id,
        customer_phone: phone,
        state,
        last_message_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id,customer_phone' },
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, state })
}
