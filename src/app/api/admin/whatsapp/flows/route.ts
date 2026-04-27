import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTenantBySlug, getTenantSlugFromRequest } from '@/lib/tenant'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function srvClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const SYSTEM_BUTTON_IDS: Record<string, string> = {
  products: 'btn_products',
  orders:   'btn_orders',
  support:  'btn_support',
}

function generateButtonId() {
  return 'flow_' + crypto.randomUUID().replace(/-/g, '').slice(0, 8)
}

export interface FlowStepData {
  id?:                 string
  button_id?:          string
  button_title:        string
  step_type:           'products' | 'orders' | 'support' | 'custom'
  response_text?:      string
  response_image_url?: string
  sort_order?:         number
  children?:           ChildStepData[]
}

export interface ChildStepData {
  id?:                 string
  button_id?:          string
  button_title:        string
  response_text?:      string
  response_image_url?: string
  sort_order?:         number
}

/**
 * GET /api/admin/whatsapp/flows
 * Devuelve los flujos del menú como árbol (top-level con hijos anidados).
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantSlug = getTenantSlugFromRequest(request)
  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const db = srvClient()
  const { data: rows, error } = await db
    .from('bot_flow_steps')
    .select('id, parent_id, button_id, button_title, step_type, response_text, response_image_url, sort_order')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const all = rows ?? []
  const top = all.filter((r) => !r.parent_id)
  const tree = top.map((parent) => ({
    ...parent,
    children: all
      .filter((r) => r.parent_id === parent.id)
      .sort((a, b) => a.sort_order - b.sort_order),
  }))

  return NextResponse.json(tree)
}

/**
 * PUT /api/admin/whatsapp/flows
 * Reemplaza todos los flujos del tenant con los enviados.
 * Body: FlowStepData[] (top-level con children anidados)
 */
export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantSlug = getTenantSlugFromRequest(request)
  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const steps: FlowStepData[] = await request.json()

  if (!Array.isArray(steps)) {
    return NextResponse.json({ error: 'Se esperaba un array de pasos' }, { status: 400 })
  }
  if (steps.length > 3) {
    return NextResponse.json({ error: 'Máximo 3 botones en el menú principal' }, { status: 400 })
  }

  const db = srvClient()

  // 1. Borrar todos los flujos existentes del tenant
  const { error: delError } = await db
    .from('bot_flow_steps')
    .delete()
    .eq('tenant_id', tenant.id)

  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 })

  if (steps.length === 0) return NextResponse.json({ success: true })

  // 2. Insertar top-level steps
  const topRows = steps.map((s, i) => ({
    tenant_id:          tenant.id,
    parent_id:          null,
    button_id:          s.step_type !== 'custom'
                          ? (SYSTEM_BUTTON_IDS[s.step_type] ?? generateButtonId())
                          : (s.button_id ?? generateButtonId()),
    button_title:       s.button_title.substring(0, 20),
    step_type:          s.step_type,
    response_text:      s.step_type === 'custom' ? (s.response_text ?? null) : null,
    response_image_url: s.step_type === 'custom' ? (s.response_image_url ?? null) : null,
    sort_order:         i,
    is_active:          true,
  }))

  const { data: inserted, error: insError } = await db
    .from('bot_flow_steps')
    .insert(topRows)
    .select('id, sort_order')

  if (insError) return NextResponse.json({ error: insError.message }, { status: 500 })

  // 3. Insertar children
  const childRows: object[] = []
  for (const parent of inserted ?? []) {
    const step = steps[parent.sort_order]
    const children = step?.children ?? []
    children.slice(0, 3).forEach((c, ci) => {
      childRows.push({
        tenant_id:          tenant.id,
        parent_id:          parent.id,
        button_id:          c.button_id ?? generateButtonId(),
        button_title:       c.button_title.substring(0, 20),
        step_type:          'custom',
        response_text:      c.response_text ?? null,
        response_image_url: c.response_image_url ?? null,
        sort_order:         ci,
        is_active:          true,
      })
    })
  }

  if (childRows.length > 0) {
    const { error: childError } = await db
      .from('bot_flow_steps')
      .insert(childRows)
    if (childError) return NextResponse.json({ error: childError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
