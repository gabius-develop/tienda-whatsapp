'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageSquare, Phone, RefreshCw, Bot, User, Send, ArrowLeft, BotOff, CirclePlay, Smile, ImagePlus, X } from 'lucide-react'
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  // ── Refresh automático ────────────────────────────────────────────────────

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(() => fetchConversations(true), 30000)
    return () => clearInterval(interval)
  }, [fetchConversations])

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
                    <span className={`text-sm flex items-center gap-1.5 ${unread ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      +{conv.customer_phone}
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
                  <Phone className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">+{selectedPhone}</p>
                  <p className="text-xs text-gray-400">{messages.length} mensajes</p>
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
    </div>
  )
}
