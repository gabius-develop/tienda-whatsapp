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

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Suscripción en tiempo real a cambios en productos
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('store-products-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => { fetchProducts() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchProducts])

  useEffect(() => {
    const unique = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[]
    setCategories(unique)
  }, [products])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          {/* Fila superior: logo + carrito */}
          <div className="flex items-center justify-between gap-3 mb-2 sm:mb-0">
            <div className="flex items-center gap-2 min-w-0">
              <Store className="w-6 h-6 text-green-600 shrink-0" />
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{settings.store_name}</h1>
            </div>
            {/* Buscador solo visible en pantallas medianas+ en fila superior */}
            <div className="hidden sm:flex flex-1 max-w-sm">
              <SearchBar value={search} onChange={setSearch} />
            </div>
            <CartButton />
          </div>
          {/* Buscador en fila propia en móvil */}
          <div className="sm:hidden mt-2">
            <SearchBar value={search} onChange={setSearch} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Hero */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 text-white">
          <h2 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">{settings.welcome_title}</h2>
          <p className="text-sm sm:text-base text-green-100">{settings.welcome_subtitle}</p>
        </div>

        {/* Live banner */}
        <LiveBanner />

        {/* Promotions */}
        <PromotionsBanner />

        {/* Filters */}
        {categories.length > 0 && (
          <div className="mb-6">
            <CategoryFilter
              categories={categories}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-64 sm:h-72 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <div className="text-6xl mb-4">🛍️</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">No hay productos disponibles</h3>
            <p className="text-gray-500 text-sm sm:text-base">Vuelve pronto, estamos agregando más productos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-sm text-gray-400 border-t border-gray-100 mt-12">
        <p>{settings.footer_text}</p>
      </footer>

      <FloatingCart />
    </div>
  )
}
