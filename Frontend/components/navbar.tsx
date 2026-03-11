'use client'

import { Search, Upload, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export function Navbar() {
  const [selectedParty, setSelectedParty] = useState('All Parties')
  const [isOpen, setIsOpen] = useState(false)

  const parties = ['All Parties', 'Democratic Party', 'Republican Party', 'Independent']

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
          {/* Party selector */}
          <div className="relative hidden md:block">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setIsOpen(!isOpen)}
            >
              {selectedParty}
              <ChevronDown className="h-4 w-4" />
            </Button>

            {isOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
                {parties.map((party) => (
                  <button
                    key={party}
                    onClick={() => {
                      setSelectedParty(party)
                      setIsOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-muted ${
                      selectedParty === party ? 'bg-primary/10 text-primary font-medium' : ''
                    }`}
                  >
                    {party}
                  </button>
                ))}
              </div>
            )}
          </div>

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
