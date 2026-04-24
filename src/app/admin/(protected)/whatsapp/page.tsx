'use client'

import { useState, useEffect } from 'react'
import { Bot, Save, Eye, EyeOff, Copy, CheckCircle, ExternalLink, Info } from 'lucide-react'
import toast from 'react-hot-toast'

interface BotConfig {
  phone_number_id: string
  access_token: string
  access_token_preview?: string
  verify_token: string
  is_active: boolean
  welcome_message: string
  menu_header: string
  orders_ask_phone: string
  support_message: string
  no_orders_message: string
}

const DEFAULT_CONFIG: BotConfig = {
  phone_number_id: '',
  access_token: '',
  verify_token: '',
  is_active: false,
  welcome_message: '¡Hola! 👋 Bienvenido a nuestra tienda. ¿En qué te puedo ayudar?',
  menu_header: '¿Qué deseas hacer?',
  orders_ask_phone: 'Por favor, ingresa el número de teléfono que usaste al hacer tu pedido (solo los dígitos):',
  support_message: '¡Gracias por contactarnos! 🙏 Un agente te atenderá en breve. Para una respuesta más rápida puedes escribirnos directamente.',
  no_orders_message: 'No encontramos pedidos con ese número. Verifica que sea el número correcto o intenta con otro.',
}

