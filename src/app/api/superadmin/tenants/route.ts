import { NextRequest, NextResponse } from 'next/server'
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

// GET — lista todos los tenants
export async function GET(request: NextRequest) {
  if (!(await verifySuperadmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST — crear nuevo tenant
export async function POST(request: NextRequest) {
  if (!(await verifySuperadmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { name, slug, whatsapp_phone, feature_live, feature_competencia, admin_email } = body

  if (!name || !slug) {
    return NextResponse.json({ error: 'name y slug son requeridos' }, { status: 400 })
  }

  // Validar slug: solo letras, números y guiones
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'El slug solo puede contener letras minúsculas, números y guiones' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('tenants')
    .insert([{
      name,
      slug,
      whatsapp_phone: whatsapp_phone ?? null,
      feature_live: feature_live ?? false,
      feature_competencia: feature_competencia ?? false,
      admin_email: admin_email ?? null,
      mercadopago_access_token: body.mercadopago_access_token ?? null,
      is_active: true,
    }])
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Este slug ya está en uso' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Crear usuario en Supabase Auth si se proporcionó email
  let tempPassword: string | null = null
  if (admin_email) {
    tempPassword = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6).toUpperCase() + '!'

    const { error: createError } = await supabase.auth.admin.createUser({
      email: admin_email,
      password: tempPassword,
      email_confirm: true,
    })

    if (createError) {
      // El usuario puede ya existir — buscar y actualizar el password
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const existingUser = users.find((u) => u.email === admin_email)

      if (existingUser) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          { password: tempPassword }
        )
        if (updateError) {
          console.error('Error actualizando password:', updateError.message)
          tempPassword = null
        }
        // Si el update fue exitoso, tempPassword es válido
      } else {
        console.error('Error creando usuario Auth:', createError.message)
        tempPassword = null
      }
    }
  }

  return NextResponse.json({ ...data, temp_password: tempPassword }, { status: 201 })
}
