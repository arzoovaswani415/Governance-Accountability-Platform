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
  { href: '/assistant', icon: MessageSquare, label: 'AI Assistant' },
  { href: '/governance-map', icon: Network, label: 'Governance Map' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col h-full w-full">
      {/* Logo / Brand */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs">FF</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground tracking-tight leading-none">FairFlow</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">Governance Tracker</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {/* Section label */}
        <p className="section-label px-2 mb-2">Navigation</p>

        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname?.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-1.5 rounded-md text-[13px] transition-all duration-100 group ${
                isActive
                  ? 'bg-muted text-foreground font-bold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon
                className={`h-4 w-4 flex-shrink-0 transition-colors ${
                  isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                }`}
              />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border">
        <p className="text-[11px] text-muted-foreground">
          India Governance Platform
        </p>
      </div>
    </aside>
  )
}
