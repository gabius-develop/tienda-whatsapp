import { CartItem } from '@/types'
import { formatCurrency } from './utils'

interface OrderData {
  customerName: string
  customerPhone: string
  customerAddress: string
  items: CartItem[]
  total: number
  paymentUrl?: string
}

export function buildWhatsAppMessage(data: OrderData): string {
  const { customerName, customerPhone, customerAddress, items, total, paymentUrl } = data

  const itemsList = items
    .map(
      (item) =>
        `• ${item.product.name} x${item.quantity} = ${formatCurrency(item.product.price * item.quantity)}`
    )
    .join('\n')

  const paymentSection = paymentUrl
    ? `\n💳 *Link de pago MercadoPago:*\n${paymentUrl}\n`
    : ''

  const message = `🛍️ *NUEVO PEDIDO*

👤 *Cliente:* ${customerName}
📱 *Teléfono:* ${customerPhone}
📍 *Dirección de entrega:* ${customerAddress}

📦 *Productos:*
${itemsList}

💰 *Total: ${formatCurrency(total)}*
${paymentSection}
---
_Pedido realizado desde la tienda online_`

  return encodeURIComponent(message)
}

export function getWhatsAppUrl(phoneNumber: string, message: string): string {
  const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '')
  return `https://wa.me/${cleanPhone}?text=${message}`
}
