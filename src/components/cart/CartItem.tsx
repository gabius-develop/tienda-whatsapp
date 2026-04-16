'use client'

import Image from 'next/image'
import { Trash2, Plus, Minus } from 'lucide-react'
import { CartItem as CartItemType } from '@/types'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/lib/utils'

interface CartItemProps {
  item: CartItemType
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore()

  return (
    <div className="flex gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50">
        {item.product.image_url ? (
          <Image
            src={item.product.image_url}
            alt={item.product.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-3xl">📦</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{item.product.name}</h3>
        <p className="text-sm text-green-600 font-semibold mt-0.5">
          {formatCurrency(item.product.price)}
        </p>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg">
            <button
              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
              className="p-1.5 hover:bg-gray-100 rounded-l-lg transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
              className="p-1.5 hover:bg-gray-100 rounded-r-lg transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-900">
              {formatCurrency(item.product.price * item.quantity)}
            </span>
            <button
              onClick={() => removeItem(item.product.id)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
