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
  from: string
  type: 'text' | 'interactive' | 'other'
  text?: string
  interactiveId?: string
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

const STALE_MS = 30 * 60 * 1000

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
    { tenant_id: tenantId, customer_phone: phone, state, last_message_at: new Date().toISOString() },
    { onConflict: 'tenant_id,customer_phone' },
  )
}

// ─── Flujos personalizados ────────────────────────────────────────────────────

async function loadTopLevelFlows(
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

// ─── Menú hardcodeado (solo se usa cuando NO hay flujos configurados) ──────────

async function sendDefaultMenu(
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

// ─── Menú dinámico (cuando SÍ hay flujos configurados) ────────────────────────
//
// Esta función NUNCA llama al menú hardcodeado: si se invoca con flows vacíos
// significa que los flujos ya fueron comprobados antes y realmente no hay.

async function sendDynamicMenu(
  cfg: WaBotConfig,
  to: string,
  flows: FlowStep[],
  db: ReturnType<typeof srvClient>,
  tenantId: string,
) {
  const buttons = flows.map(s => ({ id: s.button_id, title: s.button_title.substring(0, 20) }))
  const content = `${cfg.menu_header}\n[${buttons.map(b => b.title).join(' | ')}]`
  await saveMessage(db, tenantId, to, 'outbound', content)
  return sendButtonMessage(cfg.phone_number_id, cfg.access_token, to, cfg.menu_header, buttons)
}

// ─── Bienvenida inicial ────────────────────────────────────────────────────────
//
// • Sin flujos configurados → texto de bienvenida por separado + menú hardcodeado
// • Con flujos configurados → UN SOLO mensaje que combina la bienvenida con los
//   botones (imagen como header si hay, texto de bienvenida como body).
//   Así el cliente ve un único mensaje, no "dos flujos".

async function sendWelcomeAndMenu(
  cfg: WaBotConfig,
  to: string,
  flows: FlowStep[],
  db: ReturnType<typeof srvClient>,
  tenantId: string,
) {
  if (flows.length === 0) {
    // Sin flujos → comportamiento original (dos mensajes separados)
    await saveMessage(db, tenantId, to, 'outbound', cfg.welcome_message)
    await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, cfg.welcome_message)
    return sendDefaultMenu(cfg, to, db, tenantId)
  }

  // Con flujos → un solo mensaje interactivo con bienvenida integrada
  const buttons = flows.map(s => ({ id: s.button_id, title: s.button_title.substring(0, 20) }))
  const logContent = `[Bienvenida] ${cfg.welcome_message}\n[${buttons.map(b => b.title).join(' | ')}]`
  await saveMessage(db, tenantId, to, 'outbound', logContent)

  return sendButtonMessage(
    cfg.phone_number_id,
    cfg.access_token,
    to,
    cfg.welcome_message,  // body del mensaje interactivo
    buttons,
    cfg.welcome_image_url
      ? { headerImageUrl: cfg.welcome_image_url }
      : undefined,
  )
}

// ─── Enrutador de menú (para volver al menú después de una interacción) ────────

async function returnToMenu(
  cfg: WaBotConfig,
  to: string,
  flows: FlowStep[],
  db: ReturnType<typeof srvClient>,
  tenantId: string,
) {
  if (flows.length === 0) {
    return sendDefaultMenu(cfg, to, db, tenantId)
  }
  return sendDynamicMenu(cfg, to, flows, db, tenantId)
}

// ─── Flujo: Ver productos ─────────────────────────────────────────────────────

async function handleProducts(
  cfg: WaBotConfig,
  to: string,
  tenantId: string,
  db: ReturnType<typeof srvClient>,
  flows: FlowStep[],
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

  const byCategory: Record<string, typeof products> = {}
  for (const p of products) {
    const cat = p.category ?? 'General'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(p)
  }

  const sections = Object.entries(byCategory).map(([cat, items]) => ({
    title: cat,
    rows: items.map(p => ({ id: `product_${p.id}`, title: p.name, description: formatCurrency(p.price) })),
  }))

  const productList = products.map(p => `• ${p.name} — ${formatCurrency(p.price)}`).join('\n')
  await saveMessage(db, tenantId, to, 'outbound', `🛍️ Nuestros productos:\n${productList}`)

  return sendListMessage(
    cfg.phone_number_id, cfg.access_token, to,
    'Selecciona un producto para ver sus detalles:',
    'Ver productos', sections,
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
  flows: FlowStep[],
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
    return returnToMenu(cfg, to, flows, db, tenantId)
  }

  const desc = p.description ? `\n\n_${p.description}_` : ''
  const stock = p.stock > 0 ? `✅ Disponible (${p.stock} en stock)` : '❌ Sin stock'
  const storeLink = storeUrl ? `\n\n🛒 Agregar al carrito:\n${storeUrl}` : ''
  const text = `*${p.name}*\n💰 ${formatCurrency(p.price)}\n${stock}${desc}${storeLink}`

  await saveMessage(db, tenantId, to, 'outbound', text)
  await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, text)
  return returnToMenu(cfg, to, flows, db, tenantId)
}

// ─── Flujo: Mis pedidos ───────────────────────────────────────────────────────

