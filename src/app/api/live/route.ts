import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTenantBySlug, getTenantSlugFromRequest } from '@/lib/tenant'

function extractYouTubeId(input: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const pattern of patterns) {
    const match = input.trim().match(pattern)
    if (match) return match[1]
  }
  return null
}

// GET — verifica si hay transmisión activa
export async function GET(request: NextRequest) {
  const tenantSlug = getTenantSlugFromRequest(request)
  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) return NextResponse.json({ active: false, youtube_id: null, started_at: null })

  const supabase = await createClient()

  const { data } = await supabase
    .from('store_settings')
    .select('key, value')
    .eq('tenant_id', tenant.id)
    .in('key', ['live_active', 'live_youtube_id', 'live_started_at'])

  const map: Record<string, string> = {}
  data?.forEach(({ key, value }) => { if (value) map[key] = value })

  return NextResponse.json({
    active: map['live_active'] === 'true',
    youtube_id: map['live_youtube_id'] ?? null,
    started_at: map['live_started_at'] ?? null,
  })
}

// POST — inicia la transmisión
export async function POST(request: NextRequest) {
  const tenantSlug = getTenantSlugFromRequest(request)
  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { youtube_url } = await request.json()
  const youtubeId = extractYouTubeId(youtube_url ?? '')

  if (!youtubeId) {
    return NextResponse.json({ error: 'URL de YouTube no válida' }, { status: 400 })
  }

  const now = new Date().toISOString()
  await supabase.from('store_settings').upsert([
    { key: 'live_active', tenant_id: tenant.id, value: 'true', updated_at: now },
    { key: 'live_youtube_id', tenant_id: tenant.id, value: youtubeId, updated_at: now },
    { key: 'live_started_at', tenant_id: tenant.id, value: now, updated_at: now },
  ], { onConflict: 'key,tenant_id' })

  return NextResponse.json({ ok: true, youtube_id: youtubeId })
}

// DELETE — termina la transmisión
export async function DELETE(request: NextRequest) {
  const tenantSlug = getTenantSlugFromRequest(request)
  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date().toISOString()
  await supabase.from('store_settings').upsert([
    { key: 'live_active', tenant_id: tenant.id, value: 'false', updated_at: now },
    { key: 'live_youtube_id', tenant_id: tenant.id, value: '', updated_at: now },
  ], { onConflict: 'key,tenant_id' })

  return NextResponse.json({ ok: true })
}
