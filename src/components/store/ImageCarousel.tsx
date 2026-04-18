'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageCarouselProps {
  images: string[]
  alt: string
}

export default function ImageCarousel({ images, alt }: ImageCarouselProps) {
  const [current, setCurrent] = useState(0)

  const prev = useCallback(() => {
    setCurrent((c) => (c === 0 ? images.length - 1 : c - 1))
  }, [images.length])

  const next = useCallback(() => {
    setCurrent((c) => (c === images.length - 1 ? 0 : c + 1))
  }, [images.length])

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gray-50 flex items-center justify-center text-8xl">
        📦
      </div>
    )
  }

  if (images.length === 1) {
    return (
      <div className="aspect-square relative bg-gray-50">
        <Image src={images[0]} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Main image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <Image
          key={current}
          src={images[current]}
          alt={`${alt} - imagen ${current + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={current === 0}
        />

        {/* Arrow buttons */}
        <button
          onClick={prev}
          aria-label="Imagen anterior"
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={next}
          aria-label="Imagen siguiente"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Ir a imagen ${i + 1}`}
              className={`w-2 h-2 rounded-full transition-all ${
                i === current ? 'bg-white scale-125' : 'bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 p-3 overflow-x-auto">
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
              i === current ? 'border-green-500' : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <Image src={src} alt={`Miniatura ${i + 1}`} fill className="object-cover" sizes="64px" />
          </button>
        ))}
      </div>
    </div>
  )
}
