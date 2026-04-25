'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageSquare, Phone, RefreshCw, Bot, User, Send, ArrowLeft, BotOff, CirclePlay } from 'lucide-react'
import toast from 'react-hot-toast'

interface Conversation {
  customer_phone: string
  last_message: string
  last_direction: string
  last_at: string
  message_count: number
  state: string
}

interface Message {
  id: string
  direction: 'inbound' | 'outbound'
  content: string
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

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [convState, setConvState] = useState<'idle' | 'support' | 'order_lookup'>('idle')
  const [initialLoading, setInitialLoading] = useState(true)
  const [initialLoadingMsgs, setInitialLoadingMsgs] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [togglingState, setTogglingState] = useState(false)

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wasAtBottomRef = useRef(true)
  const selectedPhoneRef = useRef<string | null>(null)

  const isAtBottom = () => {
    const el = messagesContainerRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 60
  }

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
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

  useEffect(() => {
    if (messages.length === 0) return
    if (wasAtBottomRef.current) {
      requestAnimationFrame(() => scrollToBottom(!initialLoadingMsgs))
    }
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

  // ── Acciones ──────────────────────────────────────────────────────────────

  const markAsRead = (phone: string) => {
    try {
      const seen = JSON.parse(localStorage.getItem('wa_seen') ?? '{}')
      seen[phone] = new Date().toISOString()
      localStorage.setItem('wa_seen', JSON.stringify(seen))
      // Notificar al sidebar para que actualice el conteo
      window.dispatchEvent(new CustomEvent('wa-conversation-read'))
    } catch { /* silencioso */ }
  }

  const isUnread = (conv: Conversation) => {
    if (conv.last_direction !== 'inbound') return false
    try {
      const seen = JSON.parse(localStorage.getItem('wa_seen') ?? '{}')
      const lastSeen = seen[conv.customer_phone]
      if (!lastSeen) return true
      return new Date(conv.last_at) > new Date(lastSeen)
    } catch { return false }
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
    if (!selectedPhone || !replyText.trim() || sending) return
    setSending(true)
    wasAtBottomRef.current = true
    try {
      const res = await fetch('/api/admin/whatsapp/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: selectedPhone, message: replyText.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Error al enviar')
        return
      }
      setReplyText('')
      markAsRead(selectedPhone)
      await fetchMessages(selectedPhone)
      fetchConversations(true)
    } catch {
      toast.error('Error inesperado')
    } finally {
      setSending(false)
    }
  }

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

  // ── Render ────────────────────────────────────────────────────────────────

  const isSupport = convState === 'support'

  return (
    <div className="flex h-[calc(100vh-48px)] md:h-screen">

      {/* ── Lista de conversaciones ── */}
      <div className={`${selectedPhone ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-gray-200 flex-col bg-white`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h1 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
            <MessageSquare className="w-4 h-4 text-green-600" />
            Conversaciones
          </h1>
          <button
            onClick={() => fetchConversations()}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

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
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No hay conversaciones aún
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.customer_phone}
                onClick={() => handleSelect(conv.customer_phone)}
                className={`w-full text-left p-4 border-b border-gray-50 transition-colors ${
                  selectedPhone === conv.customer_phone
                    ? 'bg-green-50 border-l-[3px] border-l-green-500'
                    : isUnread(conv)
                      ? 'bg-blue-50/50 border-l-[3px] border-l-blue-400 hover:bg-blue-50'
                      : 'border-l-[3px] border-l-transparent hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm flex items-center gap-1.5 ${isUnread(conv) ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    +{conv.customer_phone}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {isUnread(conv) && selectedPhone !== conv.customer_phone && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    )}
                    {conv.state === 'support' && (
                      <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">
                        soporte
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{timeAgo(conv.last_at)}</span>
                  </div>
                </div>
                <p className={`text-xs truncate ${isUnread(conv) ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                  {conv.last_direction === 'outbound' ? '🤖 ' : '👤 '}
                  {conv.last_message}
                </p>
              </button>
            ))
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
                      className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm shadow-sm ${
                        msg.direction === 'outbound'
                          ? 'bg-green-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-900 rounded-bl-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <p className={`text-[10px] mt-0.5 ${msg.direction === 'outbound' ? 'text-green-200' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}
                        {new Date(msg.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                      </p>
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

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-200 flex items-end gap-2">
              <textarea
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
                disabled={sending || !replyText.trim()}
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
