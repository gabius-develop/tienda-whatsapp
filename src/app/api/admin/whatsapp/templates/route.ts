import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTenantBySlug, getTenantSlugFromRequest } from '@/lib/tenant'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { fetchMetaTemplates, sendTemplateMessage } from '@/lib/whatsapp-cloud'

function srvClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/**
 * GET /api/admin/whatsapp/templates
 * Obtiene las plantillas aprobadas desde Meta Business (requiere waba_id).
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantSlug = getTenantSlugFromRequest(request)
  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const db = srvClient()
  const { data: cfg } = await db
    .from('whatsapp_bot_config')
    .select('waba_id, access_token')
    .eq('tenant_id', tenant.id)
    .single()

  if (!cfg?.waba_id || !cfg?.access_token) {
    return NextResponse.json({ templates: [], error: 'Falta el WABA ID o el Access Token en la configuración del bot.' })
  }

  const templates = await fetchMetaTemplates(cfg.waba_id, cfg.access_token)
  return NextResponse.json({ templates })
}

/**
 * POST /api/admin/whatsapp/templates
 * Envía una plantilla aprobada a un número de teléfono.
 * Body: { to, templateName, languageCode, bodyParams?, headerParams? }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantSlug = getTenantSlugFromRequest(request)
  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const body = await request.json()
  const { to, templateName, languageCode, bodyParams, headerParams } = body

  if (!to || !templateName || !languageCode) {
    return NextResponse.json(
      { error: 'Faltan campos requeridos: to, templateName, languageCode' },
      { status: 400 },
    )
  }

  // Limpiar el número de teléfono (quitar +, espacios, guiones)
  const cleanPhone = String(to).replace(/[\s\-\(\)\+]/g, '')
  if (!/^\d{7,15}$/.test(cleanPhone)) {
    return NextResponse.json({ error: 'Número de teléfono inválido' }, { status: 400 })
  }

  const db = srvClient()
  const { data: cfg } = await db
    .from('whatsapp_bot_config')
    .select('phone_number_id, access_token')
    .eq('tenant_id', tenant.id)
    .single()

  if (!cfg?.phone_number_id || !cfg?.access_token) {
    return NextResponse.json({ error: 'El bot no está configurado' }, { status: 400 })
  }

  const ok = await sendTemplateMessage(
    cfg.phone_number_id,
    cfg.access_token,
    cleanPhone,
    templateName,
    languageCode,
    Array.isArray(bodyParams) ? bodyParams.filter(Boolean) : [],
    Array.isArray(headerParams) ? headerParams.filter(Boolean) : [],
  )

  if (!ok) {
    return NextResponse.json({ error: 'Error al enviar la plantilla. Revisa el nombre, idioma y parámetros.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
