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
    default: 'bg-primary-light text-primary-hover border border-primary/20 hover:bg-primary/10',
    success: 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100',
    warning: 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100',
    danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
  }

  const isPositive = change && change > 0

  return (
    <div className={`p-4 rounded-lg border shadow-sm transition-all duration-200 hover:shadow-md ${variants[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{title}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold tracking-tight">{value}</span>
            {unit && <span className="text-[10px] text-muted-foreground uppercase font-bold">{unit}</span>}
          </div>
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 ${isPositive ? 'text-secondary' : 'text-destructive'}`}>
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span className="text-[11px] font-bold">{Math.abs(change)}%</span>
          </div>
        )}
      </div>
    </div>
  )
}
