'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, X, ImagePlus, Plus } from 'lucide-react'
import { Product, ProductType, ClothingAttributes } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import toast from 'react-hot-toast'
import Image from 'next/image'

const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: 'general',    label: 'General' },
  { value: 'ropa',       label: 'Ropa' },
  { value: 'calzado',    label: 'Calzado' },
  { value: 'accesorio',  label: 'Accesorio' },
  { value: 'electronica', label: 'Electrónica' },
]

const PRESET_SIZES_ROPA  = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
const PRESET_SIZES_CALZADO = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45']
const GENDERS = [
  { value: 'hombre', label: 'Hombre' },
  { value: 'mujer',  label: 'Mujer' },
  { value: 'unisex', label: 'Unisex' },
  { value: 'niño',   label: 'Niño' },
  { value: 'niña',   label: 'Niña' },
] as const

const productSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido'),
  description: z.string().optional(),
  price: z.string().transform((v) => parseFloat(v)).pipe(z.number().positive('El precio debe ser mayor a 0')),
  was_price: z.string().optional().transform((v) => (v && v !== '' ? parseFloat(v) : null)),
  category: z.string().optional(),
  stock: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().int().min(0, 'El stock no puede ser negativo')),
  is_active: z.boolean(),
})

type ProductFormValues = z.input<typeof productSchema>
type ProductFormOutput = z.output<typeof productSchema>

interface ProductFormProps {
  product?: Product
  prefill?: { name?: string; price?: string; was_price?: string; image_url?: string }
  onSuccess: () => void
}

function getInitialImages(product?: Product): string[] {
  if (product?.images && product.images.length > 0) return product.images
  if (product?.image_url) return [product.image_url]
  return []
}

