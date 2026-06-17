'use client'

import Image from 'next/image'
import { ShoppingCart, Share2, Check } from 'lucide-react'
import { Product } from '@/types'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useState } from 'react'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const [added, setAdded] = useState(false)

  const handleAddToCart = () => {
    if (product.stock === 0) return
    addItem(product)
    toast.success(`${product.name} agregado al carrito`)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/product/${product.id}`
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: product.description ?? '', url })
      } catch {
        // cancelado por el usuario
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Enlace copiado al portapapeles')
    }
  }

  const isNegotiable = product.price_type === 'negotiable'
  const hasDiscount = !isNegotiable && product.was_price && product.was_price > product.price
  const discountPercent = hasDiscount ? Math.round((1 - product.price / product.was_price!) * 100) : 0

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 flex flex-col transition-all duration-200 hover:shadow-lg hover:shadow-gray-200/60 hover:-translate-y-1 cursor-pointer">
      {/* Imagen — aspect-square en todas las resoluciones */}
      <Link href={`/product/${product.id}`} className="relative block aspect-square bg-gray-50 overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-5xl">📦</div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-white text-xs font-bold bg-black/60 px-4 py-1.5 rounded-full">Agotado</span>
          </div>
        )}
        {hasDiscount && (
          <div className="absolute top-2 right-2">
            <span className="bg-red-500 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
              -{discountPercent}%
            </span>
          </div>
        )}
        {product.category && (
          <div className="absolute top-2 left-2">
            <Badge variant="info" className="text-[10px] px-2 py-0.5 shadow-sm backdrop-blur-sm">{product.category}</Badge>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-2.5 sm:p-3 flex flex-col flex-1">
        <p className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2 mb-1.5 leading-snug">{product.name}</p>

        <div className="flex items-baseline gap-1.5 flex-wrap mb-3">
          {isNegotiable ? (
            <span className="text-sm sm:text-base font-bold text-amber-600">A convenir</span>
          ) : (
            <>
              <span className="text-sm sm:text-base font-bold sp-text">{formatCurrency(product.price)}</span>
              {hasDiscount && (
                <span className="text-[11px] text-gray-400 line-through">{formatCurrency(product.was_price!)}</span>
              )}
            </>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-1.5 mt-auto">
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all duration-200
              ${added
                ? 'sp-btn scale-95'
                : product.stock === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'sp-btn'
              }`}
          >
            {added ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
            {added ? '¡Listo!' : 'Agregar'}
          </button>

          <button
            onClick={handleShare}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50 active:scale-95 transition-all"
            title="Compartir"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
