import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    if (type !== 'payment') return NextResponse.json({ received: true })

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) return NextResponse.json({ received: true })

    const client = new MercadoPagoConfig({ accessToken })
    const paymentClient = new Payment(client)

    const payment = await paymentClient.get({ id: data.id })

    if (payment.status === 'approved') {
      const orderId = payment.external_reference
      if (orderId) {
        const supabase = await createClient()
        await supabase
          .from('orders')
          .update({ status: 'confirmed' })
          .eq('id', orderId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ received: true })
  }
}
