import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTenantBySlug, getTenantSlugFromRequest } from '@/lib/tenant'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { sendTemplateMessage } from '@/lib/whatsapp-cloud'

const WA_API_VERSION = 'v20.0'

function srvClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/**
 * GET /api/admin/whatsapp/templates
 * Obtiene plantillas desde Meta Business (requiere waba_id).
 * Retorna también rawData para debug del código de idioma exacto.
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
    return NextResponse.json({
      templates: [],
      error: 'Falta el WABA ID o el Access Token en la configuración del bot.',
    })
  }

  try {
    const url =
      `https://graph.facebook.com/${WA_API_VERSION}/${cfg.waba_id}/message_templates` +
      `?fields=name,status,language,category,components&limit=100`

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${cfg.access_token}` },
    })

    const json = await res.json()

    if (!res.ok) {
      console.error('[templates GET] Meta error:', JSON.stringify(json))
      return NextResponse.json({
        templates: [],
        error: `Meta respondió ${res.status}: ${json?.error?.message ?? 'error desconocido'}`,
      })
    }

    // Log completo para depuración en Railway
    console.log('[templates GET] raw de Meta:', JSON.stringify(json.data?.slice(0, 5)))

    const all: unknown[] = json.data ?? []

    // Normalizar: asegurar que language sea string
    const normalized = all.map((t: unknown) => {
      const tpl = t as Record<string, unknown>
      const lang = typeof tpl.language === 'string'
        ? tpl.language
        : typeof tpl.language === 'object' && tpl.language !== null
          ? (tpl.language as Record<string, string>).code ?? ''
          : ''
      return { ...tpl, language: lang }
    })

    const approved = normalized.filter((t) => (t as Record<string, unknown>).status === 'APPROVED')

    return NextResponse.json({
      templates: approved,
      rawData: all,  // incluye TODOS (aprobados y no) para debug
    })
  } catch (err) {
    console.error('[templates GET] fetch error:', err)
    return NextResponse.json({ templates: [], error: 'Error al conectar con Meta' })
  }
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

  // NO usar filter(Boolean) — Meta requiere el array completo de parámetros
  const bParams = Array.isArray(bodyParams)   ? bodyParams   : []
  const hParams = Array.isArray(headerParams) ? headerParams : []

  console.log('[templates POST] enviando plantilla:', {
    templateName,
    languageCode,
    to: cleanPhone,
    bodyParams: bParams,
    headerParams: hParams,
  })

  const ok = await sendTemplateMessage(
    cfg.phone_number_id,
    cfg.access_token,
    cleanPhone,
    templateName,
    languageCode,
    bParams,
    hParams,
  )

  if (!ok) {
    return NextResponse.json(
      { error: 'Meta rechazó la plantilla. Revisa los logs de Railway para ver el error exacto.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
