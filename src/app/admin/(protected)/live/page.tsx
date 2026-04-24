'use client'

import { useState, useEffect, useCallback } from 'react'
import { Radio, Copy, Share2, StopCircle, ExternalLink, PlayCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface LiveState {
  active: boolean
  youtube_id: string | null
  started_at: string | null
}

export default function AdminLivePage() {
  const [live, setLive] = useState<LiveState>({ active: false, youtube_id: null, started_at: null })
  const [loading, setLoading] = useState(true)
  const [youtubeUrl, setPlayCircleUrl] = useState('')
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

  const handleStart = async () => {
    if (!youtubeUrl.trim()) {
      toast.error('Pega el link de YouTube primero')
      return
    }
    setStarting(true)
    try {
      const res = await fetch('/api/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_url: youtubeUrl }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'URL no válida')
        return
      }
      setLive({ active: true, youtube_id: data.youtube_id, started_at: new Date().toISOString() })
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
      setLive({ active: false, youtube_id: null, started_at: null })
      setPlayCircleUrl('')
      toast.success('Transmisión terminada')
    } catch {
      toast.error('Error al terminar')
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
      `🔴 ¡Estamos en vivo! Únete para ver productos y ofertas en tiempo real.\n\n👉 ${publicLiveUrl}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="h-48 bg-white rounded-2xl animate-pulse border border-gray-100" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Radio className="w-7 h-7 text-red-500" />
          Transmisión en vivo
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Transmite desde YouTube y comparte el link con tus clientes.
        </p>
      </div>

      {!live.active ? (
        <div className="space-y-6 max-w-2xl">
          {/* Instrucciones */}
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
            <h2 className="font-semibold text-red-800 flex items-center gap-2 mb-3">
              <PlayCircle className="w-5 h-5" />
              Cómo iniciar tu transmisión
            </h2>
            <ol className="space-y-2 text-sm text-red-700 list-decimal list-inside">
              <li>Entra a <strong>YouTube Studio</strong> (studio.youtube.com)</li>
              <li>Haz clic en <strong>"Crear → Iniciar transmisión en directo"</strong></li>
              <li>En <strong>"Más opciones" → "Latencia"</strong> → selecciona <strong>"Ultra baja latencia"</strong> (reduce el delay a ~2s)</li>
              <li>Configura tu stream y haz clic en <strong>"Ir al directo"</strong></li>
              <li>Copia la URL de la página (ej: youtube.com/watch?v=XXXX)</li>
              <li>Pégala abajo y haz clic en <strong>"Publicar transmisión"</strong></li>
            </ol>
          </div>

          {/* Input de URL */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Link de YouTube Live
            </label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setPlayCircleUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
            />
            <p className="text-xs text-gray-400 mt-2">
              También acepta: youtu.be/XXXX o youtube.com/live/XXXX
            </p>
            <button
              onClick={handleStart}
              disabled={starting || !youtubeUrl.trim()}
              className="mt-4 w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
            >
              <Radio className="w-6 h-6" />
              {starting ? 'Publicando...' : 'Publicar transmisión'}
            </button>
          </div>
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
            <PlayCircle className="w-6 h-6 opacity-80" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Preview del stream */}
            <div className="lg:col-span-2 bg-black rounded-2xl overflow-hidden" style={{ height: '400px' }}>
              <iframe
                src={`https://www.youtube.com/embed/${live.youtube_id}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&color=white`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
                title="Stream en vivo"
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
