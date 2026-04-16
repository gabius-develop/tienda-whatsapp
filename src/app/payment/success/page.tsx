'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, MessageCircle } from 'lucide-react'
import { buildWhatsAppMessage, getWhatsAppUrl } from '@/lib/whatsapp'
import { formatCurrency } from '@/lib/utils'
import Button from '@/components/ui/Button'

interface OrderData {
  customerName: string
  customerPhone: string
  customerAddress: string
  items: { name: string; quantity: number; price: number }[]
  total: number
}

export default function PaymentSuccessPage() {
  const [order, setOrder] = useState<OrderData | null>(null)
  const [waSent, setWaSent] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('last_order')
    if (stored) {
      setOrder(JSON.parse(stored))
    }
  }, [])

  const handleWhatsApp = () => {
    if (!order) return

    const cartItems = order.items.map((item) => ({
      product: { id: '', name: item.name, price: item.price } as never,
      quantity: item.quantity,
    }))

    const message = buildWhatsAppMessage({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      items: cartItems,
      total: order.total,
      paymentUrl: '✅ Pago realizado con MercadoPago',
    })

    const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE!
    window.location.href = getWhatsAppUrl(phone, message)
    setWaSent(true)
    localStorage.removeItem('last_order')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-10 text-center max-w-md w-full shadow-sm border border-gray-100">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Pago realizado!</h1>
        <p className="text-gray-500 mb-6">
          Tu pago fue aprobado. Ahora avísale al vendedor por WhatsApp para coordinar el envío.
        </p>

        {order && (
          <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 text-sm">
            <p className="font-semibold text-gray-700 mb-2">Resumen del pedido:</p>
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-gray-600">
                <span>{item.name} x{item.quantity}</span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold text-gray-900">
              <span>Total pagado</span>
              <span className="text-green-600">{formatCurrency(order.total)}</span>
            </div>
          </div>
        )}

        <Button
          onClick={handleWhatsApp}
          size="lg"
          className="w-full bg-green-600 hover:bg-green-700 mb-3"
          disabled={waSent}
        >
          <MessageCircle className="w-5 h-5" />
          {waSent ? 'Mensaje enviado' : 'Avisar al vendedor por WhatsApp'}
        </Button>

        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          Seguir comprando
        </Link>
      </div>
    </div>
  )
}
