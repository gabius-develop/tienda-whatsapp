import { unstable_cache } from 'next/cache'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export interface Tenant {
  id: string
  name: string
  slug: string
  whatsapp_phone: string | null
  feature_live: boolean
  feature_competencia: boolean
  is_active: boolean
  admin_email: string | null
}

function createPublicSupabaseClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const getTenantBySlug = unstable_cache(
  async (slug: string): Promise<Tenant | null> => {
    const supabase = createPublicSupabaseClient()
    const { data } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .single()
    return data ?? null
  },
  ['tenant-by-slug'],
  { revalidate: 60 }
)

export function getTenantSlugFromRequest(request: { headers: { get(name: string): string | null } }): string {
  return request.headers.get('x-tenant-slug') ?? process.env.DEFAULT_TENANT_SLUG ?? 'default'
}
