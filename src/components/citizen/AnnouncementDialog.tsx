'use client'

import { useEffect } from 'react'
import { WifiOff, CheckCircle2, AlertTriangle, X } from 'lucide-react'
import type { Announcement } from '@/lib/types'

interface Props {
  announcement: Announcement
  onDismiss: () => void
  isBlackout: boolean
}

export default function AnnouncementDialog({ announcement, onDismiss, isBlackout }: Props) {
  const isBlackoutType = announcement.type === 'blackout'
  const isAllClear = announcement.type === 'all_clear'

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const overlayBg = isBlackoutType
    ? 'bg-slate-950/97'
    : isAllClear
    ? 'bg-green-950/97'
    : 'bg-slate-950/95'

  const cardBg = isBlackoutType
    ? 'bg-slate-800 border-amber-600'
    : isAllClear
    ? 'bg-green-900 border-green-500'
    : 'bg-slate-800 border-slate-600'

  const iconColor = isBlackoutType ? 'text-amber-400' : isAllClear ? 'text-green-400' : 'text-amber-400'
  const titleColor = isBlackoutType ? 'text-amber-200' : isAllClear ? 'text-green-200' : 'text-white'
  const msgColor = 'text-slate-200'
  const btnBg = isBlackoutType
    ? 'bg-amber-600 hover:bg-amber-500'
    : isAllClear
    ? 'bg-green-600 hover:bg-green-500'
    : 'bg-slate-600 hover:bg-slate-500'

  const formattedTime = new Date(announcement.created_at).toLocaleString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Europe/Prague',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className={`absolute inset-0 ${overlayBg}`} />

      {/* Dialog */}
      <div
        className={`relative z-10 w-full max-w-sm rounded-2xl border-2 p-6 text-center ${cardBg}`}
        style={{ animation: 'fadeInUp 0.35s ease-out' }}
      >
        {/* Close */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full opacity-60 hover:opacity-100 text-white transition-opacity"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className="mb-4 flex justify-center">
          {isBlackoutType ? (
            <WifiOff size={60} className={iconColor} />
          ) : isAllClear ? (
            <CheckCircle2 size={60} className={iconColor} />
          ) : (
            <AlertTriangle size={60} className={iconColor} />
          )}
        </div>

        {/* Title */}
        <h2 className={`text-2xl font-black mb-1 uppercase tracking-wide ${titleColor}`}>
          {isBlackoutType ? '⚡ Power Outage' : isAllClear ? '✅ All Clear' : '📢 New Update'}
        </h2>

        {/* Meta */}
        <p className="text-slate-400 text-xs mb-4">
          {announcement.area} · {formattedTime}
        </p>

        {/* Message */}
        <p className={`text-base leading-relaxed mb-6 ${msgColor}`}>{announcement.message}</p>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className={`w-full py-3 rounded-xl font-bold text-base text-white transition-colors ${btnBg}`}
        >
          UNDERSTOOD
        </button>
      </div>
    </div>
  )
}
