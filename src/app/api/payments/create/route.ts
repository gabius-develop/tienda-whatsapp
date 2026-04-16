import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'

export async function POST(request: NextRequest) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

  if (!accessToken || accessToken === 'TEST-tu-access-token-aqui') {
    return NextResponse.json({ error: 'MERCADOPAGO_ACCESS_TOKEN no configurado en Railway' }, { status: 500 })
  }

  const body = await request.json()
  const { items, orderId } = body

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'No hay productos en el carrito' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const isSandbox = accessToken.startsWith('TEST-')

  try {
    const client = new MercadoPagoConfig({ accessToken })
    const preference = new Preference(client)

    const result = await preference.create({
      body: {
        items: items.map((item: { name: string; quantity: number; unit_price: number }) => ({
          id: item.name,
          title: item.name,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          currency_id: 'MXN',
        })),
        external_reference: orderId ?? undefined,
        back_urls: {
          success: `${appUrl}/payment/success`,
          failure: `${appUrl}/payment/failure`,
          pending: `${appUrl}/payment/pending`,
        },
        auto_return: 'approved',
        notification_url: `${appUrl}/api/payments/webhook`,
      },
    })

    // Sandbox token → usar sandbox_init_point; producción → init_point
    const paymentUrl = isSandbox
      ? (result.sandbox_init_point ?? result.init_point)
      : result.init_point

    if (!paymentUrl) {
      return NextResponse.json({ error: 'MercadoPago no devolvió URL de pago' }, { status: 500 })
    }

    return NextResponse.json({ preference_id: result.id, payment_url: paymentUrl })
  } catch (err) {
    // Log the full error for debugging
    console.error('[MercadoPago Error]', JSON.stringify(err, null, 2))
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `MercadoPago: ${message}` }, { status: 500 })
  }
}
