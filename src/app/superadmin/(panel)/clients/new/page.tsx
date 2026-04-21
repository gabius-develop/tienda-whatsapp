'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function NewClientPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    whatsapp_phone: '',
    admin_email: '',
    mercadopago_access_token: '',
    feature_live: false,
    feature_competencia: false,
  })

  const handleChange = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Auto-generar slug desde el nombre
  const handleNameChange = (value: string) => {
    const slug = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    setForm((prev) => ({ ...prev, name: value, slug }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.slug) {
      toast.error('Nombre y slug son requeridos')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/superadmin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Error al crear cliente')
        return
      }

      toast.success('Cliente creado correctamente')
      router.push('/superadmin/clients')
    } catch {
      toast.error('Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/superadmin/clients" className="text-gray-500 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Nuevo cliente</h1>
          <p className="text-gray-500 text-sm mt-1">Crea una nueva tienda para un cliente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos básicos */}
        <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
          <h2 className="text-white font-semibold">Datos del cliente</h2>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-400">Nombre del negocio</label>
            <input
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej: Tienda de Ropa Laura"
              required
              className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-400">Slug (subdominio)</label>
            <div className="flex items-center gap-2">
              <input
                value={form.slug}
                onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="tienda-laura"
                required
                className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
              />
            </div>
            <p className="text-xs text-gray-600">
              La tienda estará en: <span className="text-purple-400 font-mono">{form.slug || 'slug'}.tudominio.com</span>
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-400">Email del administrador</label>
            <input
              type="email"
              value={form.admin_email}
              onChange={(e) => handleChange('admin_email', e.target.value)}
              placeholder="admin@ejemplo.com"
              className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-600">Email con el que el cliente accede al panel admin</p>
          </div>
        </section>

        {/* WhatsApp */}
        <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
          <h2 className="text-white font-semibold">WhatsApp Business</h2>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-400">Número de WhatsApp</label>
            <input
              value={form.whatsapp_phone}
              onChange={(e) => handleChange('whatsapp_phone', e.target.value)}
              placeholder="521XXXXXXXXXX"
              className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
            />
            <p className="text-xs text-gray-600">Con código de país, sin + (ej: 521XXXXXXXXXX para México)</p>
          </div>
        </section>

        {/* MercadoPago */}
        <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
          <h2 className="text-white font-semibold">MercadoPago</h2>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-400">Access Token</label>
            <input
              type="password"
              value={form.mercadopago_access_token}
              onChange={(e) => handleChange('mercadopago_access_token', e.target.value)}
              placeholder="APP_USR-... o TEST-..."
              className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
            />
            <p className="text-xs text-gray-600">
              En MercadoPago → Tu negocio → Credenciales → Access Token de producción
            </p>
          </div>
        </section>

        {/* Funcionalidades */}
        <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
          <h2 className="text-white font-semibold">Funcionalidades activas</h2>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-white">En Vivo</p>
              <p className="text-xs text-gray-500 mt-0.5">Transmisiones de YouTube en la tienda</p>
            </div>
            <div
              onClick={() => handleChange('feature_live', !form.feature_live)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                form.feature_live ? 'bg-red-600' : 'bg-gray-700'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                form.feature_live ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </div>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-white">Competencia</p>
              <p className="text-xs text-gray-500 mt-0.5">Comparador de precios con otras tiendas</p>
            </div>
            <div
              onClick={() => handleChange('feature_competencia', !form.feature_competencia)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                form.feature_competencia ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                form.feature_competencia ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </div>
          </label>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Creando...' : 'Crear cliente'}
        </button>
      </form>
    </div>
  )
}
