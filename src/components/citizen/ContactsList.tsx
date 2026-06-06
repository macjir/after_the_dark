'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, HelpCircle, Phone } from 'lucide-react'
import type { Contact, CitizenStatusRecord } from '@/lib/types'

interface Props {
  contacts: Contact[]
  contactStatuses: Record<string, CitizenStatusRecord>
  isBlackout: boolean
}

export default function ContactsList({ contacts, contactStatuses, isBlackout }: Props) {
  const [isOpen, setIsOpen] = useState(true)

  const borderColor = isBlackout ? 'border-amber-900/50' : 'border-slate-800'
  const cardBg = isBlackout ? 'bg-slate-900' : 'bg-slate-900'
  const dividerColor = isBlackout ? 'border-amber-900/40' : 'border-slate-800'
  const iconColor = isBlackout ? 'text-amber-500' : 'text-slate-400'
  const badgeBg = isBlackout ? 'bg-amber-900/40 text-amber-400' : 'bg-slate-800 text-slate-400'

  return (
    <div className={`rounded-xl border overflow-hidden ${cardBg} ${borderColor}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
          isBlackout ? 'hover:bg-amber-900/20' : 'hover:bg-slate-800/50'
        }`}
      >
        <div className="flex items-center gap-2">
          <Phone size={16} className={iconColor} />
          <span className="text-white font-semibold text-sm">My Contacts</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeBg}`}>
            {contacts.length}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp size={18} className="text-slate-500" />
        ) : (
          <ChevronDown size={18} className="text-slate-500" />
        )}
      </button>

      {isOpen && (
        <div className={`border-t ${borderColor}`}>
          {contacts.length === 0 ? (
            <p className="px-4 py-4 text-slate-500 text-sm text-center">No contacts added.</p>
          ) : (
            contacts.map((contact, index) => {
              const statusRecord = contact.linked_citizen_id
                ? contactStatuses[contact.linked_citizen_id]
                : null
              const isOk = statusRecord?.is_ok ?? false
              const okAt = statusRecord?.ok_at

              return (
                <div
                  key={contact.id}
                  className={`px-4 py-3 flex items-center justify-between ${
                    index < contacts.length - 1 ? `border-b ${dividerColor}` : ''
                  }`}
                >
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${
                        isOk ? 'bg-green-600' : 'bg-slate-700'
                      }`}
                    >
                      {contact.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm leading-tight">{contact.name}</p>
                      <p className="text-slate-500 text-xs">{contact.phone}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="text-right flex-shrink-0 ml-3">
                    {isOk ? (
                      <div className="flex items-center gap-1.5 justify-end">
                        <div>
                          <p className="text-green-400 text-xs font-bold leading-tight">OK</p>
                          {okAt && (
                            <p className="text-slate-500 text-xs">
                              {new Date(okAt).toLocaleString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                              })}
                            </p>
                          )}
                        </div>
                        <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 justify-end">
                        <p className="text-slate-500 text-xs font-medium">Unknown</p>
                        <HelpCircle size={16} className="text-slate-600 flex-shrink-0" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
