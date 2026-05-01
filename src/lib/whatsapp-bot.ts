/**
 * Motor del bot de WhatsApp
 * Maneja el estado de conversaciones y los flujos de respuesta automática.
 * Incluye: carrito en bot, checkout por chat, menú restaurante.
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
  const { error } = await db.from('whatsapp_messages').insert({
    tenant_id: tenantId,
    customer_phone: customerPhone,
    direction,
    content,
    ...(waMessageId ? { wa_message_id: waMessageId } : {}),
  })
  if (error) console.error('[WA bot] saveMessage error:', error.message, '| tenant:', tenantId)
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WaBotConfig {
  id: string
  tenant_id: string
  phone_number_id: string
  access_token: string
  verify_token: string
  is_active: boolean
  is_restaurant: boolean
  welcome_message: string
  welcome_image_url?: string | null
  menu_header: string
  orders_ask_phone: string
  support_message: string
  no_orders_message: string
}

type ConversationState =
  | 'idle'
  | 'order_lookup'
  | 'support'
  | 'ended'
  | 'collecting_name'
  | 'collecting_address'

interface ConversationContext {
  checkout_name?: string
}

export interface IncomingMessage {
  messageId: string
  from: string
  type: 'text' | 'interactive' | 'location' | 'other'
  text?: string
  interactiveId?: string
  interactiveTitle?: string
  locationLatitude?:  number
  locationLongitude?: number
  locationName?:      string
  locationAddress?:   string
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

interface CartProduct {
  id: string
  name: string
  price: number
  stock: number
}

interface CartRow {
  quantity: number
  products: CartProduct | null
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
  context?: ConversationContext,
) {
  const payload: Record<string, unknown> = {
    tenant_id: tenantId,
    customer_phone: phone,
    state,
    last_message_at: new Date().toISOString(),
  }
  if (context !== undefined) payload.context = context
  await db.from('whatsapp_conversations').upsert(payload, { onConflict: 'tenant_id,customer_phone' })
}

async function getConversationContext(
  db: ReturnType<typeof srvClient>,
  tenantId: string,
  phone: string,
): Promise<ConversationContext> {
  const { data } = await db
    .from('whatsapp_conversations')
    .select('context')
    .eq('tenant_id', tenantId)
    .eq('customer_phone', phone)
    .maybeSingle()
  return ((data?.context ?? {}) as ConversationContext)
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

// ─── Carrito del bot ──────────────────────────────────────────────────────────

async function addToCart(
  db: ReturnType<typeof srvClient>,
  tenantId: string,
  customerPhone: string,
  productId: string,
) {
  const { data: existing, error: selErr } = await db
    .from('bot_cart_items')
    .select('id, quantity')
    .eq('tenant_id', tenantId)
    .eq('customer_phone', customerPhone)
    .eq('product_id', productId)
    .maybeSingle()

  if (selErr) console.error('[WA bot] addToCart SELECT error:', selErr.message)

  if (existing) {
    const { error: updErr } = await db
      .from('bot_cart_items')
      .update({ quantity: existing.quantity + 1 })
      .eq('id', existing.id)
    if (updErr) console.error('[WA bot] addToCart UPDATE error:', updErr.message)
  } else {
    const { error: insErr } = await db
      .from('bot_cart_items')
      .insert({ tenant_id: tenantId, customer_phone: customerPhone, product_id: productId, quantity: 1 })
    if (insErr) console.error('[WA bot] addToCart INSERT error:', insErr.message)
  }
}

async function getCartItems(
  db: ReturnType<typeof srvClient>,
  tenantId: string,
  customerPhone: string,
): Promise<CartRow[]> {
  const { data, error } = await db
    .from('bot_cart_items')
    .select('quantity, products(id, name, price, stock)')
    .eq('tenant_id', tenantId)
    .eq('customer_phone', customerPhone)
  if (error) console.error('[WA bot] getCartItems error:', error.message)
  return (data ?? []) as unknown as CartRow[]
}

async function clearBotCart(
  db: ReturnType<typeof srvClient>,
  tenantId: string,
  customerPhone: string,
) {
  await db
    .from('bot_cart_items')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('customer_phone', customerPhone)
}

function cartTotal(items: CartRow[]): number {
  return items.reduce((sum, row) => {
    const p = row.products
    return sum + (p ? p.price * row.quantity : 0)
  }, 0)
}

// ─── Menú hardcodeado (solo cuando NO hay flujos configurados) ─────────────────

async function sendDefaultMenu(
  cfg: WaBotConfig,
  to: string,
  db: ReturnType<typeof srvClient>,
  tenantId: string,
) {
  const menuHeader = cfg.menu_header || '¿En qué te puedo ayudar?'
  const buttons = cfg.is_restaurant
    ? [
        { id: 'btn_restaurant', title: '🍽️ Ver menú' },
        { id: 'btn_orders',     title: '📦 Mis pedidos' },
        { id: 'btn_support',    title: '💬 Con un operador' },
      ]
    : [
        { id: 'btn_products', title: '🛍️ Ver productos' },
        { id: 'btn_orders',   title: '📦 Mis pedidos' },
        { id: 'btn_support',  title: '💬 Con un operador' },
      ]

  const content = `${menuHeader}\n[${buttons.map(b => b.title).join(' | ')}]`
  await saveMessage(db, tenantId, to, 'outbound', content)
  return sendButtonMessage(cfg.phone_number_id, cfg.access_token, to, menuHeader, buttons)
}

// ─── Bienvenida inicial ────────────────────────────────────────────────────────

async function sendWelcomeAndMenu(
  cfg: WaBotConfig,
  to: string,
  flows: FlowStep[],
  db: ReturnType<typeof srvClient>,
  tenantId: string,
) {
  if (flows.length === 0) {
    if (cfg.welcome_image_url) {
      await saveMessage(db, tenantId, to, 'outbound', `[Imagen bienvenida] ${cfg.welcome_message}`)
      await sendImageMessage(cfg.phone_number_id, cfg.access_token, to, cfg.welcome_image_url, cfg.welcome_message)
    } else {
      await saveMessage(db, tenantId, to, 'outbound', cfg.welcome_message)
      await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, cfg.welcome_message)
    }
    return sendDefaultMenu(cfg, to, db, tenantId)
  }

  const buttons = flows.map(s => ({ id: s.button_id, title: s.button_title.substring(0, 20) }))
  const bodyText = cfg.welcome_message || cfg.menu_header || '¡Hola! ¿En qué te puedo ayudar?'
  const logContent = `[Bienvenida] ${bodyText}\n[${buttons.map(b => b.title).join(' | ')}]`
  await saveMessage(db, tenantId, to, 'outbound', logContent)

  return sendButtonMessage(
    cfg.phone_number_id,
    cfg.access_token,
    to,
    bodyText,
    buttons,
    cfg.welcome_image_url ? { headerImageUrl: cfg.welcome_image_url } : undefined,
  )
}

// ─── Menú post-acción ─────────────────────────────────────────────────────────

async function sendPostActionMenu(
  cfg: WaBotConfig,
  to: string,
  db: ReturnType<typeof srvClient>,
  tenantId: string,
) {
  const bodyText = '¿Qué deseas hacer ahora?'
  const buttons = [
    { id: 'btn_main_menu', title: '🏠 Menú principal' },
    { id: 'btn_support',   title: '💬 Con un operador' },
    { id: 'btn_exit',      title: '👋 Salir' },
  ]
  await saveMessage(db, tenantId, to, 'outbound', `${bodyText}\n[${buttons.map(b => b.title).join(' | ')}]`)
  return sendButtonMessage(cfg.phone_number_id, cfg.access_token, to, bodyText, buttons)
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
    await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, text)
    return sendPostActionMenu(cfg, to, db, tenantId)
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

// ─── Flujo: Detalle de producto (con botón agregar al carrito) ────────────────

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
    const text = 'Producto no encontrado.'
    await saveMessage(db, tenantId, to, 'outbound', text)
    await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, text)
    return sendPostActionMenu(cfg, to, db, tenantId)
  }

  const desc = p.description ? `\n\n_${p.description}_` : ''
  const stockText = p.stock > 0 ? `✅ Disponible (${p.stock} en stock)` : '❌ Sin stock'
  const text = `*${p.name}*\n💰 ${formatCurrency(p.price)}\n${stockText}${desc}`

  await saveMessage(db, tenantId, to, 'outbound', text)
  await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, text)

  if (p.stock > 0) {
    const buttons = [
      { id: `cart_add_${productId}`, title: '🛒 Agregar' },
      { id: 'btn_view_cart',         title: '📋 Ver carrito' },
      { id: 'btn_products',          title: '🛍️ Ver más' },
    ]
    const log = `[${buttons.map(b => b.title).join(' | ')}]`
    await saveMessage(db, tenantId, to, 'outbound', log)
    return sendButtonMessage(cfg.phone_number_id, cfg.access_token, to, '¿Qué deseas hacer?', buttons)
  }

  return sendPostActionMenu(cfg, to, db, tenantId)
}

// ─── Flujo: Agregar al carrito ────────────────────────────────────────────────

async function handleAddToCart(
  cfg: WaBotConfig,
  to: string,
  productId: string,
  tenantId: string,
  db: ReturnType<typeof srvClient>,
) {
  const { data: p } = await db
    .from('products')
    .select('name, price, stock')
    .eq('id', productId)
    .eq('tenant_id', tenantId)
    .single()

  if (!p || p.stock <= 0) {
    const text = 'Lo sentimos, ese producto ya no está disponible.'
    await saveMessage(db, tenantId, to, 'outbound', text)
    await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, text)
    return sendPostActionMenu(cfg, to, db, tenantId)
  }

  await addToCart(db, tenantId, to, productId)

  const cartItems = await getCartItems(db, tenantId, to)
  const total = cartTotal(cartItems)

  const text = `✅ *${p.name}* agregado al carrito.\n\n🛒 Carrito: ${cartItems.length} artículo(s) — Total: *${formatCurrency(total)}*`
  await saveMessage(db, tenantId, to, 'outbound', text)
  await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, text)

  const buttons = [
    { id: 'btn_checkout',  title: '✅ Pedir ahora' },
    { id: 'btn_view_cart', title: '📋 Ver carrito' },
    { id: 'btn_products',  title: '🛍️ Más productos' },
  ]
  const log = `[${buttons.map(b => b.title).join(' | ')}]`
  await saveMessage(db, tenantId, to, 'outbound', log)
  return sendButtonMessage(cfg.phone_number_id, cfg.access_token, to, '¿Qué deseas hacer?', buttons)
}

// ─── Flujo: Ver carrito ───────────────────────────────────────────────────────

async function handleViewCart(
  cfg: WaBotConfig,
  to: string,
  tenantId: string,
  db: ReturnType<typeof srvClient>,
) {
  const cartItems = await getCartItems(db, tenantId, to)

  if (cartItems.length === 0) {
    const text = '🛒 Tu carrito está vacío.\n\nExplora nuestros productos y agrega algo que te guste. 😊'
    await saveMessage(db, tenantId, to, 'outbound', text)
    await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, text)
    const buttons = [
      { id: 'btn_products',  title: '🛍️ Ver productos' },
      { id: 'btn_main_menu', title: '🏠 Menú principal' },
      { id: 'btn_exit',      title: '👋 Salir' },
    ]
    return sendButtonMessage(cfg.phone_number_id, cfg.access_token, to, '¿Qué deseas hacer?', buttons)
  }

  const total = cartTotal(cartItems)
  const lines = cartItems
    .filter(row => row.products)
    .map(row => `• ${row.products!.name} x${row.quantity} — ${formatCurrency(row.products!.price * row.quantity)}`)

  const text = `🛒 *Tu carrito:*\n\n${lines.join('\n')}\n\n💰 *Total: ${formatCurrency(total)}*`
  await saveMessage(db, tenantId, to, 'outbound', text)
  await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, text)

  const buttons = [
    { id: 'btn_checkout',   title: '✅ Pedir ahora' },
    { id: 'btn_clear_cart', title: '🗑️ Vaciar carrito' },
    { id: 'btn_products',   title: '🛍️ Más productos' },
  ]
  const log = `[${buttons.map(b => b.title).join(' | ')}]`
  await saveMessage(db, tenantId, to, 'outbound', log)
  return sendButtonMessage(cfg.phone_number_id, cfg.access_token, to, '¿Qué deseas hacer?', buttons)
}

// ─── Flujo: Iniciar checkout (pedir nombre) ───────────────────────────────────

async function handleBotCheckout(
  cfg: WaBotConfig,
  to: string,
  tenantId: string,
  db: ReturnType<typeof srvClient>,
) {
  const cartItems = await getCartItems(db, tenantId, to)

  if (cartItems.length === 0) {
    const text = '🛒 Tu carrito está vacío. Agrega productos primero.'
    await saveMessage(db, tenantId, to, 'outbound', text)
    await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, text)
    return handleViewCart(cfg, to, tenantId, db)
  }

  const text = 'Para completar tu pedido, ¿cuál es tu *nombre completo*?'
  await saveMessage(db, tenantId, to, 'outbound', text)
  await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, text)
  return setConversationState(db, tenantId, to, 'collecting_name', {})
}

// ─── Flujo: Recibir nombre → pedir dirección ──────────────────────────────────

async function handleCollectingName(
  cfg: WaBotConfig,
  to: string,
  name: string,
  tenantId: string,
  db: ReturnType<typeof srvClient>,
) {
  const text =
    `Perfecto, *${name}*. ¿Cuál es tu *dirección de entrega*?\n\n` +
    `Puedes _escribir tu dirección_ o _compartir tu ubicación actual_ 📍 desde el ícono de adjuntar en WhatsApp.`
  await saveMessage(db, tenantId, to, 'outbound', text)
  await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, text)
  return setConversationState(db, tenantId, to, 'collecting_address', { checkout_name: name })
}

// ─── Flujo: Recibir dirección → crear pedido ──────────────────────────────────

async function handleCollectingAddress(
  cfg: WaBotConfig,
  to: string,
  address: string,
  tenantId: string,
  db: ReturnType<typeof srvClient>,
) {
  const context = await getConversationContext(db, tenantId, to)
  const customerName = context.checkout_name ?? 'Cliente'

  const cartItems = await getCartItems(db, tenantId, to)
  if (cartItems.length === 0) {
    await setConversationState(db, tenantId, to, 'idle', {})
    const text = 'No encontré productos en tu carrito. Intenta agregar productos de nuevo.'
    await saveMessage(db, tenantId, to, 'outbound', text)
    await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, text)
    return sendPostActionMenu(cfg, to, db, tenantId)
  }

  // Verificar precios y stock directamente desde la DB (nunca confiar en cache)
  type OrderItem = {
    product_id: string
    product_name: string
    quantity: number
    unit_price: number
    subtotal: number
  }

  let total = 0
  const orderItems: OrderItem[] = []

  for (const row of cartItems) {
    if (!row.products) continue
    const { data: fresh } = await db
      .from('products')
      .select('id, name, price, stock')
      .eq('id', row.products.id)
      .eq('tenant_id', tenantId)
      .single()

    if (!fresh || fresh.stock < row.quantity) continue // producto sin stock suficiente, se omite

    const subtotal = fresh.price * row.quantity
    total += subtotal
    orderItems.push({
      product_id:   fresh.id,
      product_name: fresh.name,
      quantity:     row.quantity,
      unit_price:   fresh.price,
      subtotal,
    })
  }

  if (orderItems.length === 0) {
    await clearBotCart(db, tenantId, to)
    await setConversationState(db, tenantId, to, 'idle', {})
    const text = 'Lo sentimos, los productos de tu carrito ya no tienen stock disponible. Por favor agrega nuevos productos.'
    await saveMessage(db, tenantId, to, 'outbound', text)
    await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, text)
    return sendPostActionMenu(cfg, to, db, tenantId)
  }

  // Crear orden
  const { data: order } = await db
    .from('orders')
    .insert({
      tenant_id:        tenantId,
      customer_name:    customerName,
      customer_phone:   to,
      customer_address: address,
      total,
      status:           'pending',
    })
    .select('id')
    .single()

  if (order) {
    await db.from('order_items').insert(
      orderItems.map(oi => ({ ...oi, order_id: order.id, tenant_id: tenantId })),
    )

    // Decrementar stock
    for (const oi of orderItems) {
      const { data: cur } = await db
        .from('products')
        .select('stock')
        .eq('id', oi.product_id)
        .single()
      if (cur && cur.stock >= oi.quantity) {
        await db
          .from('products')
          .update({ stock: cur.stock - oi.quantity })
          .eq('id', oi.product_id)
      }
    }
  }

  await clearBotCart(db, tenantId, to)
  await setConversationState(db, tenantId, to, 'idle', {})

  const itemsList = orderItems
    .map(oi => `• ${oi.product_name} x${oi.quantity} — ${formatCurrency(oi.subtotal)}`)
    .join('\n')

  // Confirmación al cliente
  const confirmText =
    `✅ *¡Pedido confirmado!*\n\n` +
    `👤 ${customerName}\n` +
    `📍 ${address}\n\n` +
    `${itemsList}\n\n` +
    `💰 *Total: ${formatCurrency(total)}*\n\n` +
    `⏳ Pronto nos pondremos en contacto contigo para coordinar la entrega. ¡Gracias! 🙏`

  await saveMessage(db, tenantId, to, 'outbound', confirmText)
  await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, confirmText)

  // Notificación al dueño de la tienda (si tiene whatsapp_phone configurado)
  const { data: tenant } = await db
    .from('tenants')
    .select('whatsapp_phone, name')
    .eq('id', tenantId)
    .single()

  if (tenant?.whatsapp_phone) {
    const ownerMsg =
      `🛒 *NUEVO PEDIDO — ${tenant.name ?? 'Tu tienda'}*\n\n` +
      `👤 Cliente: ${customerName}\n` +
      `📱 WhatsApp: +${to}\n` +
      `📍 Dirección: ${address}\n\n` +
      `${itemsList}\n\n` +
      `💰 *Total: ${formatCurrency(total)}*`

    await sendTextMessage(cfg.phone_number_id, cfg.access_token, tenant.whatsapp_phone, ownerMsg)
      .catch(err => console.error('[WA bot] error notificando al dueño:', err))
  }

  return sendPostActionMenu(cfg, to, db, tenantId)
}

// ─── Flujo: Menú restaurante (categorías) ────────────────────────────────────

async function handleRestaurantMenu(
  cfg: WaBotConfig,
  to: string,
  tenantId: string,
  db: ReturnType<typeof srvClient>,
) {
  const { data: products } = await db
    .from('products')
    .select('category')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)

  if (!products || products.length === 0) {
    const text = 'El menú no está disponible en este momento. ¡Vuelve pronto! 😊'
    await saveMessage(db, tenantId, to, 'outbound', text)
    await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, text)
    return sendPostActionMenu(cfg, to, db, tenantId)
  }

  const categories = [...new Set(products.map(p => p.category ?? 'General'))].slice(0, 10)

  const rows = categories.map(cat => ({
    id:          `menu_cat_${cat}`,
    title:       cat.substring(0, 24),
    description: 'Ver platillos',
  }))

  await saveMessage(db, tenantId, to, 'outbound', `🍽️ Categorías del menú: ${categories.join(', ')}`)

  return sendListMessage(
    cfg.phone_number_id, cfg.access_token, to,
    'Selecciona una categoría para ver los platillos:',
    'Ver menú',
    [{ title: 'Categorías', rows }],
    { headerText: '🍽️ Nuestro Menú' },
  )
}

// ─── Flujo: Platillos de una categoría ───────────────────────────────────────

async function handleMenuCategory(
  cfg: WaBotConfig,
  to: string,
  category: string,
  tenantId: string,
  db: ReturnType<typeof srvClient>,
) {
  const { data: products } = await db
    .from('products')
    .select('id, name, price, description, stock')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .eq('category', category)
    .order('name')
    .limit(10)

  if (!products || products.length === 0) {
    const text = `No hay platillos disponibles en "${category}" por el momento.`
    await saveMessage(db, tenantId, to, 'outbound', text)
    await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, text)
    return handleRestaurantMenu(cfg, to, tenantId, db)
  }

  const rows = products.map(p => ({
    id:          `product_${p.id}`,
    title:       p.name.substring(0, 24),
    description: formatCurrency(p.price),
  }))

  const list = products.map(p => `• ${p.name} — ${formatCurrency(p.price)}`).join('\n')
  await saveMessage(db, tenantId, to, 'outbound', `📋 ${category}:\n${list}`)

  return sendListMessage(
    cfg.phone_number_id, cfg.access_token, to,
    'Selecciona un platillo para ver su detalle y agregarlo a tu pedido:',
    'Ver platillos',
    [{ title: category, rows }],
    { headerText: `📋 ${category}`.substring(0, 60) },
  )
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
    return sendPostActionMenu(cfg, to, db, tenantId)
  }

  const STATUS: Record<string, string> = {
    pending:    '⏳ Pendiente',
    confirmed:  '✅ Confirmado',
    preparing:  '👨‍🍳 En preparación',
    shipped:    '🚚 En camino',
    delivered:  '🏠 Entregado',
    cancelled:  '❌ Cancelado',
  }

  const list = orders.map(o => {
    const date = new Date(o.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    return `📦 *${date}*\n💰 Total: ${formatCurrency(o.total)}\n${STATUS[o.status] ?? o.status}`
  }).join('\n\n')

  const text = `Encontré ${orders.length} pedido(s) para ese número:\n\n${list}`
  await saveMessage(db, tenantId, to, 'outbound', text)
  await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, text)
  return sendPostActionMenu(cfg, to, db, tenantId)
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
  if (step.response_image_url) {
    const caption = step.response_text ?? undefined
    await saveMessage(db, tenantId, to, 'outbound', `[Imagen] ${caption ?? ''}`)
    await sendImageMessage(cfg.phone_number_id, cfg.access_token, to, step.response_image_url, caption)
  } else if (step.response_text) {
    await saveMessage(db, tenantId, to, 'outbound', step.response_text)
    await sendTextMessage(cfg.phone_number_id, cfg.access_token, to, step.response_text)
  }

  // step_type especial: menú restaurante
  if (step.step_type === 'restaurant_menu') {
    return handleRestaurantMenu(cfg, to, tenantId, db)
  }

  // step_type especial: productos
  if (step.step_type === 'products') {
    return handleProducts(cfg, to, tenantId, db, flows)
  }

  const children = await getChildFlowSteps(db, tenantId, step.id)
  if (children.length > 0) {
    const menuHeader = cfg.menu_header || '¿En qué te puedo ayudar?'
    const buttons = children.map(c => ({ id: c.button_id, title: c.button_title.substring(0, 20) }))
    const content = `[Sub-menú] ${buttons.map(b => b.title).join(' | ')}`
    await saveMessage(db, tenantId, to, 'outbound', content)
    return sendButtonMessage(cfg.phone_number_id, cfg.access_token, to, menuHeader, buttons)
  }

  return sendPostActionMenu(cfg, to, db, tenantId)
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

  await markAsRead(phoneNumberId, cfg.access_token, msg.messageId)

  const flows = await loadTopLevelFlows(db, tenantId)

  // ── Respuestas a botones e ítems de lista ──────────────────────────────────
  if (msg.type === 'interactive' && msg.interactiveId) {
    const id    = msg.interactiveId
    const title = msg.interactiveTitle ?? id

    await saveMessage(db, tenantId, msg.from, 'inbound', `[Botón] ${title}`, msg.messageId)

    // ── Carrito ──────────────────────────────────────────────────────────────
    if (id.startsWith('cart_add_')) {
      return handleAddToCart(cfg, msg.from, id.replace('cart_add_', ''), tenantId, db)
    }
    if (id === 'btn_view_cart')  return handleViewCart(cfg, msg.from, tenantId, db)
    if (id === 'btn_checkout')   return handleBotCheckout(cfg, msg.from, tenantId, db)
    if (id === 'btn_clear_cart') {
      await clearBotCart(db, tenantId, msg.from)
      const text = '🗑️ Tu carrito ha sido vaciado.'
      await saveMessage(db, tenantId, msg.from, 'outbound', text)
      await sendTextMessage(cfg.phone_number_id, cfg.access_token, msg.from, text)
      return sendPostActionMenu(cfg, msg.from, db, tenantId)
    }

    // ── Restaurante ──────────────────────────────────────────────────────────
    if (id === 'btn_restaurant') return handleRestaurantMenu(cfg, msg.from, tenantId, db)
    if (id.startsWith('menu_cat_')) {
      return handleMenuCategory(cfg, msg.from, id.replace('menu_cat_', ''), tenantId, db)
    }

    // ── Flujos personalizados ────────────────────────────────────────────────
    if (id.startsWith('flow_')) {
      const { data: step } = await db
        .from('bot_flow_steps')
        .select('id, parent_id, button_id, button_title, step_type, response_text, response_image_url, sort_order')
        .eq('tenant_id', tenantId)
        .eq('button_id', id)
        .eq('is_active', true)
        .single()

      if (step) return handleCustomFlow(cfg, msg.from, step as FlowStep, tenantId, db, flows)
      return sendPostActionMenu(cfg, msg.from, db, tenantId)
    }

    // ── Botones del sistema ──────────────────────────────────────────────────
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

    if (id === 'btn_main_menu') {
      return sendWelcomeAndMenu(cfg, msg.from, flows, db, tenantId)
    }

    if (id === 'btn_exit') {
      const exitText = '¡Hasta pronto! 👋 Si necesitas algo más, escríbenos cuando quieras.'
      await saveMessage(db, tenantId, msg.from, 'outbound', exitText)
      await sendTextMessage(cfg.phone_number_id, cfg.access_token, msg.from, exitText)
      return setConversationState(db, tenantId, msg.from, 'ended')
    }

    if (id.startsWith('product_')) {
      return handleProductDetail(cfg, msg.from, id.replace('product_', ''), tenantId, db)
    }

    return sendPostActionMenu(cfg, msg.from, db, tenantId)
  }

  // ── Mensajes de texto ──────────────────────────────────────────────────────
  // Nota: el webhook ya guarda el texto inbound antes de llamar aquí.
  if (msg.type === 'text' && msg.text) {
    const state = await getConversationState(db, tenantId, msg.from)

    if (state === 'order_lookup') {
      return handleOrderLookup(cfg, msg.from, msg.text, tenantId, db, flows)
    }

    if (state === 'collecting_name') {
      return handleCollectingName(cfg, msg.from, msg.text, tenantId, db)
    }

    if (state === 'collecting_address') {
      return handleCollectingAddress(cfg, msg.from, msg.text, tenantId, db)
    }

    if (state === 'support') {
      console.log('[WA bot] modo soporte activo, no se responde a:', msg.from)
      return
    }

    return sendWelcomeAndMenu(cfg, msg.from, flows, db, tenantId)
  }

  // ── Mensajes de ubicación ─────────────────────────────────────────────────
  if (msg.type === 'location' && msg.locationLatitude !== undefined && msg.locationLongitude !== undefined) {
    const state = await getConversationState(db, tenantId, msg.from)

    const mapsUrl = `https://maps.google.com/maps?q=${msg.locationLatitude},${msg.locationLongitude}`
    const parts: string[] = []
    if (msg.locationName)    parts.push(msg.locationName)
    if (msg.locationAddress) parts.push(msg.locationAddress)
    parts.push(mapsUrl)
    const addressText = parts.join('\n')

    await saveMessage(db, tenantId, msg.from, 'inbound', `📍 Ubicación: ${addressText}`, msg.messageId)

    if (state === 'collecting_address') {
      return handleCollectingAddress(cfg, msg.from, addressText, tenantId, db)
    }

    if (state === 'support') return

    // Ubicación fuera de contexto
    const reply = 'Recibí tu ubicación 📍, pero en este momento no estoy esperando una dirección. Usa el menú para hacer un pedido.'
    await saveMessage(db, tenantId, msg.from, 'outbound', reply)
    await sendTextMessage(cfg.phone_number_id, cfg.access_token, msg.from, reply)
    return sendPostActionMenu(cfg, msg.from, db, tenantId)
  }

  // ── Cualquier otro tipo de mensaje ────────────────────────────────────────
  const state = await getConversationState(db, tenantId, msg.from)
  if (state === 'support') return
  return sendPostActionMenu(cfg, msg.from, db, tenantId)
}
