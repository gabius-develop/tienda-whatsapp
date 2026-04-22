'use client'

import { useState, useEffect } from 'react'
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

export default function CheckoutForm() {
  const [loading, setLoading] = useState<'whatsapp' | 'mercadopago' | null>(null)
  const [whatsappPhone, setWhatsappPhone] = useState<string | null>(null)
  const { items, totalPrice, clearCart } = useCartStore()

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((s) => { setWhatsappPhone(s.whatsapp_phone || process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '') })
      .catch(() => { setWhatsappPhone(process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? '') })
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  })

  const saveOrderForSuccessPage = (data: CheckoutFormData, verifiedItems?: { product_name: string; quantity: number; unit_price: number }[], verifiedTotal?: number) => {
    localStorage.setItem('last_order', JSON.stringify({
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerAddress: data.customerAddress,
      items: (verifiedItems ?? items.map((item) => ({ product_name: item.product.name, quantity: item.quantity, unit_price: item.product.price }))).map((item) => ({
        name: item.product_name,
        quantity: item.quantity,
        price: item.unit_price,
      })),
      total: verifiedTotal ?? totalPrice(),
    }))
  }

  const handleWhatsApp = async (data: CheckoutFormData) => {
    setLoading('whatsapp')
    try {
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: data.customerName,
          customer_phone: data.customerPhone,
          customer_address: data.customerAddress,
          // Solo enviamos IDs y cantidades — el servidor determina precios y totales
          items: items.map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
        }),
      })

      if (!orderRes.ok) {
        const err = await orderRes.json()
        toast.error(err.error ?? 'Error al procesar el pedido')
        setLoading(null)
        return
      }

      // Usar precios verificados del servidor, no los del carrito
      const { verified_items, verified_total } = await orderRes.json()

      const message = buildWhatsAppMessage({
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress,
        verifiedItems: verified_items,
        verifiedTotal: verified_total,
      })

      clearCart()
      window.location.href = getWhatsAppUrl(whatsappPhone!, message)
    } catch {
      toast.error('Hubo un error. Intenta de nuevo.')
    } finally {
      setLoading(null)
    }
  }

  const handleMercadoPago = async (data: CheckoutFormData) => {
    setLoading('mercadopago')
    try {
      // 1. Guardar orden en DB (el servidor verifica precios)
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: data.customerName,
          customer_phone: data.customerPhone,
          customer_address: data.customerAddress,
          items: items.map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
        }),
      })

      const order = await orderRes.json()

      // 2. Guardar datos para la página de éxito con precios verificados
      saveOrderForSuccessPage(data, order.verified_items, order.verified_total)

      // 3. Crear preferencia de pago con precios verificados del servidor
      const mpRes = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: (order.verified_items ?? []).map((item: { product_name: string; quantity: number; unit_price: number }) => ({
            name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
          orderId: order.id,
        }),
      })

      if (!mpRes.ok) throw new Error('Error al crear el pago')

      const { payment_url } = await mpRes.json()

      // 4. Limpiar carrito y redirigir a MercadoPago (misma pestaña)
      clearCart()
      window.location.href = payment_url
    } catch {
      toast.error('Error al crear el pago. Intenta con WhatsApp.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
    {loading === 'mercadopago' && (
      <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center">
        <div className="animate-spin w-16 h-16 border-4 border-white border-t-transparent rounded-full mb-4" />
        <p className="text-white text-xl font-semibold">Procesando pago...</p>
        <p className="text-white/70 text-sm mt-1">Redirigiendo a MercadoPago</p>
      </div>
    )}
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

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="flex-1 border-t border-gray-200" />
            <span>o también</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <Button
            type="button"
            onClick={handleSubmit(handleWhatsApp)}
            loading={loading === 'whatsapp'}
            disabled={loading !== null || whatsappPhone === null}
            size="lg"
            variant="primary"
            className="w-full rounded-xl"
          >
            <MessageCircle className="w-5 h-5" />
            {whatsappPhone === null ? 'Cargando...' : 'Solo por WhatsApp'}
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-3 text-center">
          MercadoPago acepta tarjetas y OXXO
        </p>
      </div>
    </form>
    </>
  )
}
