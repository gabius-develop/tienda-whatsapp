'use client'

import { useState, useEffect } from 'react'
import { KeyRound, Palette, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const PRESET_COLORS = [
  { name: 'Verde',    hex: '#16a34a' },
  { name: 'Azul',     hex: '#2563eb' },
  { name: 'Rojo',     hex: '#dc2626' },
  { name: 'Morado',   hex: '#9333ea' },
  { name: 'Naranja',  hex: '#ea580c' },
  { name: 'Cian',     hex: '#0891b2' },
  { name: 'Ámbar',    hex: '#d97706' },
  { name: 'Rosa',     hex: '#db2777' },
  { name: 'Índigo',   hex: '#4f46e5' },
  { name: 'Gris',     hex: '#374151' },
]

export default function AdminSettingsPage() {
  // ── Contraseña ──────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  // ── Color ────────────────────────────────────────────────────────────────
  const [primaryColor, setPrimaryColor] = useState('#16a34a')
  const [savingColor, setSavingColor] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((s) => {
        if (s.primary_color) setPrimaryColor(s.primary_color)
      })
      .catch(() => {})
  }, [])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) { toast.error('La contraseña debe tener al menos 8 caracteres'); return }
    if (newPassword !== confirm) { toast.error('Las contraseñas no coinciden'); return }

    setSavingPassword(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) { toast.error('No se pudo verificar tu sesión'); return }

      const { error: reAuthError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword })
      if (reAuthError) { toast.error('La contraseña actual es incorrecta'); return }

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) { toast.error(error.message ?? 'Error al cambiar la contraseña'); return }

      toast.success('Contraseña actualizada')
      setCurrentPassword(''); setNewPassword(''); setConfirm('')
    } catch {
      toast.error('Error inesperado')
    } finally {
      setSavingPassword(false)
    }
  }

  const handleSaveColor = async () => {
    setSavingColor(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primary_color: primaryColor }),
      })
      if (!res.ok) { toast.error('Error al guardar el color'); return }
      toast.success('Color actualizado — los cambios se verán en la tienda')
    } catch {
      toast.error('Error inesperado')
    } finally {
      setSavingColor(false)
    }
  }

  const inputClass = 'block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500'

  return (
    <div className="p-4 md:p-8 max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 text-sm mt-1">Personaliza tu tienda y gestiona tu cuenta</p>
      </div>

      {/* ── Color de la tienda ── */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Palette className="w-5 h-5 text-indigo-500" />
          <h2 className="font-semibold text-gray-900">Color principal de la tienda</h2>
        </div>

        {/* Vista previa */}
        <div className="rounded-xl p-4 mb-5 flex items-center gap-3 text-white text-sm font-medium"
          style={{ backgroundColor: primaryColor }}>
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-base">🛍️</div>
          <div>
            <p className="font-semibold">Vista previa</p>
            <p className="opacity-75 text-xs">{primaryColor}</p>
          </div>
          <button className="ml-auto text-xs bg-white/20 px-3 py-1 rounded-lg">Agregar</button>
        </div>

        {/* Colores predefinidos */}
        <p className="text-xs font-medium text-gray-500 mb-2">Colores predefinidos</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESET_COLORS.map(({ name, hex }) => (
            <button
              key={hex}
              onClick={() => setPrimaryColor(hex)}
              title={name}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                primaryColor === hex ? 'border-gray-800 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>

        {/* Picker personalizado */}
        <p className="text-xs font-medium text-gray-500 mb-2">Color personalizado</p>
        <div className="flex items-center gap-3 mb-5">
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
          />
          <input
            type="text"
            value={primaryColor}
            onChange={(e) => {
              const v = e.target.value
              if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setPrimaryColor(v)
            }}
            placeholder="#16a34a"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>

        <button
          onClick={handleSaveColor}
          disabled={savingColor}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm"
        >
          <Save className="w-4 h-4" />
          {savingColor ? 'Guardando...' : 'Guardar color'}
        </button>
      </div>

      {/* ── Cambiar contraseña ── */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <KeyRound className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-900">Cambiar contraseña</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Contraseña actual</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••" required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Nueva contraseña</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres" required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Confirmar nueva contraseña</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repite la nueva contraseña" required className={inputClass} />
          </div>
          <button type="submit" disabled={savingPassword}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm">
            <Save className="w-4 h-4" />
            {savingPassword ? 'Guardando...' : 'Guardar nueva contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
