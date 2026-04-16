'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Promotion } from '@/types'

const BADGE_COLORS: Record<string, string> = {
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-400',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
}

export default function PromotionsBanner() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    fetch('/api/promotions')
      .then((r) => r.json())
      .then((data) => setPromotions(data ?? []))
  }, [])

  useEffect(() => {
    if (promotions.length <= 1) return
    const timer = setInterval(() => setCurrent((c) => (c + 1) % promotions.length), 5000)
    return () => clearInterval(timer)
  }, [promotions.length])

  if (promotions.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Promociones</h2>
      <div className="relative overflow-hidden rounded-2xl">
        {promotions.map((promo, i) => (
          <div
            key={promo.id}
            className={`transition-opacity duration-500 ${i === current ? 'block' : 'hidden'}`}
          >
            <div className="relative bg-gradient-to-r from-gray-900 to-gray-700 rounded-2xl overflow-hidden min-h-[140px]">
              {promo.image_url && (
                <Image
                  src={promo.image_url}
                  alt={promo.title}
                  fill
                  className="object-cover opacity-60"
                  sizes="(max-width: 768px) 100vw, 1200px"
                />
              )}
              <div className="relative z-10 p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{promo.title}</h3>
                  {promo.description && (
                    <p className="text-white/80 text-sm max-w-md">{promo.description}</p>
                  )}
                </div>
                {promo.discount_label && (
                  <div className={`flex-shrink-0 ml-4 ${BADGE_COLORS[promo.badge_color] ?? 'bg-green-500'} text-white font-bold text-lg px-5 py-3 rounded-xl text-center shadow-lg`}>
                    {promo.discount_label}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Dots navigation */}
        {promotions.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2">
            {promotions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === current ? 'bg-green-600' : 'bg-gray-300'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
