import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const site = searchParams.get('site')
    const search = searchParams.get('search')
    const onlyDeals = searchParams.get('deals') === 'true'

    let query = supabase
      .from('competitor_latest')
      .select('*')
      .order('scraped_at', { ascending: false })
      .limit(300)

    if (site && site !== 'all') {
      query = query.eq('site', site)
    }

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    if (onlyDeals) {
      query = query.not('was_price', 'is', null)
    }

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data ?? [])
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
