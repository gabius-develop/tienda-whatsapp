import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTenantBySlug, getTenantSlugFromRequest } from '@/lib/tenant'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { sendButtonMessage } from '@/lib/whatsapp-cloud'
import { saveMessage } from '@/lib/whatsapp-bot'
import { formatCurrency } from '@/lib/utils'

function srvClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/**
 * POST /api/admin/whatsapp/carousel
 * Envía tarjetas de productos con imagen a un cliente desde el panel de conversaciones.
 * Body: { to, productIds?: string[] }
 * - Si productIds se proporciona, usa esos productos.
 * - Si no, usa los top 5 productos con imagen más recientes.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantSlug = getTenantSlugFromRequest(request)
  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const { to, productIds } = await request.json()
  if (!to) {
    return NextResponse.json({ error: 'El campo "to" (teléfono destino) es requerido' }, { status: 400 })
  }

  const db = srvClient()

  // Obtener config del bot
  const { data: cfg } = await db
    .from('whatsapp_bot_config')
    .select('phone_number_id, access_token, is_active')
    .eq('tenant_id', tenant.id)
    .single()

  if (!cfg || !cfg.is_active) {
    return NextResponse.json({ error: 'El bot no está activo o no está configurado' }, { status: 400 })
  }

  // Obtener productos
  type Product = { id: string; name: string; price: number; image_url: string | null }
  let products: Product[] = []

  if (productIds && productIds.length > 0) {
    const { data } = await db
      .from('products')
      .select('id, name, price, image_url')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .in('id', productIds)
    products = data ?? []
  } else {
    const { data } = await db
      .from('products')
      .select('id, name, price, image_url')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .not('image_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5)
    products = data ?? []
  }

  // Filtrar solo los que tienen imagen
  const productsWithImage = products.filter(p => p.image_url)

  if (productsWithImage.length === 0) {
    return NextResponse.json(
      { error: 'No hay productos con imagen para enviar. Agrega imágenes a tus productos primero.' },
      { status: 400 },
    )
  }

  // Enviar cada producto como tarjeta con imagen + botones
  let sentCount = 0
  for (const p of productsWithImage.slice(0, 5)) {
    const caption = `*${p.name}*\n💰 ${formatCurrency(p.price)}`

    const ok = await sendButtonMessage(
      cfg.phone_number_id, cfg.access_token, to,
      caption,
      [
        { id: `cart_add_${p.id}`, title: '🛒 Agregar' },
        { id: `product_${p.id}`,  title: '📋 Ver detalle' },
      ],
      { headerImageUrl: p.image_url! },
    )

    if (ok) {
      await saveMessage(db, tenant.id, to, 'outbound', caption)
      sentCount++
    }
  }

  if (sentCount === 0) {
    return NextResponse.json({ error: 'No se pudo enviar ninguna tarjeta de producto.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, products_sent: sentCount })
}
