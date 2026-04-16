'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, X } from 'lucide-react'
import { Promotion } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Image from 'next/image'
import toast from 'react-hot-toast'

const promotionSchema = z.object({
  title: z.string().min(2, 'El título es requerido'),
  description: z.string().optional(),
  discount_label: z.string().optional(),
  badge_color: z.string().default('green'),
  sort_order: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().int().min(0)),
  is_active: z.boolean(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
})

type PromotionFormValues = z.input<typeof promotionSchema>
type PromotionFormOutput = z.output<typeof promotionSchema>

const BADGE_COLORS = [
  { value: 'green', label: 'Verde', class: 'bg-green-500' },
  { value: 'red', label: 'Rojo', class: 'bg-red-500' },
  { value: 'yellow', label: 'Amarillo', class: 'bg-yellow-500' },
  { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
  { value: 'purple', label: 'Morado', class: 'bg-purple-500' },
  { value: 'orange', label: 'Naranja', class: 'bg-orange-500' },
]

interface PromotionFormProps {
  promotion?: Promotion
  onSuccess: () => void
}

export default function PromotionForm({ promotion, onSuccess }: PromotionFormProps) {
  const [imageUrl, setImageUrl] = useState(promotion?.image_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PromotionFormValues, unknown, PromotionFormOutput>({
    resolver: zodResolver(promotionSchema) as never,
    defaultValues: {
      title: promotion?.title ?? '',
      description: promotion?.description ?? '',
      discount_label: promotion?.discount_label ?? '',
      badge_color: promotion?.badge_color ?? 'green',
      sort_order: promotion?.sort_order?.toString() ?? '0',
      is_active: promotion?.is_active ?? true,
      starts_at: promotion?.starts_at ? promotion.starts_at.slice(0, 16) : '',
      ends_at: promotion?.ends_at ? promotion.ends_at.slice(0, 16) : '',
    },
  })

  const selectedColor = watch('badge_color')

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagen máximo 5MB'); return }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error()
      const { url } = await res.json()
      setImageUrl(url)
      toast.success('Imagen subida')
    } catch {
      toast.error('Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: PromotionFormOutput) => {
    setSaving(true)
    try {
      const payload = {
        ...data,
        image_url: imageUrl || null,
        starts_at: data.starts_at || null,
        ends_at: data.ends_at || null,
        discount_label: data.discount_label || null,
        description: data.description || null,
      }

      const url = promotion ? `/api/promotions/${promotion.id}` : '/api/promotions'
      const method = promotion ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      toast.success(promotion ? 'Promoción actualizada' : 'Promoción creada')
      onSuccess()
    } catch {
      toast.error('Error al guardar la promoción')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Image */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Imagen de la promoción</label>
        <div className="flex gap-4 items-start">
          <div className="relative w-40 h-24 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 flex-shrink-0">
            {imageUrl ? (
              <>
                <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                <button type="button" onClick={() => setImageUrl('')}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <Upload className="w-6 h-6" />
              </div>
            )}
          </div>
          <div>
            <label className="cursor-pointer">
              <span className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 text-sm gap-1.5 ${uploading ? 'opacity-50' : ''}`}>
                {uploading ? 'Subiendo...' : 'Seleccionar imagen'}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
            <p className="text-xs text-gray-500 mt-2">PNG, JPG hasta 5MB. Recomendado: 800×400px</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Input label="Título de la promoción *" placeholder="Ej. ¡Gran Oferta de Verano!" error={errors.title?.message} {...register('title')} />
        </div>

        <div className="md:col-span-2">
          <Textarea label="Descripción" placeholder="Describe la promoción..." rows={2} {...register('description')} />
        </div>

        <Input label="Etiqueta de descuento" placeholder="Ej. 20% OFF, 2x1, GRATIS envío" {...register('discount_label')} />

        <Input label="Orden de aparición" type="number" min="0" placeholder="0" {...register('sort_order')} />

        {/* Badge Color */}
        <div className="md:col-span-2 flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Color de la etiqueta</label>
          <div className="flex gap-2 flex-wrap">
            {BADGE_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setValue('badge_color', color.value)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 text-sm transition-colors ${
                  selectedColor === color.value ? 'border-gray-900' : 'border-transparent'
                }`}
              >
                <span className={`w-4 h-4 rounded-full ${color.class}`} />
                {color.label}
              </button>
            ))}
          </div>
        </div>

        <Input label="Fecha inicio (opcional)" type="datetime-local" {...register('starts_at')} />
        <Input label="Fecha fin (opcional)" type="datetime-local" {...register('ends_at')} />

        <div className="md:col-span-2 flex items-center gap-3">
          <input type="checkbox" id="is_active" className="w-4 h-4 text-green-600 rounded focus:ring-green-500" {...register('is_active')} />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Promoción activa (visible en la tienda)</label>
        </div>
      </div>

      <Button type="submit" loading={saving} className="w-full">
        {promotion ? 'Guardar cambios' : 'Crear promoción'}
      </Button>
    </form>
  )
}
