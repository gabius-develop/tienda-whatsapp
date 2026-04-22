'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart, Package, Share2 } from 'lucide-react'
import { Product, ClothingAttributes } from '@/types'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/lib/utils'
import Button from '@/components/ui/Button'
import CartButton from '@/components/store/CartButton'
import Badge from '@/components/ui/Badge'
import ImageCarousel from '@/components/store/ImageCarousel'
import toast from 'react-hot-toast'

const GENDER_LABELS: Record<string, string> = {
  hombre: 'Hombre', mujer: 'Mujer', unisex: 'Unisex', niño: 'Niño', niña: 'Niña',
}

const MEASUREMENT_LABELS: Record<string, string> = {
  busto: 'Busto / Pecho', cintura: 'Cintura', cadera: 'Cadera', largo: 'Largo', tiro: 'Tiro',
}

function ClothingAttrs({ attrs, type }: { attrs: ClothingAttributes; type: string }) {
  if (!attrs || type === 'general' || type === 'electronica') return null

  const hasColors = attrs.colors && attrs.colors.length > 0
  const hasSizes  = attrs.sizes  && attrs.sizes.length  > 0
  const hasMeasurements = attrs.measurements && Object.values(attrs.measurements).some(Boolean)

  if (!hasColors && !hasSizes && !attrs.gender && !attrs.material && !hasMeasurements) return null

  return (
    <div className="mb-6 space-y-4">
      {attrs.gender && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 font-medium">Género:</span>
          <span className="px-2 py-0.5 bg-gray-100 rounded-full text-gray-700">{GENDER_LABELS[attrs.gender] ?? attrs.gender}</span>
        </div>
      )}
      {attrs.material && (
        <div className="flex items-start gap-2 text-sm">
          <span className="text-gray-500 font-medium shrink-0">Material:</span>
          <span className="text-gray-700">{attrs.material}</span>
        </div>
      )}
      {hasColors && (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-gray-700">Colores disponibles</p>
          <div className="flex flex-wrap gap-2">
            {attrs.colors!.map((c) => (
              <span key={c} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">{c}</span>
            ))}
          </div>
        </div>
      )}
      {hasSizes && (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-gray-700">Tallas disponibles</p>
          <div className="flex flex-wrap gap-2">
            {attrs.sizes!.map((s) => (
              <span key={s} className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700">{s}</span>
            ))}
          </div>
        </div>
      )}
      {hasMeasurements && (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-gray-700">Guía de medidas</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(attrs.measurements!).filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex flex-col bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-400">{MEASUREMENT_LABELS[k] ?? k}</span>
                <span className="text-sm font-medium text-gray-700">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProductPage() {
  const { id } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const addItem = useCartStore((state) => state.addItem)

  const handleShare = async (p: Product) => {
    const url = `${window.location.origin}/product/${p.id}`
    if (navigator.share) {
      try {
        await navigator.share({ title: p.name, text: p.description ?? '', url })
      } catch {
        // cancelado por el usuario
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Enlace copiado al portapapeles')
    }
  }

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data)
        setLoading(false)
      })
  }, [id])

  const handleAddToCart = () => {
    if (!product || product.stock === 0) return
    addItem(product)
    toast.success(`${product.name} agregado al carrito`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Producto no encontrado</h2>
          <Link href="/" className="text-green-600 hover:underline mt-2 inline-block">
            Volver a la tienda
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Volver</span>
          </Link>
          <CartButton />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="bg-gray-50">
              <ImageCarousel
                images={
                  product.images && product.images.length > 0
                    ? product.images
                    : product.image_url
                    ? [product.image_url]
                    : []
                }
                alt={product.name}
              />
            </div>

            <div className="p-8 flex flex-col justify-between">
              <div>
                {product.category && (
                  <Badge variant="info" className="mb-3">{product.category}</Badge>
                )}
                <h1 className="text-2xl font-bold text-gray-900 mb-3">{product.name}</h1>
                <div className="flex items-baseline gap-3 flex-wrap mb-4">
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(product.price)}</p>
                  {product.was_price && product.was_price > product.price && (
                    <>
                      <p className="text-xl text-gray-400 line-through">{formatCurrency(product.was_price)}</p>
                      <span className="text-sm font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
                        -{Math.round((1 - product.price / product.was_price) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>
                {product.description && (
                  <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>
                )}

                {/* Atributos de ropa/calzado/accesorio */}
                <ClothingAttrs attrs={product.attributes} type={product.product_type} />

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                  <span>Disponibilidad:</span>
                  {product.stock > 0 ? (
                    <Badge variant="success">
                      {product.stock > 5 ? 'En stock' : `Solo ${product.stock} disponibles`}
                    </Badge>
                  ) : (
                    <Badge variant="danger">Agotado</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  size="lg"
                  className="w-full"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {product.stock === 0 ? 'Agotado' : 'Agregar al carrito'}
                </Button>
                <div className="flex gap-3">
                  <Link href="/cart" className="flex-1">
                    <Button variant="outline" size="lg" className="w-full">
                      Ver carrito
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleShare(product)}
                    title="Compartir producto"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