async function handleOrderLookup(
  cfg: WaBotConfig,
  to: string,
  phoneQuery: string,
  tenantId: string,
  db: ReturnType<typeof srvClient>,
  flows: FlowStep[],
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
    return returnToMenu(cfg, to, flows, db, tenantId)
  }

  const STATUS: Record<string, string> = {
    pending: '⏳ Pendiente', confirmed: '✅ Confirmado', preparing: '👨‍🍳 En preparación',
    shipped: '🚚 En camino',  delivered: '🏠 Entregado',  cancelled: '❌ Cancelado',
  }

  const list = orders.map(o => {
    const date = new Date(o.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    return `📦 *${date}*\n💰 Total: ${formatCurrency(o.total)}\n${STATUS[o.status] ?? o.status}`
  }).join('\n\n')

  const text = `Encontré ${orders.length} pedido(s) para ese número:\n\n${list}`
  await saveMessage(db, tenantId, to, 'outbound', text)
  await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, text)
  return returnToMenu(cfg, to, flows, db, tenantId)
}

// ─── Flujo: Botón personalizado ───────────────────────────────────────────────

async function handleCustomFlow(
  cfg: WaBotConfig,
  to: string,
  step: FlowStep,
  tenantId: string,
  db: ReturnType<typeof srvClient>,
  flows: FlowStep[],
) {
  // Enviar respuesta configurada para este botón
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
    const buttons = children.map(c => ({ id: c.button_id, title: c.button_title.substring(0, 20) }))
    const content = `[Sub-menú] ${buttons.map(b => b.title).join(' | ')}`
    await saveMessage(db, tenantId, to, 'outbound', content)
    return sendButtonMessage(cfg.phone_number_id, cfg.access_token, to, cfg.menu_header, buttons)
  }

  // Sin sub-botones → volver al menú principal
  return returnToMenu(cfg, to, flows, db, tenantId)
}

// ─── Punto de entrada principal ───────────────────────────────────────────────

export async function handleIncomingMessage(
  phoneNumberId: string,
  msg: IncomingMessage,
) {
  const db = srvClient()

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
  if (!tenantId) {
    console.log('[WA bot] no se encontró tenant para la config')
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const storeUrl = cfg.tenants?.slug ? `${appUrl}/s/${cfg.tenants.slug}` : appUrl

  // Marcar como leído
  await markAsRead(phoneNumberId, cfg.access_token, msg.messageId)

  // Cargar flujos UNA SOLA VEZ para toda esta interacción
  const flows = await loadTopLevelFlows(db, tenantId)

  // ── Respuestas a botones e ítems de lista ──────────────────────────────────
  if (msg.type === 'interactive' && msg.interactiveId) {
    const id = msg.interactiveId
    const title = msg.interactiveTitle ?? id

    await saveMessage(db, tenantId, msg.from, 'inbound', `[Botón] ${title}`, msg.messageId)

    // Botón de un flujo personalizado
    if (id.startsWith('flow_')) {
      const { data: step } = await db
        .from('bot_flow_steps')
        .select('id, parent_id, button_id, button_title, step_type, response_text, response_image_url, sort_order')
        .eq('tenant_id', tenantId)
        .eq('button_id', id)
        .eq('is_active', true)
        .single()

      if (step) return handleCustomFlow(cfg, msg.from, step as FlowStep, tenantId, db, flows)
      return returnToMenu(cfg, msg.from, flows, db, tenantId)
    }

    if (id === 'btn_products') return handleProducts(cfg, msg.from, tenantId, db, flows)

    if (id === 'btn_orders') {
      await saveMessage(db, tenantId, msg.from, 'outbound', cfg.orders_ask_phone)
      await sendTextMessage(cfg.phone_number_id, cfg.access_token, msg.from, cfg.orders_ask_phone)
      return setConversationState(db, tenantId, msg.from, 'order_lookup')
    }

    if (id === 'btn_support') {
      await saveMessage(db, tenantId, msg.from, 'outbound', cfg.support_message)
      await sendTextMessage(cfg.phone_number_id, cfg.access_token, msg.from, cfg.support_message)
      return setConversationState(db, tenantId, msg.from, 'support')
    }

    if (id.startsWith('product_')) {
      return handleProductDetail(cfg, msg.from, id.replace('product_', ''), tenantId, db, storeUrl, flows)
    }

    return returnToMenu(cfg, msg.from, flows, db, tenantId)
  }

  // ── Mensajes de texto ──────────────────────────────────────────────────────
  if (msg.type === 'text' && msg.text) {
    const state = await getConversationState(db, tenantId, msg.from)

    if (state === 'order_lookup') {
      return handleOrderLookup(cfg, msg.from, msg.text, tenantId, db, flows)
    }

    if (state === 'support') {
      console.log('[WA bot] modo soporte activo, no se responde a:', msg.from)
      return
    }

    // Primer mensaje / mensaje libre → bienvenida + menú en UN solo paso
    return sendWelcomeAndMenu(cfg, msg.from, flows, db, tenantId)
  }

  // ── Cualquier otro tipo de mensaje ────────────────────────────────────────
  const state = await getConversationState(db, tenantId, msg.from)
  if (state === 'support') return
  return returnToMenu(cfg, msg.from, flows, db, tenantId)
}
