'use client'

import { useEffect } from 'react'
import { X, Bell, WifiOff, CheckCircle2, Info, Zap } from 'lucide-react'
import type { Announcement } from '@/lib/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  announcements: Announcement[]
}

const TYPE_CONFIG = {
  blackout: {
    icon: WifiOff,
    label: 'BLACKOUT',
    iconColor: 'text-red-400',
    labelColor: 'text-red-400',
    cardBg: 'bg-red-950/80 border-red-800',
  },
  all_clear: {
    icon: CheckCircle2,
    label: 'ALL CLEAR',
    iconColor: 'text-green-400',
    labelColor: 'text-green-400',
    cardBg: 'bg-green-950/80 border-green-800',
  },
  update: {
    icon: Zap,
    label: 'UPDATE',
    iconColor: 'text-amber-400',
    labelColor: 'text-amber-400',
    cardBg: 'bg-amber-950/60 border-amber-800',
  },
  info: {
    icon: Info,
    label: 'INFO',
    iconColor: 'text-blue-400',
    labelColor: 'text-blue-400',
    cardBg: 'bg-slate-800 border-slate-700',
  },
}

export default function HamburgerMenu({ isOpen, onClose, announcements }: Props) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer — slides in from left */}
      <div
        className="absolute left-0 top-0 h-full w-80 max-w-[90vw] bg-slate-950 border-r border-slate-800 flex flex-col"
        style={{ animation: 'slideInLeft 0.28s ease-out' }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-slate-400" />
            <h2 className="text-white font-semibold text-sm">Received Announcements</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Announcements list */}
        <div className="flex-1 overflow-y-auto">
          {announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 p-6">
              <Bell size={32} className="mb-3 opacity-40" />
              <p className="text-sm text-center">No announcements received yet</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {announcements.map((ann) => {
                const cfg = TYPE_CONFIG[ann.type] ?? TYPE_CONFIG.info
                const Icon = cfg.icon
                return (
                  <div key={ann.id} className={`rounded-xl p-3 border ${cfg.cardBg}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon size={13} className={cfg.iconColor} />
                      <span className={`text-xs font-bold uppercase tracking-wide ${cfg.labelColor}`}>
                        {cfg.label}
                      </span>
                      <span className="text-slate-500 text-xs ml-auto">
                        {new Date(ann.created_at).toLocaleString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                          timeZone: 'Europe/Prague',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-200 text-sm leading-relaxed">{ann.message}</p>
                    <p className="text-slate-500 text-xs mt-1">{ann.area}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
