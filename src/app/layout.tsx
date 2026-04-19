import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mi Tienda Online',
  description: 'Encuentra los mejores productos al mejor precio',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geist.className} bg-gray-50 antialiased`}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              padding: '14px 18px',
              maxWidth: '90vw',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            },
            success: {
              iconTheme: { primary: '#16a34a', secondary: '#fff' },
              style: { background: '#f0fdf4', color: '#15803d', border: '1.5px solid #86efac' },
            },
            error: {
              iconTheme: { primary: '#dc2626', secondary: '#fff' },
              style: { background: '#fef2f2', color: '#b91c1c', border: '1.5px solid #fca5a5' },
            },
          }}
        />
      </body>
    </html>
  )
}
