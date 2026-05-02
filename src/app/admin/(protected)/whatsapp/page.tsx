'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Bot, Save, Eye, EyeOff, Copy, CheckCircle, ExternalLink, Info,
  ImagePlus, X, Plus, Trash2, ChevronDown, ChevronUp, GripVertical,
  Send, RefreshCw, FileText,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Emoji picker ─────────────────────────────────────────────────────────────

const EMOJIS = [
  '👋','😊','😃','😍','🤩','😎','😋','🤗','😇','🙂',
  '😉','🥳','💪','👍','👏','🙏','🤝','❤️','🔥','⭐',
  '✅','❌','⚠️','💯','🎉','🎊','💡','✨','💫','🌟',
  '📦','🛍️','💰','💳','🛒','🏷️','🎁','📋','📝','📣',
  '📱','💻','📞','💬','🔔','📍','🗓️','⏰','🚀','🔑',
  '🏪','🏠','🚚','📮','💌','🔖','📌','🔍','🆕','🆓',
]

function EmojiPickerDropdown({ onSelect }: { onSelect: (e: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="text-gray-400 hover:text-yellow-500 transition-colors text-base leading-none select-none"
        title="Insertar emoji"
      >
        😊
      </button>
      {open && (
        <div className="absolute bottom-7 right-0 z-30 bg-white border border-gray-200 rounded-xl shadow-xl p-2 w-60">
          <div className="grid grid-cols-10 gap-0.5 max-h-36 overflow-y-auto">
            {EMOJIS.map(e => (
              <button
                key={e}
                type="button"
                onClick={() => { onSelect(e); setOpen(false) }}
                className="text-lg p-0.5 rounded hover:bg-gray-100 transition-colors leading-tight"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface TextareaWithEmojiProps {
  value: string
  onValueChange: (v: string) => void
  placeholder?: string
  rows?: number
  className?: string
}

function TextareaWithEmoji({ value, onValueChange, placeholder, rows = 3, className }: TextareaWithEmojiProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const insertEmoji = useCallback((emoji: string) => {
    const el = ref.current
    const start = el ? el.selectionStart : value.length
    const end   = el ? el.selectionEnd   : value.length
    const next  = value.slice(0, start) + emoji + value.slice(end)
    onValueChange(next)
    requestAnimationFrame(() => {
      if (el) { el.focus(); el.selectionStart = el.selectionEnd = start + emoji.length }
    })
  }, [value, onValueChange])

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        onChange={e => onValueChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`${className ?? ''} pr-8`}
      />
      <div className="absolute bottom-2 right-2">
        <EmojiPickerDropdown onSelect={insertEmoji} />
      </div>
    </div>
  )
}

interface InputWithEmojiProps {
  value: string
  onValueChange: (v: string) => void
  placeholder?: string
  className?: string
  maxLength?: number
}

function InputWithEmoji({ value, onValueChange, placeholder, className, maxLength }: InputWithEmojiProps) {
  const ref = useRef<HTMLInputElement>(null)

  const insertEmoji = useCallback((emoji: string) => {
    const el = ref.current
    const start = el ? el.selectionStart ?? value.length : value.length
    const end   = el ? el.selectionEnd   ?? value.length : value.length
    const next  = value.slice(0, start) + emoji + value.slice(end)
    const trimmed = maxLength ? next.slice(0, maxLength) : next
    onValueChange(trimmed)
    requestAnimationFrame(() => {
      if (el) { el.focus(); el.selectionStart = el.selectionEnd = Math.min(start + emoji.length, trimmed.length) }
    })
  }, [value, onValueChange, maxLength])

  return (
    <div className="relative">
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={e => onValueChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
        placeholder={placeholder}
        className={`${className ?? ''} pr-8`}
      />
      <div className="absolute top-1/2 -translate-y-1/2 right-2">
        <EmojiPickerDropdown onSelect={insertEmoji} />
      </div>
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface BotConfig {
  phone_number_id:       string
  access_token:          string
  access_token_preview?: string
  verify_token:          string
  waba_id:               string
  is_active:             boolean
  is_restaurant:         boolean
  welcome_message:       string
  welcome_image_url:     string
  menu_header:           string
  orders_ask_phone:      string
  support_message:       string
  no_orders_message:     string
}

interface MetaTemplate {
  name:       string
  status:     string
  language:   string
  category:   string
  components: Array<{
    type:    string
    text?:   string
    example?: { body_text?: string[][]; header_text?: string[] }
  }>
}

type StepType = 'products' | 'orders' | 'support' | 'custom' | 'restaurant_menu' | 'promotions'

interface ChildStep {
  temp_id:           string
  id?:               string
  button_id?:        string
  button_title:      string
  response_text:     string
  response_image_url:string
  uploading?:        boolean
}

interface TopStep {
  temp_id:           string
  id?:               string
  button_id?:        string
  button_title:      string
  step_type:         StepType
  response_text:     string
  response_image_url:string
  uploading?:        boolean
  children:          ChildStep[]
  expanded:          boolean
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: BotConfig = {
  phone_number_id:   '',
  access_token:      '',
  verify_token:      '',
  waba_id:           '',
  is_active:         false,
  is_restaurant:     false,
  welcome_message:   '¡Hola! 👋 Bienvenido a nuestra tienda. ¿En qué te puedo ayudar?',
  welcome_image_url: '',
  menu_header:       '¿Qué deseas hacer?',
  orders_ask_phone:  'Por favor, ingresa el número de teléfono que usaste al hacer tu pedido (solo los dígitos):',
  support_message:   '¡Gracias por contactarnos! 🙏 Un agente te atenderá en breve. Para una respuesta más rápida puedes escribirnos directamente.',
  no_orders_message: 'No encontramos pedidos con ese número. Verifica que sea el número correcto o intenta con otro.',
}

const STEP_TYPE_OPTIONS: { value: StepType; label: string; desc: string }[] = [
  { value: 'products',        label: '🛍️ Ver productos',    desc: 'Muestra el top 5 de productos más populares' },
  { value: 'promotions',      label: '🎁 Promociones',       desc: 'Muestra las promociones activas del admin' },
  { value: 'restaurant_menu', label: '🍽️ Menú restaurante',  desc: 'Muestra categorías del menú con pedido en bot' },
  { value: 'orders',          label: '📦 Mis pedidos',        desc: 'Consulta de pedidos por teléfono' },
  { value: 'support',         label: '💬 Soporte',            desc: 'Pausa el bot para atención humana' },
  { value: 'custom',          label: '✏️ Personalizado',      desc: 'Respuesta y/o imagen a tu elección' },
]

function newTempId() {
  return Math.random().toString(36).slice(2)
}

// ─── Inline image uploader ────────────────────────────────────────────────────

interface ImageUploadProps {
  value:     string
  loading?:  boolean
  onChange:  (url: string) => void
  onUpload:  (file: File) => void
  label?:    string
}

function ImageUpload({ value, loading, onChange, onUpload, label }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      {label && <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>}
      {value ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="preview" className="h-24 w-auto rounded-lg border border-gray-200 object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <label
          className={`flex flex-col items-center justify-center gap-1.5 w-full h-24 rounded-xl border-2 border-dashed border-gray-200 hover:border-green-400 cursor-pointer transition-colors bg-gray-50 hover:bg-green-50 ${loading ? 'opacity-60 pointer-events-none' : ''}`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <ImagePlus className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-400">Subir imagen</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onUpload(file)
              e.target.value = ''
            }}
          />
        </label>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WhatsAppBotPage() {
  const [config, setConfig]       = useState<BotConfig>(DEFAULT_CONFIG)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [uploadingWelcome, setUploadingWelcome] = useState(false)

  // Flows state
  const [flows, setFlows]           = useState<TopStep[]>([])
  const [flowsLoading, setFlowsLoading] = useState(true)
  const [flowsSaving, setFlowsSaving]   = useState(false)

  // Templates state
  const [templates, setTemplates]               = useState<MetaTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<MetaTemplate | null>(null)
  const [templatePhone, setTemplatePhone]       = useState('')
  const [templateBodyParams, setTemplateBodyParams] = useState<string[]>([''])
  const [templateHeaderParams, setTemplateHeaderParams] = useState<string[]>([])
  const [templateManualName, setTemplateManualName]     = useState('')
  const [templateManualLang, setTemplateManualLang]     = useState('es_MX')
  const [sendingTemplate, setSendingTemplate]           = useState(false)

  // ── Load config & flows ──────────────────────────────────────────────────
  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/whatsapp/webhook`)

    fetch('/api/admin/whatsapp')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.phone_number_id) {
          setConfig({
            phone_number_id:      data.phone_number_id      ?? '',
            access_token:         '',
            access_token_preview: data.access_token_preview,
            verify_token:         data.verify_token         ?? '',
            waba_id:              data.waba_id              ?? '',
            is_active:            data.is_active            ?? false,
            welcome_message:      data.welcome_message      ?? DEFAULT_CONFIG.welcome_message,
            welcome_image_url:    data.welcome_image_url    ?? '',
            menu_header:          data.menu_header          ?? DEFAULT_CONFIG.menu_header,
            orders_ask_phone:     data.orders_ask_phone     ?? DEFAULT_CONFIG.orders_ask_phone,
            support_message:      data.support_message      ?? DEFAULT_CONFIG.support_message,
            no_orders_message:    data.no_orders_message    ?? DEFAULT_CONFIG.no_orders_message,
            is_restaurant:        data.is_restaurant        ?? false,
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    fetch('/api/admin/whatsapp/flows')
      .then((r) => r.json())
      .then((data: Array<{
        id: string; button_id: string; button_title: string; step_type: StepType
        response_text: string | null; response_image_url: string | null
        children: Array<{
          id: string; button_id: string; button_title: string
          response_text: string | null; response_image_url: string | null
        }>
      }>) => {
        if (Array.isArray(data)) {
          setFlows(data.map((s) => ({
            temp_id:           newTempId(),
            id:                s.id,
            button_id:         s.button_id,
            button_title:      s.button_title,
            step_type:         s.step_type,
            response_text:     s.response_text     ?? '',
            response_image_url:s.response_image_url ?? '',
            expanded:          false,
            children:          (s.children ?? []).map((c) => ({
              temp_id:           newTempId(),
              id:                c.id,
              button_id:         c.button_id,
              button_title:      c.button_title,
              response_text:     c.response_text     ?? '',
              response_image_url:c.response_image_url ?? '',
            })),
          })))
        }
      })
      .catch(() => {})
      .finally(() => setFlowsLoading(false))
  }, [])

  // ── Image upload helper ──────────────────────────────────────────────────
  async function uploadImage(file: File, folder = 'bot'): Promise<string | null> {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`/api/admin/upload?folder=${folder}`, { method: 'POST', body: form })
    if (!res.ok) {
      toast.error('Error al subir la imagen')
      return null
    }
    const { url } = await res.json()
    return url as string
  }

  // ── Save config ──────────────────────────────────────────────────────────
  const handleSaveConfig = async (e: React.FormEvent) => {
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
      setConfig((c) => ({ ...c, access_token: '' }))
    } catch {
      toast.error('Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  // ── Save flows ───────────────────────────────────────────────────────────
  const handleSaveFlows = async () => {
    for (const s of flows) {
      if (!s.button_title.trim()) { toast.error('Todos los botones deben tener un título'); return }
      for (const c of s.children) {
        if (!c.button_title.trim()) { toast.error('Todos los sub-botones deben tener un título'); return }
      }
    }

    setFlowsSaving(true)
    try {
      const payload = flows.map((s) => ({
        id:                s.id,
        button_id:         s.button_id,
        button_title:      s.button_title,
        step_type:         s.step_type,
        response_text:     s.response_text     || null,
        response_image_url:s.response_image_url || null,
        children: s.children.map((c) => ({
          id:                c.id,
          button_id:         c.button_id,
          button_title:      c.button_title,
          response_text:     c.response_text     || null,
          response_image_url:c.response_image_url || null,
        })),
      }))

      const res = await fetch('/api/admin/whatsapp/flows', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Error al guardar flujos')
        return
      }
      toast.success('Flujos guardados')
    } catch {
      toast.error('Error inesperado')
    } finally {
      setFlowsSaving(false)
    }
  }

  // ── Template helpers ─────────────────────────────────────────────────────
  const loadTemplates = async () => {
    setTemplatesLoading(true)
    try {
      const res = await fetch('/api/admin/whatsapp/templates')
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        setTemplates(data.templates ?? [])
        if ((data.templates ?? []).length === 0) {
          toast('No se encontraron plantillas aprobadas en Meta.', { icon: 'ℹ️' })
        } else {
          toast.success(`${data.templates.length} plantilla(s) cargada(s)`)
        }
      }
    } catch {
      toast.error('Error al cargar plantillas')
    } finally {
      setTemplatesLoading(false)
    }
  }

  const handleSelectTemplate = (name: string) => {
    const tpl = templates.find((t) => t.name === name) ?? null
    setSelectedTemplate(tpl)
    if (tpl) {
      // Detectar variables del cuerpo:
      // 1) Contar {{N}} en el texto
      // 2) Fallback: usar example.body_text[0].length (más confiable)
      const bodyComp  = tpl.components.find((c) => c.type === 'BODY' || c.type === 'body')
      const bodyText  = bodyComp?.text ?? ''
      const fromText  = (bodyText.match(/\{\{\d+\}\}/g) ?? []).length
      const fromExample = bodyComp?.example?.body_text?.[0]?.length ?? 0
      const varCount  = Math.max(fromText, fromExample)
      setTemplateBodyParams(Array.from({ length: Math.max(varCount, 0) }, () => ''))

      // Detectar variables del encabezado
      const headerComp = tpl.components.find((c) => c.type === 'HEADER' || c.type === 'header')
      const headerText = headerComp?.text ?? ''
      const hFromText  = (headerText.match(/\{\{\d+\}\}/g) ?? []).length
      const hFromExample = headerComp?.example?.header_text?.length ?? 0
      const hVarCount  = Math.max(hFromText, hFromExample)
      setTemplateHeaderParams(Array.from({ length: hVarCount }, () => ''))

      setTemplateManualName(tpl.name)
      setTemplateManualLang(tpl.language)
    }
  }

  const handleSendTemplate = async () => {
    const name = selectedTemplate ? selectedTemplate.name : templateManualName.trim()
    const lang = templateManualLang.trim()
    if (!name) { toast.error('Ingresa el nombre de la plantilla'); return }
    if (!lang) { toast.error('Ingresa el código de idioma'); return }
    if (!templatePhone.trim()) { toast.error('Ingresa el número de teléfono del destinatario'); return }

    // Validar que todas las variables estén llenas
    const emptyBody = templateBodyParams.findIndex((v) => !v.trim())
    if (emptyBody !== -1) {
      toast.error(`Completa la variable {{${emptyBody + 1}}} del cuerpo`)
      return
    }
    const emptyHeader = templateHeaderParams.findIndex((v) => !v.trim())
    if (emptyHeader !== -1) {
      toast.error(`Completa la variable {{${emptyHeader + 1}}} del encabezado`)
      return
    }

    setSendingTemplate(true)
    try {
      const res = await fetch('/api/admin/whatsapp/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to:           templatePhone.trim(),
          templateName: name,
          languageCode: lang,
          bodyParams:   templateBodyParams,   // sin filter(Boolean) — Meta necesita todos
          headerParams: templateHeaderParams,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Error al enviar la plantilla')
      } else {
        toast.success('¡Plantilla enviada exitosamente!')
        setTemplatePhone('')
        setTemplateBodyParams(Array.from({ length: templateBodyParams.length }, () => ''))
        setTemplateHeaderParams(Array.from({ length: templateHeaderParams.length }, () => ''))
      }
    } catch {
      toast.error('Error inesperado')
    } finally {
      setSendingTemplate(false)
    }
  }

  // ── Flow helpers ─────────────────────────────────────────────────────────
  function addTopStep() {
    if (flows.length >= 3) return
    setFlows((prev) => [
      ...prev,
      {
        temp_id:           newTempId(),
        button_title:      '',
        step_type:         'custom',
        response_text:     '',
        response_image_url:'',
        expanded:          true,
        children:          [],
      },
    ])
  }

  function removeTopStep(tempId: string) {
    setFlows((prev) => prev.filter((s) => s.temp_id !== tempId))
  }

  function updateTopStep(tempId: string, patch: Partial<TopStep>) {
    setFlows((prev) => prev.map((s) => s.temp_id === tempId ? { ...s, ...patch } : s))
  }

  function addChild(parentTempId: string) {
    setFlows((prev) => prev.map((s) => {
      if (s.temp_id !== parentTempId || s.children.length >= 3) return s
      return {
        ...s,
        children: [
          ...s.children,
          { temp_id: newTempId(), button_title: '', response_text: '', response_image_url: '' },
        ],
      }
    }))
  }

  function removeChild(parentTempId: string, childTempId: string) {
    setFlows((prev) => prev.map((s) => {
      if (s.temp_id !== parentTempId) return s
      return { ...s, children: s.children.filter((c) => c.temp_id !== childTempId) }
    }))
  }

  function updateChild(parentTempId: string, childTempId: string, patch: Partial<ChildStep>) {
    setFlows((prev) => prev.map((s) => {
      if (s.temp_id !== parentTempId) return s
      return { ...s, children: s.children.map((c) => c.temp_id === childTempId ? { ...c, ...patch } : c) }
    }))
  }

  // ─── Shared classes ────────────────────────────────────────────────────────
  const inputClass =
    'block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500'

  const textareaClass =
    'block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 resize-none'

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl)
    toast.success('URL copiada')
  }

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
              <li>Puedes configurar <strong>imagen de bienvenida</strong> y <strong>flujos con botones personalizados</strong>.</li>
              <li>Si no defines flujos, se muestra el menú estándar: Ver productos, Mis pedidos, Soporte.</li>
              <li>Requiere cuenta de <strong>Meta Business</strong> con WhatsApp Business Cloud API activada.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          SECCIÓN 1 — Configuración general (form)
      ════════════════════════════════════════════════ */}
      <form onSubmit={handleSaveConfig} className="space-y-6">

        {/* ── Activar/Desactivar ── */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
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

          <div className="border-t border-gray-100 pt-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-semibold text-gray-900">Modo restaurante 🍽️</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {config.is_restaurant
                    ? '✅ Activo — el menú principal muestra "Ver menú" con categorías de platillos'
                    : '⏸️ Desactivado — el bot funciona como tienda estándar'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfig((c) => ({ ...c, is_restaurant: !c.is_restaurant }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.is_restaurant ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.is_restaurant ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>
        </div>

        {/* ── Credenciales ── */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900">Credenciales de Meta / WhatsApp Cloud API</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number ID</label>
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
                placeholder={
                  config.access_token_preview
                    ? `Token guardado: ${config.access_token_preview} — escribe uno nuevo para cambiarlo`
                    : 'EAAxxxxx...'
                }
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WABA ID <span className="text-gray-400 font-normal">(opcional — para usar plantillas)</span>
            </label>
            <input
              type="text"
              value={config.waba_id}
              onChange={(e) => setConfig((c) => ({ ...c, waba_id: e.target.value }))}
              placeholder="123456789012345"
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-1">
              WhatsApp Business Account ID. En Meta: Business Manager → WhatsApp → Cuentas → ID de cuenta.
              Necesario para cargar y enviar plantillas aprobadas.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar credenciales'}
          </button>
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

        {/* ── Imagen de bienvenida ── */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-3">
          <h2 className="font-semibold text-gray-900">Imagen de bienvenida</h2>
          <p className="text-xs text-gray-500">
            Se enviará como imagen con caption al primer mensaje del cliente. Si no subes imagen, se enviará solo el texto.
          </p>
          <ImageUpload
            value={config.welcome_image_url}
            loading={uploadingWelcome}
            onChange={(url) => setConfig((c) => ({ ...c, welcome_image_url: url }))}
            onUpload={async (file) => {
              setUploadingWelcome(true)
              const url = await uploadImage(file)
              if (url) setConfig((c) => ({ ...c, welcome_image_url: url }))
              setUploadingWelcome(false)
            }}
          />
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
            <TextareaWithEmoji
              rows={2}
              value={config.welcome_message}
              onValueChange={(v) => setConfig((c) => ({ ...c, welcome_message: v }))}
              className={textareaClass}
            />
            <p className="text-xs text-gray-400 mt-1">
              Se envía (como caption de la imagen o como texto) antes de mostrar el menú.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Encabezado del menú principal
            </label>
            <InputWithEmoji
              value={config.menu_header}
              onValueChange={(v) => setConfig((c) => ({ ...c, menu_header: v }))}
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-1">
              Texto que aparece sobre los botones del menú.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje al pedir consulta de pedidos
            </label>
            <TextareaWithEmoji
              rows={2}
              value={config.orders_ask_phone}
              onValueChange={(v) => setConfig((c) => ({ ...c, orders_ask_phone: v }))}
              className={textareaClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje de soporte
            </label>
            <TextareaWithEmoji
              rows={2}
              value={config.support_message}
              onValueChange={(v) => setConfig((c) => ({ ...c, support_message: v }))}
              className={textareaClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensaje cuando no se encuentran pedidos
            </label>
            <TextareaWithEmoji
              rows={2}
              value={config.no_orders_message}
              onValueChange={(v) => setConfig((c) => ({ ...c, no_orders_message: v }))}
              className={textareaClass}
            />
          </div>
        </div>

        {/* ── Guardar configuración ── */}
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </form>

      {/* ════════════════════════════════════════════════
          SECCIÓN 2 — Flujos del menú principal
      ════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Flujos del menú principal</h2>
          <p className="text-xs text-gray-500 mt-1">
            Define hasta 3 botones y sus respuestas automáticas. Cada botón puede tener hasta 3 sub-botones.
            Si no configuras ninguno, se usará el menú estándar (Ver productos / Mis pedidos / Soporte).
          </p>
        </div>

        <div className="p-6 space-y-3">
          {flowsLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {flows.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  Sin flujos configurados — se usará el menú estándar.
                </p>
              )}

              {flows.map((step, idx) => (
                <TopStepCard
                  key={step.temp_id}
                  step={step}
                  idx={idx}
                  inputClass={inputClass}
                  textareaClass={textareaClass}
                  onUpdate={(patch) => updateTopStep(step.temp_id, patch)}
                  onRemove={() => removeTopStep(step.temp_id)}
                  onToggle={() => updateTopStep(step.temp_id, { expanded: !step.expanded })}
                  onAddChild={() => addChild(step.temp_id)}
                  onRemoveChild={(cid) => removeChild(step.temp_id, cid)}
                  onUpdateChild={(cid, patch) => updateChild(step.temp_id, cid, patch)}
                  uploadImage={uploadImage}
                />
              ))}

              {flows.length < 3 && (
                <button
                  type="button"
                  onClick={addTopStep}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-green-400 text-gray-400 hover:text-green-600 text-sm font-medium py-3 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar botón al menú
                </button>
              )}
            </>
          )}
        </div>

        <div className="px-6 pb-6">
          <button
            type="button"
            onClick={handleSaveFlows}
            disabled={flowsSaving}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            <Save className="w-4 h-4" />
            {flowsSaving ? 'Guardando flujos...' : 'Guardar flujos'}
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          SECCIÓN 3 — Plantillas de Meta
      ════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Plantillas de Meta (Templates)
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Envía mensajes con plantillas aprobadas por Meta Business. Útil para iniciar conversaciones o campañas.
            </p>
          </div>
          <button
            type="button"
            onClick={loadTemplates}
            disabled={templatesLoading || !config.waba_id}
            title={!config.waba_id ? 'Configura el WABA ID para cargar plantillas' : 'Cargar plantillas desde Meta'}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 text-xs font-medium px-3 py-2 rounded-lg transition-colors shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${templatesLoading ? 'animate-spin' : ''}`} />
            Cargar desde Meta
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Info box */}
          <div className="bg-amber-50 rounded-xl p-4 text-xs text-amber-800 space-y-1">
            <p className="font-semibold">¿Cuándo usar plantillas?</p>
            <ul className="list-disc ml-4 space-y-0.5 text-amber-700">
              <li>Para <strong>iniciar conversaciones</strong> con clientes (fuera de la ventana de 24 h).</li>
              <li>Para enviar <strong>notificaciones</strong>: confirmación de pedido, recordatorio, promo, etc.</li>
              <li>Las plantillas deben estar <strong>aprobadas por Meta</strong> antes de usarlas.</li>
            </ul>
          </div>

          {/* Si hay plantillas cargadas desde Meta, mostrar selector */}
          {templates.length > 0 ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar plantilla</label>
                <select
                  value={selectedTemplate?.name ?? ''}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="">— Selecciona una plantilla —</option>
                  {templates.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name} · {t.language} · {t.category}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTemplate && (
                <div className="space-y-3">
                  {/* Vista previa del contenido */}
                  <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 space-y-1">
                    {selectedTemplate.components.map((c, i) => (
                      <div key={i}>
                        <span className="font-semibold uppercase text-gray-400">{c.type}: </span>
                        {c.text ?? '—'}
                      </div>
                    ))}
                  </div>
                  {/* Idioma editable — el código debe coincidir EXACTAMENTE con el aprobado en Meta */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Código de idioma{' '}
                      <span className="text-gray-400 font-normal">(edita si hay error de idioma)</span>
                    </label>
                    <input
                      type="text"
                      value={templateManualLang}
                      onChange={(e) => setTemplateManualLang(e.target.value)}
                      className="block w-full rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Debe ser exactamente el código con el que Meta aprobó la plantilla. Ej: <code>es</code>, <code>es_MX</code>, <code>es_ES</code>, <code>en_US</code>
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Entrada manual si no hay plantillas cargadas */
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre de la plantilla</label>
                <input
                  type="text"
                  value={templateManualName}
                  onChange={(e) => setTemplateManualName(e.target.value)}
                  placeholder="hello_world"
                  className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Idioma</label>
                <input
                  type="text"
                  value={templateManualLang}
                  onChange={(e) => setTemplateManualLang(e.target.value)}
                  placeholder="es_MX"
                  className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">Ej: es_MX, es, en_US</p>
              </div>
            </div>
          )}

          {/* Variables del encabezado (header) */}
          {templateHeaderParams.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600">Variables del encabezado</p>
              {templateHeaderParams.map((val, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-12 shrink-0">&#123;&#123;{i + 1}&#125;&#125;</span>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => {
                      const next = [...templateHeaderParams]
                      next[i] = e.target.value
                      setTemplateHeaderParams(next)
                    }}
                    placeholder={`Valor ${i + 1}`}
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Variables del cuerpo (body) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-600">Variables del cuerpo &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125;…</p>
              {!selectedTemplate && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setTemplateBodyParams((p) => [...p, ''])}
                    className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Agregar
                  </button>
                  {templateBodyParams.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setTemplateBodyParams((p) => p.slice(0, -1))}
                      className="text-xs text-red-400 hover:text-red-600 font-medium flex items-center gap-0.5 ml-2"
                    >
                      <X className="w-3 h-3" /> Quitar
                    </button>
                  )}
                </div>
              )}
            </div>
            {templateBodyParams.length === 0 && (
              <p className="text-xs text-gray-400 italic">Esta plantilla no tiene variables en el cuerpo.</p>
            )}
            {templateBodyParams.map((val, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-12 shrink-0">&#123;&#123;{i + 1}&#125;&#125;</span>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => {
                    const next = [...templateBodyParams]
                    next[i] = e.target.value
                    setTemplateBodyParams(next)
                  }}
                  placeholder={`Valor ${i + 1}`}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            ))}
          </div>

          {/* Número destinatario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de teléfono del destinatario</label>
            <input
              type="text"
              value={templatePhone}
              onChange={(e) => setTemplatePhone(e.target.value)}
              placeholder="521234567890 (con código de país, sin +)"
              className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <p className="text-xs text-gray-400 mt-1">Incluye el código de país. Ej: 521234567890 para México.</p>
          </div>

          {/* Botón enviar */}
          <button
            type="button"
            onClick={handleSendTemplate}
            disabled={sendingTemplate || (!templateManualName && !selectedTemplate)}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            <Send className="w-4 h-4" />
            {sendingTemplate ? 'Enviando...' : 'Enviar plantilla'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── TopStepCard ──────────────────────────────────────────────────────────────

interface TopStepCardProps {
  step:         TopStep
  idx:          number
  inputClass:   string
  textareaClass:string
  onUpdate:     (patch: Partial<TopStep>) => void
  onRemove:     () => void
  onToggle:     () => void
  onAddChild:   () => void
  onRemoveChild:(childTempId: string) => void
  onUpdateChild:(childTempId: string, patch: Partial<ChildStep>) => void
  uploadImage:  (file: File, folder?: string) => Promise<string | null>
}

function TopStepCard({
  step, idx, inputClass, textareaClass,
  onUpdate, onRemove, onToggle, onAddChild,
  onRemoveChild, onUpdateChild, uploadImage,
}: TopStepCardProps) {

  const typeInfo = STEP_TYPE_OPTIONS.find((o) => o.value === step.step_type)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
        <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
        <span className="text-xs font-bold text-gray-400 w-5 shrink-0">#{idx + 1}</span>

        {/* Title input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={step.button_title}
            onChange={(e) => onUpdate({ button_title: e.target.value.slice(0, 20) })}
            placeholder="Título del botón (máx 20 caracteres)"
            className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 pr-16"
          />
          <div className="absolute right-7 top-1/2 -translate-y-1/2">
            <EmojiPickerDropdown onSelect={(e) => onUpdate({ button_title: (step.button_title + e).slice(0, 20) })} />
          </div>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
            {step.button_title.length}/20
          </span>
        </div>

        {/* Type badge */}
        <span className="hidden sm:inline text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0">
          {typeInfo?.label ?? step.step_type}
        </span>

        {/* Expand / Delete */}
        <button
          type="button"
          onClick={onToggle}
          className="text-gray-400 hover:text-gray-600 shrink-0"
        >
          {step.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-400 hover:text-red-600 shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Expanded content */}
      {step.expanded && (
        <div className="p-4 space-y-4 border-t border-gray-100">
          {/* Type selector */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de botón</label>
            <select
              value={step.step_type}
              onChange={(e) => onUpdate({ step_type: e.target.value as StepType })}
              className={inputClass}
            >
              {STEP_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label} — {o.desc}
                </option>
              ))}
            </select>
          </div>

          {/* Custom response fields */}
          {step.step_type === 'custom' && (
            <>
              <ImageUpload
                label="Imagen de respuesta (opcional)"
                value={step.response_image_url}
                loading={step.uploading}
                onChange={(url) => onUpdate({ response_image_url: url })}
                onUpload={async (file) => {
                  onUpdate({ uploading: true })
                  const url = await uploadImage(file)
                  if (url) onUpdate({ response_image_url: url })
                  onUpdate({ uploading: false })
                }}
              />

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Texto de respuesta (opcional)
                </label>
                <TextareaWithEmoji
                  rows={3}
                  value={step.response_text}
                  onValueChange={(v) => onUpdate({ response_text: v })}
                  placeholder="Mensaje que el bot enviará cuando el cliente toque este botón…"
                  className={textareaClass}
                />
              </div>

              {/* Sub-buttons */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-600">
                    Sub-botones ({step.children.length}/3)
                  </p>
                  {step.children.length < 3 && (
                    <button
                      type="button"
                      onClick={onAddChild}
                      className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
                    >
                      <Plus className="w-3 h-3" />
                      Agregar
                    </button>
                  )}
                </div>

                {step.children.length === 0 && (
                  <p className="text-xs text-gray-400 italic">
                    Sin sub-botones — después de la respuesta vuelve al menú principal.
                  </p>
                )}

                {step.children.map((child, ci) => (
                  <ChildStepCard
                    key={child.temp_id}
                    child={child}
                    idx={ci}
                    inputClass={inputClass}
                    textareaClass={textareaClass}
                    onUpdate={(patch) => onUpdateChild(child.temp_id, patch)}
                    onRemove={() => onRemoveChild(child.temp_id)}
                    uploadImage={uploadImage}
                  />
                ))}
              </div>
            </>
          )}

          {/* Info for system types */}
          {step.step_type !== 'custom' && (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
              ℹ️ {typeInfo?.desc}. El comportamiento de este botón está integrado en el sistema y no requiere configuración adicional.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── ChildStepCard ────────────────────────────────────────────────────────────

interface ChildStepCardProps {
  child:        ChildStep
  idx:          number
  inputClass:   string
  textareaClass:string
  onUpdate:     (patch: Partial<ChildStep>) => void
  onRemove:     () => void
  uploadImage:  (file: File, folder?: string) => Promise<string | null>
}

function ChildStepCard({ child, idx, inputClass, textareaClass, onUpdate, onRemove, uploadImage }: ChildStepCardProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden ml-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50/80">
        <span className="text-xs text-gray-400 font-medium w-4">↳{idx + 1}</span>

        <div className="flex-1 relative">
          <input
            type="text"
            value={child.button_title}
            onChange={(e) => onUpdate({ button_title: e.target.value.slice(0, 20) })}
            placeholder="Título del sub-botón (máx 20)"
            className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none pr-14"
          />
          <div className="absolute right-7 top-1/2 -translate-y-1/2 text-xs">
            <EmojiPickerDropdown onSelect={(e) => onUpdate({ button_title: (child.button_title + e).slice(0, 20) })} />
          </div>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-400">
            {child.button_title.length}/20
          </span>
        </div>

        <button type="button" onClick={() => setExpanded((v) => !v)} className="text-gray-400 hover:text-gray-600">
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-600">
          <X className="w-3 h-3" />
        </button>
      </div>

      {expanded && (
        <div className="p-3 space-y-3 border-t border-gray-100">
          <ImageUpload
            label="Imagen (opcional)"
            value={child.response_image_url}
            loading={child.uploading}
            onChange={(url) => onUpdate({ response_image_url: url })}
            onUpload={async (file) => {
              onUpdate({ uploading: true })
              const url = await uploadImage(file)
              if (url) onUpdate({ response_image_url: url })
              onUpdate({ uploading: false })
            }}
          />
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">
              Texto de respuesta (opcional)
            </label>
            <TextareaWithEmoji
              rows={2}
              value={child.response_text}
              onValueChange={(v) => onUpdate({ response_text: v })}
              placeholder="Mensaje de respuesta…"
              className={`${textareaClass} text-xs`}
            />
          </div>
        </div>
      )}
    </div>
  )
}
