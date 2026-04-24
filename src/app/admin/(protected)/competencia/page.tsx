'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, TrendingDown, TrendingUp, Minus, ExternalLink, ShoppingCart, Tag, Store } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Badge from '@/components/ui/Badge'

interface CompetitorProduct {
  id: string
  item_id: string
  name: string
  price: number
  was_price: number | null
  url: string | null
  image: string | null
  rating: number | null
  reviews: number | null
  site: string
  scraped_at: string
}

const SITE_LABELS: Record<string, string> = {
  sams_mx: "Sam's Club",
  walmart_mx: 'Walmart',
  mercadolibre_mx: 'Mercado Libre',
  aurrera_mx: 'Bodega Aurrera',
  catalogo_excel: 'Catálogo',
}

const SITE_COLORS: Record<string, string> = {
  sams_mx: 'bg-blue-100 text-blue-700',
  walmart_mx: 'bg-yellow-100 text-yellow-700',
  mercadolibre_mx: 'bg-orange-100 text-orange-700',
  aurrera_mx: 'bg-green-100 text-green-700',
  catalogo_excel: 'bg-gray-100 text-gray-700',
}

const ALL_SITES = ['all', 'sams_mx', 'walmart_mx', 'aurrera_mx', 'mercadolibre_mx']

export default function CompetenciaPage() {
  const [products, setProducts] = useState<CompetitorProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [site, setSite] = useState('all')
  const [onlyDeals, setOnlyDeals] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (site !== 'all') params.set('site', site)
      if (search) params.set('search', search)
      if (onlyDeals) params.set('deals', 'true')

      const res = await fetch(`/api/admin/competencia?${params}`)
      const text = await res.text()

      let data: unknown
      try {
        data = JSON.parse(text)
      } catch {
        console.error('Respuesta no-JSON:', text.slice(0, 200))
        setError(`Error del servidor (${res.status})`)
        setProducts([])
        return
      }

      if (!res.ok) {
        const msg = (data as { error?: string })?.error ?? `Error ${res.status}`
        setError(msg)
        setProducts([])
        return
      }

      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de red')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [site, search, onlyDeals])

  useEffect(() => {
    const timeout = setTimeout(fetchData, 300)
    return () => clearTimeout(timeout)
  }, [fetchData])

  const deals = products.filter(p => p.was_price && p.was_price > p.price)
  const stores = new Set(products.map(p => p.site)).size

  const getDiscount = (price: number, wasPrice: number) =>
    Math.round((1 - price / wasPrice) * 100)

  const buildPublishUrl = (p: CompetitorProduct) => {
    const params = new URLSearchParams({ name: p.name, price: String(p.price) })
    if (p.image) params.set('image', p.image)
    if (p.was_price && p.was_price > p.price) params.set('was_price', String(p.was_price))
    return `/admin/products/new?${params}`
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Precios de Competencia</h1>
        <p className="text-gray-500 text-sm mt-1">
          Productos scrapeados de Sam's Club, Walmart y Mercado Libre
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Productos monitoreados</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{products.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Con descuento activo</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{deals.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Tiendas monitoreadas</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{stores}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center border-b border-gray-50">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Only deals toggle */}
          <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
            <div
              onClick={() => setOnlyDeals(v => !v)}
              className={`relative w-9 h-5 rounded-full transition-colors ${onlyDeals ? 'bg-green-500' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${onlyDeals ? 'translate-x-4' : ''}`} />
            </div>
            <span className="text-sm text-gray-600 whitespace-nowrap">Solo ofertas</span>
          </label>
        </div>

        {/* Store tabs */}
        <div className="flex overflow-x-auto px-4 pt-3 pb-0 gap-1">
          {ALL_SITES.map(s => (
            <button
              key={s}
              onClick={() => setSite(s)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                site === s
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {s === 'all' ? 'Todas' : SITE_LABELS[s] ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Products table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-500 font-medium mb-1">Error al cargar datos</p>
            <p className="text-gray-400 text-sm">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
            >
              Reintentar
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Store className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {search || onlyDeals || site !== 'all'
                ? 'No se encontraron productos con esos filtros'
                : 'Aún no hay datos scrapeados. Ejecuta el scraper para ver precios aquí.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Producto</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Tienda</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Precio</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Antes</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Desc.</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-28">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map(p => {
                  const hasDiscount = p.was_price && p.was_price > p.price
                  const discount = hasDiscount ? getDiscount(p.price, p.was_price!) : null

                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      {/* Producto */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 max-w-xs">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {p.image ? (
                              <Image
                                src={p.image}
                                alt={p.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                                unoptimized
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-xl">📦</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 line-clamp-2 leading-tight">{p.name}</p>
                            {p.rating && (
                              <p className="text-xs text-gray-400 mt-0.5">⭐ {p.rating} {p.reviews ? `(${p.reviews})` : ''}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Tienda */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${SITE_COLORS[p.site] ?? 'bg-gray-100 text-gray-700'}`}>
                          {SITE_LABELS[p.site] ?? p.site}
                        </span>
                      </td>

                      {/* Precio actual */}
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${hasDiscount ? 'text-green-600' : 'text-gray-900'}`}>
                          {formatCurrency(p.price)}
                        </span>
                      </td>

                      {/* Precio anterior */}
                      <td className="px-4 py-3 text-right">
                        {p.was_price ? (
                          <span className="text-gray-400 line-through">{formatCurrency(p.was_price)}</span>
                        ) : (
                          <span className="text-gray-200">—</span>
                        )}
                      </td>

                      {/* Descuento */}
                      <td className="px-4 py-3 text-center">
                        {discount ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs font-bold">
                            <TrendingDown className="w-3 h-3" />
                            -{discount}%
                          </span>
                        ) : (
                          <Minus className="w-4 h-4 text-gray-200 mx-auto" />
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {p.url && (
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors"
                              title="Ver en tienda"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <Link
                            href={buildPublishUrl(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                            title="Publicar en mi tienda"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            Publicar
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {products.length > 0 && (
        <p className="text-xs text-gray-400 mt-3 text-right">{products.length} productos</p>
      )}
    </div>
  )
}
