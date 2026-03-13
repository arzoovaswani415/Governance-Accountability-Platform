'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function Navbar() {
  return (
    <header className="h-12 bg-white/60 backdrop-blur-xl border-b border-slate-200/40 flex items-center px-6 shrink-0 z-50">
      <div className="flex items-center gap-4 flex-1">
        {/* Empty Navbar spacer - search is handled locally by page FilterBars */}
      </div>
    </header>
  )
}
