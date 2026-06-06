'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Send, Wifi, WifiOff, Bot, Radio, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { ChatMessage, CrisisStatus } from '@/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Props {
  initialMessages: ChatMessage[]
  initialCrisisStatus: CrisisStatus
}

export default function CoordinatorApp({ initialMessages, initialCrisisStatus }: Props) {
  const [crisisStatus, setCrisisStatus] = useState<CrisisStatus>(initialCrisisStatus)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageIds = useRef(new Set(initialMessages.map((m) => m.id)))

  useEffect(() => {
    const channel = supabase
      .channel('coordinator-app')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'crisis_status' },
        (payload) => {
          setCrisisStatus(payload.new.status as CrisisStatus)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: 'session_id=eq.coordinator',
        },
        (payload) => {
          const msg = payload.new as ChatMessage
          if (!messageIds.current.has(msg.id)) {
            messageIds.current.add(msg.id)
            setMessages((prev) => [...prev, msg])
            if (msg.role === 'ai') setIsLoading(false)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = async (text?: string) => {
    const messageText = (text ?? input).trim()
    if (!messageText || isLoading) return
    setInput('')
    setIsLoading(true)
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: 'coordinator', message: messageText }),
      })
    } catch {
      setIsLoading(false)
    }
  }

  const handleSendAnnouncement = async (msg: ChatMessage) => {
    if (!msg.final_announcement || isSending) return
    setIsSending(true)
    try {
      await fetch('/api/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg.final_announcement,
          type: msg.announcement_type ?? 'info',
          area: 'Demo Zone',
        }),
      })
    } finally {
      setIsSending(false)
    }
  }

  const isBlackout = crisisStatus === 'blackout'

  const cardBg = isBlackout ? 'bg-red-900/30 border-red-800' : 'bg-slate-900 border-slate-800'
  const borderColor = isBlackout ? 'border-red-800' : 'border-slate-800'
  const userBubble = isBlackout ? 'bg-red-700 text-white' : 'bg-blue-700 text-white'
  const aiBubble = isBlackout
    ? 'bg-red-950 border border-red-800 text-red-100'
    : 'bg-slate-800 border border-slate-700 text-slate-100'
  const aiLabel = isBlackout ? 'text-red-400' : 'text-blue-400'
  const inputBg = isBlackout
    ? 'bg-red-950 border-red-700 text-white placeholder-red-500 focus:border-red-500'
    : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500'
  const sendBtn = isBlackout ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'

  return (
    <div
      className={`min-h-screen transition-colors duration-1000 ${
        isBlackout ? 'bg-red-950' : 'bg-slate-950'
      }`}
    >
      {/* ── Header ── */}
      <header
        className={`sticky top-0 z-30 px-4 py-3 border-b transition-colors duration-1000 ${
          isBlackout ? 'bg-red-950 border-red-800' : 'bg-slate-950 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Mayor Petr Dvořák</h1>
            <p className={`text-xs ${isBlackout ? 'text-red-400' : 'text-slate-500'}`}>
              Coordinator · Demo Zone
            </p>
          </div>
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              isBlackout
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-green-500/15 text-green-400 border border-green-500/30'
            }`}
          >
            {isBlackout ? <WifiOff size={13} /> : <Wifi size={13} />}
            {isBlackout ? 'BLACKOUT' : 'NORMAL'}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-lg mx-auto px-4 py-4 pb-8">
        {/* Info banner */}
        <div
          className={`rounded-xl border p-3 mb-4 flex items-center gap-3 ${
            isBlackout ? 'bg-red-900/40 border-red-800' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <Radio size={18} className={isBlackout ? 'text-red-400 animate-pulse' : 'text-amber-400'} />
          <div>
            <p className="text-white text-sm font-semibold">Crisis Communication Console</p>
            <p className={`text-xs ${isBlackout ? 'text-red-400' : 'text-slate-500'}`}>
              Describe the situation — AI will prepare a public announcement
            </p>
          </div>
        </div>

        {/* Chat area */}
        <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
          {/* Chat header */}
          <div className={`px-4 py-3 border-b flex items-center gap-2 ${borderColor}`}>
            <Bot size={16} className={isBlackout ? 'text-red-400' : 'text-blue-400'} />
            <span className="text-white font-semibold text-sm">AI Assistant</span>
          </div>

          {/* Messages */}
          <div className="h-[55vh] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-600">
                <AlertTriangle size={32} className="mb-3 opacity-40" />
                <p className="text-sm text-center">Describe the situation to get started.</p>
                <p className="text-xs mt-1 text-slate-700 text-center">
                  e.g. &quot;There is a power outage in Demo Zone since 14:00&quot;
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id}>
                {/* Message bubble */}
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user' ? `rounded-tr-sm ${userBubble}` : `rounded-tl-sm ${aiBubble}`
                    }`}
                  >
                    {msg.role !== 'user' && (
                      <p className={`text-xs font-semibold mb-1 ${aiLabel}`}>AI Assistant</p>
                    )}
                    <p>{msg.content}</p>
                  </div>
                </div>

                {/* Suggested buttons */}
                {msg.role === 'ai' && msg.suggested_buttons?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 justify-start pl-1">
                    {msg.suggested_buttons.map((btn, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(btn)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          isBlackout
                            ? 'border-red-700 text-red-300 hover:bg-red-800 hover:text-white'
                            : 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                )}

                {/* "Ready to broadcast" panel */}
                {msg.role === 'ai' && msg.can_send && msg.final_announcement && (
                  <div className="mt-3 rounded-xl border-2 border-amber-500 bg-amber-950/60 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={16} className="text-amber-400 flex-shrink-0" />
                      <span className="text-amber-400 font-bold text-xs uppercase tracking-wide">
                        Ready to Broadcast
                      </span>
                    </div>
                    <p className="text-amber-100 text-sm leading-relaxed mb-3">
                      {msg.final_announcement}
                    </p>
                    <button
                      onClick={() => handleSendAnnouncement(msg)}
                      disabled={isSending}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-black rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Send size={15} />
                      {isSending ? 'SENDING...' : 'SEND TO ALL CITIZENS'}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className={`rounded-2xl rounded-tl-sm px-4 py-3 ${aiBubble}`}>
                  <div className="flex gap-1.5 items-center h-4">
                    {[0, 150, 300].map((delay) => (
                      <div
                        key={delay}
                        className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={`p-4 border-t ${borderColor}`}>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Describe the situation or provide an update..."
                disabled={isLoading}
                className={`flex-1 rounded-xl px-4 py-3 text-sm outline-none transition-colors border ${inputBg}`}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className={`px-4 py-3 rounded-xl text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${sendBtn}`}
              >
                <Send size={17} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
