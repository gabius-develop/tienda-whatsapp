'use client'

import { Search } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar productos..."
        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white/15 backdrop-blur-sm text-white placeholder-white/50 border border-white/20 focus:outline-none focus:bg-white/25 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all"
      />
    </div>
  )
}
