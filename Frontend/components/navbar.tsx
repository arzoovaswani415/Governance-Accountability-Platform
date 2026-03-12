'use client'

import { Search, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Navbar() {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-border">
      {/* Search */}
      <div className="relative flex-1 max-w-sm group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Search..."
          className="pl-9 h-8 text-sm bg-secondary border-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-white rounded-md placeholder:text-muted-foreground"
        />
      </div>

      {/* Actions */}
      <Button
        size="sm"
        className="h-8 px-3 bg-primary hover:bg-primary-hover text-white text-xs font-medium rounded-md gap-1.5 shadow-sm"
      >
        <Upload className="h-3.5 w-3.5" />
        Upload Data
      </Button>
    </div>
  )
}
