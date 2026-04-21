'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Radio, BarChart2, Phone, ExternalLink, Pencil, PowerOff, LayoutDashboard } from 'lucide-react'
import toast from 'react-hot-toast'

interface Tenant {
  id: string
  name: string
  slug: string
  whatsapp_phone: string | null
  feature_live: boolean
  feature_competencia: boolean
  is_active: boolean
  admin_email: string | null
  created_at: string
}

export default function ClientsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTenants = async () => {
    setLoading(true)
    const res = await fetch('/api/superadmin/tenants')
    if (res.ok) setTenants(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchTenants() }, [])

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`¿Desactivar la cuenta de "${name}"?`)) return
    const res = await fetch(`/api/superadmin/tenants/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success(`Cuenta "${name}" desactivada`)
      fetchTenants()
    } else {
      toast.error('Error al desactivar')
    }
  }

  const handleReactivate = async (id: string, name: string) => {
    const res = await fetch(`/api/superadmin/tenants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: true }),
    })
    if (res.ok) {
      toast.success(`Cuenta "${name}" reactivada`)
      fetchTenants()
    } else {
      toast.error('Error al reactivar')
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gestiona las tiendas de tus clientes
          </p>
        </div>
        <Link
          href="/superadmin/clients/new"
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo cliente
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <p className="mb-4">No hay clientes aún</p>
          <Link href="/superadmin/clients/new" className="text-purple-400 hover:text-purple-300 text-sm">
            Crear el primer cliente →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tenants.map((tenant) => (
            <div
              key={tenant.id}
              className={`bg-gray-900 border rounded-xl p-5 ${
                tenant.is_active ? 'border-gray-800' : 'border-gray-800 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-white font-semibold">{tenant.name}</h2>
                    {!tenant.is_active && (
                      <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
                        Inactivo
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="font-mono text-purple-400">
                      slug: {tenant.slug}
                    </span>

                    {tenant.whatsapp_phone ? (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {tenant.whatsapp_phone}
                      </span>
                    ) : (
                      <span className="text-yellow-600 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        Sin teléfono
                      </span>
                    )}

                    {tenant.admin_email && (
                      <span className="text-gray-600">{tenant.admin_email}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
                      tenant.feature_live
                        ? 'bg-red-950 text-red-400'
                        : 'bg-gray-800 text-gray-600'
                    }`}>
                      <Radio className="w-3 h-3" />
                      En Vivo
                    </span>
                    <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
                      tenant.feature_competencia
                        ? 'bg-blue-950 text-blue-400'
                        : 'bg-gray-800 text-gray-600'
                    }`}>
                      <BarChart2 className="w-3 h-3" />
                      Competencia
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={
                      process.env.NEXT_PUBLIC_APP_DOMAIN
                        ? `https://${process.env.NEXT_PUBLIC_APP_DOMAIN}/s/${tenant.slug}`
                        : `http://localhost:3000/s/${tenant.slug}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    title="Ver tienda"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <a
                    href={
                      process.env.NEXT_PUBLIC_APP_DOMAIN
                        ? `https://${process.env.NEXT_PUBLIC_APP_DOMAIN}/admin/login?tenant=${tenant.slug}`
                        : `http://localhost:3000/admin/login?tenant=${tenant.slug}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    title="Ir al panel admin"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                  </a>
                  <Link
                    href={`/superadmin/clients/${tenant.id}`}
                    className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  {tenant.is_active ? (
                    <button
                      onClick={() => handleDeactivate(tenant.id, tenant.name)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-950 rounded-lg transition-colors"
                      title="Desactivar"
                    >
                      <PowerOff className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReactivate(tenant.id, tenant.name)}
                      className="p-2 text-gray-500 hover:text-green-400 hover:bg-green-950 rounded-lg transition-colors"
                      title="Reactivar"
                    >
                      <PowerOff className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
