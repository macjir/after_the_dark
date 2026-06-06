import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

/**
 * POST /api/status/ok
 *
 * Citizen marks themselves as "I'm OK".
 * Updates citizen_status in DB. Other citizens with this citizen
 * in their contacts see the update via real-time subscription.
 *
 * Body: { citizen_id: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { citizen_id } = body

    if (!citizen_id) {
      return NextResponse.json({ error: 'Missing citizen_id' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    const { error } = await supabase
      .from('citizen_status')
      .update({
        is_ok: true,
        ok_at: new Date().toISOString(),
      })
      .eq('citizen_id', citizen_id)

    if (error) {
      console.error('[status/ok] DB error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[status/ok] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
