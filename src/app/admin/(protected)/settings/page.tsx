'use client'

import { useState, useEffect, useRef } from 'react'
import { KeyRound, MessageCircle, Palette, Save, ImagePlus, X, Store, Type } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
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

  // ── Logo ─────────────────────────────────────────────────────────────────
  const [logoUrl, setLogoUrl] = useState('')
  const [storeName, setStoreName] = useState('')
  const [welcomeTitle, setWelcomeTitle] = useState('')
  const [welcomeSubtitle, setWelcomeSubtitle] = useState('')
  const [savingBrand, setSavingBrand] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // ── WhatsApp contacto ───────────────────────────────────────────────────
  const [contactPhone, setContactPhone] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((s) => {
        if (s.primary_color) setPrimaryColor(s.primary_color)
        if (s.whatsapp_contact_phone) setContactPhone(s.whatsapp_contact_phone)
        if (s.logo_url) setLogoUrl(s.logo_url)
        if (s.store_name) setStoreName(s.store_name)
        if (s.welcome_title) setWelcomeTitle(s.welcome_title)
        if (s.welcome_subtitle) setWelcomeSubtitle(s.welcome_subtitle)
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

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('La imagen no puede superar 2 MB'); return }

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/upload?folder=logos', { method: 'POST', body: formData })
      if (!res.ok) { toast.error('Error al subir la imagen'); return }
      const { url } = await res.json()
      setLogoUrl(url)
      toast.success('Logo subido — recuerda guardar los cambios')
    } catch {
      toast.error('Error inesperado')
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  const handleSaveBrand = async () => {
    setSavingBrand(true)
    try {
      const payload: Record<string, string> = {}
      if (storeName) payload.store_name = storeName
      if (welcomeTitle) payload.welcome_title = welcomeTitle
      if (welcomeSubtitle) payload.welcome_subtitle = welcomeSubtitle
      payload.logo_url = logoUrl
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { toast.error('Error al guardar'); return }
      toast.success('Marca actualizada — los cambios se verán en la tienda')
    } catch {
      toast.error('Error inesperado')
    } finally {
      setSavingBrand(false)
    }
  }

  const handleSaveContactPhone = async () => {
    setSavingPhone(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp_contact_phone: contactPhone }),
      })
      if (!res.ok) { toast.error('Error al guardar el número'); return }
      toast.success('Número de WhatsApp actualizado')
    } catch {
      toast.error('Error inesperado')
    } finally {
      setSavingPhone(false)
    }
  }

  const inputClass = 'block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500'

  return (
    <div className="p-4 md:p-8 max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 text-sm mt-1">Personaliza tu tienda y gestiona tu cuenta</p>
      </div>

      {/* ── Marca de la tienda (logo + nombre + textos) ── */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Store className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-900">Marca de la tienda</h2>
        </div>

        {/* Logo */}
        <p className="text-xs font-medium text-gray-500 mb-2">Logo de la tienda</p>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden shrink-0">
            {logoUrl ? (
              <>
                <Image src={logoUrl} alt="Logo" fill className="object-contain p-1" />
                <button
                  onClick={() => setLogoUrl('')}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 z-10"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <ImagePlus className="w-6 h-6 text-gray-300" />
            )}
          </div>
          <div>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadLogo} />
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {uploadingLogo ? 'Subiendo...' : logoUrl ? 'Cambiar logo' : 'Subir logo'}
            </button>
            <p className="text-xs text-gray-400 mt-0.5">PNG o JPG, máximo 2 MB. Se mostrará junto al nombre.</p>
          </div>
        </div>

        {/* Nombre */}
        <div className="flex flex-col gap-1 mb-4">
          <label className="text-xs font-medium text-gray-500">Nombre de la tienda</label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="Mi Tienda"
            className={inputClass}
          />
        </div>

        {/* Título de bienvenida */}
        <div className="flex flex-col gap-1 mb-4">
          <label className="text-xs font-medium text-gray-500">Título de bienvenida</label>
          <input
            type="text"
            value={welcomeTitle}
            onChange={(e) => setWelcomeTitle(e.target.value)}
            placeholder="Bienvenido a nuestra tienda"
            className={inputClass}
          />
        </div>

        {/* Subtítulo */}
        <div className="flex flex-col gap-1 mb-5">
          <label className="text-xs font-medium text-gray-500">Subtítulo</label>
          <input
            type="text"
            value={welcomeSubtitle}
            onChange={(e) => setWelcomeSubtitle(e.target.value)}
            placeholder="Los mejores productos al mejor precio"
            className={inputClass}
          />
        </div>

        {/* Preview */}
        <div className="rounded-xl p-4 mb-5 flex items-center gap-3 text-white text-sm" style={{ backgroundColor: primaryColor }}>
          {logoUrl ? (
            <div className="w-10 h-10 rounded-xl bg-white/20 overflow-hidden shrink-0 flex items-center justify-center">
              <Image src={logoUrl} alt="Logo" width={32} height={32} className="object-contain" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0 text-lg">🛍️</div>
          )}
          <div className="min-w-0">
            <p className="font-bold truncate">{storeName || 'Mi Tienda'}</p>
            <p className="opacity-75 text-xs truncate">{welcomeTitle || 'Bienvenido a nuestra tienda'}</p>
          </div>
        </div>

        <button
          onClick={handleSaveBrand}
          disabled={savingBrand}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm"
        >
          <Save className="w-4 h-4" />
          {savingBrand ? 'Guardando...' : 'Guardar marca'}
        </button>
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

      {/* ── Número de WhatsApp de contacto ── */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-5 h-5 text-green-500" />
          <h2 className="font-semibold text-gray-900">Botón de WhatsApp</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Configura el número de WhatsApp que aparecerá como botón flotante en tu tienda para que los clientes puedan contactarte directamente.
        </p>

        <div className="flex flex-col gap-1 mb-4">
          <label className="text-sm font-medium text-gray-700">Número de WhatsApp</label>
          <input
            type="text"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value.replace(/[^0-9+]/g, ''))}
            placeholder="Ej: 59178901234"
            className={inputClass}
          />
          <p className="text-xs text-gray-400 mt-1">
            Incluye el código de país sin el signo +. Ejemplo: 59178901234
          </p>
        </div>

        <button
          onClick={handleSaveContactPhone}
          disabled={savingPhone}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm"
        >
          <Save className="w-4 h-4" />
          {savingPhone ? 'Guardando...' : 'Guardar número'}
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
