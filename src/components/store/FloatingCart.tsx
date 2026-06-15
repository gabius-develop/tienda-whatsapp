'use client'

import Link from 'next/link'
import { ShoppingCart, ChevronRight } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/lib/utils'

export default function FloatingCart() {
  const totalItems = useCartStore((state) => state.totalItems())
  const totalPrice = useCartStore((state) => state.totalPrice())

  if (totalItems === 0) return null

  return (
    <>
      {/* Barra inferior en móvil — estilo app nativa */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pt-2 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <Link
          href="/cart"
          className="sp-btn flex items-center justify-between px-5 py-3.5 rounded-2xl w-full shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-2 -right-2.5 bg-white sp-cnt text-xs font-bold rounded-full flex items-center justify-center leading-none" style={{ width: 18, height: 18 }}>
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            </div>
            <span className="text-sm font-medium">
              {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">{formatCurrency(totalPrice)}</span>
            <ChevronRight className="w-4 h-4 text-white/70" />
          </div>
        </Link>
      </div>

      {/* Botón flotante en desktop — arriba del WhatsApp */}
      <Link
        href="/cart"
        className="hidden sm:flex fixed bottom-20 right-6 z-50 items-center gap-3 sp-btn px-5 py-3.5 rounded-2xl shadow-2xl transition-all hover:scale-105"
      >
        <div className="relative">
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute -top-2.5 -right-2.5 bg-white sp-cnt text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
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
