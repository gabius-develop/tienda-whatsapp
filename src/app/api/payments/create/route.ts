import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'

export async function POST(request: NextRequest) {
  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) {
      return NextResponse.json({ error: 'MercadoPago no configurado' }, { status: 500 })
    }

    const client = new MercadoPagoConfig({ accessToken })
    const preference = new Preference(client)

    const body = await request.json()
    const { items, orderId, customerEmail } = body

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const result = await preference.create({
      body: {
        items: items.map((item: {
          name: string
          quantity: number
          unit_price: number
        }) => ({
          title: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          currency_id: 'MXN',
        })),
        payer: customerEmail ? { email: customerEmail } : undefined,
        external_reference: orderId,
        back_urls: {
          success: `${appUrl}/payment/success`,
          failure: `${appUrl}/payment/failure`,
          pending: `${appUrl}/payment/pending`,
        },
        auto_return: 'approved',
        notification_url: `${appUrl}/api/payments/webhook`,
        statement_descriptor: 'Mi Tienda Online',
      },
    })

    return NextResponse.json({
      preference_id: result.id,
      payment_url: result.sandbox_init_point, // Usar init_point en producción real
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al crear pago'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
