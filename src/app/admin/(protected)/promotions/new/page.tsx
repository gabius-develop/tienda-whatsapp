'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PromotionForm from '@/components/admin/PromotionForm'
import { useRouter } from 'next/navigation'

export default function NewPromotionPage() {
  const router = useRouter()
  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/promotions" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva promoción</h1>
          <p className="text-gray-500 text-sm mt-1">Crea una promoción para mostrar en la tienda</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <PromotionForm onSuccess={() => router.push('/admin/promotions')} />
      </div>
    </div>
  )
}
