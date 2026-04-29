'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, LogOut, Store, ShoppingBag, Megaphone, Radio, BarChart2, Settings, Bot, MessageSquare, X, BellOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  highlight?: boolean
  badge?: number
}

interface ConvSummary {
  customer_phone: string
  last_direction: string
  last_at: string
}

const LS_KEY = 'wa_seen'

function getSeenMap(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') } catch { return {} }
}

function computeUnread(convs: ConvSummary[]): number {
  const seen = getSeenMap()
  return convs.filter(c =>
    c.last_direction === 'inbound' &&
    (!seen[c.customer_phone] || new Date(c.last_at) > new Date(seen[c.customer_phone]))
  ).length
}

function getUnreadPhones(convs: ConvSummary[]): Set<string> {
  const seen = getSeenMap()
  return new Set(
    convs
      .filter(c =>
        c.last_direction === 'inbound' &&
        (!seen[c.customer_phone] || new Date(c.last_at) > new Date(seen[c.customer_phone]))
      )
      .map(c => c.customer_phone)
  )
}

function sendBrowserNotification(count: number) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  try {
    new Notification(
      count === 1 ? '💬 Nuevo mensaje de WhatsApp' : `💬 ${count} mensajes nuevos de WhatsApp`,
      {
        body: 'Tienes conversaciones pendientes de atender en tu tienda.',
        tag: 'wa-unread',
      }
    )
  } catch { /* silencioso */ }
}

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [featureLive, setFeatureLive] = useState(false)
  const [featureCompetencia, setFeatureCompetencia] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default')

  const prevUnreadPhonesRef = useRef<Set<string>>(new Set())
  const isFirstPollRef = useRef(true)

  // Solicitar permiso de notificaciones al cargar (con delay para no ser intrusivo)
  useEffect(() => {
    if (typeof Notification === 'undefined') return
    setNotifPermission(Notification.permission)
    if (Notification.permission === 'default') {
      const t = setTimeout(async () => {
        const perm = await Notification.requestPermission()
        setNotifPermission(perm)
      }, 3000)
      return () => clearTimeout(t)
    }
  }, [])

  // Titulo del documento refleja mensajes sin leer
  useEffect(() => {
    const base = 'Admin Panel'
    document.title = unreadCount > 0 ? `(${unreadCount}) ${base}` : base
    return () => { document.title = base }
  }, [unreadCount])

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((s) => {
        setFeatureLive(s.feature_live === true)
        setFeatureCompetencia(s.feature_competencia === true)
      })
      .catch(() => {})
  }, [])

  // ── Conteo de no leídos + notificaciones de navegador ────────────────────

  const refreshUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/whatsapp/conversations')
      const data = await res.json()
      if (!Array.isArray(data)) return

      const count = computeUnread(data)
      setUnreadCount(count)

      const currentUnread = getUnreadPhones(data)

      // Solo notificar para mensajes que llegan durante la sesión activa
      if (!isFirstPollRef.current) {
        const newArrivals = [...currentUnread].filter(p => !prevUnreadPhonesRef.current.has(p))
        if (newArrivals.length > 0) {
          sendBrowserNotification(newArrivals.length)
        }
      }
      isFirstPollRef.current = false
      prevUnreadPhonesRef.current = currentUnread
    } catch { /* silencioso */ }
  }, [])

  useEffect(() => {
    refreshUnread()
    const interval = setInterval(refreshUnread, 30000)

    // Cuando el admin marca una conversación como leída, refrescar inmediatamente
    const handleRead = () => refreshUnread()
    window.addEventListener('wa-conversation-read', handleRead)

    return () => {
      clearInterval(interval)
      window.removeEventListener('wa-conversation-read', handleRead)
    }
  }, [refreshUnread])

  // Cerrar sidebar al navegar en móvil
  useEffect(() => { onClose() }, [pathname])

  const isActive = (href: string) => {
    if (href === '/admin/whatsapp') return pathname === '/admin/whatsapp'
    return pathname.startsWith(href)
  }

  const baseNavItems: NavItem[] = [
    { href: '/admin/dashboard',              label: 'Dashboard',      icon: LayoutDashboard },
    { href: '/admin/orders',                 label: 'Pedidos',        icon: ShoppingBag },
    { href: '/admin/products',               label: 'Productos',      icon: Package },
    { href: '/admin/promotions',             label: 'Promociones',    icon: Megaphone },
    { href: '/admin/whatsapp',               label: 'Bot WhatsApp',   icon: Bot },
    { href: '/admin/whatsapp/conversations', label: 'Conversaciones', icon: MessageSquare, badge: unreadCount },
    { href: '/admin/settings',               label: 'Configuración',  icon: Settings },
  ]

  const navItems: NavItem[] = [
    ...baseNavItems,
    ...(featureLive        ? [{ href: '/admin/live',         label: 'En Vivo',     icon: Radio,      highlight: true }] : []),
    ...(featureCompetencia ? [{ href: '/admin/competencia',  label: 'Competencia', icon: BarChart2 }] : []),
  ]

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const sidebarContent = (
    <aside className="w-64 bg-gray-900 min-h-full flex flex-col h-full">
      <div className="p-6 border-b border-gray-800 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-white" onClick={onClose}>
          <Store className="w-6 h-6 text-green-400" />
          <span className="font-bold text-lg">Mi Tienda</span>
        </Link>
        <button onClick={onClose} className="md:hidden text-gray-500 hover:text-white p-1">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, highlight, badge }) => {
          const active = isActive(href)
          const hasUnread = badge !== undefined && badge > 0 && !active
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-green-600 text-white'
                  : hasUnread
                    ? 'text-blue-200 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25'
                    : highlight
                      ? 'text-red-400 hover:bg-red-950 hover:text-red-300'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              {/* Ícono con efecto "sonar" cuando hay no leídos */}
              <div className="relative shrink-0">
                <Icon className="w-5 h-5" />
                {hasUnread && (
                  <>
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping opacity-80" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                  </>
                )}
              </div>

              <span className="flex-1">{label}</span>

              {/* Badge numérico de no leídos */}
              {hasUnread && (
                <span className="ml-auto min-w-[22px] h-[22px] bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1.5 shadow-md shadow-red-500/40">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}

              {highlight && !active && (
                <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-800 space-y-3">
        {/* Aviso si el usuario bloqueó las notificaciones */}
        {notifPermission === 'denied' && (
          <div className="flex items-start gap-2 bg-gray-800 rounded-lg px-3 py-2">
            <BellOff className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-500 leading-snug">
              Notificaciones bloqueadas. Actívalas en la configuración del navegador para recibir alertas.
            </p>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )

  return (
    <>
      <div className="hidden md:flex md:w-64 md:shrink-0">{sidebarContent}</div>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={onClose} />
      )}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 md:hidden transition-transform duration-200',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {sidebarContent}
      </div>
    </>
  )
}
