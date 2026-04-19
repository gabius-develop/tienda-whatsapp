'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/lib/utils'

export default function FloatingCart() {
  const totalItems = useCartStore((state) => state.totalItems())
  const totalPrice = useCartStore((state) => state.totalPrice())

  if (totalItems === 0) return null

  return (
    <>
      {/* Barra inferior en móvil — estilo app nativa */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 bg-white border-t border-gray-100 shadow-2xl">
        <Link
          href="/cart"
          className="flex items-center justify-between bg-green-600 active:bg-green-700 text-white px-5 py-4 rounded-2xl w-full transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 bg-white text-green-700 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            </div>
            <span className="text-sm font-medium">
              {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">{formatCurrency(totalPrice)}</span>
            <span className="text-green-200 text-sm">›</span>
          </div>
        </Link>
      </div>

      {/* Botón flotante en desktop */}
      <Link
        href="/cart"
        className="hidden sm:flex fixed bottom-6 right-6 z-50 items-center gap-3 bg-green-600 hover:bg-green-700 text-white px-5 py-3.5 rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95"
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
    </>
  )
}
