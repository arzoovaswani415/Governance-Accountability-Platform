'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  CheckCircle,
  MessageSquare,
  TrendingUp,
  Clock,
  Network,
} from 'lucide-react'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/comparison', icon: Network, label: 'Sector Accountability' },
  { href: '/promises', icon: CheckCircle, label: 'Promises' },
  { href: '/policies', icon: FileText, label: 'Policies' },
  { href: '/budget', icon: TrendingUp, label: 'Budget Analysis' },
  { href: '/timeline', icon: Clock, label: 'Timeline' },
  { href: '/debates', icon: FileText, label: 'Parliamentary Debates' },
  { href: '/governance-map', icon: Network, label: 'Governance Map' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col h-full w-full bg-white border border-border shadow-sm rounded-2xl overflow-hidden">
      {/* Logo / Brand */}
      <div className="px-5 py-6 border-b border-border bg-slate-50 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-right from-[#FF9933] via-white to-[#138808] opacity-50" />
        <div className="flex items-center justify-center relative z-10 w-full">
            <img 
              src="/janneeti-logo.png" 
              alt="JanNeeti Logo" 
              className="w-3/4 object-contain filter group-hover:brightness-105 transition-all duration-300" 
            />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {/* Section label */}
        <p className="section-label px-2 mb-2 text-xs font-bold text-slate-400">Navigation</p>

        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname?.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all duration-100 group ${
                isActive
                  ? 'bg-slate-100 text-slate-900 font-bold shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Icon
                className={`h-4 w-4 flex-shrink-0 transition-colors ${
                  isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer / AI Assistant */}
      <div className="p-4 border-t border-border bg-slate-50/50">
        <Link 
          href="/assistant"
          className="flex items-center gap-3 p-3 w-full bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl shadow-md transition-all group"
        >
           <div className="p-1.5 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
              <MessageSquare className="h-4 w-4 text-white" />
           </div>
           <div className="flex flex-col">
              <span className="text-xs font-black tracking-wide">AI Assistant</span>
              <span className="text-[9px] text-slate-300 font-medium">Ask governance questions</span>
           </div>
        </Link>
      </div>
    </aside>
  )
}
