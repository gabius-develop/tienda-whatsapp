'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageSquare, Phone, RefreshCw, Bot, User, Send, ArrowLeft, BotOff, CirclePlay, Smile, ImagePlus, X, Pencil, Check, UserCircle, LayoutGrid, FileText, ChevronDown, Loader2, Users, Plus, Search } from 'lucide-react'
import toast from 'react-hot-toast'

interface Conversation {
  customer_phone: string
  last_message: string
  last_direction: string
  last_at: string
  last_inbound_at: string | null
  message_count: number
  state: string
}

interface Message {
  id: string
  direction: 'inbound' | 'outbound'
  content: string
  media_url?: string | null
  media_type?: string | null
  created_at: string
}

interface MetaTemplate {
  name: string
  status: string
  language: string
  category: string
  components: Array<{
    type: string
    format?: string
    text?: string
    example?: {
      body_text?: string[][]
      header_text?: string[]
    }
  }>
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  return new Date(dateStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

function isUnread(conv: Conversation): boolean {
  if (!conv.last_inbound_at) return false
  try {
    const seen = JSON.parse(localStorage.getItem('wa_seen') ?? '{}')
    const lastSeen = seen[conv.customer_phone]
    if (!lastSeen) return true
    return new Date(conv.last_inbound_at) > new Date(lastSeen)
  } catch { return false }
}

// ─── Emoji picker ─────────────────────────────────────────────────────────────

const EMOJIS = [
  '👋','😊','😃','😍','🤩','😎','😋','🤗','😇','🙂',
  '😉','🥳','💪','👍','👏','🙏','🤝','❤️','🔥','⭐',
  '✅','❌','⚠️','💯','🎉','🎊','💡','✨','💫','🌟',
  '📦','🛍️','💰','💳','🛒','🏷️','🎁','📋','📝','📣',
  '📱','💻','📞','💬','🔔','📍','🗓️','⏰','🚀','🔑',
  '🏪','🏠','🚚','📮','💌','🔖','📌','🔍','🆕','🆓',
]

function EmojiPicker({ onSelect }: { onSelect: (e: string) => void }) {
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
        className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-yellow-500 transition-colors rounded-xl hover:bg-gray-100 shrink-0"
        title="Insertar emoji"
      >
        <Smile className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute bottom-12 left-0 z-30 bg-white border border-gray-200 rounded-xl shadow-xl p-2 w-64">
          <div className="grid grid-cols-10 gap-0.5 max-h-40 overflow-y-auto">
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

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [convState, setConvState] = useState<'idle' | 'support' | 'order_lookup'>('idle')
  const [initialLoading, setInitialLoading] = useState(true)
  const [initialLoadingMsgs, setInitialLoadingMsgs] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [togglingState, setTogglingState] = useState(false)
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [contacts, setContacts] = useState<Record<string, string>>({})
  const [editingAlias, setEditingAlias] = useState(false)
  const [aliasInput, setAliasInput] = useState('')
  const [savingAlias, setSavingAlias] = useState(false)
  const [sendingCarousel, setSendingCarousel] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templates, setTemplates] = useState<MetaTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<MetaTemplate | null>(null)
  const [templateBodyParams, setTemplateBodyParams] = useState<string[]>([])
  const [templateHeaderParams, setTemplateHeaderParams] = useState<string[]>([])
  const [templateHeaderFormat, setTemplateHeaderFormat] = useState<string | null>(null)
  const [templateHeaderMediaUrl, setTemplateHeaderMediaUrl] = useState('')
  const [sendingTemplate, setSendingTemplate] = useState(false)
  const [uploadingTemplateMedia, setUploadingTemplateMedia] = useState(false)
  const [templateSendMode, setTemplateSendMode] = useState<'single' | 'bulk'>('single')
  const [bulkRecipients, setBulkRecipients] = useState<Set<string>>(new Set())
  const [bulkPhoneInput, setBulkPhoneInput] = useState('')
  const [bulkSearch, setBulkSearch] = useState('')
  const [bulkProgress, setBulkProgress] = useState<{ sent: number; failed: number; total: number } | null>(null)
  const templateFileRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const aliasInputRef = useRef<HTMLInputElement>(null)

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wasAtBottomRef = useRef(true)
  const selectedPhoneRef = useRef<string | null>(null)

  const isAtBottom = () => {
    const el = messagesContainerRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 60
  }

  const scrollToBottom = (smooth = false) => {
    if (smooth) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    } else {
      // Instant: usar scrollTop directo para evitar animación visible
      const el = messagesContainerRef.current
      if (el) el.scrollTop = el.scrollHeight
    }
  }

  // ── Conversaciones ────────────────────────────────────────────────────────

  const fetchConversations = useCallback(async (silent = false) => {
    if (!silent) setInitialLoading(true)
    try {
      const res = await fetch('/api/admin/whatsapp/conversations')
      const data = await res.json()
      setConversations(Array.isArray(data) ? data : [])
    } catch { /* silencioso */ }
    finally { if (!silent) setInitialLoading(false) }
  }, [])

