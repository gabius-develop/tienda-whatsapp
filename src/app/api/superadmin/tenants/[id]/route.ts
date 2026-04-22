import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

async function verifySuperadmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('superadmin_auth')?.value
  const superadminPassword = process.env.SUPERADMIN_PASSWORD
  if (!token || !superadminPassword) return false

  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(superadminPassword))
  const expectedToken = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return token === expectedToken
}

// GET — obtener un tenant
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await verifySuperadmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

// PUT — actualizar tenant (nombre, teléfono, features, email admin)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await verifySuperadmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { name, whatsapp_phone, feature_live, feature_competencia, admin_email, is_active } = body

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('tenants')
    .update({
      ...(name !== undefined && { name }),
      ...(whatsapp_phone !== undefined && { whatsapp_phone }),
      ...(feature_live !== undefined && { feature_live }),
      ...(feature_competencia !== undefined && { feature_competencia }),
      ...(admin_email !== undefined && { admin_email }),
      ...(is_active !== undefined && { is_active }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidateTag('tenants', {})
  return NextResponse.json(data)
}

// POST — resetear contraseña del admin del tenant
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await verifySuperadmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServiceClient()

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('admin_email, slug')
    .eq('id', id)
    .single()

  if (tenantError || !tenant?.admin_email) {
    return NextResponse.json({ error: 'Tenant sin email de admin configurado' }, { status: 400 })
  }

  const tempPassword = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6).toUpperCase() + '!'

  // Buscar usuario existente por email
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const existingUser = users.find((u) => u.email === tenant.admin_email)

  if (existingUser) {
    const { error } = await supabase.auth.admin.updateUserById(existingUser.id, { password: tempPassword })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    // Crear usuario si no existe
    const { error } = await supabase.auth.admin.createUser({
      email: tenant.admin_email,
      password: tempPassword,
      email_confirm: true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ temp_password: tempPassword, email: tenant.admin_email })
}

// DELETE — desactivar tenant (soft delete) o eliminar permanentemente (?permanent=true)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await verifySuperadmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const permanent = request.nextUrl.searchParams.get('permanent') === 'true'
  const supabase = createServiceClient()

  if (!permanent) {
    const { error } = await supabase
      .from('tenants')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Hard delete: eliminar todos los datos asociados al tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('admin_email')
    .eq('id', id)
    .single()

  // Eliminar datos en orden (respetando FK constraints)
  const steps = [
    supabase.from('store_settings').delete().eq('tenant_id', id),
    supabase.from('promotions').delete().eq('tenant_id', id),
    supabase.from('order_items').delete().eq('tenant_id', id),
    supabase.from('orders').delete().eq('tenant_id', id),
    supabase.from('products').delete().eq('tenant_id', id),
  ]
  for (const step of steps) {
    const { error } = await step
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Eliminar usuario de auth si existe
  if (tenant?.admin_email) {
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const authUser = users.find((u) => u.email === tenant.admin_email)
    if (authUser) {
      await supabase.auth.admin.deleteUser(authUser.id)
    }
  }

  const { error } = await supabase.from('tenants').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidateTag('tenants', {})
  return NextResponse.json({ success: true })
}
