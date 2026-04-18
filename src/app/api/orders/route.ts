import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const { customer_name, customer_phone, customer_address, items, total } = body

  type OrderItem = {
    product_id: string
    product_name: string
    quantity: number
    unit_price: number
    subtotal: number
  }

  // 1. Verificar stock disponible antes de crear el pedido
  for (const item of items as OrderItem[]) {
    if (!item.product_id) continue
    const { data: product } = await supabase
      .from('products')
      .select('stock, name')
      .eq('id', item.product_id)
      .single()

    if (product && product.stock < item.quantity) {
      return NextResponse.json(
        { error: `Sin stock suficiente para "${product.name}". Disponibles: ${product.stock}` },
        { status: 409 }
      )
    }
  }

  // 2. Crear el pedido
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{
      customer_name,
      customer_phone,
      customer_address,
      total,
      status: 'pending',
      whatsapp_sent_at: new Date().toISOString(),
    }])
    .select()
    .single()

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 })
  }

  // 3. Crear items del pedido
  const orderItems = (items as OrderItem[]).map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    subtotal: item.subtotal,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  if (itemsError) {
    console.error('Error saving order items:', itemsError)
  }

  // 4. Descontar stock de cada producto
  for (const item of items as OrderItem[]) {
    if (!item.product_id) continue
    const { data: product } = await supabase
      .from('products')
      .select('stock')
      .eq('id', item.product_id)
      .single()

    if (product) {
      const newStock = Math.max(0, product.stock - item.quantity)
      await supabase
        .from('products')
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', item.product_id)
    }
  }

  return NextResponse.json(order, { status: 201 })
}

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