  // ── Mensajes ──────────────────────────────────────────────────────────────

  const fetchMessages = useCallback(async (phone: string, silent = false) => {
    if (!silent) setInitialLoadingMsgs(true)
    if (silent) wasAtBottomRef.current = isAtBottom()
    try {
      const res = await fetch(`/api/admin/whatsapp/conversations?phone=${encodeURIComponent(phone)}`)
      const data = await res.json()
      if (data.messages) {
        setMessages((prev) => {
          if (
            prev.length === data.messages.length &&
            prev[prev.length - 1]?.id === data.messages[data.messages.length - 1]?.id
          ) return prev
          return data.messages
        })
        setConvState(data.state ?? 'idle')
      }
    } catch { /* silencioso */ }
    finally { if (!silent) setInitialLoadingMsgs(false) }
  }, [])

  const prevMsgCountRef = useRef(0)
  useEffect(() => {
    if (messages.length === 0) { prevMsgCountRef.current = 0; return }
    if (wasAtBottomRef.current) {
      // Solo smooth si ya había mensajes y llegaron pocos nuevos (polling)
      const isSmallUpdate = prevMsgCountRef.current > 0 && messages.length - prevMsgCountRef.current > 0 && messages.length - prevMsgCountRef.current <= 3
      requestAnimationFrame(() => scrollToBottom(isSmallUpdate))
    }
    prevMsgCountRef.current = messages.length
  }, [messages])

