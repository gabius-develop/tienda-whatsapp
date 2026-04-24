'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Pencil, Trash2, Megaphone, Eye, EyeOff } from 'lucide-react'
import { Promotion } from '@/types'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const BADGE_BG: Record<string, string> = {
  green: 'bg-green-500', red: 'bg-red-500', yellow: 'bg-yellow-500',
  blue: 'bg-blue-500', purple: 'bg-purple-500', orange: 'bg-orange-500',
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchPromotions = async () => {
    const res = await fetch('/api/promotions?all=true')
    const data = await res.json()
    setPromotions(data)
    setLoading(false)
  }

  useEffect(() => { fetchPromotions() }, [])

  const handleToggle = async (promotion: Promotion) => {
    setToggling(promotion.id)
    const res = await fetch(`/api/promotions/${promotion.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !promotion.is_active }),
    })
    if (res.ok) {
      setPromotions((prev) =>
        prev.map((p) => p.id === promotion.id ? { ...p, is_active: !p.is_active } : p)
      )
      toast.success(promotion.is_active ? 'Promoción pausada' : 'Promoción activada')
    } else {
      toast.error('Error al actualizar')
    }
    setToggling(null)
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar "${title}"?`)) return
    setDeleting(id)
    const res = await fetch(`/api/promotions/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPromotions((prev) => prev.filter((p) => p.id !== id))
      toast.success('Promoción eliminada')
    } else {
      toast.error('Error al eliminar')
    }
    setDeleting(null)
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promociones</h1>
          <p className="text-gray-500 text-sm mt-1">{promotions.length} promociones en total</p>
        </div>
        <Link href="/admin/promotions/new">
          <Button><Plus className="w-4 h-4" /> Nueva promoción</Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-40 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : promotions.length === 0 ? (
        <div className="text-center py-20">
          <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Sin promociones</h3>
          <p className="text-gray-500 mb-6">Crea tu primera promoción para mostrarla en la tienda</p>
          <Link href="/admin/promotions/new">
            <Button><Plus className="w-4 h-4" /> Crear promoción</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promotions.map((promo) => (
            <div key={promo.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-opacity ${promo.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}>
              {/* Image */}
              {promo.image_url && (
                <div className="relative h-32 bg-gray-100">
                  <Image src={promo.image_url} alt={promo.title} fill className="object-cover" />
                  {promo.discount_label && (
                    <span className={`absolute top-2 right-2 text-white text-xs font-bold px-2 py-1 rounded-full ${BADGE_BG[promo.badge_color] ?? 'bg-green-500'}`}>
                      {promo.discount_label}
                    </span>
                  )}
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{promo.title}</h3>
                  <Badge variant={promo.is_active ? 'success' : 'default'}>
                    {promo.is_active ? 'Activa' : 'Pausada'}
                  </Badge>
                </div>
                {promo.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">{promo.description}</p>
                )}
                <p className="text-xs text-gray-400 mb-3">Creada: {formatDate(promo.created_at)}</p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(promo)}
                    disabled={toggling === promo.id}
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {promo.is_active
                      ? <><EyeOff className="w-4 h-4" /> Pausar</>
                      : <><Eye className="w-4 h-4" /> Activar</>
                    }
                  </button>
                  <Link href={`/admin/promotions/${promo.id}`}>
                    <Button variant="ghost" size="sm"><Pencil className="w-4 h-4" /></Button>
                  </Link>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => handleDelete(promo.id, promo.title)}
                    loading={deleting === promo.id}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