export default function ProductForm({ product, prefill, onSuccess }: ProductFormProps) {
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<string[]>(
    getInitialImages(product) ?? (prefill?.image_url ? [prefill.image_url] : [])
  )
  const [saving, setSaving] = useState(false)

  // ── Tipo de producto ────────────────────────────────────────────────────
  const [productType, setProductType] = useState<ProductType>(product?.product_type ?? 'general')

  // ── Atributos de ropa/calzado ───────────────────────────────────────────
  const initAttrs = product?.attributes ?? {}
  const [selectedColors, setSelectedColors] = useState<string[]>(initAttrs.colors ?? [])
  const [colorInput, setColorInput] = useState('')
  const [selectedSizes, setSelectedSizes] = useState<string[]>(initAttrs.sizes ?? [])
  const [customSizeInput, setCustomSizeInput] = useState('')
  const [material, setMaterial] = useState(initAttrs.material ?? '')
  const [gender, setGender] = useState<ClothingAttributes['gender']>(initAttrs.gender)
  const [measurements, setMeasurements] = useState<ClothingAttributes['measurements']>(
    initAttrs.measurements ?? {}
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues, unknown, ProductFormOutput>({
    resolver: zodResolver(productSchema) as never,
    defaultValues: {
      name: product?.name ?? prefill?.name ?? '',
      description: product?.description ?? '',
      price: product?.price?.toString() ?? prefill?.price ?? '0',
      was_price: product?.was_price?.toString() ?? prefill?.was_price ?? '',
      category: product?.category ?? '',
      stock: product?.stock?.toString() ?? '0',
      is_active: product?.is_active ?? true,
    },
  })

  // ── Image upload ──────────────────────────────────────────────────────
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
    const slotsLeft = 8 - images.length
    const toUpload = files.slice(0, slotsLeft)
    if (files.length > slotsLeft) toast.error('Puedes subir un máximo de 8 imágenes por producto')
    setUploading(true)
    try {
      const urls = await Promise.all(toUpload.map(uploadFile))
      setImages((prev) => [...prev, ...urls])
      toast.success(`${urls.length} imagen${urls.length > 1 ? 'es' : ''} subida${urls.length > 1 ? 's' : ''}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir imágenes')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeImage = (index: number) => setImages((prev) => prev.filter((_, i) => i !== index))

  // ── Colors ────────────────────────────────────────────────────────────
  const addColor = () => {
    const v = colorInput.trim()
    if (!v || selectedColors.includes(v)) return
    setSelectedColors((prev) => [...prev, v])
    setColorInput('')
  }
  const removeColor = (c: string) => setSelectedColors((prev) => prev.filter((x) => x !== c))

  // ── Sizes ─────────────────────────────────────────────────────────────
  const toggleSize = (s: string) =>
    setSelectedSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  const addCustomSize = () => {
    const v = customSizeInput.trim()
    if (!v || selectedSizes.includes(v)) return
    setSelectedSizes((prev) => [...prev, v])
    setCustomSizeInput('')
  }

  // ── Measurements ──────────────────────────────────────────────────────
  const setMeasurement = (key: keyof NonNullable<ClothingAttributes['measurements']>, value: string) =>
    setMeasurements((prev) => ({ ...prev, [key]: value }))

  // ── Submit ────────────────────────────────────────────────────────────
  const onSubmit = async (data: ProductFormOutput) => {
    setSaving(true)
    try {
      const attributes: ClothingAttributes = {}
      if (productType === 'ropa' || productType === 'calzado' || productType === 'accesorio') {
        if (selectedColors.length) attributes.colors = selectedColors
        if (selectedSizes.length) attributes.sizes = selectedSizes
        if (material) attributes.material = material
        if (gender) attributes.gender = gender
        const hasM = Object.values(measurements ?? {}).some(Boolean)
        if (hasM) attributes.measurements = measurements
      }

      const payload = {
        ...data,
        image_url: images[0] ?? null,
        images: images.length > 0 ? images : null,
        product_type: productType,
        attributes,
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

  const presetSizes = productType === 'calzado' ? PRESET_SIZES_CALZADO : PRESET_SIZES_ROPA
  const showClothingAttrs = productType === 'ropa' || productType === 'calzado' || productType === 'accesorio'

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

      {/* Tipo de producto */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Tipo de producto</label>
        <div className="flex flex-wrap gap-2">
          {PRODUCT_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setProductType(value)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                productType === value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {label}
            </button>
          ))}
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
          label="Precio anterior / tachado"
          type="number"
          step="0.01"
          placeholder="Dejar vacío si no hay descuento"
          {...register('was_price')}
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

      {/* ── Atributos de ropa / calzado / accesorios ── */}
      {showClothingAttrs && (
        <div className="border border-indigo-100 rounded-2xl p-5 space-y-5 bg-indigo-50/40">
          <p className="text-sm font-semibold text-indigo-700">
            Características de {PRODUCT_TYPES.find(t => t.value === productType)?.label}
          </p>

          {/* Género */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Género</label>
            <div className="flex flex-wrap gap-2">
              {GENDERS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGender(gender === value ? undefined : value)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    gender === value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Colores */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Colores disponibles</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedColors.map((c) => (
                <span key={c} className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700">
                  {c}
                  <button type="button" onClick={() => removeColor(c)} className="text-gray-400 hover:text-red-500 ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColor() } }}
                placeholder="Ej. Rojo, Negro, Azul marino..."
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <button
                type="button"
                onClick={addColor}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tallas */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Tallas disponibles</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {presetSizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSize(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    selectedSizes.includes(s)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customSizeInput}
                onChange={(e) => setCustomSizeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSize() } }}
                placeholder="Talla personalizada..."
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <button
                type="button"
                onClick={addCustomSize}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {selectedSizes.filter(s => !presetSizes.includes(s)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedSizes.filter(s => !presetSizes.includes(s)).map((s) => (
                  <span key={s} className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700">
                    {s}
                    <button type="button" onClick={() => toggleSize(s)} className="text-gray-400 hover:text-red-500 ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Material */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Material / Composición</label>
            <input
              type="text"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="Ej. 100% algodón, Poliéster 80% Spandex 20%..."
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>

          {/* Medidas */}
          {productType === 'ropa' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Guía de medidas (opcional)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {([
                  { key: 'busto',   label: 'Busto / Pecho' },
                  { key: 'cintura', label: 'Cintura' },
                  { key: 'cadera',  label: 'Cadera' },
                  { key: 'largo',   label: 'Largo' },
                  { key: 'tiro',    label: 'Tiro / Entrepierna' },
                ] as const).map(({ key, label }) => (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">{label}</label>
                    <input
                      type="text"
                      value={measurements?.[key] ?? ''}
                      onChange={(e) => setMeasurement(key, e.target.value)}
                      placeholder="Ej. 90-95 cm"
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={saving} className="flex-1">
          {product ? 'Guardar cambios' : 'Crear producto'}
        </Button>
      </div>
    </form>
  )
}
