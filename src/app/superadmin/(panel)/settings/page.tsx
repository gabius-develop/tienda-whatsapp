'use client'

import { useEffect, useState } from 'react'
import { Save, Eye, RefreshCw, LogOut } from 'lucide-react'
import { StoreSettings, DEFAULT_SETTINGS } from '@/lib/settings'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SuperAdminSettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/superadmin/auth', { method: 'DELETE' })
    router.push('/superadmin/login')
  }

  const fetchSettings = async () => {
    setLoading(true)
    const res = await fetch('/api/settings')
    const data = await res.json()
    setSettings(data)
    setLoading(false)
  }

  useEffect(() => { fetchSettings() }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error()
      toast.success('Configuración guardada correctamente')
    } catch {
      toast.error('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key: keyof StoreSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Configuración de la tienda</h1>
          <p className="text-gray-500 text-sm mt-1">
            Estos cambios se reflejan inmediatamente en la tienda online
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchSettings}
            className="flex items-center gap-2 text-gray-400 hover:text-white px-3 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link href="/" target="_blank">
            <button className="flex items-center gap-2 text-gray-400 hover:text-white px-3 py-2 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors text-sm">
              <Eye className="w-4 h-4" />
              Ver tienda
            </button>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 hover:text-red-400 px-3 py-2 rounded-lg border border-red-900 hover:border-red-700 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Store Identity */}
          <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-white font-semibold mb-4">Identidad de la tienda</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-400">
                  Nombre de la tienda
                </label>
                <input
                  value={settings.store_name}
                  onChange={(e) => handleChange('store_name', e.target.value)}
                  placeholder="Mi Tienda Online"
                  className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-600">Aparece en el header y pestaña del navegador</p>
              </div>
            </div>
          </section>

          {/* Hero Section */}
          <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-white font-semibold mb-4">Sección de bienvenida (Hero)</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-400">Título de bienvenida</label>
                <input
                  value={settings.welcome_title}
                  onChange={(e) => handleChange('welcome_title', e.target.value)}
                  placeholder="Bienvenido a nuestra tienda"
                  className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-400">Subtítulo / descripción</label>
                <textarea
                  value={settings.welcome_subtitle}
                  onChange={(e) => handleChange('welcome_subtitle', e.target.value)}
                  placeholder="Los mejores productos al mejor precio..."
                  rows={2}
                  className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                />
              </div>
            </div>

            {/* Live Preview */}
            <div className="mt-4 rounded-xl bg-gradient-to-r from-green-600 to-green-500 p-6 text-white">
              <p className="text-xs text-green-200 mb-2 uppercase tracking-wider font-medium">Vista previa</p>
              <h3 className="text-xl font-bold">{settings.welcome_title || 'Título aquí'}</h3>
              <p className="text-green-100 text-sm mt-1">{settings.welcome_subtitle || 'Descripción aquí'}</p>
            </div>
          </section>

          {/* Footer */}
          <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-white font-semibold mb-4">Footer</h2>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-400">Texto del pie de página</label>
              <input
                value={settings.footer_text}
                onChange={(e) => handleChange('footer_text', e.target.value)}
                placeholder="Compra segura por WhatsApp Business"
                className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </section>

          <Button
            onClick={handleSave}
            loading={saving}
            size="lg"
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Save className="w-5 h-5" />
            Guardar todos los cambios
          </Button>
        </div>
      )}
    </div>
  )
}
