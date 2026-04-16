'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MessageCircle } from 'lucide-react'
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

export default function CheckoutForm() {
  const [loading, setLoading] = useState(false)
  const { items, totalPrice, clearCart } = useCartStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  })

  const onSubmit = async (data: CheckoutFormData) => {
    setLoading(true)
    try {
      // Save order to database
      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        subtotal: item.product.price * item.quantity,
      }))

      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: data.customerName,
          customer_phone: data.customerPhone,
          customer_address: data.customerAddress,
          items: orderItems,
          total: totalPrice(),
        }),
      })

      // Build WhatsApp message and redirect
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
      toast.success('Pedido enviado a WhatsApp!')
    } catch {
      toast.error('Hubo un error al procesar tu pedido. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        <Button
          type="submit"
          loading={loading}
          size="lg"
          className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl"
        >
          <MessageCircle className="w-5 h-5" />
          Comprar por WhatsApp
        </Button>

        <p className="text-xs text-gray-500 mt-3 text-center">
          Al hacer clic serás redirigido a WhatsApp para confirmar tu pedido
        </p>
      </div>
    </form>
  )
}
