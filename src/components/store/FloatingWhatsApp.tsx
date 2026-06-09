'use client'

import { MessageCircle } from 'lucide-react'

interface FloatingWhatsAppProps {
  phone: string
}

export default function FloatingWhatsApp({ phone }: FloatingWhatsAppProps) {
  if (!phone) return null

  const cleanPhone = phone.replace(/[^0-9]/g, '')
  const url = `https://wa.me/${cleanPhone}`

  return (
    <>
      {/* Móvil: botón sobre la barra del carrito */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="sm:hidden fixed bottom-20 left-4 z-50 flex flex-col items-center gap-1 transition-transform hover:scale-105"
        aria-label="Contactar por WhatsApp"
      >
        <div className="bg-[#25D366] hover:bg-[#1ebe57] text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center">
          <svg viewBox="0 0 32 32" className="w-7 h-7 fill-current">
            <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.129 6.744 3.047 9.378L1.054 31.29l6.118-1.96a15.923 15.923 0 008.832 2.674C24.826 32 32 24.826 32 16.004S24.826 0 16.004 0zm9.338 22.616c-.395 1.112-1.955 2.035-3.2 2.304-.852.181-1.964.325-5.708-1.227-4.793-1.987-7.876-6.845-8.115-7.163-.229-.318-1.925-2.563-1.925-4.888s1.218-3.468 1.65-3.94c.433-.472.945-.59 1.26-.59.315 0 .63.003.906.016.29.014.68-.11 1.064.812.395.945 1.345 3.27 1.463 3.508.118.237.197.513.04.827-.158.315-.237.512-.473.789-.237.276-.498.617-.71.828-.237.236-.484.493-.208.966.276.473 1.227 2.025 2.635 3.28 1.81 1.612 3.336 2.112 3.808 2.348.473.237.749.197 1.024-.118.276-.315 1.186-1.384 1.502-1.856.316-.473.631-.394 1.064-.237.433.158 2.755 1.3 3.228 1.535.473.237.788.355.906.551.118.197.118 1.133-.276 2.245z"/>
          </svg>
        </div>
        <span className="text-[10px] font-semibold text-[#25D366] bg-white rounded-full px-2 py-0.5 shadow-sm">Contáctanos</span>
      </a>

      {/* Desktop: botón flotante esquina inferior izquierda */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden sm:flex fixed bottom-6 left-6 z-50 flex-col items-center gap-1 transition-transform hover:scale-105"
        aria-label="Contactar por WhatsApp"
      >
        <div className="bg-[#25D366] hover:bg-[#1ebe57] text-white flex items-center gap-2 px-5 py-3.5 rounded-2xl shadow-lg">
          <svg viewBox="0 0 32 32" className="w-6 h-6 fill-current">
            <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.129 6.744 3.047 9.378L1.054 31.29l6.118-1.96a15.923 15.923 0 008.832 2.674C24.826 32 32 24.826 32 16.004S24.826 0 16.004 0zm9.338 22.616c-.395 1.112-1.955 2.035-3.2 2.304-.852.181-1.964.325-5.708-1.227-4.793-1.987-7.876-6.845-8.115-7.163-.229-.318-1.925-2.563-1.925-4.888s1.218-3.468 1.65-3.94c.433-.472.945-.59 1.26-.59.315 0 .63.003.906.016.29.014.68-.11 1.064.812.395.945 1.345 3.27 1.463 3.508.118.237.197.513.04.827-.158.315-.237.512-.473.789-.237.276-.498.617-.71.828-.237.236-.484.493-.208.966.276.473 1.227 2.025 2.635 3.28 1.81 1.612 3.336 2.112 3.808 2.348.473.237.749.197 1.024-.118.276-.315 1.186-1.384 1.502-1.856.316-.473.631-.394 1.064-.237.433.158 2.755 1.3 3.228 1.535.473.237.788.355.906.551.118.197.118 1.133-.276 2.245z"/>
          </svg>
          <span className="text-sm font-medium">WhatsApp</span>
        </div>
        <span className="text-xs font-semibold text-[#25D366]">Contáctanos</span>
      </a>
    </>
  )
}
