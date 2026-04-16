'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Promotion } from '@/types'
import PromotionForm from '@/components/admin/PromotionForm'

export default function EditPromotionPage() {
  const { id } = useParams()
  const router = useRouter()
  const [promotion, setPromotion] = useState<Promotion | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/promotions/${id}`)
      .then((r) => r.json())
      .then((data) => { setPromotion(data); setLoading(false) })
  }, [id])

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/promotions" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar promoción</h1>
          <p className="text-gray-500 text-sm mt-1">Modifica los datos de la promoción</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : promotion ? (
          <PromotionForm promotion={promotion} onSuccess={() => router.push('/admin/promotions')} />
        ) : (
          <p className="text-gray-500">Promoción no encontrada</p>
        )}
      </div>
    </div>
  )
}
