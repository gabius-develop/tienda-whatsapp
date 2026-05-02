import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getTenantBySlug, getTenantSlugFromRequest } from '@/lib/tenant'

// Service role client — bypasses RLS para operaciones de servidor confiables
function srvClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(request: NextRequest) {
  const tenantSlug = getTenantSlugFromRequest(request)
  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  // supabase (anon) solo para leer productos; db (service role) para escribir órdenes
  const supabase = await createClient()
  const db = srvClient()
  const body = await request.json()

  const { customer_name, customer_phone, customer_address, items, total } = body

  type ClientItem = { product_id: string; quantity: number }

  // 1. Verificar stock Y obtener precios reales del servidor (nunca confiar en precios del cliente)
  const verifiedItems: {
    product_id: string
    product_name: string
    quantity: number
    unit_price: number
    subtotal: number
  }[] = []

  for (const item of items as ClientItem[]) {
    if (!item.product_id) continue
    const { data: product } = await supabase
      .from('products')
      .select('id, name, price, stock')
      .eq('id', item.product_id)
      .eq('tenant_id', tenant.id)
      .single()

    if (!product) {
      return NextResponse.json(
        { error: `Producto no encontrado` },
        { status: 404 }
      )
    }
    if (product.stock < item.quantity) {
      return NextResponse.json(
        { error: `Sin stock suficiente para "${product.name}". Disponibles: ${product.stock}` },
        { status: 409 }
      )
    }

    verifiedItems.push({
      product_id: product.id,
      product_name: product.name,
      quantity: item.quantity,
      unit_price: product.price,         // precio real de la BD, no del cliente
      subtotal: product.price * item.quantity,
    })
  }

  // Total calculado en el servidor
  const verifiedTotal = verifiedItems.reduce((sum, i) => sum + i.subtotal, 0)

  // 2. Crear el pedido con el total verificado (service role para evitar RLS anon)
  const { data: order, error: orderError } = await db
    .from('orders')
    .insert([{
      customer_name,
      customer_phone,
      customer_address,
      total: verifiedTotal,              // total real, no el enviado por el cliente
      tenant_id: tenant.id,
      status: 'pending',
      whatsapp_sent_at: new Date().toISOString(),
    }])
    .select()
    .single()

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 })
  }

  // 3. Crear items del pedido con precios verificados
  const { error: itemsError } = await db.from('order_items').insert(
    verifiedItems.map((item) => ({ ...item, order_id: order.id, tenant_id: tenant.id }))
  )
  if (itemsError) {
    console.error('Error saving order items:', itemsError)
  }

  // 4. Descontar stock
  for (const item of verifiedItems) {
    const { data: product } = await db
      .from('products')
      .select('stock')
      .eq('id', item.product_id)
      .eq('tenant_id', tenant.id)
      .single()

    if (product) {
      await db
        .from('products')
        .update({ stock: Math.max(0, product.stock - item.quantity), updated_at: new Date().toISOString() })
        .eq('id', item.product_id)
        .eq('tenant_id', tenant.id)
    }
  }

  // Devolver items y total verificados para que el cliente construya el mensaje con precios reales
  return NextResponse.json({ ...order, verified_items: verifiedItems, verified_total: verifiedTotal }, { status: 201 })
}

export async function GET(request: NextRequest) {
  const tenantSlug = getTenantSlugFromRequest(request)
  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) return NextResponse.json([])

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