export default function WhatsAppBotPage() {
  const [config, setConfig] = useState<BotConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/whatsapp/webhook`)

    fetch('/api/admin/whatsapp')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.phone_number_id) {
          setConfig({
            phone_number_id:   data.phone_number_id   ?? '',
            access_token:      '',  // No precargamos el token por seguridad
            access_token_preview: data.access_token_preview,
            verify_token:      data.verify_token      ?? '',
            is_active:         data.is_active         ?? false,
            welcome_message:   data.welcome_message   ?? DEFAULT_CONFIG.welcome_message,
            menu_header:       data.menu_header        ?? DEFAULT_CONFIG.menu_header,
            orders_ask_phone:  data.orders_ask_phone  ?? DEFAULT_CONFIG.orders_ask_phone,
            support_message:   data.support_message   ?? DEFAULT_CONFIG.support_message,
            no_orders_message: data.no_orders_message ?? DEFAULT_CONFIG.no_orders_message,
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!config.phone_number_id.trim()) { toast.error('Phone Number ID es requerido'); return }
    if (!config.verify_token.trim())    { toast.error('Verify Token es requerido');    return }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/whatsapp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Error al guardar')
        return
      }
      toast.success('Configuración guardada')
      // Limpiar el campo de token
      setConfig((c) => ({ ...c, access_token: '' }))
    } catch {
      toast.error('Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl)
    toast.success('URL copiada')
  }

  const inputClass =
    'block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500'

  const textareaClass =
    'block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 resize-none'

  if (loading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bot className="w-7 h-7 text-green-600" />
          Bot de WhatsApp
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Respuestas automáticas con botones para tus clientes
        </p>
      </div>

      {/* ── Cómo funciona ── */}
      <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-green-700 mt-0.5 shrink-0" />
          <div className="text-sm text-green-800 space-y-1">
            <p className="font-semibold">¿Cómo funciona el bot?</p>
            <ul className="list-disc ml-4 space-y-1 text-green-700">
              <li>Cuando un cliente te escribe, el bot le responde automáticamente.</li>
              <li>Muestra un menú con <strong>3 botones</strong>: Ver productos, Mis pedidos, Soporte.</li>
              <li>El cliente puede ver tus productos y consultar el estado de sus pedidos sin que intervienes.</li>
              <li>Requiere cuenta de <strong>Meta Business</strong> con WhatsApp Business Cloud API activada.</li>
            </ul>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* ── Activar/Desactivar ── */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-semibold text-gray-900">Estado del bot</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {config.is_active ? '✅ Bot activo — responde automáticamente' : '⏸️ Bot desactivado'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfig((c) => ({ ...c, is_active: !c.is_active }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.is_active ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.is_active ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        </div>

        {/* ── Credenciales de la API ── */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900">Credenciales de Meta / WhatsApp Cloud API</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number ID
            </label>
            <input
              type="text"
              value={config.phone_number_id}
              onChange={(e) => setConfig((c) => ({ ...c, phone_number_id: e.target.value }))}
              placeholder="123456789012345"
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-1">
              Encuéntralo en: Meta for Developers → tu app → WhatsApp → API Setup → Phone Number ID
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Access Token (Token de acceso)
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={config.access_token}
                onChange={(e) => setConfig((c) => ({ ...c, access_token: e.target.value }))}
                placeholder={config.access_token_preview ? `Token guardado: ${config.access_token_preview} — escribe uno nuevo para cambiarlo` : 'EAAxxxxx...'}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Token temporal (para pruebas) o token permanente de sistema. Déjalo vacío para no cambiar el guardado.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verify Token (Token de verificación del webhook)
            </label>
            <input
              type="text"
              value={config.verify_token}
              onChange={(e) => setConfig((c) => ({ ...c, verify_token: e.target.value }))}
              placeholder="mi-token-secreto-123"
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-1">
              Cualquier texto que tú elijas. Debes poner el mismo valor al configurar el webhook en Meta.
            </p>
          </div>
        </div>

        {/* ── URL del Webhook ── */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-3">
          <h2 className="font-semibold text-gray-900">URL del Webhook</h2>
          <p className="text-sm text-gray-500">
            Configura esta URL en el panel de Meta para que WhatsApp envíe los mensajes a tu bot:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-xs font-mono text-gray-700 border border-gray-200 truncate">
              {webhookUrl}
            </code>
            <button
              type="button"
              onClick={copyWebhookUrl}
              className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-2 rounded-lg transition-colors shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              Copiar
            </button>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800 space-y-2">
            <p className="font-semibold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              Cómo configurar el webhook en Meta:
            </p>
            <ol className="list-decimal ml-5 space-y-1 text-blue-700 text-xs">
              <li>Ve a <strong>developers.facebook.com</strong> → tu app → WhatsApp → Configuration</li>
              <li>En <em>Webhook</em>, haz clic en <strong>Edit</strong></li>
              <li>Pega la URL del webhook de arriba en <em>Callback URL</em></li>
              <li>Pon tu <em>Verify Token</em> (el mismo que escribiste en el campo de arriba)</li>
              <li>Haz clic en <strong>Verify and Save</strong></li>
              <li>Suscríbete al campo <strong>messages</strong></li>
            </ol>
            <a
              href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs font-medium"
            >
              <ExternalLink className="w-3 h-3" />
              Guía oficial de Meta
            </a>
          </div>
        </div>

        {/* ── Mensajes del bot ── */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900">Mensajes del bot</h2>
          <p className="text-xs text-gray-400">
            Personaliza los mensajes que el bot envía automáticamente. Puedes usar emojis.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje de bienvenida
            </label>
            <textarea
              rows={2}
              value={config.welcome_message}
              onChange={(e) => setConfig((c) => ({ ...c, welcome_message: e.target.value }))}
              className={textareaClass}
            />
            <p className="text-xs text-gray-400 mt-1">Se envía antes de mostrar el menú principal.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Encabezado del menú principal
            </label>
            <input
              type="text"
              value={config.menu_header}
              onChange={(e) => setConfig((c) => ({ ...c, menu_header: e.target.value }))}
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-1">
              Texto que aparece sobre los 3 botones: 🛍️ Ver productos / 📦 Mis pedidos / 💬 Soporte.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje al pedir consulta de pedidos
            </label>
            <textarea
              rows={2}
              value={config.orders_ask_phone}
              onChange={(e) => setConfig((c) => ({ ...c, orders_ask_phone: e.target.value }))}
              className={textareaClass}
            />
            <p className="text-xs text-gray-400 mt-1">
              Se envía cuando el cliente toca "Mis pedidos". El cliente debe responder con su número de teléfono.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje de soporte
            </label>
            <textarea
              rows={2}
              value={config.support_message}
              onChange={(e) => setConfig((c) => ({ ...c, support_message: e.target.value }))}
              className={textareaClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje cuando no se encuentran pedidos
            </label>
            <textarea
              rows={2}
              value={config.no_orders_message}
              onChange={(e) => setConfig((c) => ({ ...c, no_orders_message: e.target.value }))}
              className={textareaClass}
            />
          </div>
        </div>

        {/* ── Guardar ── */}
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </form>
    </div>
  )
}
