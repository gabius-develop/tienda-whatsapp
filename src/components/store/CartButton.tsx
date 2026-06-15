'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'

export default function CartButton() {
  const totalItems = useCartStore((state) => state.totalItems())

  return (
    <Link href="/cart" className="relative p-2 text-white/90 hover:text-white transition-colors">
      <ShoppingCart className="w-6 h-6" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-white sp-cnt text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Link>
  )
}
