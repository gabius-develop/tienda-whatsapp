'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart, Package, Share2, Check, Minus, Plus, Truck, ShieldCheck, MessageCircle, Ruler, Palette, Tag } from 'lucide-react'
import { Product, ClothingAttributes } from '@/types'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/lib/utils'
import Button from '@/components/ui/Button'
import CartButton from '@/components/store/CartButton'
import Badge from '@/components/ui/Badge'
import ImageCarousel from '@/components/store/ImageCarousel'
import { StoreColorStyle } from '@/components/store/StoreColorStyle'
import { StoreSettings, DEFAULT_SETTINGS } from '@/lib/settings'
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
    <div className="space-y-5">
      {/* Género y Material en fila */}
      {(attrs.gender || attrs.material) && (
        <div className="flex flex-wrap gap-3">
          {attrs.gender && (
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5">
              <Tag className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Género</p>
                <p className="text-sm font-semibold text-gray-700">{GENDER_LABELS[attrs.gender] ?? attrs.gender}</p>
              </div>
            </div>
          )}
          {attrs.material && (
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 flex-1 min-w-0">
              <div className="shrink-0 w-4 h-4 rounded-full bg-gray-300" />
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Material</p>
                <p className="text-sm font-semibold text-gray-700 truncate">{attrs.material}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Colores */}
      {hasColors && (
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Palette className="w-4 h-4 text-gray-400" />
            <p className="text-sm font-semibold text-gray-700">Colores disponibles</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {attrs.colors!.map((c) => (
              <span key={c} className="px-3.5 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-default">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tallas */}
      {hasSizes && (
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Ruler className="w-4 h-4 text-gray-400" />
            <p className="text-sm font-semibold text-gray-700">Tallas disponibles</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {attrs.sizes!.map((s) => (
              <span key={s} className="w-11 h-11 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:border-gray-400 hover:bg-gray-100 transition-all cursor-default">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Medidas */}
      {hasMeasurements && (
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Ruler className="w-4 h-4 text-gray-400" />
            <p className="text-sm font-semibold text-gray-700">Guía de medidas</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(attrs.measurements!).filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="bg-gray-50 rounded-xl px-3.5 py-2.5 border border-gray-100">
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium mb-0.5">{MEASUREMENT_LABELS[k] ?? k}</p>
                <p className="text-sm font-bold text-gray-700">{v}</p>
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
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
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
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => setSettings(data))
      .catch(() => {})
  }, [])

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
    for (let i = 0; i < quantity; i++) addItem(product)
    toast.success(`${product.name} agregado al carrito`)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 sp-border border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Producto no encontrado</h2>
          <Link href="/" className="sp-text hover:underline mt-2 inline-block">
            Volver a la tienda
          </Link>
        </div>
      </div>
    )
  }

  const isNegotiable = product.price_type === 'negotiable'
  const hasDiscount = !isNegotiable && product.was_price && product.was_price > product.price
  const discountPercent = hasDiscount ? Math.round((1 - product.price / product.was_price!) * 100) : 0
  const hasClothingAttrs = product.attributes && product.product_type !== 'general' && product.product_type !== 'electronica'

  return (
    <div className="min-h-screen bg-neutral-100 pb-28 md:pb-8">
      <StoreColorStyle color={settings.primary_color} />

      {/* ── Header ── */}
      <header className="sp-gradient-light sticky top-0 z-40 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Tienda</span>
          </Link>
          <CartButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 md:py-8">
        {/* ── Layout principal ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* ── Columna izquierda: Imagen ── */}
          <div className="md:col-span-7">
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="relative">
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
                {/* Badges sobre la imagen */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                  {product.category && (
                    <Badge variant="info" className="text-xs px-3 py-1 shadow-md backdrop-blur-sm">{product.category}</Badge>
                  )}
                  {hasDiscount && (
                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                      -{discountPercent}% OFF
                    </span>
                  )}
                  {product.stock === 0 && (
                    <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                      Agotado
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Columna derecha: Info ── */}
          <div className="md:col-span-5 flex flex-col gap-4">

            {/* Bloque principal: nombre + precio + CTA */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
              {/* Nombre */}
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight mb-4">
                {product.name}
              </h1>

              {/* Precio */}
              <div className="mb-5">
                {isNegotiable ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <p className="text-2xl font-bold text-amber-600">A convenir</p>
                    <p className="text-sm text-amber-600/70 mt-0.5">Contacta para acordar el precio</p>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <p className="text-3xl font-extrabold sp-text">{formatCurrency(product.price)}</p>
                    {hasDiscount && (
                      <>
                        <p className="text-lg text-gray-400 line-through">{formatCurrency(product.was_price!)}</p>
                        <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                          Ahorras {formatCurrency(product.was_price! - product.price)}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Disponibilidad */}
              <div className="flex items-center gap-2 mb-5">
                <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                {product.stock > 0 ? (
                  <span className="text-sm text-gray-600">
                    {product.stock > 10
                      ? 'Disponible'
                      : product.stock > 1
                      ? `Quedan ${product.stock} unidades`
                      : 'Última unidad'}
                  </span>
                ) : (
                  <span className="text-sm text-red-500 font-medium">Agotado</span>
                )}
              </div>

              {/* Selector de cantidad + Botón agregar (desktop) */}
              <div className="hidden md:block space-y-3">
                {product.stock > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">Cantidad:</span>
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="px-3 py-2 hover:bg-gray-50 transition-colors text-gray-600"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center text-sm font-bold text-gray-800">{quantity}</span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                        className="px-3 py-2 hover:bg-gray-50 transition-colors text-gray-600"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className={`w-full flex items-center justify-center gap-2.5 rounded-xl py-3.5 text-base font-bold transition-all duration-200 ${
                    added
                      ? 'sp-btn scale-[0.97]'
                      : product.stock === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'sp-btn hover:shadow-lg active:scale-[0.97]'
                  }`}
                >
                  {added ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                  {added ? 'Agregado' : product.stock === 0 ? 'Agotado' : 'Agregar al carrito'}
                </button>

                <div className="flex gap-2">
                  <Link href="/cart" className="flex-1">
                    <Button variant="outline" size="lg" className="w-full rounded-xl">
                      Ver carrito
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleShare(product)}
                    title="Compartir producto"
                    className="rounded-xl"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Beneficios */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                    <Truck className="w-4.5 h-4.5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Envío disponible</p>
                    <p className="text-xs text-gray-400">Consulta costos por WhatsApp</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Compra segura</p>
                    <p className="text-xs text-gray-400">Tu pedido es verificado</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4.5 h-4.5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Atención por WhatsApp</p>
                    <p className="text-xs text-gray-400">Respuesta rápida a tus dudas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Secciones debajo ── */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Descripción */}
          {product.description && (
            <div className={`${hasClothingAttrs ? 'md:col-span-7' : 'md:col-span-12'} bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6`}>
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-5 sp-bg rounded-full" />
                Descripción
              </h2>
              <div className="text-[15px] text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </div>
            </div>
          )}

          {/* Características (ropa/calzado/accesorio) */}
          {hasClothingAttrs && (
            <div className={`${product.description ? 'md:col-span-5' : 'md:col-span-12'} bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6`}>
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-5 sp-bg rounded-full" />
                Características
              </h2>
              <ClothingAttrs attrs={product.attributes} type={product.product_type} />
            </div>
          )}
        </div>
      </main>

      {/* ── Barra inferior fija (mobile) ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="px-4 py-3 flex items-center gap-3">
          {/* Precio resumido */}
          <div className="shrink-0">
            {isNegotiable ? (
              <p className="text-base font-bold text-amber-600">A convenir</p>
            ) : (
              <p className="text-lg font-extrabold sp-text">{formatCurrency(product.price)}</p>
            )}
            {hasDiscount && (
              <p className="text-xs text-gray-400 line-through">{formatCurrency(product.was_price!)}</p>
            )}
          </div>

          {/* Cantidad mobile */}
          {product.stock > 0 && (
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden shrink-0">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-2.5 py-2 hover:bg-gray-50 transition-colors text-gray-600"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-sm font-bold text-gray-800">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                className="px-2.5 py-2 hover:bg-gray-50 transition-colors text-gray-600"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Botón agregar mobile */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all duration-200 ${
              added
                ? 'sp-btn scale-[0.97]'
                : product.stock === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'sp-btn'
            }`}
          >
            {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
            {added ? 'Listo' : product.stock === 0 ? 'Agotado' : 'Agregar'}
          </button>

          {/* Compartir mobile */}
          <button
            onClick={() => handleShare(product)}
            className="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
