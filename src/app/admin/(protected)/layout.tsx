'use client'

import { useState } from 'react'
import { Menu, Store } from 'lucide-react'
import Sidebar from '@/components/admin/Sidebar'

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header móvil */}
        <header className="md:hidden bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white p-1"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-white">
            <Store className="w-5 h-5 text-green-400" />
            <span className="font-semibold text-sm">Panel Admin</span>
          </div>
        </header>

        <main className="flex-1 bg-gray-50 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
