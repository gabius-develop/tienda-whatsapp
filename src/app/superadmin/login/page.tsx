'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Code2, Lock, Mail, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const forbidden = searchParams.get('error') === 'forbidden'

  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }
    router.push('/superadmin/settings')
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const appUrl = window.location.origin
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${appUrl}/auth/callback?next=/superadmin/settings` },
    })
    if (error) {
      toast.error(error.status === 429 ? 'Demasiados intentos. Espera unos minutos.' : 'Error al enviar el link.')
      setLoading(false)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-sm border border-gray-800 text-center">
          <CheckCircle className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">¡Link enviado!</h2>
          <p className="text-gray-400 text-sm mb-4">
            Revisa tu correo <span className="text-purple-400 font-medium">{email}</span> y
            da clic en el link para acceder. Da clic inmediatamente, expira en 1 hora.
          </p>
          <button onClick={() => { setSent(false); setMode('password') }}
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← Volver al login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-sm border border-gray-800">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Code2 className="w-8 h-8 text-purple-400" />
            <span className="text-2xl font-bold text-white">Super Admin</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            <Lock className="w-4 h-4" />
            <span>Acceso solo para el desarrollador</span>
          </div>
          {forbidden && (
            <p className="mt-3 text-sm text-red-400 bg-red-950 rounded-lg px-3 py-2">
              Esta cuenta no tiene permisos de super administrador
            </p>
          )}
        </div>

        {/* Mode toggle */}
        <div className="flex bg-gray-800 rounded-lg p-1 mb-6">
          <button
            onClick={() => setMode('password')}
            className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-colors ${
              mode === 'password' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Contraseña
          </button>
          <button
            onClick={() => setMode('magic')}
            className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-colors ${
              mode === 'magic' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Link por email
          </button>
        </div>

        {/* Password form */}
        {mode === 'password' && (
          <form onSubmit={handlePassword} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-400">Correo</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="tu-correo@gmail.com" required
                className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-400">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 pr-10 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" loading={loading} size="lg" className="w-full bg-purple-600 hover:bg-purple-700 mt-2">
              Ingresar
            </Button>
          </form>
        )}

        {/* Magic link form */}
        {mode === 'magic' && (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-400">Correo del desarrollador</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="tu-correo@gmail.com" required
                className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <Button type="submit" loading={loading} size="lg" className="w-full bg-purple-600 hover:bg-purple-700">
              <Mail className="w-5 h-5" />
              Enviar link de acceso
            </Button>
            <p className="text-gray-600 text-xs text-center">
              Da clic en el link inmediatamente, expira en 1 hora.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

export default function SuperAdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
