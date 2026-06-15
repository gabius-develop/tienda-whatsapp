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
import { Store, Sparkles, ShieldCheck, Truck, Tag, Headphones } from 'lucide-react'
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
    <div className="min-h-screen bg-neutral-100">
      <StoreColorStyle color={settings.primary_color} />

      {/* ── HEADER ── */}
      <header className="sp-gradient-light sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center gap-3 py-2.5 sm:py-3">
            {/* Logo + Name */}
            <div className="flex items-center gap-2.5 shrink-0">
              {hasLogo ? (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/25 overflow-hidden">
                  <Image src={settings.logo_url} alt={settings.store_name} width={40} height={40} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/25">
                  <Store className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="hidden sm:block">
                <h1 className="text-white font-bold text-base tracking-tight leading-none">{settings.store_name}</h1>
                <p className="text-white/60 text-[10px] font-medium mt-0.5">Compra fácil por WhatsApp</p>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-2xl">
              <SearchBar value={search} onChange={setSearch} />
            </div>

            {/* Cart */}
            <CartButton />
          </div>
        </div>
      </header>

      {/* ── HERO DESKTOP ── */}
      <div className="hidden sm:block max-w-7xl mx-auto px-4 lg:px-6 pt-6">
        <div className="sp-gradient rounded-3xl overflow-hidden relative">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
          <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2" />
          <div className="absolute bottom-1/4 right-1/4 w-20 h-20 bg-white/[0.03] rounded-full" />
          {/* Dot pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

          <div className="relative z-10 px-8 md:px-12 py-10 md:py-14 flex items-center gap-8">
            {hasLogo && (
              <div className="hidden md:flex w-24 h-24 lg:w-28 lg:h-28 rounded-2xl bg-white/15 backdrop-blur-sm items-center justify-center shrink-0 ring-2 ring-white/20 overflow-hidden shadow-2xl">
                <Image src={settings.logo_url} alt={settings.store_name} width={112} height={112} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-3">{settings.welcome_title}</h2>
              <p className="text-white/75 text-base md:text-lg max-w-xl leading-relaxed">{settings.welcome_subtitle}</p>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-2.5 mt-6">
                <div className="flex items-center gap-2 bg-white/[0.12] backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium text-white border border-white/10">
                  <Truck className="w-4 h-4" /> Envío rápido
                </div>
                <div className="flex items-center gap-2 bg-white/[0.12] backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium text-white border border-white/10">
                  <ShieldCheck className="w-4 h-4" /> Compra segura
                </div>
                <div className="flex items-center gap-2 bg-white/[0.12] backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium text-white border border-white/10">
                  <Tag className="w-4 h-4" /> Mejores precios
                </div>
                <div className="flex items-center gap-2 bg-white/[0.12] backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium text-white border border-white/10">
                  <Headphones className="w-4 h-4" /> Soporte 24/7
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── HERO MÓVIL ── */}
      <div className="sm:hidden sp-gradient-light relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative z-10 px-4 py-5">
          <p className="text-white font-bold text-lg tracking-tight leading-snug">{settings.welcome_title}</p>
          <p className="text-white/70 text-sm mt-1 leading-relaxed">{settings.welcome_subtitle}</p>
          <div className="flex gap-2 mt-3.5 overflow-x-auto scrollbar-none">
            <span className="flex items-center gap-1.5 bg-white/[0.12] border border-white/10 rounded-full px-3 py-1.5 text-[11px] font-semibold text-white whitespace-nowrap shrink-0">
              <Truck className="w-3 h-3" /> Envío rápido
            </span>
            <span className="flex items-center gap-1.5 bg-white/[0.12] border border-white/10 rounded-full px-3 py-1.5 text-[11px] font-semibold text-white whitespace-nowrap shrink-0">
              <ShieldCheck className="w-3 h-3" /> Compra segura
            </span>
            <span className="flex items-center gap-1.5 bg-white/[0.12] border border-white/10 rounded-full px-3 py-1.5 text-[11px] font-semibold text-white whitespace-nowrap shrink-0">
              <Tag className="w-3 h-3" /> Mejores precios
            </span>
          </div>
        </div>
      </div>

      {/* ── LIVE + PROMOCIONES ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 mt-5 sm:mt-6">
        <LiveBanner />
        <PromotionsBanner />
      </div>

      {/* ── CATEGORÍAS ── */}
      {categories.length > 0 && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 mt-5 sm:mt-6">
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>
      )}

      {/* ── TÍTULO + GRID DE PRODUCTOS ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 mt-5 sm:mt-6">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 sp-text" />
            <h2 className="text-base font-bold text-gray-800 tracking-tight">
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

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                <div className="aspect-square skeleton" />
                <div className="p-3 space-y-2.5">
                  <div className="h-3 skeleton rounded-full w-4/5" />
                  <div className="h-3 skeleton rounded-full w-3/5" />
                  <div className="h-5 skeleton rounded-full w-2/5 mt-1" />
                  <div className="h-10 skeleton rounded-xl mt-2" />
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3.5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Spacer for mobile floating cart */}
      <div className="h-24 sm:h-0" />

      {/* ── FOOTER ── */}
      <footer className="mt-12 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {hasLogo ? (
                <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-gray-200">
                  <Image src={settings.logo_url} alt={settings.store_name} width={36} height={36} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-9 h-9 sp-bg rounded-xl flex items-center justify-center">
                  <Store className="w-4 h-4 text-white" />
                </div>
              )}
              <div>
                <span className="font-bold text-gray-800 text-sm tracking-tight">{settings.store_name}</span>
                <p className="text-xs text-gray-400">Tu tienda de confianza</p>
              </div>
            </div>
            <p className="text-xs text-gray-400">{settings.footer_text}</p>
          </div>
        </div>
      </footer>

      <FloatingWhatsApp phone={settings.whatsapp_contact_phone} />
      <FloatingCart />
    </div>
  )
}
