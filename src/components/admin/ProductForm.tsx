'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, X, ImagePlus } from 'lucide-react'
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

function getInitialImages(product?: Product): string[] {
  if (product?.images && product.images.length > 0) return product.images
  if (product?.image_url) return [product.image_url]
  return []
}

export default function ProductForm({ product, onSuccess }: ProductFormProps) {
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<string[]>(getInitialImages(product))
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

  const uploadFile = async (file: File): Promise<string> => {
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) throw new Error('La imagen no puede pesar más de 5MB')

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
    if (!res.ok) throw new Error('Error al subir imagen')

    const { url } = await res.json()
    return url
  }

  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    // Limit to 8 images total
    const slotsLeft = 8 - images.length
    const toUpload = files.slice(0, slotsLeft)

    if (files.length > slotsLeft) {
      toast.error(`Puedes subir un máximo de 8 imágenes por producto`)
    }

    setUploading(true)
    try {
      const urls = await Promise.all(toUpload.map(uploadFile))
      setImages((prev) => [...prev, ...urls])
      toast.success(`${urls.length} imagen${urls.length > 1 ? 'es' : ''} subida${urls.length > 1 ? 's' : ''}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir imágenes')
    } finally {
      setUploading(false)
      // Reset input so the same file can be selected again
      e.target.value = ''
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: ProductFormOutput) => {
    setSaving(true)
    try {
      const payload = {
        ...data,
        image_url: images[0] ?? null,
        images: images.length > 0 ? images : null,
      }
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
      {/* Multi-image Upload */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Imágenes del producto
            <span className="ml-1 text-gray-400 font-normal">({images.length}/8)</span>
          </label>
          {images.length > 0 && (
            <span className="text-xs text-gray-400">La primera imagen es la principal</span>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Existing thumbnails */}
          {images.map((src, i) => (
            <div key={src + i} className="relative w-24 h-24 rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-50 flex-shrink-0">
              <Image src={src} alt={`Imagen ${i + 1}`} fill className="object-cover" sizes="96px" />
              {i === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-green-600/80 text-white text-[10px] text-center py-0.5">
                  Principal
                </div>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Add more button */}
          {images.length < 8 && (
            <label className={`relative w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors flex-shrink-0 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {uploading ? (
                <svg className="animate-spin h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  <ImagePlus className="w-6 h-6 text-gray-400" />
                  <span className="text-xs text-gray-400">Agregar</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleAddImages}
                disabled={uploading}
              />
            </label>
          )}

          {/* Empty state when no images */}
          {images.length === 0 && !uploading && (
            <p className="text-xs text-gray-400 self-center ml-1">
              Sube hasta 8 imágenes. PNG, JPG hasta 5MB cada una.
            </p>
          )}
        </div>

        {images.length === 0 && (
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-gray-400" />
            <p className="text-xs text-gray-500">PNG, JPG hasta 5MB por imagen</p>
          </div>
        )}
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
