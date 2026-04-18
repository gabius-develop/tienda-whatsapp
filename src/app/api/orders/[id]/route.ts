import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const newStatus: string = body.status

  // Obtener el estado actual del pedido antes de cambiar
  const { data: currentOrder } = await supabase
    .from('orders')
    .select('status')
    .eq('id', id)
    .single()

  // Actualizar el estado del pedido
  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Si se cancela un pedido que NO estaba ya cancelado → restaurar stock
  const wasCancelled = currentOrder?.status === 'cancelled'
  if (newStatus === 'cancelled' && !wasCancelled) {
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', id)

    if (orderItems) {
      for (const item of orderItems) {
        if (!item.product_id) continue
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single()

        if (product) {
          await supabase
            .from('products')
            .update({
              stock: product.stock + item.quantity,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.product_id)
        }
      }
    }
  }

  return NextResponse.json(data)
}
