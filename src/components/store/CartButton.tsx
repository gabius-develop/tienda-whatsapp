'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'

export default function CartButton() {
  const totalItems = useCartStore((state) => state.totalItems())

  return (
    <Link href="/cart" className="relative p-2 text-gray-700 hover:text-green-600 transition-colors">
      <ShoppingCart className="w-6 h-6" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 sp-badge text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Link>
  )
}
