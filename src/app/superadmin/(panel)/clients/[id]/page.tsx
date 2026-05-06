'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, RefreshCw, Copy, KeyRound, ExternalLink, LayoutDashboard, Trash2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface TenantForm {
  name: string
  whatsapp_phone: string
  admin_email: string
  mercadopago_access_token: string
  feature_live: boolean
  feature_competencia: boolean
  feature_mandadito: boolean
  feature_mercadopago: boolean
  is_active: boolean
}

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [newTempPassword, setNewTempPassword] = useState<string | null>(null)
  const [slug, setSlug] = useState('')
  const [form, setForm] = useState<TenantForm>({
    name: '',
    whatsapp_phone: '',
    admin_email: '',
    mercadopago_access_token: '',
    feature_live: false,
    feature_competencia: false,
    feature_mandadito: false,
    feature_mercadopago: false,
    is_active: true,
  })

  const fetchTenant = async () => {
    setLoading(true)
    const res = await fetch(`/api/superadmin/tenants/${id}`)
    if (res.ok) {
      const data = await res.json()
      setSlug(data.slug)
      setForm({
        name: data.name,
        whatsapp_phone: data.whatsapp_phone ?? '',
        admin_email: data.admin_email ?? '',
        mercadopago_access_token: data.mercadopago_access_token ?? '',
        feature_live: data.feature_live,
        feature_competencia: data.feature_competencia,
        feature_mandadito: data.feature_mandadito ?? false,
        feature_mercadopago: data.feature_mercadopago ?? false,
        is_active: data.is_active,
      })
    } else {
      toast.error('Cliente no encontrado')
      router.push('/superadmin/clients')
    }
    setLoading(false)
  }

  useEffect(() => { fetchTenant() }, [id])

  const handleChange = (key: keyof TenantForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/superadmin/tenants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          whatsapp_phone: form.whatsapp_phone || null,
          admin_email: form.admin_email || null,
          mercadopago_access_token: form.mercadopago_access_token || null,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Error al guardar')
        return
      }

      toast.success('Cambios guardados')
    } catch {
      toast.error('Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async () => {
    if (!confirm(`¿Generar nueva contraseña temporal para ${form.admin_email}?`)) return
    setResettingPassword(true)
    try {
      const res = await fetch(`/api/superadmin/tenants/${id}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Error al resetear contraseña')
        return
      }
      setNewTempPassword(data.temp_password)
      toast.success('Contraseña reseteada correctamente')
    } catch {
      toast.error('Error inesperado')
    } finally {
      setResettingPassword(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = confirm(
      `¿ELIMINAR PERMANENTEMENTE la cuenta de "${form.name}"?\n\nEsto borrará todos los productos, órdenes, promociones y el usuario de acceso. Esta acción NO se puede deshacer.`
    )
    if (!confirmed) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/superadmin/tenants/${id}?permanent=true`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Error al eliminar')
        return
      }
      toast.success(`Cuenta "${form.name}" eliminada permanentemente`)
      router.push('/superadmin/clients')
    } catch {
      toast.error('Error inesperado')
    } finally {
      setDeleting(false)
    }
  }

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado')
  }

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN
  const adminUrl = appDomain
    ? `https://${appDomain}/admin/login?tenant=${slug}`
    : `http://localhost:3000/admin/login?tenant=${slug}`
  const storeUrl = appDomain
    ? `https://${appDomain}/s/${slug}`
    : `http://localhost:3000/s/${slug}`

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/superadmin/clients" className="text-gray-500 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{form.name}</h1>
            <p className="text-purple-400 text-sm font-mono mt-0.5">slug: {slug}</p>
          </div>
        </div>
        <button
          onClick={fetchTenant}
          className="text-gray-500 hover:text-white p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Datos básicos */}
        <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
          <h2 className="text-white font-semibold">Datos del cliente</h2>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-400">Nombre del negocio</label>
            <input
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
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
              MercadoPago → Tu negocio → Credenciales → Access Token de producción
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
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
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
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                form.feature_competencia ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                form.feature_competencia ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </div>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-white">Mandaditos</p>
              <p className="text-xs text-gray-500 mt-0.5">Botón de mandaditos en el bot de WhatsApp</p>
            </div>
            <div
              onClick={() => handleChange('feature_mandadito', !form.feature_mandadito)}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                form.feature_mandadito ? 'bg-orange-500' : 'bg-gray-700'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                form.feature_mandadito ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </div>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-white">Pago con MercadoPago</p>
              <p className="text-xs text-gray-500 mt-0.5">Permite pagar órdenes con MercadoPago</p>
            </div>
            <div
              onClick={() => handleChange('feature_mercadopago', !form.feature_mercadopago)}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                form.feature_mercadopago ? 'bg-sky-500' : 'bg-gray-700'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                form.feature_mercadopago ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </div>
          </label>
        </section>

        {/* Estado de la cuenta */}
        <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-white font-semibold mb-4">Estado de la cuenta</h2>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-white">Cuenta activa</p>
              <p className="text-xs text-gray-500 mt-0.5">Si se desactiva, la tienda deja de funcionar</p>
            </div>
            <div
              onClick={() => handleChange('is_active', !form.is_active)}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                form.is_active ? 'bg-green-600' : 'bg-gray-700'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                form.is_active ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </div>
          </label>
        </section>

        {/* Accesos */}
        <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-3">
          <h2 className="text-white font-semibold">Accesos del cliente</h2>

          <div className="flex items-center justify-between gap-3 bg-gray-800 rounded-xl px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> Tienda pública
              </p>
              <p className="text-green-300 text-sm font-mono truncate">{storeUrl}</p>
            </div>
            <button onClick={() => copy(storeUrl)} className="text-gray-500 hover:text-white flex-shrink-0">
              <Copy className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 bg-gray-800 rounded-xl px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                <LayoutDashboard className="w-3 h-3" /> Panel de administración
              </p>
              <p className="text-purple-300 text-sm font-mono truncate">{adminUrl}</p>
            </div>
            <button onClick={() => copy(adminUrl)} className="text-gray-500 hover:text-white flex-shrink-0">
              <Copy className="w-4 h-4" />
            </button>
          </div>

          {form.admin_email && (
            <div className="flex items-center justify-between gap-3 bg-gray-800 rounded-xl px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">Email admin</p>
                <p className="text-white text-sm font-mono">{form.admin_email}</p>
              </div>
              <button onClick={() => copy(form.admin_email)} className="text-gray-500 hover:text-white flex-shrink-0">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}

          {newTempPassword && (
            <div className="flex items-center justify-between gap-3 bg-yellow-950 border border-yellow-800 rounded-xl px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs text-yellow-600 mb-0.5">Nueva contraseña temporal</p>
                <p className="text-yellow-300 text-sm font-mono">{newTempPassword}</p>
              </div>
              <button onClick={() => copy(newTempPassword)} className="text-yellow-600 hover:text-yellow-300 flex-shrink-0">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}

          {form.admin_email && (
            <button
              onClick={handleResetPassword}
              disabled={resettingPassword}
              className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 hover:text-white font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
            >
              <KeyRound className="w-4 h-4" />
              {resettingPassword ? 'Generando...' : 'Generar nueva contraseña'}
            </button>
          )}
        </section>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>

        {/* Zona de peligro */}
        <section className="bg-gray-900 rounded-2xl p-6 border border-red-900/50 space-y-3">
          <h2 className="text-red-400 font-semibold">Zona de peligro</h2>
          <p className="text-sm text-gray-500">
            Eliminar la cuenta borra permanentemente todos los productos, órdenes, promociones y el usuario de acceso. Esta acción no se puede deshacer.
          </p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 bg-red-950 hover:bg-red-900 disabled:opacity-50 text-red-400 hover:text-red-300 font-medium py-2.5 px-4 rounded-xl transition-colors text-sm border border-red-800"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Eliminando...' : 'Eliminar cuenta permanentemente'}
          </button>
        </section>
      </div>
    </div>
  )
}
