'use client'

import { Search, Upload, Bell, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Navbar() {
  return (
    <header className="h-14 bg-white/40 backdrop-blur-md border-b border-white/20 flex items-center justify-between px-6 shrink-0 z-50">
      <div className="flex items-center gap-4 flex-1">
        {/* Search */}
        <div className="relative w-full max-w-sm group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <Input
            placeholder="Search Intelligence..."
            className="pl-9 h-8 w-full bg-white/50 border-white/20 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 rounded-lg transition-all duration-300 text-xs placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-white/50 text-slate-500 hover:text-emerald-600 transition-all"
        >
          <Bell className="h-4 w-4" />
        </Button>
        
        <div className="h-6 w-px bg-white/30 truncate mx-1" />

        <Button
          size="sm"
          className="h-8 px-3 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black rounded-lg gap-2 shadow-lg shadow-slate-200/50 transition-all active:scale-95 uppercase tracking-wider"
        >
          <Upload className="h-3 w-3" />
          Import
        </Button>

        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-md ring-2 ring-white/50 cursor-pointer hover:scale-105 transition-transform">
          <User className="h-3.5 w-3.5" />
        </div>
      </div>
    </header>
  )
}
