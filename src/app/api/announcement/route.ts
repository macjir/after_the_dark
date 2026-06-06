import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

/**
 * POST /api/announcement
 *
 * Coordinator sends a final announcement to all citizens.
 * Saves announcement and optionally updates crisis_status.
 *
 * Body: { message: string, type: string, area?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Guard: fail fast with a clear message if env vars are missing
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[announcement] Missing Supabase env vars')
      return NextResponse.json(
        { error: 'Server misconfiguration: Supabase env vars not set on Vercel' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { message, area = 'Demo Zone' } = body

    // Sanitize type — must match DB CHECK constraint, default to 'info'
    const VALID_TYPES = ['info', 'blackout', 'all_clear', 'update']
    const type = VALID_TYPES.includes(body.type) ? body.type : 'info'

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Save announcement (real-time triggers citizens' dialogs)
    const { error: annError } = await supabase
      .from('announcements')
      .insert({ message, type, area })

    if (annError) {
      console.error('[announcement] DB error:', annError)
      return NextResponse.json({ error: annError.message }, { status: 500 })
    }

    // Update crisis status based on announcement type
    if (type === 'blackout') {
      await supabase
        .from('crisis_status')
        .update({ status: 'blackout', updated_at: new Date().toISOString() })
        .eq('id', 1)
    } else if (type === 'all_clear') {
      await supabase
        .from('crisis_status')
        .update({ status: 'normal', updated_at: new Date().toISOString() })
        .eq('id', 1)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[announcement] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
