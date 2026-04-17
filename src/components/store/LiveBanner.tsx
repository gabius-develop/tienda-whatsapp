'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Radio } from 'lucide-react'

export default function LiveBanner() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    fetch('/api/live')
      .then(r => r.json())
      .then(data => setActive(data.active))
      .catch(() => {})
  }, [])

  if (!active) return null

  return (
    <Link
      href="/live"
      className="flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-2xl mb-6 transition-colors group"
    >
      <span className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
        <span className="font-bold text-sm uppercase tracking-wide">En Vivo ahora</span>
      </span>
      <span className="text-red-200 text-sm">
        ¡Únete a la transmisión y compra en tiempo real!
      </span>
      <Radio className="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" />
    </Link>
  )
}
