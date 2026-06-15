'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { Product } from '@/types'
import { StoreSettings, DEFAULT_SETTINGS } from '@/lib/settings'
import ProductCard from '@/components/store/ProductCard'
import CategoryFilter from '@/components/store/CategoryFilter'
import CartButton from '@/components/store/CartButton'
import SearchBar from '@/components/store/SearchBar'
import PromotionsBanner from '@/components/store/PromotionsBanner'
import LiveBanner from '@/components/store/LiveBanner'
import FloatingCart from '@/components/store/FloatingCart'
import FloatingWhatsApp from '@/components/store/FloatingWhatsApp'
import { StoreColorStyle } from '@/components/store/StoreColorStyle'
import { Store, Sparkles, ShieldCheck, Truck, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => setSettings(data))
      .catch(() => {})
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedCategory) params.set('category', selectedCategory)
    if (search) params.set('search', search)
    const res = await fetch(`/api/products?${params}`)
    const data = await res.json()
    setProducts(data)
    setLoading(false)
  }, [selectedCategory, search])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('store-products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => { fetchProducts() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchProducts])

  useEffect(() => {
    const unique = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[]
    setCategories(unique)
  }, [products])

  const hasLogo = !!settings.logo_url

  return (
    <div className="min-h-screen bg-gray-50">
      <StoreColorStyle color={settings.primary_color} />

      {/* ── HEADER ── */}
      <header className="sp-gradient sticky top-0 z-40 shadow-lg">
        {/* Fila 1: logo + nombre + carrito */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            {hasLogo ? (
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-white/30">
                <Image
                  src={settings.logo_url}
                  alt={settings.store_name}
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 ring-2 ring-white/30">
                <Store className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-base font-bold text-white truncate leading-tight">{settings.store_name}</h1>
              <p className="text-[11px] text-white/70 truncate hidden sm:block">Compra fácil por WhatsApp</p>
            </div>
          </div>
          <CartButton />
        </div>
        {/* Fila 2: buscador */}
        <div className="px-4 pb-3">
          <SearchBar value={search} onChange={setSearch} />
        </div>
      </header>

      {/* ── HERO DESKTOP ── */}
      <div className="hidden sm:block max-w-6xl mx-auto px-4 pt-8">
        <div className="sp-gradient rounded-3xl p-8 md:p-10 text-white relative overflow-hidden">
          {/* Decoraciones de fondo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white/5 rounded-full" />

          <div className="relative z-10 flex items-center gap-6">
            {hasLogo && (
              <div className="hidden md:flex w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm items-center justify-center shrink-0 ring-2 ring-white/20">
                <Image
                  src={settings.logo_url}
                  alt={settings.store_name}
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
            )}
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-2 leading-tight">{settings.welcome_title}</h2>
              <p className="text-white/80 text-base md:text-lg max-w-lg">{settings.welcome_subtitle}</p>
            </div>
          </div>

          {/* Badges de confianza */}
          <div className="relative z-10 flex flex-wrap gap-3 mt-6">
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Compra segura
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-medium">
              <Truck className="w-3.5 h-3.5" /> Envío rápido
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-medium">
              <Tag className="w-3.5 h-3.5" /> Mejores precios
            </div>
          </div>
        </div>
      </div>

      {/* ── HERO MÓVIL ── */}
      <div className="sm:hidden sp-gradient px-4 py-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10">
          <p className="text-white font-bold text-base leading-snug">{settings.welcome_title}</p>
          <p className="text-white/75 text-xs mt-1">{settings.welcome_subtitle}</p>
          {/* Mini badges móvil */}
          <div className="flex gap-2 mt-3">
            <span className="flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-1 text-[10px] font-medium text-white">
              <ShieldCheck className="w-3 h-3" /> Segura
            </span>
            <span className="flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-1 text-[10px] font-medium text-white">
              <Truck className="w-3 h-3" /> Rápido
            </span>
            <span className="flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-1 text-[10px] font-medium text-white">
              <Tag className="w-3 h-3" /> Precios
            </span>
          </div>
        </div>
      </div>

      {/* ── LIVE + PROMOCIONES ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-4 mt-4">
        <LiveBanner />
        <PromotionsBanner />
      </div>

      {/* ── CATEGORÍAS ── */}
      {categories.length > 0 && (
        <div className="sticky top-[109px] sm:top-0 sm:relative z-30 bg-gray-50/95 backdrop-blur-sm py-3 border-b border-gray-100 sm:border-none sm:py-0 sm:mb-6 sm:mt-2 sm:max-w-6xl sm:mx-auto">
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>
      )}

      {/* ── TÍTULO DE SECCIÓN ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-4 mt-4 mb-2 sm:mt-0 sm:mb-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 sp-text" />
          <h2 className="text-sm font-bold text-gray-800">
            {selectedCategory
              ? selectedCategory
              : search
                ? `Resultados para "${search}"`
                : 'Todos los productos'
            }
          </h2>
          <span className="text-xs text-gray-400 font-medium">
            {!loading && `(${products.length})`}
          </span>
        </div>
      </div>

      {/* ── GRID DE PRODUCTOS ── */}
      <main className="max-w-6xl mx-auto px-1.5 sm:px-4 py-2 sm:py-4 pb-32 sm:pb-10">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                <div className="aspect-[3/4] sm:aspect-square bg-gray-100 animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 rounded-full w-3/4 animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded-full w-1/2 animate-pulse" />
                  <div className="h-9 bg-gray-100 rounded-xl animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 sp-bg-soft rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🛍️</span>
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-1">Sin productos</h3>
            <p className="text-gray-400 text-sm">Vuelve pronto, estamos agregando más.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="hidden sm:block border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {hasLogo ? (
                <div className="w-8 h-8 rounded-lg overflow-hidden">
                  <Image src={settings.logo_url} alt={settings.store_name} width={32} height={32} className="object-contain" />
                </div>
              ) : (
                <div className="w-8 h-8 sp-bg rounded-lg flex items-center justify-center">
                  <Store className="w-4 h-4 text-white" />
                </div>
              )}
              <span className="font-semibold text-gray-700 text-sm">{settings.store_name}</span>
            </div>
            <p className="text-sm text-gray-400">{settings.footer_text}</p>
          </div>
        </div>
      </footer>

      <FloatingWhatsApp phone={settings.whatsapp_contact_phone} />
      <FloatingCart />
    </div>
  )
}
