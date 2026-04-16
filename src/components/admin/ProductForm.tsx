'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, X } from 'lucide-react'
import { Product } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import toast from 'react-hot-toast'
import Image from 'next/image'

const productSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido'),
  description: z.string().optional(),
  price: z.string().transform((v) => parseFloat(v)).pipe(z.number().positive('El precio debe ser mayor a 0')),
  category: z.string().optional(),
  stock: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().int().min(0, 'El stock no puede ser negativo')),
  is_active: z.boolean(),
})

type ProductFormValues = z.input<typeof productSchema>
type ProductFormOutput = z.output<typeof productSchema>

interface ProductFormProps {
  product?: Product
  onSuccess: () => void
}

export default function ProductForm({ product, onSuccess }: ProductFormProps) {
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '')
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues, unknown, ProductFormOutput>({
    resolver: zodResolver(productSchema) as never,
    defaultValues: {
      name: product?.name ?? '',
      description: product?.description ?? '',
      price: product?.price?.toString() ?? '0',
      category: product?.category ?? '',
      stock: product?.stock?.toString() ?? '0',
      is_active: product?.is_active ?? true,
    },
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('La imagen no puede pesar más de 5MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Error al subir imagen')

      const { url } = await res.json()
      setImageUrl(url)
      toast.success('Imagen subida correctamente')
    } catch {
      toast.error('Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: ProductFormOutput) => {
    setSaving(true)
    try {
      const payload = { ...data, image_url: imageUrl }
      const url = product ? `/api/products/${product.id}` : '/api/products'
      const method = product ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Error al guardar')

      toast.success(product ? 'Producto actualizado' : 'Producto creado')
      onSuccess()
    } catch {
      toast.error('Error al guardar el producto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Image Upload */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Imagen del producto</label>
        <div className="flex gap-4 items-start">
          <div className="relative w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 flex-shrink-0">
            {imageUrl ? (
              <>
                <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <Upload className="w-8 h-8" />
              </div>
            )}
          </div>
          <div>
            <label className="cursor-pointer">
              <span className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 text-sm gap-1.5 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {uploading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Subiendo...
                  </>
                ) : 'Seleccionar imagen'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">PNG, JPG hasta 5MB</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Input
            label="Nombre del producto *"
            placeholder="Ej. Camiseta básica negra"
            error={errors.name?.message}
            {...register('name')}
          />
        </div>

        <div className="md:col-span-2">
          <Textarea
            label="Descripción"
            placeholder="Describe el producto..."
            rows={3}
            {...register('description')}
          />
        </div>

        <Input
          label="Precio (MXN) *"
          type="number"
          step="0.01"
          placeholder="0.00"
          error={errors.price?.message}
          {...register('price')}
        />

        <Input
          label="Stock disponible *"
          type="number"
          placeholder="0"
          error={errors.stock?.message}
          {...register('stock')}
        />

        <div className="md:col-span-2">
          <Input
            label="Categoría"
            placeholder="Ej. Ropa, Electrónica, Hogar..."
            {...register('category')}
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-3">
          <input
            type="checkbox"
            id="is_active"
            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
            {...register('is_active')}
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Producto activo (visible en la tienda)
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={saving} className="flex-1">
          {product ? 'Guardar cambios' : 'Crear producto'}
        </Button>
      </div>
    </form>
  )
}
