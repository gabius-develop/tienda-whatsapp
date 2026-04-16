'use client'

import { useEffect, useState, useCallback } from 'react'
import { Product } from '@/types'
import ProductCard from '@/components/store/ProductCard'
import CategoryFilter from '@/components/store/CategoryFilter'
import CartButton from '@/components/store/CartButton'
import SearchBar from '@/components/store/SearchBar'
import { Store } from 'lucide-react'

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    // Extract unique categories
    const unique = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[]
    setCategories(unique)
  }, [products])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Store className="w-7 h-7 text-green-600" />
            <h1 className="text-xl font-bold text-gray-900">Mi Tienda</h1>
          </div>
          <div className="flex-1 max-w-sm">
            <SearchBar value={search} onChange={setSearch} />
          </div>
          <CartButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-8 mb-8 text-white">
          <h2 className="text-3xl font-bold mb-2">Bienvenido a nuestra tienda</h2>
          <p className="text-green-100">Los mejores productos al mejor precio. ¡Compra fácil por WhatsApp!</p>
        </div>

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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-72 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🛍️</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay productos disponibles</h3>
            <p className="text-gray-500">Vuelve pronto, estamos agregando más productos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-sm text-gray-400 border-t border-gray-100 mt-12">
        <p>Compra segura por WhatsApp Business</p>
      </footer>
    </div>
  )
}
