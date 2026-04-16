import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [ordersResult, productsResult, topProductsResult, recentOrdersResult] = await Promise.all([
    supabase
      .from('orders')
      .select('total')
      .eq('status', 'pending'),

    supabase
      .from('products')
      .select('id, is_active'),

    supabase
      .from('order_items')
      .select('product_id, product_name, quantity, subtotal, products(image_url)')
      .order('quantity', { ascending: false }),

    supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const totalOrders = ordersResult.data?.length ?? 0
  const totalRevenue = ordersResult.data?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0
  const totalProducts = productsResult.data?.length ?? 0
  const activeProducts = productsResult.data?.filter((p) => p.is_active).length ?? 0

  // Aggregate top products from order items
  const productMap = new Map<string, {
    product_id: string
    product_name: string
    total_sold: number
    total_revenue: number
    image_url: string | null
  }>()

  topProductsResult.data?.forEach((item) => {
    const existing = productMap.get(item.product_id)
    const imageUrl = (item.products as unknown as { image_url: string | null } | null)?.image_url ?? null

    if (existing) {
      existing.total_sold += item.quantity
      existing.total_revenue += Number(item.subtotal)
    } else {
      productMap.set(item.product_id, {
        product_id: item.product_id,
        product_name: item.product_name,
        total_sold: item.quantity,
        total_revenue: Number(item.subtotal),
        image_url: imageUrl,
      })
    }
  })

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.total_sold - a.total_sold)
    .slice(0, 5)

  return NextResponse.json({
    total_orders: totalOrders,
    total_revenue: totalRevenue,
    total_products: totalProducts,
    active_products: activeProducts,
    top_products: topProducts,
    recent_orders: recentOrdersResult.data ?? [],
  })
}
