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

function getPeriodRange(period: string) {
  const now = new Date()
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const todayEnd = new Date(todayStart.getTime() + 86_400_000)

  if (period === 'today') {
    return {
      start: todayStart,
      end: todayEnd,
      prevStart: new Date(todayStart.getTime() - 86_400_000),
      prevEnd: todayStart,
      label: 'Hoy',
    }
  }

  if (period === 'week') {
    const dow = now.getUTCDay() || 7
    const weekStart = new Date(todayStart.getTime() - (dow - 1) * 86_400_000)
    const prevWeekStart = new Date(weekStart.getTime() - 7 * 86_400_000)
    return {
      start: weekStart,
      end: todayEnd,
      prevStart: prevWeekStart,
      prevEnd: weekStart,
      label: 'Esta semana',
    }
  }

  // month
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const prevMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  return {
    start: monthStart,
    end: todayEnd,
    prevStart: prevMonthStart,
    prevEnd: monthStart,
    label: 'Este mes',
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantSlug = getTenantSlugFromRequest(request)
  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const period = request.nextUrl.searchParams.get('period') ?? 'week'
  const { start, end, prevStart, prevEnd, label } = getPeriodRange(period)
  const db = srvClient()

  const [
    { data: currentOrders },
    { data: prevOrders },
    { data: waMsgs },
  ] = await Promise.all([
    db.from('orders')
      .select('id, customer_name, customer_phone, total, status, created_at')
      .eq('tenant_id', tenant.id)
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())
      .order('created_at', { ascending: false }),

    db.from('orders')
      .select('total, status')
      .eq('tenant_id', tenant.id)
      .gte('created_at', prevStart.toISOString())
      .lt('created_at', prevEnd.toISOString()),

    db.from('whatsapp_messages')
      .select('direction')
      .eq('tenant_id', tenant.id)
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString()),
  ])

  const orders = currentOrders ?? []
  const orderIds = orders.map(o => o.id)

  // Order items solo para las órdenes del período
  const { data: itemsData } = orderIds.length > 0
    ? await db.from('order_items')
        .select('product_id, product_name, quantity, subtotal, products(image_url)')
        .in('order_id', orderIds)
    : { data: [] }

  // ── Métricas actuales ─────────────────────────────────────────────────────

  const nonCancelled = orders.filter(o => o.status !== 'cancelled')
  const revenue = nonCancelled.reduce((s, o) => s + Number(o.total), 0)
  const avgTicket = nonCancelled.length > 0 ? revenue / nonCancelled.length : 0

  const ordersByStatus = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  // ── Métricas período anterior ─────────────────────────────────────────────

  const prev = prevOrders ?? []
  const prevNonCancelled = prev.filter(o => o.status !== 'cancelled')
  const prevRevenue = prevNonCancelled.reduce((s, o) => s + Number(o.total), 0)

  // ── Ingresos por día ──────────────────────────────────────────────────────

  const dayMap = new Map<string, { revenue: number; orders: number }>()
  let cur = new Date(start)
  while (cur < end) {
    dayMap.set(cur.toISOString().slice(0, 10), { revenue: 0, orders: 0 })
    cur = new Date(cur.getTime() + 86_400_000)
  }
  for (const o of nonCancelled) {
    const key = o.created_at.slice(0, 10)
    const entry = dayMap.get(key)
    if (entry) { entry.revenue += Number(o.total); entry.orders++ }
  }
  const revenueByDay = Array.from(dayMap.entries()).map(([date, d]) => ({ date, ...d }))

  // ── Top productos ─────────────────────────────────────────────────────────

  const productMap = new Map<string, {
    product_id: string; product_name: string
    total_sold: number; total_revenue: number; image_url: string | null
  }>()
  for (const item of (itemsData ?? [])) {
    const img = (item.products as unknown as { image_url: string | null } | null)?.image_url ?? null
    const ex = productMap.get(item.product_id)
    if (ex) { ex.total_sold += item.quantity; ex.total_revenue += Number(item.subtotal) }
    else productMap.set(item.product_id, {
      product_id: item.product_id, product_name: item.product_name,
      total_sold: item.quantity, total_revenue: Number(item.subtotal), image_url: img,
    })
  }
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, 5)

  // ── WhatsApp ──────────────────────────────────────────────────────────────

  const msgs = waMsgs ?? []
  const waInbound = msgs.filter(m => m.direction === 'inbound').length
  const waOutbound = msgs.filter(m => m.direction === 'outbound').length

  return NextResponse.json({
    period,
    label,
    // KPIs actuales
    revenue,
    orders: orders.length,
    avg_ticket: avgTicket,
    orders_by_status: ordersByStatus,
    // Comparación período anterior
    prev_revenue: prevRevenue,
    prev_orders: prev.length,
    // Gráfica
    revenue_by_day: revenueByDay,
    // Productos
    top_products: topProducts,
    // WhatsApp
    wa_inbound: waInbound,
    wa_outbound: waOutbound,
    // Lista para exportar (máx 500 registros)
    orders_list: orders.slice(0, 500).map(o => ({
      id: o.id,
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      total: Number(o.total),
      status: o.status,
      created_at: o.created_at,
    })),
  })
}
