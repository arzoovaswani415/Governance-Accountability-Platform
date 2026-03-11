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
    default: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-secondary/10 text-secondary border-secondary/20',
    warning: 'bg-accent/10 text-accent border-accent/20',
    danger: 'bg-destructive/10 text-destructive border-destructive/20',
  }

  const isPositive = change && change > 0

  return (
    <Card className={`p-6 border ${variants[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold">{value}</span>
            {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
          </div>
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 ${isPositive ? 'text-secondary' : 'text-destructive'}`}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{Math.abs(change)}%</span>
          </div>
        )}
      </div>
    </Card>
  )
}
