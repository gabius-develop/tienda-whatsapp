import { redirect } from 'next/navigation'

/** /admin → redirige automáticamente al dashboard */
export default function AdminRoot() {
  redirect('/admin/dashboard')
}
