'use client'

import { useEffect, useState } from 'react'
import { Radio, ShoppingCart, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Product } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { useCartStore } from '@/store/cartStore'
import { getWhatsAppUrl } from '@/lib/whatsapp'
import toast from 'react-hot-toast'

const JitsiEmbed = dynamic(() => import('@/components/live/JitsiEmbed'), { ssr: false })

interface LiveState {
  active: boolean
  room: string | null
  started_at: string | null
}

export default function LivePage() {
  const [live, setLive] = useState<LiveState | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [elapsed, setElapsed] = useState('')
  const addItem = useCartStore((s) => s.addItem)

  useEffect(() => {
    fetch('/api/live').then(r => r.json()).then(setLive)
    fetch('/api/products').then(r => r.json()).then((data: Product[]) =>
      setProducts(data.slice(0, 8))
    )

    const interval = setInterval(() => {
      fetch('/api/live').then(r => r.json()).then(setLive)
    }, 30_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!live?.active || !live.started_at) { setElapsed(''); return }
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(live.started_at!).getTime()) / 1000)
      const h = Math.floor(diff / 3600).toString().padStart(2, '0')
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0')
      const s = (diff % 60).toString().padStart(2, '0')
      setElapsed(`${h}:${m}:${s}`)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [live?.active, live?.started_at])

  const handleAddToCart = (product: Product) => {
    addItem(product)
    toast.success(`${product.name} agregado al carrito`)
  }

  const handleAskWhatsApp = (product: Product) => {
    const msg = `¡Hola! Vi "${product.name}" en la transmisión en vivo. ¿Puedes darme más información?`
    window.location.href = getWhatsAppUrl(process.env.NEXT_PUBLIC_WHATSAPP_PHONE!, msg)
  }

  if (!live) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!live.active) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <Radio className="w-12 h-12 text-gray-600" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Sin transmisión activa</h1>
        <p className="text-gray-500 mb-8">
          Aún no hay transmisión en vivo. Vuelve pronto o visita la tienda.
        </p>
        <Link
          href="/"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl font-medium transition-colors"
        >
          <ShoppingCart className="w-5 h-5" />
          Ver la tienda
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            EN VIVO
          </span>
          {elapsed && (
            <span className="text-gray-400 text-sm font-mono">{elapsed}</span>
          )}
        </div>
        <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
          Ver tienda →
        </Link>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Stream principal */}
        <div className="flex-1 bg-black min-h-[320px]">
          <JitsiEmbed
            room={live.room!}
            displayName="Cliente"
            isHost={false}
          />
        </div>

        {/* Panel de productos */}
        <aside className="w-full lg:w-80 bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800 flex-shrink-0">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-green-400" />
              Productos disponibles
            </h2>
            <p className="text-gray-500 text-xs mt-1">Compra mientras ves el live</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {products.map((product) => (
              <div key={product.id} className="bg-gray-800 rounded-xl p-3 flex gap-3">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                    📦
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{product.name}</p>
                  <p className="text-green-400 font-bold text-sm">{formatCurrency(product.price)}</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-1.5 px-2 rounded-lg transition-colors"
                    >
                      + Carrito
                    </button>
                    <button
                      onClick={() => handleAskWhatsApp(product)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3" />
                      WA
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-gray-800 flex-shrink-0">
            <Link
              href="/cart"
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition-colors text-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              Ver mi carrito
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
