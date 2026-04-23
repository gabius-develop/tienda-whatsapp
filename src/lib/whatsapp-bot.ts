/**
 * Motor del bot de WhatsApp
 * Maneja el estado de conversaciones y los flujos de respuesta automática.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { formatCurrency } from './utils'
import {
  sendTextMessage,
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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WaBotConfig {
  id: string
  tenant_id: string
  phone_number_id: string
  access_token: string
  verify_token: string
  is_active: boolean
  welcome_message: string
  menu_header: string
  orders_ask_phone: string
  support_message: string
  no_orders_message: string
}

type ConversationState = 'idle' | 'order_lookup'

export interface IncomingMessage {
  messageId: string
  from: string              // Número del cliente (con código de país, sin +)
  type: 'text' | 'interactive' | 'other'
  text?: string
  interactiveId?: string    // ID del botón o ítem de lista seleccionado
  interactiveTitle?: string
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

// ─── Menú principal ───────────────────────────────────────────────────────────

async function sendMainMenu(cfg: WaBotConfig, to: string) {
  return sendButtonMessage(
    cfg.phone_number_id,
    cfg.access_token,
    to,
    cfg.menu_header,
    [
      { id: 'btn_products', title: '🛍️ Ver productos' },
      { id: 'btn_orders',   title: '📦 Mis pedidos' },
      { id: 'btn_support',  title: '💬 Soporte' },
    ],
  )
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
    return sendTextMessage(
      cfg.phone_number_id,
      cfg.access_token,
      to,
      'Pronto tendremos productos disponibles. ¡Vuelve a visitarnos! 😊',
    )
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
) {
  const { data: p } = await db
    .from('products')
    .select('name, price, description, stock')
    .eq('id', productId)
    .eq('tenant_id', tenantId)
    .single()

  if (!p) {
    await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, 'Producto no encontrado.')
    return sendMainMenu(cfg, to)
  }

  const desc = p.description ? `\n\n_${p.description}_` : ''
  const stock = p.stock > 0 ? `✅ Disponible (${p.stock} en stock)` : '❌ Sin stock'

  await sendTextMessage(
    cfg.phone_number_id,
    cfg.access_token,
    to,
    `*${p.name}*\n💰 ${formatCurrency(p.price)}\n${stock}${desc}\n\nPuedes agregarlo al carrito desde nuestra tienda web.`,
  )

  return sendMainMenu(cfg, to)
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
    await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, cfg.no_orders_message)
    return sendMainMenu(cfg, to)
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

  await sendTextMessage(
    cfg.phone_number_id,
    cfg.access_token,
    to,
    `Encontré ${orders.length} pedido(s) para ese número:\n\n${list}`,
  )

  return sendMainMenu(cfg, to)
}

// ─── Punto de entrada principal ───────────────────────────────────────────────

export async function handleIncomingMessage(
  phoneNumberId: string,
  msg: IncomingMessage,
) {
  const db = srvClient()

  // Buscar configuración del bot por phone_number_id
  const { data: cfgRow } = await db
    .from('whatsapp_bot_config')
    .select('*, tenants(id)')
    .eq('phone_number_id', phoneNumberId)
    .eq('is_active', true)
    .single()

  if (!cfgRow) return // Bot no configurado o desactivado para este número

  const cfg = cfgRow as WaBotConfig & { tenants: { id: string } | null }
  const tenantId = cfg.tenants?.id
  if (!tenantId) return

  // Marcar como leído
  await markAsRead(phoneNumberId, cfg.access_token, msg.messageId)

  // ── Respuestas a botones e ítems de lista ──────────────────────────────────
  if (msg.type === 'interactive' && msg.interactiveId) {
    const id = msg.interactiveId

    if (id === 'btn_products') {
      return handleProducts(cfg, msg.from, tenantId, db)
    }

    if (id === 'btn_orders') {
      await sendTextMessage(cfg.phone_number_id, cfg.access_token, msg.from, cfg.orders_ask_phone)
      return setConversationState(db, tenantId, msg.from, 'order_lookup')
    }

    if (id === 'btn_support') {
      await sendTextMessage(cfg.phone_number_id, cfg.access_token, msg.from, cfg.support_message)
      return setConversationState(db, tenantId, msg.from, 'idle')
    }

    if (id.startsWith('product_')) {
      return handleProductDetail(cfg, msg.from, id.replace('product_', ''), tenantId, db)
    }

    // Cualquier otra selección → menú
    return sendMainMenu(cfg, msg.from)
  }

  // ── Mensajes de texto ──────────────────────────────────────────────────────
  if (msg.type === 'text' && msg.text) {
    const state = await getConversationState(db, tenantId, msg.from)

    if (state === 'order_lookup') {
      return handleOrderLookup(cfg, msg.from, msg.text, tenantId, db)
    }

    // Primer mensaje / mensaje libre → bienvenida + menú
    await sendTextMessage(cfg.phone_number_id, cfg.access_token, msg.from, cfg.welcome_message)
    return sendMainMenu(cfg, msg.from)
  }

  // ── Cualquier otro tipo de mensaje → menú ─────────────────────────────────
  return sendMainMenu(cfg, msg.from)
}
