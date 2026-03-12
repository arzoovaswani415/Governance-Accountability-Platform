'use client'

import { Search, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Navbar() {
  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-background border-b border-border z-30">
      <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
        {/* Search bar */}
        <div className="flex-1 max-w-md hidden md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search promises, policies..."
              className="pl-10 bg-muted/50"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Upload button */}
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Upload className="h-4 w-4" />
            <span className="hidden md:inline">Upload</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
