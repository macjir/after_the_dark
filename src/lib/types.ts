export type CrisisStatus = 'normal' | 'blackout'

export interface Citizen {
  id: string
  name: string
  zone: string
  health_info: string
  location: string
}

export interface CitizenStatusRecord {
  citizen_id: string
  is_ok: boolean
  ok_at: string | null
}

export interface Contact {
  id: string
  owner_id: string
  linked_citizen_id: string | null
  name: string
  phone: string
}

export interface Announcement {
  id: string
  message: string
  type: 'info' | 'blackout' | 'all_clear' | 'update'
  area: string
  created_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'ai' | 'coordinator'
  content: string
  suggested_buttons: string[]
  call_izs: boolean
  send_ok_to_contacts: boolean
  can_send: boolean
  final_announcement: string | null
  announcement_type: string | null
  created_at: string
}

export interface CrisisStatusRecord {
  id: number
  status: CrisisStatus
  updated_at: string
}
