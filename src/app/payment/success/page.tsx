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
  const [countdown, setCountdown] = useState(5)
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

    let count = 5
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

  const total = 5
  const progressPct = (countdown / total) * 100
  const circumference = 2 * Math.PI * 54

  // Pantalla de conteo regresiva — bloquea la interacción hasta abrir WhatsApp
  if (order && !waSent) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center px-6 z-50">
        {/* Ícono de éxito */}
        <CheckCircle className="w-16 h-16 text-green-400 mb-6" />

        <h1 className="text-3xl font-bold text-white mb-2 text-center">¡Pago realizado!</h1>
        <p className="text-gray-400 text-center mb-10 max-w-sm">
          Te llevamos a WhatsApp para notificar al vendedor. No cierres esta página.
        </p>

        {/* Círculo de cuenta regresiva */}
        <div className="relative w-48 h-48 mb-8">
          <svg className="w-48 h-48 -rotate-90" viewBox="0 0 120 120">
            {/* Fondo */}
            <circle cx="60" cy="60" r="54" fill="none" stroke="#1f2937" strokeWidth="10" />
            {/* Progreso */}
            <circle
              cx="60" cy="60" r="54"
              fill="none" stroke="#16a34a" strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progressPct / 100)}
              className="transition-all duration-1000 ease-linear"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-7xl font-black text-white leading-none">{countdown}</span>
            <span className="text-gray-400 text-sm mt-1">segundos</span>
          </div>
        </div>

        <p className="text-green-400 font-semibold text-lg mb-1">Abriendo WhatsApp...</p>
        <p className="text-gray-500 text-sm mb-10">El mensaje al vendedor se enviará automáticamente</p>

        {/* Botón para abrir ahora sin esperar */}
        <button
          onClick={handleManualWhatsApp}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-colors shadow-lg shadow-green-900/40"
        >
          <MessageCircle className="w-6 h-6" />
          Abrir WhatsApp ahora
        </button>
      </div>
    )
  }

  // Pantalla posterior — ya se abrió WhatsApp o no había orden
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-10 text-center max-w-lg w-full shadow-sm border border-gray-100">

        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Pago realizado!</h1>
        <p className="text-gray-500 mb-6">
          Tu pago fue aprobado.
        </p>

        {order && (
          <div className="bg-gray-50 rounded-xl p-4 text-left mb-8 text-sm">
            <p className="font-semibold text-gray-700 mb-2">Resumen del pedido:</p>
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-gray-600 py-0.5">
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

        {waSent && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
            <MessageCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-green-700 font-semibold">WhatsApp abierto correctamente</p>
          </div>
        )}

        {order && (
          <button
            onClick={handleManualWhatsApp}
            disabled={waSent}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-4 px-6 rounded-xl transition-colors text-lg"
          >
            <MessageCircle className="w-5 h-5" />
            {waSent ? 'Redirigiendo...' : 'Abrir WhatsApp ahora'}
          </button>
        )}

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
