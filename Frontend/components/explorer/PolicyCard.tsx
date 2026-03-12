'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { PolicyBrief } from '@/lib/api'

interface PolicyCardProps {
  policy: PolicyBrief
  onClick: () => void
  statusColor: (status: string) => string
}

const sectorImages: Record<string, string> = {
  'Agriculture': '/assets/thumbnails/agriculture.png',
  'Healthcare': '/assets/thumbnails/healthcare.png',
  'Energy': '/assets/thumbnails/energy.png',
  'Infrastructure': '/assets/thumbnails/infrastructure.png',
  'Education': '/assets/thumbnails/education.png',
  'Environment': '/assets/thumbnails/environment.png',
  'Defense': '/assets/thumbnails/infrastructure.png', // Fallback
}

export function PolicyCard({ policy, onClick, statusColor }: PolicyCardProps) {
  const imageUrl = sectorImages[policy.sector.name] || '/assets/thumbnails/infrastructure.png'

  return (
    <button
      onClick={onClick}
      className="gov-card text-left group"
    >
      <div className="gov-card-image">
        <Image
          src={imageUrl}
          alt={policy.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent group-hover:from-black/40 transition-all duration-300" />
      </div>
      
      <div className="gov-card-content">
        <h3 className="gov-card-title">
          {policy.name}
        </h3>
        
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            {policy.sector.name}
          </span>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            {policy.year_introduced}
          </span>
        </div>

        <div className="gov-card-footer">
          <span className={`gov-status-pill ${statusColor(policy.status.toLowerCase()).replace('bg-', 'bg-').replace('text-', 'text-')}`}>
            {policy.status}
          </span>
          <div className="text-[10px] font-black text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
             VIEW DETAILS 
             <span className="text-[12px]">→</span>
          </div>
        </div>
      </div>
    </button>
  )
}
