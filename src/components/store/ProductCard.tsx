'use client'

import Image from 'next/image'
import { ShoppingCart, Eye, Share2, Check } from 'lucide-react'
import { Product } from '@/types'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/lib/utils'
import Button from '@/components/ui/Button'
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
        // el usuario canceló el share, no hacer nada
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Enlace copiado al portapapeles')
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="relative aspect-square bg-gray-50">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-300 text-6xl">📦</div>
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Badge variant="danger" className="text-sm px-3 py-1">Agotado</Badge>
          </div>
        )}
        {product.category && (
          <div className="absolute top-2 left-2">
            <Badge variant="info">{product.category}</Badge>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{product.description}</p>
        )}

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xl font-bold text-green-600">{formatCurrency(product.price)}</span>
            {product.was_price && product.was_price > product.price && (
              <>
                <span className="text-sm text-gray-400 line-through">{formatCurrency(product.was_price)}</span>
                <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                  -{Math.round((1 - product.price / product.was_price) * 100)}%
                </span>
              </>
            )}
          </div>
          {product.stock > 0 && product.stock <= 5 && (
            <Badge variant="warning">Solo {product.stock} disponibles</Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`flex-1 transition-all duration-200 ${added ? 'bg-green-800 scale-95' : ''}`}
            size="sm"
          >
            {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
            {added ? '¡Listo!' : 'Agregar'}
          </Button>
          <Link href={`/product/${product.id}`}>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleShare} title="Compartir producto">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
