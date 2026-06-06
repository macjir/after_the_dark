import { notFound } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import CitizenApp from '@/components/citizen/CitizenApp'
import type { CitizenStatusRecord, Contact } from '@/lib/types'

export const dynamic = 'force-dynamic'

const VALID_IDS = ['1', '2']

export default async function CitizenPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (!VALID_IDS.includes(id)) notFound()

  const citizenId = `citizen-${id}`
  const supabase = getSupabaseServerClient()

  // Parallel fetches for initial data
  const [
    { data: citizen },
    { data: citizenStatus },
    { data: contacts },
    { data: announcements },
    { data: messages },
    { data: crisisStatus },
  ] = await Promise.all([
    supabase.from('citizens').select('*').eq('id', citizenId).single(),
    supabase.from('citizen_status').select('*').eq('citizen_id', citizenId).single(),
    supabase.from('contacts').select('*').eq('owner_id', citizenId),
    supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', citizenId)
      .order('created_at', { ascending: true }),
    supabase.from('crisis_status').select('*').eq('id', 1).single(),
  ])

  if (!citizen) notFound()

  // Fetch statuses for linked contacts
  const linkedIds = (contacts as Contact[] | null)
    ?.filter((c) => c.linked_citizen_id)
    .map((c) => c.linked_citizen_id as string) ?? []

  const { data: contactStatuses } =
    linkedIds.length > 0
      ? await supabase.from('citizen_status').select('*').in('citizen_id', linkedIds)
      : { data: [] as CitizenStatusRecord[] }

  return (
    <CitizenApp
      citizenId={citizenId}
      citizen={citizen}
      initialCitizenStatus={citizenStatus}
      initialContacts={contacts ?? []}
      initialContactStatuses={contactStatuses ?? []}
      initialAnnouncements={announcements ?? []}
      initialMessages={messages ?? []}
      initialCrisisStatus={crisisStatus?.status ?? 'normal'}
    />
  )
}
