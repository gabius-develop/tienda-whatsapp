'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, ShoppingBag, Phone, MapPin, Calendar } from 'lucide-react'
import { Order, OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types'
import Badge from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/orders')
      .then((r) => r.json())
      .then((data) => {
        setOrders(data)
        setLoading(false)
      })
  }, [])

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setUpdatingStatus(orderId)
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      )
      toast.success('Estado actualizado')
    } else {
      toast.error('Error al actualizar el estado')
    }
    setUpdatingStatus(null)
  }

  const toggleExpand = (id: string) => setExpanded((prev) => (prev === id ? null : id))

  if (loading) {
    return (
      <div className="p-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl h-20 animate-pulse border border-gray-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-gray-500 text-sm mt-1">{orders.length} pedidos en total</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Sin pedidos aún</h3>
          <p className="text-gray-500">Los pedidos aparecerán aquí cuando los clientes compren.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Order Header */}
              <div className="px-4 md:px-6 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{order.customer_name}</span>
                      <Badge variant={ORDER_STATUS_COLORS[order.status]}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {order.customer_phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {order.customer_address}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(order.created_at)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleExpand(order.id)}
                    className="text-gray-400 hover:text-gray-700 transition-colors shrink-0 mt-1"
                  >
                    {expanded === order.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3 gap-3">
                  <span className="text-lg font-bold text-green-600">{formatCurrency(order.total)}</span>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                    disabled={updatingStatus === order.id}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Order Items (expanded) */}
              {expanded === order.id && order.order_items && order.order_items.length > 0 && (
                <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Artículos del pedido</p>
                  <div className="space-y-2">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">
                          <span className="font-medium">{item.product_name}</span>
                          <span className="text-gray-400 ml-2">x{item.quantity}</span>
                        </span>
                        <span className="font-semibold text-gray-900">{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-sm font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-green-600">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
