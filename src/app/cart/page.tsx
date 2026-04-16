'use client'

import Link from 'next/link'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import CartItem from '@/components/cart/CartItem'
import CheckoutForm from '@/components/cart/CheckoutForm'
import Button from '@/components/ui/Button'

export default function CartPage() {
  const { items, clearCart } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Tu carrito está vacío</h2>
          <p className="text-gray-500 mb-6">Agrega productos desde la tienda para continuar</p>
          <Link href="/">
            <Button size="lg">Ver productos</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Tu Carrito</h1>
          <span className="text-sm text-gray-500">({items.length} {items.length === 1 ? 'producto' : 'productos'})</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Productos seleccionados</h2>
                <button
                  onClick={clearCart}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  Vaciar carrito
                </button>
              </div>

              <div>
                {items.map((item) => (
                  <CartItem key={item.product.id} item={item} />
                ))}
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <CheckoutForm />
          </div>
        </div>
      </main>
    </div>
  )
}
