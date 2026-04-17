import { NextRequest, NextResponse } from 'next/server'

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const expected = process.env.SUPERADMIN_PASSWORD

  if (!expected) {
    return NextResponse.json({ error: 'Superadmin no configurado' }, { status: 500 })
  }

  if (!password || password !== expected) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  const token = await hashPassword(password)
  const response = NextResponse.json({ ok: true })
  response.cookies.set('superadmin_auth', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: '/',
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set('superadmin_auth', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
  })
  return response
}
