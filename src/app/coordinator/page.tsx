import { getSupabaseServerClient } from '@/lib/supabase-server'
import CoordinatorApp from '@/components/coordinator/CoordinatorApp'

export const dynamic = 'force-dynamic'

export default async function CoordinatorPage() {
  const supabase = getSupabaseServerClient()

  const [{ data: messages }, { data: crisisStatus }] = await Promise.all([
    supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', 'coordinator')
      .order('created_at', { ascending: true }),
    supabase.from('crisis_status').select('*').eq('id', 1).single(),
  ])

  return (
    <CoordinatorApp
      initialMessages={messages ?? []}
      initialCrisisStatus={crisisStatus?.status ?? 'normal'}
    />
  )
}
