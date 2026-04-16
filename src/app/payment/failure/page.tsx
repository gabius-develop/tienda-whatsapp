import Link from 'next/link'
import { XCircle } from 'lucide-react'

export default function PaymentFailurePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-10 text-center max-w-md w-full shadow-sm border border-gray-100">
        <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pago no completado</h1>
        <p className="text-gray-500 mb-6">
          Hubo un problema con tu pago. Puedes intentarlo de nuevo o contactarnos por WhatsApp.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/cart"
            className="inline-flex items-center justify-center bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            Reintentar
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  )
}
