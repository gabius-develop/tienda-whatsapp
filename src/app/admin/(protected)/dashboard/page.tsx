'use client'

import { useEffect, useState } from 'react'
import { Package, ShoppingBag, TrendingUp, Star } from 'lucide-react'
import { DashboardStats } from '@/types'
import StatsCard from '@/components/admin/StatsCard'
import { formatCurrency, formatDate } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Image from 'next/image'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data)
      })
      .catch(() => {
        setStats({ total_orders: 0, total_revenue: 0, total_products: 0, active_products: 0, top_products: [], recent_orders: [] })
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen de tu tienda</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total pedidos"
          value={stats.total_orders}
          icon={<ShoppingBag className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Ingresos totales"
          value={formatCurrency(stats.total_revenue)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="Productos totales"
          value={stats.total_products}
          icon={<Package className="w-5 h-5" />}
          color="purple"
        />
        <StatsCard
          title="Productos activos"
          value={stats.active_products}
          icon={<Star className="w-5 h-5" />}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Ranking */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Top productos más vendidos
          </h2>

          {stats.top_products.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">
              Aún no hay datos de ventas
            </p>
          ) : (
            <div className="space-y-3">
              {stats.top_products.map((product, index) => (
                <div key={product.product_id} className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </span>
                  {product.image_url ? (
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={product.image_url} alt={product.product_name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                      📦
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.product_name}</p>
                    <p className="text-xs text-gray-500">{product.total_sold} vendidos</p>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    {formatCurrency(product.total_revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            Pedidos recientes
          </h2>

          {stats.recent_orders.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">
              Aún no hay pedidos
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recent_orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                    <Badge variant="success" className="text-xs">{order.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
