'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  unit?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

export function KPICard({ title, value, change, unit, variant = 'default' }: KPICardProps) {
  const variants = {
    default: 'from-blue-500/10 to-indigo-500/10 border-blue-200/50 text-indigo-700',
    success: 'from-emerald-500/10 to-teal-500/10 border-emerald-200/50 text-emerald-700',
    warning: 'from-amber-500/10 to-orange-500/10 border-amber-200/50 text-orange-700',
    danger: 'from-rose-500/10 to-red-500/10 border-rose-200/50 text-rose-700',
  }

  const isPositive = change && change > 0

  return (
    <div className={`relative group p-5 rounded-2xl border bg-gradient-to-br backdrop-blur-md shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden ${variants[variant]}`}>
      {/* Decorative background element */}
      <div className={`absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ${variant === 'default' ? 'bg-blue-500' : variant === 'success' ? 'bg-emerald-500' : variant === 'warning' ? 'bg-amber-500' : 'bg-rose-500'}`} />
      
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black tracking-[0.15em] text-slate-500/80 uppercase mb-2">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tighter text-slate-800">{value}</span>
            {unit && <span className="text-[10px] text-slate-400 uppercase font-black">{unit}</span>}
          </div>
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-black ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {isPositive ? (
              <TrendingUp className="h-3 w-3 stroke-[3]" />
            ) : (
              <TrendingDown className="h-3 w-3 stroke-[3]" />
            )}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
    </div>
  )
}
