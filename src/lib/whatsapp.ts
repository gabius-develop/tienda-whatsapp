import { CartItem } from '@/types'
import { formatCurrency } from './utils'

interface OrderData {
  customerName: string
  customerPhone: string
  customerAddress: string
  items: CartItem[]
  total: number
}

export function buildWhatsAppMessage(data: OrderData): string {
  const { customerName, customerPhone, customerAddress, items, total } = data

  const itemsList = items
    .map(
      (item) =>
        `• ${item.product.name} x${item.quantity} = ${formatCurrency(item.product.price * item.quantity)}`
    )
    .join('\n')

  const message = `🛍️ *NUEVO PEDIDO*

👤 *Cliente:* ${customerName}
📱 *Teléfono:* ${customerPhone}
📍 *Dirección de entrega:* ${customerAddress}

📦 *Productos:*
${itemsList}

💰 *Total: ${formatCurrency(total)}*

---
_Pedido realizado desde la tienda online_`

  return encodeURIComponent(message)
}

export function getWhatsAppUrl(phoneNumber: string, message: string): string {
  // Remove spaces, dashes, and ensure it starts with country code
  const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '')
  return `https://wa.me/${cleanPhone}?text=${message}`
}
