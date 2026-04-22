'use client'

import { useState } from 'react'
import { Lock, Store } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        toast.error(error.message === 'Email not confirmed'
          ? 'El correo no está confirmado. Contacta al administrador.'
          : 'Credenciales incorrectas')
        return
      }

      // window.location fuerza un reload completo para que las cookies de sesión
      // lleguen correctamente en la primera petición al dashboard
      window.location.href = '/admin/dashboard'
    } catch {
      toast.error('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Store className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">Mi Tienda</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            <Lock className="w-4 h-4" />
            <span>Panel de Administración</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="admin@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" loading={loading} size="lg" className="w-full mt-6">
            Iniciar sesión
          </Button>
        </form>
      </div>
    </div>
  )
}
