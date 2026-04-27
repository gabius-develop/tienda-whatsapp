/**
 * Motor del bot de WhatsApp
 * Maneja el estado de conversaciones y los flujos de respuesta automática.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { formatCurrency } from './utils'
import {
  sendTextMessage,
  sendImageMessage,
  sendButtonMessage,
  sendListMessage,
  markAsRead,
} from './whatsapp-cloud'

// ─── Supabase service client (sin RLS) ────────────────────────────────────────

function srvClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// ─── Guardar mensaje en historial ─────────────────────────────────────────────

export async function saveMessage(
  db: ReturnType<typeof srvClient>,
  tenantId: string,
  customerPhone: string,
  direction: 'inbound' | 'outbound',
  content: string,
  waMessageId?: string,
) {
  try {
    await db.from('whatsapp_messages').insert({
      tenant_id: tenantId,
      customer_phone: customerPhone,
      direction,
      content,
      ...(waMessageId ? { wa_message_id: waMessageId } : {}),
    })
  } catch (err) {
    console.error('[WA bot] error guardando mensaje:', err)
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WaBotConfig {
  id: string
  tenant_id: string
  phone_number_id: string
  access_token: string
  verify_token: string
  is_active: boolean
  welcome_message: string
  welcome_image_url?: string | null
  menu_header: string
  orders_ask_phone: string
  support_message: string
  no_orders_message: string
}

type ConversationState = 'idle' | 'order_lookup' | 'support'

export interface IncomingMessage {
  messageId: string
  from: string              // Número del cliente (con código de país, sin +)
  type: 'text' | 'interactive' | 'other'
  text?: string
  interactiveId?: string    // ID del botón o ítem de lista seleccionado
  interactiveTitle?: string
}

interface FlowStep {
  id: string
  parent_id: string | null
  button_id: string
  button_title: string
  step_type: string
  response_text: string | null
  response_image_url: string | null
  sort_order: number
}

// ─── Conversación ─────────────────────────────────────────────────────────────

const STALE_MS = 30 * 60 * 1000 // 30 minutos de inactividad = reiniciar sesión

async function getConversationState(
  db: ReturnType<typeof srvClient>,
  tenantId: string,
  phone: string,
): Promise<ConversationState> {
  const { data } = await db
    .from('whatsapp_conversations')
    .select('state, last_message_at')
    .eq('tenant_id', tenantId)
    .eq('customer_phone', phone)
    .single()

  if (!data) return 'idle'

  const stale = Date.now() - new Date(data.last_message_at).getTime() > STALE_MS
  return stale ? 'idle' : (data.state as ConversationState)
}

async function setConversationState(
  db: ReturnType<typeof srvClient>,
  tenantId: string,
  phone: string,
  state: ConversationState,
) {
  await db.from('whatsapp_conversations').upsert(
    {
      tenant_id: tenantId,
      customer_phone: phone,
      state,
      last_message_at: new Date().toISOString(),
    },
    { onConflict: 'tenant_id,customer_phone' },
  )
}

// ─── Flujos personalizados ────────────────────────────────────────────────────

async function getTopLevelFlowSteps(
  db: ReturnType<typeof srvClient>,
  tenantId: string,
): Promise<FlowStep[]> {
  const { data } = await db
    .from('bot_flow_steps')
    .select('id, parent_id, button_id, button_title, step_type, response_text, response_image_url, sort_order')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .is('parent_id', null)
    .order('sort_order', { ascending: true })
    .limit(3)
  return data ?? []
}

async function getChildFlowSteps(
  db: ReturnType<typeof srvClient>,
  tenantId: string,
  parentId: string,
): Promise<FlowStep[]> {
  const { data } = await db
    .from('bot_flow_steps')
    .select('id, parent_id, button_id, button_title, step_type, response_text, response_image_url, sort_order')
    .eq('tenant_id', tenantId)
    .eq('parent_id', parentId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(3)
  return data ?? []
}

async function getFlowStepByButtonId(
  db: ReturnType<typeof srvClient>,
  tenantId: string,
  buttonId: string,
): Promise<FlowStep | null> {
  const { data } = await db
    .from('bot_flow_steps')
    .select('id, parent_id, button_id, button_title, step_type, response_text, response_image_url, sort_order')
    .eq('tenant_id', tenantId)
    .eq('button_id', buttonId)
    .eq('is_active', true)
    .single()
  return data ?? null
}

// ─── Menú principal (hardcodeado, fallback) ───────────────────────────────────

async function sendMainMenu(
  cfg: WaBotConfig,
  to: string,
  db: ReturnType<typeof srvClient>,
  tenantId: string,
) {
  const buttons = [
    { id: 'btn_products', title: '🛍️ Ver productos' },
    { id: 'btn_orders',   title: '📦 Mis pedidos' },
    { id: 'btn_support',  title: '💬 Soporte' },
  ]
  const content = `${cfg.menu_header}\n[${buttons.map(b => b.title).join(' | ')}]`
  await saveMessage(db, tenantId, to, 'outbound', content)
  return sendButtonMessage(cfg.phone_number_id, cfg.access_token, to, cfg.menu_header, buttons)
}

// ─── Menú principal dinámico (desde flujos configurados) ─────────────────────

async function sendMainMenuDynamic(
  cfg: WaBotConfig,
  to: string,
  db: ReturnType<typeof srvClient>,
  tenantId: string,
) {
  const topSteps = await getTopLevelFlowSteps(db, tenantId)

  if (topSteps.length === 0) {
    // Sin flujos configurados → usar menú por defecto
    return sendMainMenu(cfg, to, db, tenantId)
  }

  const buttons = topSteps.map((s) => ({
    id: s.button_id,
    title: s.button_title.substring(0, 20),
  }))

  const content = `${cfg.menu_header}\n[${buttons.map(b => b.title).join(' | ')}]`
  await saveMessage(db, tenantId, to, 'outbound', content)
  return sendButtonMessage(cfg.phone_number_id, cfg.access_token, to, cfg.menu_header, buttons)
}

// ─── Enviar bienvenida (texto o imagen + texto) ───────────────────────────────

async function sendWelcome(
  cfg: WaBotConfig,
  to: string,
  db: ReturnType<typeof srvClient>,
  tenantId: string,
) {
  if (cfg.welcome_image_url) {
    await saveMessage(db, tenantId, to, 'outbound', `[Imagen] ${cfg.welcome_message}`)
    return sendImageMessage(
      cfg.phone_number_id,
      cfg.access_token,
      to,
      cfg.welcome_image_url,
      cfg.welcome_message,
    )
  }
  await saveMessage(db, tenantId, to, 'outbound', cfg.welcome_message)
  return sendTextMessage(cfg.phone_number_id, cfg.access_token, to, cfg.welcome_message)
}

// ─── Flujo: Ver productos ─────────────────────────────────────────────────────

async function handleProducts(
  cfg: WaBotConfig,
  to: string,
  tenantId: string,
  db: ReturnType<typeof srvClient>,
) {
  const { data: products } = await db
    .from('products')
    .select('id, name, price, category')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(10)

  if (!products || products.length === 0) {
    const text = 'Pronto tendremos productos disponibles. ¡Vuelve a visitarnos! 😊'
    await saveMessage(db, tenantId, to, 'outbound', text)
    return sendTextMessage(cfg.phone_number_id, cfg.access_token, to, text)
  }

  // Agrupar por categoría
  const byCategory: Record<string, typeof products> = {}
  for (const p of products) {
    const cat = p.category ?? 'General'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(p)
  }

  const sections = Object.entries(byCategory).map(([cat, items]) => ({
    title: cat,
    rows: items.map((p) => ({
      id: `product_${p.id}`,
      title: p.name,
      description: formatCurrency(p.price),
    })),
  }))

  const productList = products.map(p => `• ${p.name} — ${formatCurrency(p.price)}`).join('\n')
  await saveMessage(db, tenantId, to, 'outbound', `🛍️ Nuestros productos:\n${productList}`)

  return sendListMessage(
    cfg.phone_number_id,
    cfg.access_token,
    to,
    'Selecciona un producto para ver sus detalles:',
    'Ver productos',
    sections,
    { headerText: '🛍️ Nuestros productos' },
  )
}

// ─── Flujo: Detalle de producto ───────────────────────────────────────────────

async function handleProductDetail(
  cfg: WaBotConfig,
  to: string,
  productId: string,
  tenantId: string,
  db: ReturnType<typeof srvClient>,
  storeUrl: string,
) {
  const { data: p } = await db
    .from('products')
    .select('name, price, description, stock')
    .eq('id', productId)
    .eq('tenant_id', tenantId)
    .single()

  if (!p) {
    const text = 'Producto no encontrado.'
    await saveMessage(db, tenantId, to, 'outbound', text)
    await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, text)
    return sendMainMenuDynamic(cfg, to, db, tenantId)
  }

  const desc = p.description ? `\n\n_${p.description}_` : ''
  const stock = p.stock > 0 ? `✅ Disponible (${p.stock} en stock)` : '❌ Sin stock'
  const storeLink = storeUrl ? `\n\n🛒 Agregar al carrito:\n${storeUrl}` : ''
  const text = `*${p.name}*\n💰 ${formatCurrency(p.price)}\n${stock}${desc}${storeLink}`

  await saveMessage(db, tenantId, to, 'outbound', text)
  await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, text)

  return sendMainMenuDynamic(cfg, to, db, tenantId)
}

// ─── Flujo: Mis pedidos ───────────────────────────────────────────────────────

async function handleOrderLookup(
  cfg: WaBotConfig,
  to: string,
  phoneQuery: string,
  tenantId: string,
  db: ReturnType<typeof srvClient>,
) {
  const clean = phoneQuery.replace(/[\s\-\(\)\+]/g, '')

  const { data: orders } = await db
    .from('orders')
    .select('id, created_at, total, status, customer_name')
    .eq('tenant_id', tenantId)
    .ilike('customer_phone', `%${clean}%`)
    .order('created_at', { ascending: false })
    .limit(3)

  await setConversationState(db, tenantId, to, 'idle')

  if (!orders || orders.length === 0) {
    await saveMessage(db, tenantId, to, 'outbound', cfg.no_orders_message)
    await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, cfg.no_orders_message)
    return sendMainMenuDynamic(cfg, to, db, tenantId)
  }

  const STATUS: Record<string, string> = {
    pending:   '⏳ Pendiente',
    confirmed: '✅ Confirmado',
    preparing: '👨‍🍳 En preparación',
    shipped:   '🚚 En camino',
    delivered: '🏠 Entregado',
    cancelled: '❌ Cancelado',
  }

  const list = orders
    .map((o) => {
      const date = new Date(o.created_at).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      const status = STATUS[o.status] ?? o.status
      return `📦 *${date}*\n💰 Total: ${formatCurrency(o.total)}\n${status}`
    })
    .join('\n\n')

  const text = `Encontré ${orders.length} pedido(s) para ese número:\n\n${list}`
  await saveMessage(db, tenantId, to, 'outbound', text)
  await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, text)

  return sendMainMenuDynamic(cfg, to, db, tenantId)
}

// ─── Flujo: Botón personalizado ───────────────────────────────────────────────

async function handleCustomFlow(
  cfg: WaBotConfig,
  to: string,
  step: FlowStep,
  tenantId: string,
  db: ReturnType<typeof srvClient>,
) {
  // Enviar respuesta configurada
  if (step.response_image_url) {
    const caption = step.response_text ?? undefined
    await saveMessage(db, tenantId, to, 'outbound', `[Imagen] ${caption ?? ''}`)
    await sendImageMessage(cfg.phone_number_id, cfg.access_token, to, step.response_image_url, caption)
  } else if (step.response_text) {
    await saveMessage(db, tenantId, to, 'outbound', step.response_text)
    await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, step.response_text)
  }

  // ¿Tiene sub-botones?
  const children = await getChildFlowSteps(db, tenantId, step.id)
  if (children.length > 0) {
    const buttons = children.map((c) => ({
      id: c.button_id,
      title: c.button_title.substring(0, 20),
    }))
    const bodyText = cfg.menu_header
    const content = `[Sub-menú] ${buttons.map(b => b.title).join(' | ')}`
    await saveMessage(db, tenantId, to, 'outbound', content)
    return sendButtonMessage(cfg.phone_number_id, cfg.access_token, to, bodyText, buttons)
  }

  // Sin hijos → volver al menú principal
  return sendMainMenuDynamic(cfg, to, db, tenantId)
}

// ─── Punto de entrada principal ───────────────────────────────────────────────

export async function handleIncomingMessage(
  phoneNumberId: string,
  msg: IncomingMessage,
) {
  const db = srvClient()

  // Buscar configuración del bot por phone_number_id
  console.log('[WA bot] buscando config para phone_number_id:', phoneNumberId)
  const { data: cfgRow, error: cfgError } = await db
    .from('whatsapp_bot_config')
    .select('*, tenants(id, slug)')
    .eq('phone_number_id', phoneNumberId)
    .eq('is_active', true)
    .single()

  if (cfgError) console.error('[WA bot] error buscando config:', cfgError.message)
  if (!cfgRow) {
    console.log('[WA bot] no se encontró config activa para phone_number_id:', phoneNumberId)
    return
  }

  const cfg = cfgRow as WaBotConfig & { tenants: { id: string; slug: string } | null }
  const tenantId = cfg.tenants?.id
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const storeUrl = cfg.tenants?.slug ? `${appUrl}/s/${cfg.tenants.slug}` : appUrl
  console.log('[WA bot] tenant encontrado:', tenantId)
  if (!tenantId) {
    console.log('[WA bot] no se encontró tenant para la config')
    return
  }

  // Marcar como leído
  await markAsRead(phoneNumberId, cfg.access_token, msg.messageId)

  // ── Respuestas a botones e ítems de lista ──────────────────────────────────
  if (msg.type === 'interactive' && msg.interactiveId) {
    const id = msg.interactiveId
    const title = msg.interactiveTitle ?? id

    // Guardar selección del usuario
    await saveMessage(db, tenantId, msg.from, 'inbound', `[Botón] ${title}`, msg.messageId)

    // Botón personalizado de un flujo configurado
    if (id.startsWith('flow_')) {
      const step = await getFlowStepByButtonId(db, tenantId, id)
      if (step) {
        return handleCustomFlow(cfg, msg.from, step, tenantId, db)
      }
      return sendMainMenuDynamic(cfg, msg.from, db, tenantId)
    }

    if (id === 'btn_products') {
      return handleProducts(cfg, msg.from, tenantId, db)
    }

    if (id === 'btn_orders') {
      await saveMessage(db, tenantId, msg.from, 'outbound', cfg.orders_ask_phone)
      await sendTextMessage(cfg.phone_number_id, cfg.access_token, msg.from, cfg.orders_ask_phone)
      return setConversationState(db, tenantId, msg.from, 'order_lookup')
    }

    if (id === 'btn_support') {
      await saveMessage(db, tenantId, msg.from, 'outbound', cfg.support_message)
      await sendTextMessage(cfg.phone_number_id, cfg.access_token, msg.from, cfg.support_message)
      // Pausar el bot: el admin atenderá manualmente
      return setConversationState(db, tenantId, msg.from, 'support')
    }

    if (id.startsWith('product_')) {
      return handleProductDetail(cfg, msg.from, id.replace('product_', ''), tenantId, db, storeUrl)
    }

    // Cualquier otra selección → menú
    return sendMainMenuDynamic(cfg, msg.from, db, tenantId)
  }

  // ── Mensajes de texto ──────────────────────────────────────────────────────
  if (msg.type === 'text' && msg.text) {
    const state = await getConversationState(db, tenantId, msg.from)

    if (state === 'order_lookup') {
      return handleOrderLookup(cfg, msg.from, msg.text, tenantId, db)
    }

    // Bot pausado: el admin está atendiendo manualmente, no responder
    if (state === 'support') {
      console.log('[WA bot] modo soporte activo, no se responde automáticamente a:', msg.from)
      return
    }

    // Primer mensaje / mensaje libre → bienvenida + menú
    await saveMessage(db, tenantId, msg.from, 'inbound', msg.text, msg.messageId)
    await sendWelcome(cfg, msg.from, db, tenantId)
    return sendMainMenuDynamic(cfg, msg.from, db, tenantId)
  }

  // ── Cualquier otro tipo de mensaje → menú (solo si no está en soporte) ────
  const state = await getConversationState(db, tenantId, msg.from)
  if (state === 'support') return
  return sendMainMenuDynamic(cfg, msg.from, db, tenantId)
}
