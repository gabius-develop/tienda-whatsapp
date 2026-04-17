'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Radio, Copy, Share2, StopCircle, ExternalLink } from 'lucide-react'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'

const JitsiEmbed = dynamic(() => import('@/components/live/JitsiEmbed'), { ssr: false })

interface LiveState {
  active: boolean
  room: string | null
  started_at: string | null
}

export default function AdminLivePage() {
  const [live, setLive] = useState<LiveState>({ active: false, room: null, started_at: null })
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [stopping, setStopping] = useState(false)
  const [elapsed, setElapsed] = useState('')

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const publicLiveUrl = `${appUrl}/live`

  const fetchStatus = useCallback(async () => {
    const res = await fetch('/api/live')
    const data = await res.json()
    setLive(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  // Contador de tiempo en vivo
  useEffect(() => {
    if (!live.active || !live.started_at) { setElapsed(''); return }
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(live.started_at!).getTime()) / 1000)
      const h = Math.floor(diff / 3600).toString().padStart(2, '0')
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0')
      const s = (diff % 60).toString().padStart(2, '0')
      setElapsed(`${h}:${m}:${s}`)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [live.active, live.started_at])

  const generateRoomName = () => {
    const id = Math.random().toString(36).substring(2, 10)
    return `tienda-en-vivo-${id}`
  }

  const handleStart = async () => {
    setStarting(true)
    const room = generateRoomName()
    try {
      const res = await fetch('/api/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room }),
      })
      if (!res.ok) throw new Error()
      setLive({ active: true, room, started_at: new Date().toISOString() })
      toast.success('¡Transmisión iniciada!')
    } catch {
      toast.error('Error al iniciar la transmisión')
    } finally {
      setStarting(false)
    }
  }

  const handleStop = async () => {
    if (!confirm('¿Seguro que quieres terminar la transmisión?')) return
    setStopping(true)
    try {
      await fetch('/api/live', { method: 'DELETE' })
      setLive({ active: false, room: null, started_at: null })
      toast.success('Transmisión terminada')
    } catch {
      toast.error('Error al terminar la transmisión')
    } finally {
      setStopping(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(publicLiveUrl)
    toast.success('Link copiado')
  }

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `🔴 ¡Estamos en vivo! Únete a nuestra transmisión para ver los mejores productos y ofertas en tiempo real.\n\n👉 ${publicLiveUrl}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-48 bg-white rounded-2xl animate-pulse border border-gray-100" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Radio className="w-7 h-7 text-red-500" />
          Transmisión en vivo
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Vende tus productos en tiempo real. Los clientes se unen desde un link.
        </p>
      </div>

      {!live.active ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center max-w-lg mx-auto">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Radio className="w-12 h-12 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No hay transmisión activa</h2>
          <p className="text-gray-500 text-sm mb-8">
            Al iniciar, el navegador pedirá acceso a tu cámara y micrófono. Comparte el link con tus clientes por WhatsApp.
          </p>
          <button
            onClick={handleStart}
            disabled={starting}
            className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold py-4 px-8 rounded-2xl text-lg transition-colors shadow-lg shadow-red-200"
          >
            <Radio className="w-6 h-6" />
            {starting ? 'Iniciando...' : 'Iniciar transmisión'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Barra de estado */}
          <div className="bg-red-600 rounded-2xl p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <span className="font-bold text-lg">EN VIVO</span>
              {elapsed && (
                <span className="bg-red-700 px-3 py-1 rounded-full text-sm font-mono">{elapsed}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Jitsi via External API */}
            <div className="lg:col-span-2 bg-black rounded-2xl overflow-hidden" style={{ height: '480px' }}>
              <JitsiEmbed
                room={live.room!}
                displayName="Vendedor"
                isHost={true}
              />
            </div>

            {/* Panel lateral */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Link para los clientes
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 break-all mb-3">
                  {publicLiveUrl}
                </div>
                <div className="space-y-2">
                  <button
                    onClick={copyLink}
                    className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar link
                  </button>
                  <button
                    onClick={shareWhatsApp}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
                  >
                    <Share2 className="w-4 h-4" />
                    Compartir por WhatsApp
                  </button>
                  <a
                    href={publicLiveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 border border-blue-200 text-blue-600 hover:bg-blue-50 font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver como cliente
                  </a>
                </div>
              </div>

              <button
                onClick={handleStop}
                disabled={stopping}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-2xl transition-colors"
              >
                <StopCircle className="w-5 h-5" />
                {stopping ? 'Terminando...' : 'Terminar transmisión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