  // ── Contactos (alias) ──────────────────────────────────────────────────────

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/whatsapp/contacts')
      if (res.ok) setContacts(await res.json())
    } catch { /* silencioso */ }
  }, [])

  const saveAlias = async (phone: string, alias: string) => {
    setSavingAlias(true)
    try {
      const res = await fetch('/api/admin/whatsapp/contacts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, alias }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setContacts(data.contacts)
      setEditingAlias(false)
      toast.success(alias.trim() ? 'Contacto guardado' : 'Alias eliminado')
    } catch {
      toast.error('Error al guardar el contacto')
    } finally {
      setSavingAlias(false)
    }
  }

  // ── Refresh automático ────────────────────────────────────────────────────

  useEffect(() => {
    fetchConversations()
    fetchContacts()
    const interval = setInterval(() => fetchConversations(true), 30000)
    return () => clearInterval(interval)
  }, [fetchConversations, fetchContacts])

  useEffect(() => {
    selectedPhoneRef.current = selectedPhone
    if (!selectedPhone) return
    const interval = setInterval(() => {
      if (selectedPhoneRef.current) fetchMessages(selectedPhoneRef.current, true)
    }, 15000)
    return () => clearInterval(interval)
  }, [selectedPhone, fetchMessages])

  // ── Auto-reset filtro cuando no quedan sin leer ───────────────────────────

  useEffect(() => {
    if (filter === 'unread' && conversations.filter(isUnread).length === 0) {
      setFilter('all')
    }
  }, [conversations, filter])

  // ── Acciones ──────────────────────────────────────────────────────────────

  const markAsRead = (phone: string) => {
    try {
      const seen = JSON.parse(localStorage.getItem('wa_seen') ?? '{}')
      seen[phone] = new Date().toISOString()
      localStorage.setItem('wa_seen', JSON.stringify(seen))
      window.dispatchEvent(new CustomEvent('wa-conversation-read'))
    } catch { /* silencioso */ }
  }

  const handleSelect = (phone: string) => {
    setSelectedPhone(phone)
    setMessages([])
    setReplyText('')
    setEditingAlias(false)
    wasAtBottomRef.current = true
    markAsRead(phone)
    fetchMessages(phone)
  }

  const handleSend = async () => {
    if (!selectedPhone || sending) return
    if (!replyText.trim() && imageFiles.length === 0) return
    setSending(true)
    wasAtBottomRef.current = true
    try {
      if (imageFiles.length > 0) {
        // Subir y enviar cada imagen
        for (let i = 0; i < imageFiles.length; i++) {
          const formData = new FormData()
          formData.append('file', imageFiles[i])
          const uploadRes = await fetch('/api/admin/upload?folder=wa-media', { method: 'POST', body: formData })
          if (!uploadRes.ok) {
            toast.error(`Error al subir imagen ${i + 1}`)
            continue
          }
          const uploadData = await uploadRes.json()
          // Solo la primera imagen lleva el caption (texto)
          const caption = i === 0 ? (replyText.trim() || undefined) : undefined
          const res = await fetch('/api/admin/whatsapp/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: selectedPhone,
              message: caption,
              imageUrl: uploadData.url,
            }),
          })
          if (!res.ok) {
            const err = await res.json()
            toast.error(err.error ?? `Error al enviar imagen ${i + 1}`)
          }
        }
      } else {
        // Solo texto
        const res = await fetch('/api/admin/whatsapp/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: selectedPhone,
            message: replyText.trim(),
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          toast.error(err.error ?? 'Error al enviar')
          return
        }
      }
      setReplyText('')
      clearImages()
      markAsRead(selectedPhone)
      await fetchMessages(selectedPhone)
      fetchConversations(true)
    } catch {
      toast.error('Error inesperado')
    } finally {
      setSending(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const newFiles: File[] = []
    const newPreviews: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) {
        toast.error(`"${file.name}" no es una imagen`)
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" supera 5 MB`)
        continue
      }
      newFiles.push(file)
      newPreviews.push(URL.createObjectURL(file))
    }
    if (newFiles.length > 0) {
      setImageFiles(prev => [...prev, ...newFiles])
      setImagePreviews(prev => [...prev, ...newPreviews])
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const clearImages = () => {
    imagePreviews.forEach(url => URL.revokeObjectURL(url))
    setImageFiles([])
    setImagePreviews([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const insertEmoji = useCallback((emoji: string) => {
    const el = textareaRef.current
    const start = el ? el.selectionStart : replyText.length
    const end = el ? el.selectionEnd : replyText.length
    const next = replyText.slice(0, start) + emoji + replyText.slice(end)
    setReplyText(next)
    requestAnimationFrame(() => {
      if (el) { el.focus(); el.selectionStart = el.selectionEnd = start + emoji.length }
    })
  }, [replyText])

  const handleToggleState = async () => {
    if (!selectedPhone || togglingState) return
    const newState = convState === 'support' ? 'idle' : 'support'
    setTogglingState(true)
    try {
      const res = await fetch('/api/admin/whatsapp/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: selectedPhone, state: newState }),
      })
      if (!res.ok) { toast.error('Error al cambiar el estado'); return }
      setConvState(newState)
      fetchConversations(true)
      toast.success(newState === 'idle' ? '🤖 Bot reactivado' : '⏸️ Bot pausado')
    } catch {
      toast.error('Error inesperado')
    } finally {
      setTogglingState(false)
    }
  }

  const handleSendCarousel = async () => {
    if (!selectedPhone || sendingCarousel) return
    setSendingCarousel(true)
    wasAtBottomRef.current = true
    try {
      const res = await fetch('/api/admin/whatsapp/carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: selectedPhone }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Error al enviar carousel')
        return
      }
      toast.success(`Carousel enviado (${data.products_sent} productos)`)
      await fetchMessages(selectedPhone)
      fetchConversations(true)
    } catch {
      toast.error('Error inesperado')
    } finally {
      setSendingCarousel(false)
    }
  }

  // ── Plantillas (Templates) ─────────────────────────────────────────────────

  const openTemplateModal = async () => {
    setShowTemplateModal(true)
    setSelectedTemplate(null)
    setTemplateBodyParams([])
    setTemplateHeaderParams([])
    setTemplateHeaderFormat(null)
    setTemplateHeaderMediaUrl('')
    setTemplateSendMode('single')
    setBulkRecipients(new Set())
    setBulkPhoneInput('')
    setBulkSearch('')
    setBulkProgress(null)
    if (templates.length === 0) {
      setLoadingTemplates(true)
      try {
        const res = await fetch('/api/admin/whatsapp/templates')
        const data = await res.json()
        setTemplates(Array.isArray(data.templates) ? data.templates : [])
        if (data.error) toast.error(data.error)
      } catch {
        toast.error('Error al cargar plantillas')
      } finally {
        setLoadingTemplates(false)
      }
    }
  }

  const selectTemplate = (tpl: MetaTemplate) => {
    setSelectedTemplate(tpl)
    // Detectar variables del body
    const bodyComp = tpl.components.find(c => c.type === 'BODY')
    const bodyMatches = bodyComp?.text?.match(/\{\{\d+\}\}/g) ?? []
    const bodyExampleCount = bodyComp?.example?.body_text?.[0]?.length ?? 0
    const bodyCount = Math.max(bodyMatches.length, bodyExampleCount)
    setTemplateBodyParams(Array(bodyCount).fill(''))

    // Detectar formato del header (TEXT, IMAGE, VIDEO, DOCUMENT)
    const headerComp = tpl.components.find(c => c.type === 'HEADER')
    const format = headerComp?.format
    setTemplateHeaderFormat(format ?? null)
    setTemplateHeaderMediaUrl('')

    if (format === 'IMAGE' || format === 'VIDEO' || format === 'DOCUMENT') {
      // Header de media — no tiene variables de texto
      setTemplateHeaderParams([])
    } else {
      // Header de texto — puede tener variables {{1}}
      const headerMatches = headerComp?.text?.match(/\{\{\d+\}\}/g) ?? []
      const headerExampleCount = headerComp?.example?.header_text?.length ?? 0
      const headerCount = Math.max(headerMatches.length, headerExampleCount)
      setTemplateHeaderParams(Array(headerCount).fill(''))
    }
  }

  const handleTemplateMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo supera 10 MB')
      return
    }
    setUploadingTemplateMedia(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/upload?folder=wa-media', { method: 'POST', body: formData })
      if (!res.ok) { toast.error('Error al subir archivo'); return }
      const data = await res.json()
      setTemplateHeaderMediaUrl(data.url)
    } catch {
      toast.error('Error al subir archivo')
    } finally {
      setUploadingTemplateMedia(false)
      if (templateFileRef.current) templateFileRef.current.value = ''
    }
  }

  const buildTemplatePayload = (phone: string) => {
    const payload: Record<string, unknown> = {
      to: phone,
      templateName: selectedTemplate!.name,
      languageCode: selectedTemplate!.language,
      bodyParams: templateBodyParams.length > 0 ? templateBodyParams : undefined,
      headerParams: templateHeaderParams.length > 0 ? templateHeaderParams : undefined,
    }
    if (templateHeaderFormat === 'IMAGE' && templateHeaderMediaUrl) payload.headerImageUrl = templateHeaderMediaUrl
    if (templateHeaderFormat === 'VIDEO' && templateHeaderMediaUrl) payload.headerVideoUrl = templateHeaderMediaUrl
    if (templateHeaderFormat === 'DOCUMENT' && templateHeaderMediaUrl) payload.headerDocumentUrl = templateHeaderMediaUrl
    return payload
  }

  const handleSendTemplate = async () => {
    if (!selectedTemplate || sendingTemplate) return
    // Validar media
    if ((templateHeaderFormat === 'IMAGE' || templateHeaderFormat === 'VIDEO' || templateHeaderFormat === 'DOCUMENT') && !templateHeaderMediaUrl) {
      toast.error(`Debes subir ${templateHeaderFormat === 'IMAGE' ? 'una imagen' : templateHeaderFormat === 'VIDEO' ? 'un video' : 'un documento'} para el encabezado`)
      return
    }

    if (templateSendMode === 'single') {
      // Envío a conversación actual
      if (!selectedPhone) return
      setSendingTemplate(true)
      wasAtBottomRef.current = true
      try {
        const res = await fetch('/api/admin/whatsapp/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildTemplatePayload(selectedPhone)),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.error ?? 'Error al enviar plantilla'); return }
        toast.success('Plantilla enviada')
        setShowTemplateModal(false)
        setSelectedTemplate(null)
        await fetchMessages(selectedPhone)
        fetchConversations(true)
      } catch { toast.error('Error inesperado') }
      finally { setSendingTemplate(false) }
    } else {
      // Envío masivo
      if (bulkRecipients.size === 0) { toast.error('Selecciona al menos un destinatario'); return }
      setSendingTemplate(true)
      const phones = Array.from(bulkRecipients)
      const progress = { sent: 0, failed: 0, total: phones.length }
      setBulkProgress({ ...progress })

      for (const phone of phones) {
        try {
          const res = await fetch('/api/admin/whatsapp/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildTemplatePayload(phone)),
          })
          if (res.ok) { progress.sent++ } else { progress.failed++ }
        } catch { progress.failed++ }
        setBulkProgress({ ...progress })
      }

      setSendingTemplate(false)
      if (progress.failed === 0) {
        toast.success(`Plantilla enviada a ${progress.sent} contactos`)
        setShowTemplateModal(false)
        setSelectedTemplate(null)
      } else {
        toast.error(`Enviada a ${progress.sent}, falló en ${progress.failed}`)
      }
      fetchConversations(true)
    }
  }

  const toggleBulkRecipient = (phone: string) => {
    setBulkRecipients(prev => {
      const next = new Set(prev)
      if (next.has(phone)) next.delete(phone); else next.add(phone)
      return next
    })
  }

  const addBulkPhone = () => {
    const clean = bulkPhoneInput.replace(/[\s\-\(\)\+]/g, '')
    if (!/^\d{7,15}$/.test(clean)) { toast.error('Número inválido'); return }
    setBulkRecipients(prev => new Set(prev).add(clean))
    setBulkPhoneInput('')
  }

  const selectAllRecipients = () => {
    const all = new Set(bulkRecipients)
    conversations.forEach(c => all.add(c.customer_phone))
    setBulkRecipients(all)
  }

  const deselectAllRecipients = () => {
    setBulkRecipients(new Set())
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const isSupport = convState === 'support'
  const unreadConvsCount = conversations.filter(isUnread).length
  const filteredConversations = filter === 'unread' ? conversations.filter(isUnread) : conversations

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-48px)] md:h-screen">

      {/* ── Lista de conversaciones ── */}
      <div className={`${selectedPhone ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-gray-200 flex-col bg-white`}>

        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h1 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
            <MessageSquare className="w-4 h-4 text-green-600" />
            Conversaciones
            {unreadConvsCount > 0 && (
              <span className="min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 animate-pulse">
                {unreadConvsCount > 99 ? '99+' : unreadConvsCount}
              </span>
            )}
          </h1>
          <button
            onClick={() => fetchConversations()}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs de filtro — solo visibles cuando hay sin leer */}
        {unreadConvsCount > 0 && (
          <div className="flex border-b border-gray-100 px-3 gap-0">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 text-xs font-medium py-2.5 border-b-2 transition-colors ${
                filter === 'all'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              Todas ({conversations.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex-1 text-xs font-medium py-2.5 border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                filter === 'unread'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              Sin leer
              <span className={`text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full font-bold px-1 ${
                filter === 'unread' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {unreadConvsCount}
              </span>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {initialLoading ? (
            <div className="space-y-px">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 border-b border-gray-50 animate-pulse">
                  <div className="h-3 bg-gray-100 rounded w-32 mb-2" />
                  <div className="h-2.5 bg-gray-100 rounded w-48" />
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              {filter === 'unread' ? '¡Todo leído!' : 'No hay conversaciones aún'}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const unread = isUnread(conv)
              const active = selectedPhone === conv.customer_phone
              return (
                <button
                  key={conv.customer_phone}
                  onClick={() => handleSelect(conv.customer_phone)}
                  className={`w-full text-left p-4 border-b border-gray-50 transition-colors ${
                    active
                      ? 'bg-green-50 border-l-[3px] border-l-green-500'
                      : unread
                        ? 'bg-blue-50/60 border-l-[3px] border-l-blue-500 hover:bg-blue-50'
                        : 'border-l-[3px] border-l-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm flex items-center gap-1.5 min-w-0 ${unread ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>
                      {contacts[conv.customer_phone] ? (
                        <UserCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      ) : (
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      )}
                      <span className="truncate">
                        {contacts[conv.customer_phone]
                          ? <>{contacts[conv.customer_phone]} <span className="text-gray-400 font-normal text-xs">+{conv.customer_phone}</span></>
                          : <>+{conv.customer_phone}</>
                        }
                      </span>
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {unread && !active && (
                        <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-bold leading-tight">
                          nuevo
                        </span>
                      )}
                      {conv.state === 'support' && (
                        <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">
                          soporte
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{timeAgo(conv.last_at)}</span>
                    </div>
                  </div>
                  <p className={`text-xs truncate ${unread ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                    {conv.last_direction === 'outbound' ? '🤖 ' : '👤 '}
                    {conv.last_message}
                  </p>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Panel de mensajes ── */}
      <div className={`${selectedPhone ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-gray-50 min-w-0`}>
        {selectedPhone ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
              {/* Fila principal */}
              <div className="px-4 py-3 flex items-center gap-3">
                <button
                  onClick={() => setSelectedPhone(null)}
                  className="md:hidden text-gray-400 hover:text-gray-700 shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  {contacts[selectedPhone] ? (
                    <UserCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Phone className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {editingAlias ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={aliasInputRef}
                        type="text"
                        value={aliasInput}
                        onChange={e => setAliasInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveAlias(selectedPhone, aliasInput)
                          if (e.key === 'Escape') setEditingAlias(false)
                        }}
                        placeholder="Nombre o alias..."
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 w-full max-w-[180px]"
                        autoFocus
                      />
                      <button
                        onClick={() => saveAlias(selectedPhone, aliasInput)}
                        disabled={savingAlias}
                        className="p-1 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                        title="Guardar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingAlias(false)}
                        className="p-1 text-gray-400 hover:bg-gray-100 rounded-md transition-colors"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div className="min-w-0">
                        {contacts[selectedPhone] ? (
                          <>
                            <p className="font-medium text-gray-900 text-sm truncate">{contacts[selectedPhone]}</p>
                            <p className="text-xs text-gray-400">+{selectedPhone}</p>
                          </>
                        ) : (
                          <>
                            <p className="font-medium text-gray-900 text-sm">+{selectedPhone}</p>
                            <p className="text-xs text-gray-400">{messages.length} mensajes</p>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setAliasInput(contacts[selectedPhone] || '')
                          setEditingAlias(true)
                          requestAnimationFrame(() => aliasInputRef.current?.focus())
                        }}
                        className="p-1 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors shrink-0"
                        title={contacts[selectedPhone] ? 'Editar alias' : 'Agregar alias'}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                {/* Toggle bot — solo en desktop */}
                <button
                  onClick={handleToggleState}
                  disabled={togglingState}
                  className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                    isSupport
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isSupport
                    ? <><CirclePlay className="w-3.5 h-3.5" /> Reactivar bot</>
                    : <><BotOff className="w-3.5 h-3.5" /> Pausar bot</>
                  }
                </button>
                <button
                  onClick={() => { wasAtBottomRef.current = true; fetchMessages(selectedPhone) }}
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              {/* Fila de acción — solo móvil */}
              <div className="sm:hidden px-4 pb-2">
                <button
                  onClick={handleToggleState}
                  disabled={togglingState}
                  className={`w-full flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-lg transition-colors ${
                    isSupport
                      ? 'bg-orange-100 text-orange-700 active:bg-orange-200'
                      : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                  }`}
                >
                  {isSupport
                    ? <><CirclePlay className="w-4 h-4" /> Reactivar bot</>
                    : <><BotOff className="w-4 h-4" /> Pausar bot</>
                  }
                </button>
              </div>
            </div>

            {/* Banner modo soporte */}
            {isSupport && (
              <div className="bg-orange-50 border-b border-orange-100 px-4 py-2 flex items-center gap-2">
                <BotOff className="w-4 h-4 text-orange-500 shrink-0" />
                <p className="text-xs text-orange-700">
                  <strong>Bot pausado</strong> — estás atendiendo manualmente. El bot no responderá hasta que lo reactives.
                </p>
              </div>
            )}

            {/* Mensajes */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-2"
            >
              {initialLoadingMsgs ? (
                <div className="space-y-3 pt-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                      <div className="h-10 bg-gray-200 rounded-2xl animate-pulse w-48" />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-400 text-sm pt-8">No hay mensajes</div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-1.5 ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.direction === 'inbound' && (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mb-1">
                        <User className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl text-sm shadow-sm overflow-hidden ${
                        msg.direction === 'outbound'
                          ? 'bg-green-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-900 rounded-bl-sm'
                      }`}
                    >
                      {msg.media_url && msg.media_type === 'image' && (
                        <a href={msg.media_url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={msg.media_url}
                            alt="Imagen"
                            className="w-full max-w-xs rounded-t-2xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            loading="lazy"
                          />
                        </a>
                      )}
                      {msg.media_url && msg.media_type === 'audio' && (
                        <div className="px-3 pt-3">
                          <audio controls preload="none" className="w-full max-w-xs">
                            <source src={msg.media_url} />
                          </audio>
                        </div>
                      )}
                      {msg.media_url && msg.media_type === 'video' && (
                        <div className="px-1 pt-1">
                          <video
                            controls
                            preload="none"
                            className="w-full max-w-xs rounded-t-2xl"
                          >
                            <source src={msg.media_url} />
                          </video>
                        </div>
                      )}
                      <div className="px-3.5 py-2.5">
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        <p className={`text-[10px] mt-0.5 ${msg.direction === 'outbound' ? 'text-green-200' : 'text-gray-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                          {' · '}
                          {new Date(msg.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    {msg.direction === 'outbound' && (
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mb-1">
                        <Bot className="w-3.5 h-3.5 text-green-600" />
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Preview de imágenes seleccionadas */}
            {imagePreviews.length > 0 && (
              <div className="px-3 pt-2 bg-white border-t border-gray-100">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {imagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative shrink-0">
                      <img src={preview} alt={`Preview ${idx + 1}`} className="h-20 rounded-lg object-cover border border-gray-200" />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {imagePreviews.length > 1 && (
                    <button
                      onClick={clearImages}
                      className="shrink-0 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Quitar todas
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">{imagePreviews.length} imagen{imagePreviews.length !== 1 ? 'es' : ''}</p>
              </div>
            )}

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-200 flex items-end gap-1.5">
              <EmojiPicker onSelect={insertEmoji} />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-green-600 transition-colors rounded-xl hover:bg-gray-100 shrink-0"
                title="Enviar imagen"
              >
                <ImagePlus className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleSendCarousel}
                disabled={sendingCarousel}
                className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-purple-600 transition-colors rounded-xl hover:bg-gray-100 shrink-0 disabled:opacity-40"
                title="Enviar carousel de productos"
              >
                {sendingCarousel
                  ? <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  : <LayoutGrid className="w-5 h-5" />
                }
              </button>

              <button
                type="button"
                onClick={openTemplateModal}
                className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-blue-600 transition-colors rounded-xl hover:bg-gray-100 shrink-0"
                title="Enviar plantilla de Meta"
              >
                <FileText className="w-5 h-5" />
              </button>

              <textarea
                ref={textareaRef}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder={isSupport ? 'Respondiendo como agente...' : 'Escribe un mensaje...'}
                rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 max-h-32 overflow-y-auto"
                style={{ minHeight: '40px' }}
              />
              <button
                onClick={handleSend}
                disabled={sending || (!replyText.trim() && imageFiles.length === 0)}
                className="flex items-center justify-center w-10 h-10 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0"
              >
                {sending
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <MessageSquare className="w-14 h-14 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Selecciona una conversación</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal de Plantillas ── */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowTemplateModal(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-blue-600" />
                Enviar Plantilla de Meta
              </h2>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {loadingTemplates ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3" />
                  <p className="text-sm">Cargando plantillas...</p>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No hay plantillas aprobadas</p>
                  <p className="text-xs mt-1">Asegurate de tener el WABA ID configurado y plantillas aprobadas en Meta</p>
                </div>
              ) : !selectedTemplate ? (
                /* Lista de plantillas para seleccionar */
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Selecciona una plantilla</p>
                  {templates.map((tpl, idx) => (
                    <button
                      key={`${tpl.name}-${tpl.language}-${idx}`}
                      onClick={() => selectTemplate(tpl)}
                      className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-gray-900 group-hover:text-blue-700">{tpl.name}</span>
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{tpl.language}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {tpl.components.find(c => c.type === 'BODY')?.text ?? 'Sin contenido'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400">{tpl.category}</span>
                        {tpl.components.find(c => c.type === 'HEADER' && (c.format === 'IMAGE' || c.format === 'VIDEO' || c.format === 'DOCUMENT')) && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                            {tpl.components.find(c => c.type === 'HEADER')?.format === 'IMAGE' ? 'Con imagen' : tpl.components.find(c => c.type === 'HEADER')?.format === 'VIDEO' ? 'Con video' : 'Con documento'}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                /* Plantilla seleccionada — mostrar preview y variables */
                <div className="space-y-4">
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                  >
                    <ChevronDown className="w-3 h-3 rotate-90" /> Cambiar plantilla
                  </button>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm text-gray-900">{selectedTemplate.name}</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{selectedTemplate.language}</span>
                    </div>
                    {selectedTemplate.components.map((comp, i) => (
                      <div key={i} className="mb-1">
                        {comp.type === 'HEADER' && comp.text && (
                          <p className="text-xs font-semibold text-gray-700">{comp.text}</p>
                        )}
                        {comp.type === 'BODY' && (
                          <p className="text-xs text-gray-600 whitespace-pre-wrap">{comp.text}</p>
                        )}
                        {comp.type === 'FOOTER' && (
                          <p className="text-[10px] text-gray-400 mt-1">{comp.text}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Header media (IMAGE/VIDEO/DOCUMENT) */}
                  {(templateHeaderFormat === 'IMAGE' || templateHeaderFormat === 'VIDEO' || templateHeaderFormat === 'DOCUMENT') && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                        {templateHeaderFormat === 'IMAGE' ? 'Imagen del encabezado' : templateHeaderFormat === 'VIDEO' ? 'Video del encabezado' : 'Documento del encabezado'}
                      </p>
                      <input
                        ref={templateFileRef}
                        type="file"
                        accept={templateHeaderFormat === 'IMAGE' ? 'image/*' : templateHeaderFormat === 'VIDEO' ? 'video/*' : '*'}
                        className="hidden"
                        onChange={handleTemplateMediaUpload}
                      />
                      {templateHeaderMediaUrl ? (
                        <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                          {templateHeaderFormat === 'IMAGE' && (
                            <img src={templateHeaderMediaUrl} alt="Header" className="h-16 rounded object-cover" />
                          )}
                          <span className="text-xs text-green-700 flex-1 truncate">Archivo cargado</span>
                          <button
                            type="button"
                            onClick={() => setTemplateHeaderMediaUrl('')}
                            className="p-1 text-red-400 hover:text-red-600 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => templateFileRef.current?.click()}
                          disabled={uploadingTemplateMedia}
                          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                        >
                          {uploadingTemplateMedia ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo...</>
                          ) : (
                            <><ImagePlus className="w-4 h-4" /> Subir {templateHeaderFormat === 'IMAGE' ? 'imagen' : templateHeaderFormat === 'VIDEO' ? 'video' : 'documento'}</>
                          )}
                        </button>
                      )}
                      <p className="text-[10px] text-gray-400">La plantilla requiere {templateHeaderFormat === 'IMAGE' ? 'una imagen' : templateHeaderFormat === 'VIDEO' ? 'un video' : 'un documento'} en el encabezado</p>
                    </div>
                  )}

                  {/* Variables del header (solo para headers de texto) */}
                  {templateHeaderParams.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Variables del encabezado</p>
                      {templateHeaderParams.map((val, i) => (
                        <div key={`h-${i}`}>
                          <label className="text-xs text-gray-500 mb-1 block">{`{{${i + 1}}}`}</label>
                          <input
                            type="text"
                            value={val}
                            onChange={e => {
                              const next = [...templateHeaderParams]
                              next[i] = e.target.value
                              setTemplateHeaderParams(next)
                            }}
                            placeholder={`Valor para {{${i + 1}}}`}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Variables del body */}
                  {templateBodyParams.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Variables del cuerpo</p>
                      {templateBodyParams.map((val, i) => (
                        <div key={`b-${i}`}>
                          <label className="text-xs text-gray-500 mb-1 block">{`{{${i + 1}}}`}</label>
                          <input
                            type="text"
                            value={val}
                            onChange={e => {
                              const next = [...templateBodyParams]
                              next[i] = e.target.value
                              setTemplateBodyParams(next)
                            }}
                            placeholder={`Valor para {{${i + 1}}}`}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Destinatarios ── */}
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Destinatarios</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setTemplateSendMode('single')}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg transition-colors ${
                          templateSendMode === 'single'
                            ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Conversación actual
                      </button>
                      <button
                        type="button"
                        onClick={() => setTemplateSendMode('bulk')}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg transition-colors ${
                          templateSendMode === 'bulk'
                            ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        Varios contactos
                      </button>
                    </div>

                    {templateSendMode === 'single' && selectedPhone && (
                      <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                        <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="text-sm text-blue-800 font-medium">
                          {contacts[selectedPhone] ? `${contacts[selectedPhone]} (+${selectedPhone})` : `+${selectedPhone}`}
                        </span>
                      </div>
                    )}

                    {templateSendMode === 'bulk' && (
                      <div className="space-y-2">
                        {/* Agregar número manual */}
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={bulkPhoneInput}
                            onChange={e => setBulkPhoneInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addBulkPhone() } }}
                            placeholder="Agregar número (ej: 521234567890)"
                            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={addBulkPhone}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Seleccionar/deseleccionar todos + buscador */}
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={bulkSearch}
                              onChange={e => setBulkSearch(e.target.value)}
                              placeholder="Buscar contacto..."
                              className="w-full text-xs border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <button type="button" onClick={selectAllRecipients} className="text-[10px] text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap">
                            Todos
                          </button>
                          <span className="text-gray-300">|</span>
                          <button type="button" onClick={deselectAllRecipients} className="text-[10px] text-gray-500 hover:text-gray-700 font-medium whitespace-nowrap">
                            Ninguno
                          </button>
                        </div>

                        {/* Lista de conversaciones como checkboxes */}
                        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-50">
                          {conversations
                            .filter(c => {
                              if (!bulkSearch.trim()) return true
                              const q = bulkSearch.toLowerCase()
                              return c.customer_phone.includes(q) || (contacts[c.customer_phone] ?? '').toLowerCase().includes(q)
                            })
                            .map(c => (
                            <label
                              key={c.customer_phone}
                              className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={bulkRecipients.has(c.customer_phone)}
                                onChange={() => toggleBulkRecipient(c.customer_phone)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                              />
                              <span className="text-xs text-gray-700 truncate flex-1">
                                {contacts[c.customer_phone]
                                  ? <>{contacts[c.customer_phone]} <span className="text-gray-400">+{c.customer_phone}</span></>
                                  : `+${c.customer_phone}`
                                }
                              </span>
                            </label>
                          ))}
                        </div>

                        {/* Números manuales agregados que no están en conversaciones */}
                        {Array.from(bulkRecipients).filter(p => !conversations.find(c => c.customer_phone === p)).length > 0 && (
                          <div className="space-y-1">
                            <p className="text-[10px] text-gray-400 font-medium">Números agregados manualmente:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {Array.from(bulkRecipients).filter(p => !conversations.find(c => c.customer_phone === p)).map(p => (
                                <span key={p} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                                  +{p}
                                  <button type="button" onClick={() => toggleBulkRecipient(p)} className="text-blue-400 hover:text-red-500">
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Contador */}
                        <p className="text-xs text-gray-500">
                          {bulkRecipients.size === 0
                            ? 'Ningún contacto seleccionado'
                            : <><strong>{bulkRecipients.size}</strong> contacto{bulkRecipients.size !== 1 ? 's' : ''} seleccionado{bulkRecipients.size !== 1 ? 's' : ''}</>
                          }
                        </p>

                        {/* Progreso de envío masivo */}
                        {bulkProgress && (
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Progreso: {bulkProgress.sent + bulkProgress.failed} / {bulkProgress.total}</span>
                              <span className="flex items-center gap-2">
                                {bulkProgress.sent > 0 && <span className="text-green-600 font-medium">{bulkProgress.sent} enviados</span>}
                                {bulkProgress.failed > 0 && <span className="text-red-600 font-medium">{bulkProgress.failed} fallidos</span>}
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                style={{ width: `${((bulkProgress.sent + bulkProgress.failed) / bulkProgress.total) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer del modal */}
            {selectedTemplate && (
              <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  {templateSendMode === 'bulk' && bulkRecipients.size > 0 && (
                    <span>{bulkRecipients.size} destinatario{bulkRecipients.size !== 1 ? 's' : ''}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setShowTemplateModal(false); setBulkProgress(null) }}
                    className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSendTemplate}
                    disabled={sendingTemplate || (templateSendMode === 'bulk' && bulkRecipients.size === 0)}
                    className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    {sendingTemplate ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                    ) : templateSendMode === 'bulk' ? (
                      <><Users className="w-4 h-4" /> Enviar a {bulkRecipients.size || ''}</>
                    ) : (
                      <><Send className="w-4 h-4" /> Enviar plantilla</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
