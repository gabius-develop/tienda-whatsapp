'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MessageCircle, CreditCard } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { buildWhatsAppMessage, getWhatsAppUrl } from '@/lib/whatsapp'
import { formatCurrency } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

const checkoutSchema = z.object({
  customerName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  customerPhone: z.string().min(10, 'Ingresa un número de teléfono válido'),
  customerAddress: z.string().min(10, 'Ingresa una dirección completa'),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

async function createOrder(data: CheckoutFormData, items: ReturnType<typeof useCartStore.getState>['items'], total: number) {
  const orderItems = items.map((item) => ({
    product_id: item.product.id,
    product_name: item.product.name,
    quantity: item.quantity,
    unit_price: item.product.price,
    subtotal: item.product.price * item.quantity,
  }))

  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      customer_address: data.customerAddress,
      items: orderItems,
      total,
    }),
  })

  if (!res.ok) throw new Error('Error al guardar el pedido')
  return res.json()
}

export default function CheckoutForm() {
  const [loading, setLoading] = useState<'whatsapp' | 'mercadopago' | null>(null)
  const { items, totalPrice, clearCart } = useCartStore()

  const mpEnabled = !!process.env.NEXT_PUBLIC_APP_URL

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  })

  const handleWhatsApp = async (data: CheckoutFormData) => {
    setLoading('whatsapp')
    try {
      const order = await createOrder(data, items, totalPrice())

      const message = buildWhatsAppMessage({
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress,
        items,
        total: totalPrice(),
      })

      const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE!
      const url = getWhatsAppUrl(whatsappPhone, message)

      clearCart()
      window.open(url, '_blank')
      toast.success('¡Pedido enviado a WhatsApp!')
    } catch {
      toast.error('Hubo un error al procesar tu pedido. Intenta de nuevo.')
    } finally {
      setLoading(null)
    }
  }

  const handleMercadoPago = async (data: CheckoutFormData) => {
    setLoading('mercadopago')
    try {
      const order = await createOrder(data, items, totalPrice())

      const mpItems = items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
      }))

      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: mpItems, orderId: order.id }),
      })

      if (!res.ok) throw new Error('Error al crear el pago')

      const { payment_url } = await res.json()

      // Also send WhatsApp with payment link
      const message = buildWhatsAppMessage({
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress,
        items,
        total: totalPrice(),
        paymentUrl: payment_url,
      })

      const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE!
      const waUrl = getWhatsAppUrl(whatsappPhone, message)

      clearCart()
      // Open payment first
      window.open(payment_url, '_blank')
      // Then open WhatsApp so admin also gets notified
      setTimeout(() => window.open(waUrl, '_blank'), 1000)

      toast.success('¡Redirigiendo al pago!')
    } catch {
      toast.error('Error al crear el pago. Intenta con WhatsApp.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <form className="space-y-4">
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos de envío</h2>
        <div className="space-y-4">
          <Input
            label="Nombre completo"
            placeholder="Tu nombre"
            error={errors.customerName?.message}
            {...register('customerName')}
          />
          <Input
            label="Teléfono"
            placeholder="10 dígitos"
            type="tel"
            error={errors.customerPhone?.message}
            {...register('customerPhone')}
          />
          <Input
            label="Dirección de entrega"
            placeholder="Calle, número, colonia, ciudad"
            error={errors.customerAddress?.message}
            {...register('customerAddress')}
          />
        </div>
      </div>

      <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600">Total a pagar</span>
          <span className="text-2xl font-bold text-green-700">{formatCurrency(totalPrice())}</span>
        </div>

        <div className="space-y-3">
          {/* MercadoPago button */}
          <Button
            type="button"
            onClick={handleSubmit(handleMercadoPago)}
            loading={loading === 'mercadopago'}
            disabled={loading !== null}
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
          >
            <CreditCard className="w-5 h-5" />
            Pagar con MercadoPago
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="flex-1 border-t border-gray-200" />
            <span>o también</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* WhatsApp button */}
          <Button
            type="button"
            onClick={handleSubmit(handleWhatsApp)}
            loading={loading === 'whatsapp'}
            disabled={loading !== null}
            size="lg"
            variant="primary"
            className="w-full rounded-xl"
          >
            <MessageCircle className="w-5 h-5" />
            Solo por WhatsApp
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-3 text-center">
          MercadoPago acepta tarjetas y OXXO. WhatsApp coordina el pago directo.
        </p>
      </div>
    </form>
  )
}
