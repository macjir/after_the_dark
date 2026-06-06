'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Menu, Wifi, WifiOff, CheckCircle2 } from 'lucide-react'
import type {
  Citizen,
  CitizenStatusRecord,
  Contact,
  Announcement,
  ChatMessage,
  CrisisStatus,
} from '@/lib/types'
import AnnouncementDialog from './AnnouncementDialog'
import ContactsList from './ContactsList'
import ChatAssistant from './ChatAssistant'
import HamburgerMenu from './HamburgerMenu'

// Module-level singleton — avoids creating a new client on every render
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Props {
  citizenId: string
  citizen: Citizen
  initialCitizenStatus: CitizenStatusRecord | null
  initialContacts: Contact[]
  initialContactStatuses: CitizenStatusRecord[]
  initialAnnouncements: Announcement[]
  initialMessages: ChatMessage[]
  initialCrisisStatus: CrisisStatus
}

export default function CitizenApp({
  citizenId,
  citizen,
  initialCitizenStatus,
  initialContacts,
  initialContactStatuses,
  initialAnnouncements,
  initialMessages,
  initialCrisisStatus,
}: Props) {
  const [crisisStatus, setCrisisStatus] = useState<CrisisStatus>(initialCrisisStatus)
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements)
  const [contactStatuses, setContactStatuses] = useState<Record<string, CitizenStatusRecord>>(
    Object.fromEntries(initialContactStatuses.map((s) => [s.citizen_id, s]))
  )
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [myStatus, setMyStatus] = useState<CitizenStatusRecord | null>(initialCitizenStatus)
  const [pendingAnnouncement, setPendingAnnouncement] = useState<Announcement | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isSendingOk, setIsSendingOk] = useState(false)

  // Track IDs already in state to prevent real-time duplicates
  const messageIds = useRef(new Set(initialMessages.map((m) => m.id)))
  const announcementIds = useRef(new Set(initialAnnouncements.map((a) => a.id)))

  // On initial load in blackout mode, surface the latest unacknowledged announcement
  useEffect(() => {
    if (initialCrisisStatus === 'blackout' && initialAnnouncements.length > 0) {
      const dismissed: string[] = JSON.parse(
        localStorage.getItem(`dismissed-${citizenId}`) ?? '[]'
      )
      const latest = initialAnnouncements.find((a) => !dismissed.includes(a.id))
      if (latest) setPendingAnnouncement(latest)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Supabase real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel(`citizen-app-${citizenId}`)
      // Crisis status changes
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'crisis_status' },
        (payload) => {
          setCrisisStatus(payload.new.status as CrisisStatus)
        }
      )
      // New announcements
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'announcements' },
        (payload) => {
          const ann = payload.new as Announcement
          if (!announcementIds.current.has(ann.id)) {
            announcementIds.current.add(ann.id)
            setAnnouncements((prev) => [ann, ...prev])
            setPendingAnnouncement(ann)
            if (ann.type === 'blackout') setCrisisStatus('blackout')
            else if (ann.type === 'all_clear') setCrisisStatus('normal')
          }
        }
      )
      // Contact / my own OK status changes
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'citizen_status' },
        (payload) => {
          const updated = payload.new as CitizenStatusRecord
          if (updated.citizen_id === citizenId) {
            setMyStatus(updated)
          } else {
            setContactStatuses((prev) => ({ ...prev, [updated.citizen_id]: updated }))
          }
        }
      )
      // New chat messages for this citizen's session
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${citizenId}`,
        },
        (payload) => {
          const msg = payload.new as ChatMessage
          if (!messageIds.current.has(msg.id)) {
            messageIds.current.add(msg.id)
            setMessages((prev) => [...prev, msg])
            if (msg.role === 'ai') setIsChatLoading(false)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [citizenId])

  const handleDismissAnnouncement = (id: string) => {
    const key = `dismissed-${citizenId}`
    const dismissed: string[] = JSON.parse(localStorage.getItem(key) ?? '[]')
    localStorage.setItem(key, JSON.stringify([...dismissed, id]))
    setPendingAnnouncement(null)
  }

  const handleSendMessage = async (text: string) => {
    setIsChatLoading(true)
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: citizenId, message: text }),
      })
    } catch {
      setIsChatLoading(false)
    }
  }

  const handleSendOk = async () => {
    if (isSendingOk) return
    setIsSendingOk(true)
    try {
      await fetch('/api/status/ok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citizen_id: citizenId }),
      })
    } finally {
      setIsSendingOk(false)
    }
  }

  const isBlackout = crisisStatus === 'blackout'

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Announcement Dialog */}
      {pendingAnnouncement && (
        <AnnouncementDialog
          announcement={pendingAnnouncement}
          onDismiss={() => handleDismissAnnouncement(pendingAnnouncement.id)}
          isBlackout={isBlackout}
        />
      )}

      {/* Side Drawer */}
      <HamburgerMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        announcements={announcements}
      />

      {/* ── Header ── */}
      <header
        className={`sticky top-0 z-30 px-4 py-3 border-b bg-slate-950 ${
          isBlackout ? 'border-amber-900/60' : 'border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 rounded-lg transition-colors relative text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Open announcements"
          >
            <Menu size={22} />
            {announcements.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>

          {/* Name + zone */}
          <div className="text-center">
            <h1 className="text-white font-bold text-lg leading-tight">{citizen.name}</h1>
            <p className={`text-xs ${isBlackout ? 'text-amber-500' : 'text-slate-500'}`}>
              {citizen.zone}
            </p>
          </div>

          {/* Status badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              isBlackout
                ? 'bg-amber-700/70 text-amber-100 border border-amber-600/50'
                : 'bg-green-500/15 text-green-400 border border-green-500/30'
            }`}
          >
            {isBlackout ? <WifiOff size={13} /> : <Wifi size={13} />}
            {isBlackout ? 'POWER OUTAGE' : 'NORMAL'}
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-8">
        {/* "I'm OK" card */}
        <div
          className={`rounded-xl border p-4 ${
            isBlackout ? 'bg-slate-900 border-amber-800/50' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${
                isBlackout ? 'text-amber-500' : 'text-slate-500'
              }`}>
                Your Status
              </p>
              {myStatus?.is_ok && myStatus.ok_at ? (
                <p className="text-green-400 text-xs">
                  Last confirmed:{' '}
                  {new Date(myStatus.ok_at).toLocaleString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </p>
              ) : (
                <p className="text-xs text-slate-600">
                  Not reported yet
                </p>
              )}
            </div>
            <button
              onClick={handleSendOk}
              disabled={isSendingOk}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all flex-shrink-0 ${
                myStatus?.is_ok
                  ? 'bg-green-600 hover:bg-green-500'
                  : 'bg-green-600 hover:bg-green-500 active:scale-95'
              } disabled:opacity-60`}
            >
              <CheckCircle2 size={15} />
              I&apos;M OK
            </button>
          </div>
        </div>

        {/* Contacts */}
        <ContactsList
          contacts={initialContacts}
          contactStatuses={contactStatuses}
          isBlackout={isBlackout}
        />

        {/* Chat */}
        <ChatAssistant
          messages={messages}
          isLoading={isChatLoading}
          isBlackout={isBlackout}
          onSendMessage={handleSendMessage}
          onSendOk={handleSendOk}
        />
      </main>
    </div>
  )
}
