import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import type { Citizen, Contact, CitizenStatusRecord, Announcement, ChatMessage } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, message } = body

    if (!session_id || !message) {
      return NextResponse.json({ error: 'Missing session_id or message' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()
    const isCoordinator = session_id === 'coordinator'

    // Save user message to DB
    await supabase.from('chat_messages').insert({
      session_id,
      role: 'user',
      content: message,
      suggested_buttons: [],
    })

    // Determine webhook URL based on session
    const webhookUrl = isCoordinator
      ? process.env.N8N_COORDINATOR_WEBHOOK_URL
      : process.env.N8N_CITIZEN_WEBHOOK_URL

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook URL not configured. Set N8N_CITIZEN_WEBHOOK_URL or N8N_COORDINATOR_WEBHOOK_URL.' },
        { status: 500 }
      )
    }

    // Build context for n8n
    let context: Record<string, unknown>

    if (isCoordinator) {
      const { data: crisisStatus } = await supabase
        .from('crisis_status')
        .select('status')
        .eq('id', 1)
        .single()

      const { data: recentMessages } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('session_id', 'coordinator')
        .order('created_at', { ascending: false })
        .limit(10)

      context = {
        current_status: crisisStatus?.status ?? 'normal',
        area: 'Demo Zone',
        session: (recentMessages as Pick<ChatMessage, 'role' | 'content'>[] | null)
          ?.reverse()
          .map((m) => `${m.role}: ${m.content}`)
          .join('\n') ?? '',
      }
    } else {
      // Fetch citizen data in parallel
      const [
        { data: citizen },
        { data: crisisStatus },
        { data: contacts },
        { data: recentMessages },
        { data: recentAnnouncements },
      ] = await Promise.all([
        supabase.from('citizens').select('*').eq('id', session_id).single(),
        supabase.from('crisis_status').select('status').eq('id', 1).single(),
        supabase.from('contacts').select('*').eq('owner_id', session_id),
        supabase
          .from('chat_messages')
          .select('role, content')
          .eq('session_id', session_id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('announcements')
          .select('message, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      // Get linked contact statuses
      const linkedIds = (contacts as Contact[] | null)
        ?.filter((c) => c.linked_citizen_id)
        .map((c) => c.linked_citizen_id as string) ?? []

      const { data: contactStatuses } = linkedIds.length > 0
        ? await supabase.from('citizen_status').select('*').in('citizen_id', linkedIds)
        : { data: [] as CitizenStatusRecord[] }

      const statusMap = Object.fromEntries(
        (contactStatuses as CitizenStatusRecord[] | null ?? []).map((s) => [s.citizen_id, s])
      )

      context = {
        crisis: {
          type: crisisStatus?.status ?? 'normal',
          area: (citizen as Citizen | null)?.zone ?? 'Demo Zone',
        },
        location: (citizen as Citizen | null)?.location ?? '',
        health: (citizen as Citizen | null)?.health_info ?? '',
        contacts: (contacts as Contact[] | null)?.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          status: c.linked_citizen_id && statusMap[c.linked_citizen_id]?.is_ok ? 'ok' : 'unknown',
        })) ?? [],
        coordinator_updates: (recentAnnouncements as Pick<Announcement, 'message' | 'created_at'>[] | null)?.map(
          (a) => ({ message: a.message, valid_until: null })
        ) ?? [],
        session: (recentMessages as Pick<ChatMessage, 'role' | 'content'>[] | null)
          ?.reverse()
          .map((m) => `${m.role}: ${m.content}`)
          .join('\n') ?? '',
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // Send to n8n (fire and forget — n8n calls back /api/webhook/n8n)
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: message, source: isCoordinator ? 'coordinator_chat' : 'chat' },
        context,
        session_id,
        callback_url: `${appUrl}/api/webhook/n8n`,
      }),
    }).catch((err) => console.error('[chat] n8n webhook error:', err))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[chat] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
