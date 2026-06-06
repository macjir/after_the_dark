import Link from 'next/link'
import { Zap, User, ShieldAlert } from 'lucide-react'

const DEMO_PAGES = [
  {
    href: '/citizen/1',
    icon: User,
    name: 'Jan Novák',
    role: 'Citizen 1',
    description: 'Demo Zone · Praha 7',
    color: 'border-blue-700 hover:border-blue-500 hover:bg-blue-950/40',
    iconBg: 'bg-blue-900/60 text-blue-300',
    badge: 'bg-blue-900 text-blue-300',
  },
  {
    href: '/citizen/2',
    icon: User,
    name: 'Marie Svobodová',
    role: 'Citizen 2',
    description: 'Demo Zone · Praha 7',
    color: 'border-violet-700 hover:border-violet-500 hover:bg-violet-950/40',
    iconBg: 'bg-violet-900/60 text-violet-300',
    badge: 'bg-violet-900 text-violet-300',
  },
  {
    href: '/coordinator',
    icon: ShieldAlert,
    name: 'Mayor Petr Dvořák',
    role: 'Coordinator',
    description: 'Demo Zone · Command',
    color: 'border-amber-700 hover:border-amber-500 hover:bg-amber-950/40',
    iconBg: 'bg-amber-900/60 text-amber-300',
    badge: 'bg-amber-900 text-amber-300',
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 py-12">
      {/* Logo / title */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-900/50 border border-red-700 mb-5">
          <Zap size={32} className="text-red-400" />
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">After the Dark</h1>
        <p className="text-slate-400 text-base">Crisis Communication Platform — Hackathon Demo</p>
      </div>

      {/* Page cards */}
      <div className="w-full max-w-xl space-y-3">
        <p className="text-slate-600 text-xs uppercase tracking-widest font-semibold mb-4 text-center">
          Open each view on a separate device
        </p>

        {DEMO_PAGES.map((page) => {
          const Icon = page.icon
          return (
            <Link
              key={page.href}
              href={page.href}
              className={`flex items-center gap-4 p-5 rounded-2xl border bg-slate-900/60 transition-all duration-200 group ${page.color}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${page.iconBg}`}>
                <Icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-white font-bold text-base">{page.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${page.badge}`}>
                    {page.role}
                  </span>
                </div>
                <p className="text-slate-500 text-sm">{page.description}</p>
              </div>
              <div className="text-slate-600 group-hover:text-slate-300 transition-colors">
                →
              </div>
            </Link>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center space-y-2">
        <p className="text-slate-600 text-xs">
          Real-time sync via Supabase · AI chat via n8n · Hosted on Vercel
        </p>
        <div className="flex items-center justify-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <p className="text-green-500 text-xs font-medium">Live demo</p>
        </div>
      </div>
    </main>
  )
}

