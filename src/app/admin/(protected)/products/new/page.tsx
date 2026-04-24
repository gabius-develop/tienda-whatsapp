'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ProductForm from '@/components/admin/ProductForm'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function NewProductContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const prefill = {
    name: searchParams.get('name') ?? undefined,
    price: searchParams.get('price') ?? undefined,
    was_price: searchParams.get('was_price') ?? undefined,
    image_url: searchParams.get('image') ?? undefined,
  }

  const hasPrefill = Object.values(prefill).some(Boolean)

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={hasPrefill ? '/admin/competencia' : '/admin/products'}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo producto</h1>
          <p className="text-gray-500 text-sm mt-1">
            {hasPrefill ? 'Datos pre-llenados desde la competencia' : 'Completa los datos del producto'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <ProductForm
          prefill={prefill}
          onSuccess={() => router.push('/admin/products')}
        />
      </div>
    </div>
  )
}

export default function NewProductPage() {
  return (
    <Suspense>
      <NewProductContent />
    </Suspense>
  )
}
