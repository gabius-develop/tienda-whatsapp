import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_SETTINGS, StoreSettings } from '@/lib/settings'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('store_settings').select('key, value')

    if (error || !data) return NextResponse.json(DEFAULT_SETTINGS)

    const settings = { ...DEFAULT_SETTINGS } as Record<string, string>
    data.forEach(({ key, value }) => {
      if (value !== null) settings[key] = value
    })

    return NextResponse.json(settings)
  } catch {
    return NextResponse.json(DEFAULT_SETTINGS)
  }
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only superadmin can update settings
  const superadminEmail = process.env.SUPERADMIN_EMAIL
  if (!superadminEmail || user.email !== superadminEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body: Partial<StoreSettings> = await request.json()

  const upserts = Object.entries(body).map(([key, value]) => ({
    key,
    value: String(value),
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('store_settings')
    .upsert(upserts, { onConflict: 'key' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
