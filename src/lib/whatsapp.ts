import { formatCurrency } from './utils'

export interface VerifiedOrderItem {
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

interface OrderData {
  customerName: string
  customerPhone: string
  customerAddress: string
  verifiedItems: VerifiedOrderItem[]
  verifiedTotal: number
  paymentUrl?: string
}

export function buildWhatsAppMessage(data: OrderData): string {
  const { customerName, customerPhone, customerAddress, verifiedItems, verifiedTotal, paymentUrl } = data

  const itemsList = verifiedItems
    .map((item) => `• ${item.product_name} x${item.quantity} = ${formatCurrency(item.subtotal)}`)
    .join('\n')

  const total = verifiedTotal

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
