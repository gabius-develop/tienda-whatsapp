'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Code2, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const forbidden = searchParams.get('error') === 'forbidden'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('Credenciales incorrectas')
      setLoading(false)
      return
    }

    router.push('/superadmin/settings')
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
              Tu cuenta no tiene permisos de super administrador
            </p>
          )}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="developer@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />
          <Button
            type="submit"
            loading={loading}
            size="lg"
            className="w-full mt-6 bg-purple-600 hover:bg-purple-700"
          >
            Ingresar
          </Button>
        </form>
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
