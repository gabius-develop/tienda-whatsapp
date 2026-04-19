'use client'

import { cn } from '@/lib/utils'

interface CategoryFilterProps {
  categories: string[]
  selected: string | null
  onSelect: (category: string | null) => void
}

export default function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none px-3 sm:px-0 sm:flex-wrap">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap shrink-0',
          selected === null
            ? 'bg-green-600 text-white'
            : 'bg-white text-gray-700 border border-gray-200 active:bg-gray-100'
        )}
      >
        Todos
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap shrink-0',
            selected === category
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-700 border border-gray-200 active:bg-gray-100'
          )}
        >
          {category}
        </button>
      ))}
    </div>
  )
}
