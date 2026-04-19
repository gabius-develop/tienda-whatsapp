'use client'

import { useEffect, useState, useCallback } from 'react'
import { Product } from '@/types'
import { StoreSettings, DEFAULT_SETTINGS } from '@/lib/settings'
import ProductCard from '@/components/store/ProductCard'
import CategoryFilter from '@/components/store/CategoryFilter'
import CartButton from '@/components/store/CartButton'
import SearchBar from '@/components/store/SearchBar'
import PromotionsBanner from '@/components/store/PromotionsBanner'
import LiveBanner from '@/components/store/LiveBanner'
import FloatingCart from '@/components/store/FloatingCart'
import { Store } from 'lucide-react'
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── APP BAR (móvil) / Header (desktop) ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        {/* Fila 1: logo + carrito */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center shrink-0">
              <Store className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-base font-bold text-gray-900 truncate">{settings.store_name}</h1>
          </div>
          <CartButton />
        </div>
        {/* Fila 2: buscador siempre visible */}
        <div className="px-4 pb-3">
          <SearchBar value={search} onChange={setSearch} />
        </div>
      </header>

      {/* ── HERO: solo en desktop ── */}
      <div className="hidden sm:block max-w-6xl mx-auto px-4 pt-8">
        <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-8 mb-8 text-white">
          <h2 className="text-3xl font-bold mb-2">{settings.welcome_title}</h2>
          <p className="text-green-100">{settings.welcome_subtitle}</p>
        </div>
      </div>

      {/* ── HERO MÓVIL: banner compacto ── */}
      <div className="sm:hidden bg-gradient-to-r from-green-600 to-green-500 px-4 py-4">
        <p className="text-white font-semibold text-sm">{settings.welcome_title}</p>
        <p className="text-green-100 text-xs mt-0.5">{settings.welcome_subtitle}</p>
      </div>

      {/* ── LIVE + PROMOCIONES ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-4 mt-3">
        <LiveBanner />
        <PromotionsBanner />
      </div>

      {/* ── CATEGORÍAS ── */}
      {categories.length > 0 && (
        <div className="sticky top-[109px] sm:top-0 sm:relative z-30 bg-gray-50 py-3 border-b border-gray-100 sm:border-none sm:py-0 sm:mb-6 sm:mt-2 sm:max-w-6xl sm:mx-auto">
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>
      )}

      {/* ── GRID DE PRODUCTOS ── */}
      <main className="max-w-6xl mx-auto px-1.5 sm:px-4 py-2 sm:py-4 pb-32 sm:pb-10">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-72 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🛍️</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Sin productos</h3>
            <p className="text-gray-400 text-sm">Vuelve pronto, estamos agregando más.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <footer className="hidden sm:block text-center py-8 text-sm text-gray-400 border-t border-gray-100">
        <p>{settings.footer_text}</p>
      </footer>

      <FloatingCart />
    </div>
  )
}
