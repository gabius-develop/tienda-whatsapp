import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTenantBySlug, getTenantSlugFromRequest } from '@/lib/tenant'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { sendCarouselTemplate } from '@/lib/whatsapp-cloud'
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
 * Envía un carousel de productos a un cliente desde el panel de conversaciones.
 * Body: { to, productIds?: string[] }
 * - Si productIds se proporciona, usa esos productos.
 * - Si no, usa los top 5 productos más vendidos/recientes.
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
    .select('phone_number_id, access_token, is_active, carousel_template_name, carousel_template_lang')
    .eq('tenant_id', tenant.id)
    .single()

  if (!cfg || !cfg.is_active) {
    return NextResponse.json({ error: 'El bot no está activo o no está configurado' }, { status: 400 })
  }

  if (!cfg.carousel_template_name) {
    return NextResponse.json({ error: 'No hay un template de carousel configurado. Configúralo en la sección de WhatsApp Bot.' }, { status: 400 })
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
    // Top 5 productos más recientes con imagen
    const { data } = await db
      .from('products')
      .select('id, name, price, image_url')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .not('image_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)
    products = data ?? []
  }

  // Filtrar solo los que tienen imagen (requerido para carousel)
  const productsWithImage = products.filter(p => p.image_url)

  if (productsWithImage.length < 2) {
    return NextResponse.json(
      { error: 'Se necesitan al menos 2 productos con imagen para enviar un carousel.' },
      { status: 400 },
    )
  }

  // Obtener URL de la tienda
  const { data: urlRow } = await db
    .from('store_settings')
    .select('value')
    .eq('tenant_id', tenant.id)
    .eq('key', 'store_url')
    .maybeSingle()
  const storeUrl = urlRow?.value ?? process.env.NEXT_PUBLIC_APP_URL ?? null

  const cards = productsWithImage.slice(0, 10).map(p => ({
    imageUrl: p.image_url!,
    bodyParams: [p.name, formatCurrency(p.price)],
    buttonUrlSuffix: storeUrl ? `/product/${p.id}` : undefined,
  }))

  const ok = await sendCarouselTemplate(
    cfg.phone_number_id,
    cfg.access_token,
    to,
    cfg.carousel_template_name,
    cfg.carousel_template_lang ?? 'es',
    cards,
  )

  if (!ok) {
    return NextResponse.json({ error: 'Error al enviar el carousel por WhatsApp. Verifica que el template exista y esté aprobado.' }, { status: 500 })
  }

  // Guardar en historial
  const productList = productsWithImage.map(p => `${p.name} — ${formatCurrency(p.price)}`).join(', ')
  await saveMessage(db, tenant.id, to, 'outbound', `[Carousel] ${productList}`)

  return NextResponse.json({ success: true, products_sent: productsWithImage.length })
}
