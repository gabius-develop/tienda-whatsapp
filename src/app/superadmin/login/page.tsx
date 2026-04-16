'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Code2, Lock, Mail, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { Suspense } from 'react'

function LoginForm() {
  const searchParams = useSearchParams()
  const forbidden = searchParams.get('error') === 'forbidden'
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${appUrl}/superadmin/settings`,
      },
    })

    if (error) {
      toast.error('Error al enviar el link. Verifica tu correo.')
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
            da clic en el link para acceder al panel.
          </p>
          <p className="text-gray-600 text-xs">
            Si no lo ves, revisa la carpeta de spam.
          </p>
          <button
            onClick={() => setSent(false)}
            className="mt-6 text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            Usar otro correo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-sm border border-gray-800">
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

        <form onSubmit={handleMagicLink} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-400">
              Correo electrónico del desarrollador
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu-correo@gmail.com"
              required
              className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <Button
            type="submit"
            loading={loading}
            size="lg"
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Mail className="w-5 h-5" />
            Enviar link de acceso
          </Button>
        </form>

        <p className="text-gray-600 text-xs text-center mt-4">
          Recibirás un link en tu correo para entrar sin contraseña.
          Solo funciona con el correo configurado como super admin.
        </p>
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
