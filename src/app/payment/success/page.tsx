'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, MessageCircle } from 'lucide-react'
import { buildWhatsAppMessage, getWhatsAppUrl } from '@/lib/whatsapp'
import { formatCurrency } from '@/lib/utils'

interface OrderData {
  customerName: string
  customerPhone: string
  customerAddress: string
  items: { name: string; quantity: number; price: number }[]
  total: number
}

export default function PaymentSuccessPage() {
  const [order, setOrder] = useState<OrderData | null>(null)
  const [countdown, setCountdown] = useState(3)
  const [waSent, setWaSent] = useState(false)

  const buildWaUrl = (order: OrderData) => {
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
      paymentUrl: '✅ Pago completado con MercadoPago',
    })
    return getWhatsAppUrl(process.env.NEXT_PUBLIC_WHATSAPP_PHONE!, message)
  }

  useEffect(() => {
    const stored = localStorage.getItem('last_order')
    if (!stored) return

    const orderData: OrderData = JSON.parse(stored)
    setOrder(orderData)
    localStorage.removeItem('last_order')

    let count = 3
    const interval = setInterval(() => {
      count -= 1
      setCountdown(count)
      if (count === 0) {
        clearInterval(interval)
        setWaSent(true)
        window.location.href = buildWaUrl(orderData)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleManualWhatsApp = () => {
    if (!order) return
    setWaSent(true)
    window.location.href = buildWaUrl(order)
  }

  // Progress bar width: 100% → 66% → 33% → 0%
  const progressWidth = `${(countdown / 3) * 100}%`

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-10 text-center max-w-md w-full shadow-sm border border-gray-100">

        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Pago realizado!</h1>
        <p className="text-gray-500 mb-6">
          Tu pago fue aprobado. En un momento serás enviado a WhatsApp para notificar al vendedor.
        </p>

        {order && (
          <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 text-sm">
            <p className="font-semibold text-gray-700 mb-2">Resumen:</p>
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-gray-600">
                <span>{item.name} x{item.quantity}</span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold">
              <span>Total pagado</span>
              <span className="text-green-600">{formatCurrency(order.total)}</span>
            </div>
          </div>
        )}

        {/* Countdown + progress bar */}
        {order && !waSent && (
          <div className="mb-5">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center text-2xl font-bold shadow-md">
                {countdown}
              </div>
              <p className="text-sm text-gray-600">
                Abriendo WhatsApp...
              </p>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: progressWidth }}
              />
            </div>
          </div>
        )}

        {waSent && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
            <p className="text-sm text-green-700 font-medium flex items-center justify-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Abriendo WhatsApp...
            </p>
          </div>
        )}

        {/* Manual fallback — solo si hay orden pendiente */}
        {order && (
          <button
            onClick={handleManualWhatsApp}
            disabled={waSent}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            {waSent ? 'Redirigiendo...' : 'Abrir WhatsApp ahora'}
          </button>
        )}

        {/* Sin orden (recarga directa) */}
        {!order && (
          <p className="text-gray-400 text-sm">
            Si pagaste correctamente, revisa tu WhatsApp. <br />
            <a href="/" className="text-green-600 hover:underline">Volver a la tienda</a>
          </p>
        )}
      </div>
    </div>
  )
}
