import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-10 text-center max-w-md w-full shadow-sm border border-gray-100">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Pago realizado!</h1>
        <p className="text-gray-500 mb-6">
          Tu pago fue aprobado. Nos comunicaremos contigo por WhatsApp para coordinar el envío.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  )
}
