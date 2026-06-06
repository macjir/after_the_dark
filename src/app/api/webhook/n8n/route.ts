import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

/**
 * POST /api/webhook/n8n
 *
 * Incoming callback from n8n. Saves the AI response to the database.
 * The real-time Supabase subscription on the client side picks it up automatically.
 *
 * Expected body:
 * {
 *   session_id: string,
 *   role: 'ai',
 *   content: string,
 *   suggested_buttons?: string[],
 *   call_izs?: boolean,
 *   send_ok_to_contacts?: boolean,
 *   can_send?: boolean,            // coordinator only — ready to broadcast
 *   final_announcement?: string,  // coordinator only — polished message
 *   announcement_type?: string,   // 'blackout' | 'all_clear' | 'info' | 'update'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Optional webhook secret verification
    const secret = request.headers.get('x-webhook-secret')
    if (process.env.N8N_WEBHOOK_SECRET && secret !== process.env.N8N_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const {
      session_id,
      role = 'ai',
      content,
      suggested_buttons = [],
      call_izs = false,
      send_ok_to_contacts = false,
      can_send = false,
      final_announcement = null,
      announcement_type = null,
    } = body

    if (!session_id || !content) {
      return NextResponse.json({ error: 'Missing session_id or content' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    const { error } = await supabase.from('chat_messages').insert({
      session_id,
      role,
      content,
      suggested_buttons,
      call_izs,
      send_ok_to_contacts,
      can_send,
      final_announcement,
      announcement_type,
    })

    if (error) {
      console.error('[webhook/n8n] DB error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[webhook/n8n] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
