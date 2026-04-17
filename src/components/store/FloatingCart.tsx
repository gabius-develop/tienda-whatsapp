'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/lib/utils'

export default function FloatingCart() {
  const items = useCartStore((state) => state.items)
  const totalItems = useCartStore((state) => state.totalItems())
  const totalPrice = useCartStore((state) => state.totalPrice())

  if (totalItems === 0) return null

  return (
    <Link
      href="/cart"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white px-5 py-3.5 rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95"
    >
      <div className="relative">
        <ShoppingCart className="w-6 h-6" />
        <span className="absolute -top-2.5 -right-2.5 bg-white text-green-700 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {totalItems > 9 ? '9+' : totalItems}
        </span>
      </div>
      <div className="flex flex-col items-start leading-tight">
        <span className="text-xs opacity-80">
          {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
        </span>
        <span className="font-bold text-sm">{formatCurrency(totalPrice)}</span>
      </div>
    </Link>
  )
}
