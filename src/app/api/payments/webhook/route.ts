import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    if (type !== 'payment') return NextResponse.json({ received: true })

    // Usamos service client porque el webhook no tiene sesión de usuario ni tenant header fiable
    const supabase = createServiceClient()

    // 1. Obtener info básica del pago con el token global (solo para saber el external_reference)
    //    Usamos el token del env var o intentamos sin verificar si el tenant lo tiene configurado
    const globalToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!globalToken) return NextResponse.json({ received: true })

    const globalClient = new MercadoPagoConfig({ accessToken: globalToken })
    const paymentClient = new Payment(globalClient)

    let payment
    try {
      payment = await paymentClient.get({ id: data.id })
    } catch {
      // Si falla con el token global, puede ser un pago de otro tenant — ignorar
      return NextResponse.json({ received: true })
    }

    const orderId = payment.external_reference
    if (!orderId) return NextResponse.json({ received: true })

    // 2. Buscar la orden para obtener el tenant_id
    const { data: order } = await supabase
      .from('orders')
      .select('id, tenant_id, status')
      .eq('id', orderId)
      .single()

    if (!order) return NextResponse.json({ received: true })

    // 3. Obtener el token de MercadoPago del tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('mercadopago_access_token')
      .eq('id', order.tenant_id)
      .single()

    const tenantToken = tenant?.mercadopago_access_token ?? globalToken

    // 4. Re-verificar el pago con el token correcto del tenant
    let verifiedPayment = payment
    if (tenantToken !== globalToken) {
      const tenantClient = new MercadoPagoConfig({ accessToken: tenantToken })
      const tenantPaymentClient = new Payment(tenantClient)
      try {
        verifiedPayment = await tenantPaymentClient.get({ id: data.id })
      } catch {
        return NextResponse.json({ received: true })
      }
    }

    // 5. Actualizar estado del pedido
    if (verifiedPayment.status === 'approved') {
      await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', orderId)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ received: true })
  }
}
