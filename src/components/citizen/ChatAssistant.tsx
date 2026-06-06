'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, CheckCircle2, Phone } from 'lucide-react'
import type { ChatMessage } from '@/lib/types'

interface Props {
  messages: ChatMessage[]
  isLoading: boolean
  isBlackout: boolean
  onSendMessage: (text: string) => void
  onSendOk: () => void
}

export default function ChatAssistant({ messages, isLoading, isBlackout, onSendMessage, onSendOk }: Props) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || isLoading) return
    setInput('')
    onSendMessage(msg)
  }

  // Suggested buttons from the last AI message
  const lastAiMsg = [...messages].reverse().find((m) => m.role === 'ai')
  const suggestedButtons = lastAiMsg?.suggested_buttons ?? []

  const cardBg = isBlackout ? 'bg-slate-900 border-amber-900/50' : 'bg-slate-900 border-slate-800'
  const headerBorder = isBlackout ? 'border-amber-900/50' : 'border-slate-800'
  const inputBg = isBlackout
    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-amber-600'
    : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-slate-500'
  const sendBtnBg = 'bg-blue-600 hover:bg-blue-500'
  const userBubble = 'bg-blue-600 text-white'
  const aiBubble = 'bg-slate-800 border border-slate-700 text-slate-100'
  const aiLabel = 'text-blue-400'
  const suggestBorder = isBlackout
    ? 'border-amber-800/60 text-amber-300 hover:bg-amber-900/40 hover:text-white'
    : 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'

  return (
    <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b flex items-center gap-2 ${headerBorder}`}>
        <Bot size={16} className="text-blue-400" />
        <h2 className="text-white font-semibold text-sm">AI Crisis Assistant</h2>
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-600">
            <Bot size={32} className="mb-2 opacity-40" />
            <p className="text-sm text-center">Ask anything — water, power, shelter, medication...</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? `rounded-tr-sm ${userBubble}`
                    : `rounded-tl-sm ${aiBubble}`
                }`}
              >
                {msg.role === 'ai' && (
                  <p className={`text-xs font-semibold mb-1 ${aiLabel}`}>AI Assistant</p>
                )}
                <p>{msg.content}</p>

                {/* Action buttons within the AI message */}
                {msg.role === 'ai' && (msg.call_izs || msg.send_ok_to_contacts) && (
                  <div className="mt-2.5 space-y-1.5">
                    {msg.call_izs && (
                      <a
                        href="tel:112"
                        className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        <Phone size={11} />
                        CALL EMERGENCY SERVICES — 112
                      </a>
                    )}
                    {msg.send_ok_to_contacts && (
                      <button
                        onClick={onSendOk}
                        className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        <CheckCircle2 size={11} />
                        SEND OK TO MY CONTACTS
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
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

      {/* Suggested quick-reply buttons */}
      {suggestedButtons.length > 0 && !isLoading && (
        <div className={`px-4 pb-3 pt-2 border-t flex flex-wrap gap-2 ${headerBorder}`}>
          {suggestedButtons.map((btn, i) => (
            <button
              key={i}
              onClick={() => handleSend(btn)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${suggestBorder}`}
            >
              {btn}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className={`p-3 border-t ${headerBorder}`}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type your question..."
            disabled={isLoading}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors border ${inputBg}`}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={`px-3 py-2.5 rounded-xl text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${sendBtnBg}`}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
