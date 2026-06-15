'use client'

import { cn } from '@/lib/utils'

interface CategoryFilterProps {
  categories: string[]
  selected: string | null
  onSelect: (category: string | null) => void
}

export default function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 sm:flex-wrap">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap shrink-0',
          selected === null
            ? 'sp-btn shadow-sm'
            : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:shadow-sm active:scale-95'
        )}
      >
        Todos
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={cn(
            'px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap shrink-0',
            selected === category
              ? 'sp-btn shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:shadow-sm active:scale-95'
          )}
        >
          {category}
        </button>
      ))}
    </div>
  )
}
