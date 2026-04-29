'use client'

import { useCallback, useEffect, useState } from 'react'
import { Menu, Store, MessageSquare } from 'lucide-react'
import Sidebar from '@/components/admin/Sidebar'
import Link from 'next/link'

function computeUnreadFromData(convs: { customer_phone: string; last_direction: string; last_at: string }[]) {
  try {
    const seen: Record<string, string> = JSON.parse(localStorage.getItem('wa_seen') ?? '{}')
    return convs.filter(c =>
      c.last_direction === 'inbound' &&
      (!seen[c.customer_phone] || new Date(c.last_at) > new Date(seen[c.customer_phone]))
    ).length
  } catch { return 0 }
}

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/whatsapp/conversations')
      const data = await res.json()
      if (Array.isArray(data)) setUnreadCount(computeUnreadFromData(data))
    } catch { /* silencioso */ }
  }, [])

  useEffect(() => {
    refreshUnread()
    const interval = setInterval(refreshUnread, 30000)
    const onRead = () => refreshUnread()
    window.addEventListener('wa-conversation-read', onRead)
    return () => { clearInterval(interval); window.removeEventListener('wa-conversation-read', onRead) }
  }, [refreshUnread])

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header móvil */}
        <header className="md:hidden bg-gray-900 border-b border-gray-800 sticky top-0 z-30">
          <div className="px-4 py-3 flex items-center gap-3">
            {/* Botón hamburguesa con sonar cuando hay no leídos */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="relative text-gray-400 hover:text-white p-1 shrink-0"
            >
              <Menu className="w-5 h-5" />
              {unreadCount > 0 && (
                <>
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75" />
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2 text-white flex-1 min-w-0">
              <Store className="w-5 h-5 text-green-400 shrink-0" />
              <span className="font-semibold text-sm">Panel Admin</span>
            </div>

            {/* Acceso rápido a conversaciones desde el header */}
            {unreadCount > 0 && (
              <Link
                href="/admin/whatsapp/conversations"
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {unreadCount} nuevo{unreadCount !== 1 ? 's' : ''}
              </Link>
            )}
          </div>

          {/* Banner de alerta debajo del header cuando hay mensajes */}
          {unreadCount > 0 && (
            <div className="bg-blue-600/90 px-4 py-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shrink-0" />
              <p className="text-white text-xs font-medium">
                {unreadCount === 1
                  ? 'Tienes 1 mensaje de WhatsApp sin leer'
                  : `Tienes ${unreadCount} mensajes de WhatsApp sin leer`}
              </p>
            </div>
          )}
        </header>

        <main className="flex-1 bg-gray-50 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
