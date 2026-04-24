'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageSquare, Phone, RefreshCw, Bot, User } from 'lucide-react'

interface Conversation {
  customer_phone: string
  last_message: string
  last_direction: string
  last_at: string
  message_count: number
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
  const [loading, setLoading] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadConversations = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/whatsapp/conversations')
      const data = await res.json()
      setConversations(Array.isArray(data) ? data : [])
    } catch {
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (phone: string) => {
    setLoadingMsgs(true)
    try {
      const res = await fetch(`/api/admin/whatsapp/conversations?phone=${encodeURIComponent(phone)}`)
      const data = await res.json()
      setMessages(Array.isArray(data) ? data : [])
    } catch {
      setMessages([])
    } finally {
      setLoadingMsgs(false)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSelect = (phone: string) => {
    setSelectedPhone(phone)
    loadMessages(phone)
  }

  return (
    <div className="flex h-[calc(100vh-0px)]">

      {/* ── Panel izquierdo: lista de conversaciones ── */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h1 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
            <MessageSquare className="w-4 h-4 text-green-600" />
            Conversaciones
          </h1>
          <button
            onClick={loadConversations}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-gray-400 text-sm">Cargando...</div>
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
                className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                  selectedPhone === conv.customer_phone
                    ? 'bg-green-50 border-l-[3px] border-l-green-500'
                    : 'border-l-[3px] border-l-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 text-sm flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    +{conv.customer_phone}
                  </span>
                  <span className="text-xs text-gray-400">{timeAgo(conv.last_at)}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {conv.last_direction === 'outbound' ? '🤖 ' : '👤 '}
                  {conv.last_message}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{conv.message_count} mensajes</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Panel derecho: mensajes ── */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedPhone ? (
          <>
            {/* Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Phone className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">+{selectedPhone}</p>
                <p className="text-xs text-gray-400">{messages.length} mensajes</p>
              </div>
              <button
                onClick={() => loadMessages(selectedPhone)}
                className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
                title="Actualizar mensajes"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingMsgs ? (
                <div className="text-center text-gray-400 text-sm pt-8">Cargando mensajes...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-400 text-sm pt-8">No hay mensajes</div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.direction === 'inbound' && (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mb-1">
                        <User className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                    )}
                    <div
                      className={`max-w-xs lg:max-w-md px-3.5 py-2.5 rounded-2xl text-sm shadow-sm ${
                        msg.direction === 'outbound'
                          ? 'bg-green-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-900 rounded-bl-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${msg.direction === 'outbound' ? 'text-green-200' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('es-MX', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {' · '}
                        {new Date(msg.created_at).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                        })}
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <MessageSquare className="w-14 h-14 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Selecciona una conversación</p>
              <p className="text-xs mt-1 opacity-60">para ver los mensajes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
