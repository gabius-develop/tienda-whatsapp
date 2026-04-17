import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — cualquiera puede verificar si hay transmisión activa
export async function GET() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('store_settings')
    .select('key, value')
    .in('key', ['live_active', 'live_room', 'live_started_at'])

  const map: Record<string, string> = {}
  data?.forEach(({ key, value }) => { if (value) map[key] = value })

  return NextResponse.json({
    active: map['live_active'] === 'true',
    room: map['live_room'] ?? null,
    started_at: map['live_started_at'] ?? null,
  })
}

// POST — inicia la transmisión (requiere sesión admin)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { room } = await request.json()
  if (!room) return NextResponse.json({ error: 'room requerido' }, { status: 400 })

  const now = new Date().toISOString()
  const upserts = [
    { key: 'live_active', value: 'true', updated_at: now },
    { key: 'live_room', value: room, updated_at: now },
    { key: 'live_started_at', value: now, updated_at: now },
  ]

  await supabase.from('store_settings').upsert(upserts, { onConflict: 'key' })
  return NextResponse.json({ ok: true, room })
}

// DELETE — termina la transmisión (requiere sesión admin)
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date().toISOString()
  await supabase.from('store_settings').upsert([
    { key: 'live_active', value: 'false', updated_at: now },
    { key: 'live_room', value: '', updated_at: now },
  ], { onConflict: 'key' })

  return NextResponse.json({ ok: true })
}
