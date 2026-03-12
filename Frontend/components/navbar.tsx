'use client'

import { Search, Upload, Bell, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Navbar() {
  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 z-40 flex items-center justify-between px-8 transition-all duration-300">
      <div className="flex items-center gap-6 flex-1">
        {/* Search */}
        <div className="relative w-full max-w-md group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <Input
            placeholder="Search intelligence, policies, or manifesto commitments..."
            className="pl-10 h-10 w-full bg-slate-100/50 border-slate-200/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 rounded-xl transition-all duration-300 text-sm placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-emerald-600 transition-all"
        >
          <Bell className="h-4 w-4" />
        </Button>
        
        <div className="h-8 w-px bg-slate-200 mx-1" />

        <Button
          size="sm"
          className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl gap-2 shadow-lg shadow-slate-200/50 transition-all active:scale-95"
        >
          <Upload className="h-3.5 w-3.5" />
          Import Dataset
        </Button>

        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-md ring-2 ring-white cursor-pointer hover:scale-105 transition-transform">
          <User className="h-4 w-4" />
        </div>
      </div>
    </header>
  )
}
