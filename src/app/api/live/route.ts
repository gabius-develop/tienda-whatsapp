import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — cualquiera puede verificar si hay transmisión activa
export async function GET() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('store_settings')
    .select('key, value')
    .in('key', ['live_active', 'live_room_url', 'live_started_at'])

  const map: Record<string, string> = {}
  data?.forEach(({ key, value }) => { if (value) map[key] = value })

  return NextResponse.json({
    active: map['live_active'] === 'true',
    room_url: map['live_room_url'] ?? null,
    started_at: map['live_started_at'] ?? null,
  })
}

// POST — inicia la transmisión creando una sala en Daily.co
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dailyKey = process.env.DAILY_API_KEY
  if (!dailyKey) {
    return NextResponse.json({ error: 'DAILY_API_KEY no configurado' }, { status: 500 })
  }

  // 1. Crear sala en Daily.co
  const roomName = `tienda-live-${Date.now()}`
  const roomRes = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${dailyKey}`,
    },
    body: JSON.stringify({
      name: roomName,
      properties: {
        exp: Math.floor(Date.now() / 1000) + 12 * 3600, // expira en 12h
        enable_chat: true,
        enable_knocking: false,
        start_video_off: false,
        start_audio_off: false,
      },
    }),
  })

  if (!roomRes.ok) {
    const err = await roomRes.text()
    return NextResponse.json({ error: `Daily.co: ${err}` }, { status: 500 })
  }

  const room = await roomRes.json()

  // 2. Crear token de anfitrión
  const tokenRes = await fetch('https://api.daily.co/v1/meeting-tokens', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${dailyKey}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        is_owner: true,
        start_video_off: false,
        start_audio_off: false,
      },
    }),
  })

  const { token: hostToken } = await tokenRes.json()

  // 3. Guardar estado en store_settings
  const now = new Date().toISOString()
  await supabase.from('store_settings').upsert([
    { key: 'live_active', value: 'true', updated_at: now },
    { key: 'live_room_url', value: room.url, updated_at: now },
    { key: 'live_started_at', value: now, updated_at: now },
  ], { onConflict: 'key' })

  return NextResponse.json({ room_url: room.url, host_token: hostToken })
}

// DELETE — termina la transmisión
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date().toISOString()
  await supabase.from('store_settings').upsert([
    { key: 'live_active', value: 'false', updated_at: now },
    { key: 'live_room_url', value: '', updated_at: now },
  ], { onConflict: 'key' })

  return NextResponse.json({ ok: true })
}
