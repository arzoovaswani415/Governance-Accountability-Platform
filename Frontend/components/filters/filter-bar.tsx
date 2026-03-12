'use client'

import { Search, ChevronDown, X, RotateCcw, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import {
  sectors as defaultSectors,
  electionCycles,
  type StatusOption,
} from './filter-context'

interface FilterBarProps {
  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchPlaceholder?: string
  
  // Election Cycle
  electionCycle: string
  setElectionCycle: (cycle: string) => void
  showElectionCycle?: boolean
  
  // Sectors
  selectedSectors: string[]
  setSelectedSectors: React.Dispatch<React.SetStateAction<string[]>>
  toggleSector?: (sector: string) => void
  sectors?: string[]
  sectorLabel?: string
  showSectors?: boolean
  
  // Statuses (can be promise statuses, policy statuses, or any custom statuses)
  selectedStatuses: string[]
  setSelectedStatuses: React.Dispatch<React.SetStateAction<string[]>>
  toggleStatus?: (status: string) => void
  statuses?: StatusOption[]
  statusLabel?: string
  showStatuses?: boolean
  
  // Budget Type (optional - for budget page)
  budgetType?: string
  setBudgetType?: (type: string) => void
  budgetTypes?: string[]
  showBudgetType?: boolean
  
  // Reset
  clearAllFilters?: () => void
  hasActiveFilters?: boolean

  // Center Content
  centerContent?: React.ReactNode
}

export function FilterBar({
  searchQuery,
  setSearchQuery,
  searchPlaceholder = 'Search...',
  electionCycle,
  setElectionCycle,
  showElectionCycle = true,
  selectedSectors,
  setSelectedSectors,
  toggleSector,
  sectors = defaultSectors,
  sectorLabel = 'Sector',
  showSectors = true,
  selectedStatuses,
  setSelectedStatuses,
  toggleStatus,
  statuses = [],
  statusLabel = 'Status',
  showStatuses = true,
  budgetType,
  setBudgetType,
  budgetTypes = [],
  showBudgetType = false,
  clearAllFilters,
  hasActiveFilters,
  centerContent,
}: FilterBarProps) {
  const [sectorOpen, setSectorOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)

  // Internal toggle functions if not provided
  const handleToggleSector = (sector: string) => {
    if (toggleSector) {
      toggleSector(sector)
    } else {
      setSelectedSectors((prev) =>
        prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
      )
    }
  }

  const handleToggleStatus = (status: string) => {
    if (toggleStatus) {
      toggleStatus(status)
    } else {
      setSelectedStatuses((prev) =>
        prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
      )
    }
  }

  const handleClearAllFilters = () => {
    if (clearAllFilters) {
      clearAllFilters()
    } else {
      setSearchQuery('')
      setElectionCycle('Overall')
      setSelectedSectors([])
      setSelectedStatuses([])
      if (setBudgetType) setBudgetType('Both')
    }
  }

  const computedHasActiveFilters =
    hasActiveFilters ??
    (searchQuery !== '' ||
      electionCycle !== 'Overall' ||
      selectedSectors.length > 0 ||
      selectedStatuses.length > 0 ||
      (showBudgetType && budgetType !== 'Both'))

  const removeFilter = (type: 'search' | 'cycle' | 'sector' | 'status' | 'budgetType', value?: string) => {
    switch (type) {
      case 'search':
        setSearchQuery('')
        break
      case 'cycle':
        setElectionCycle('Overall')
        break
      case 'sector':
        if (value) setSelectedSectors((prev) => prev.filter((s) => s !== value))
        break
      case 'status':
        if (value) setSelectedStatuses((prev) => prev.filter((s) => s !== value))
        break
      case 'budgetType':
        if (setBudgetType) setBudgetType('Both')
        break
    }
  }

  const getStatusInfo = (key: string) => statuses.find((s) => s.key === key)

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 w-full">
        {/* Search Bar (Left) */}
        <div className="relative w-full md:w-[240px] shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 pr-4 h-8 bg-muted/20 border-border/40 focus-visible:ring-1 focus-visible:bg-background transition-all rounded-lg text-[12px] placeholder:text-muted-foreground/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Center Content */}
        <div className="hidden md:flex justify-center flex-1">
          {centerContent}
        </div>

        {/* Filter Row (Right) */}
        <div className="flex flex-wrap items-center justify-end gap-2 w-full md:w-auto">
        {/* Election Cycle Dropdown */}
        {showElectionCycle && (
          <Select value={electionCycle} onValueChange={setElectionCycle}>
            <SelectTrigger className="h-8 min-w-[120px] border-dashed border-border/60 rounded-lg bg-transparent hover:bg-muted/20 transition-colors text-[12px]">
              <SelectValue placeholder="Cycle" />
            </SelectTrigger>
            <SelectContent>
              {electionCycles.map((cycle) => (
                <SelectItem key={cycle} value={cycle}>
                  {cycle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Sector Multi-Select Popover */}
        {showSectors && (
          <Popover open={sectorOpen} onOpenChange={setSectorOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'h-8 min-w-[90px] justify-between gap-2 font-medium bg-transparent border-dashed border-border/60 rounded-lg hover:bg-muted/20 hover:border-border transition-all text-[12px]',
                  selectedSectors.length > 0 && 'border-solid border-primary/50 bg-primary/5 text-primary'
                )}
              >
                <span className="flex items-center gap-2">
                  {sectorLabel}
                  {selectedSectors.length > 0 && (
                    <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs font-medium">
                      {selectedSectors.length}
                    </Badge>
                  )}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div className="space-y-1">
                {sectors.map((sector) => (
                  <button
                    key={sector}
                    onClick={() => handleToggleSector(sector)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                      selectedSectors.includes(sector) && 'bg-accent'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded border border-primary',
                        selectedSectors.includes(sector)
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50'
                      )}
                    >
                      {selectedSectors.includes(sector) && <Check className="h-3 w-3" />}
                    </div>
                    {sector}
                  </button>
                ))}
              </div>
              {selectedSectors.length > 0 && (
                <div className="border-t mt-2 pt-2">
                  <button
                    onClick={() => setSelectedSectors([])}
                    className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear sectors
                  </button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        )}

        {/* Status Multi-Select Popover */}
        {showStatuses && statuses.length > 0 && (
          <Popover open={statusOpen} onOpenChange={setStatusOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'h-8 min-w-[90px] justify-between gap-2 font-medium bg-transparent border-dashed border-border/60 rounded-lg hover:bg-muted/20 hover:border-border transition-all text-[12px]',
                  selectedStatuses.length > 0 && 'border-solid border-primary/50 bg-primary/5 text-primary'
                )}
              >
                <span className="flex items-center gap-2">
                  {statusLabel}
                  {selectedStatuses.length > 0 && (
                    <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs font-medium">
                      {selectedStatuses.length}
                    </Badge>
                  )}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div className="space-y-1">
                {statuses.map((status) => (
                  <button
                    key={status.key}
                    onClick={() => handleToggleStatus(status.key)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                      selectedStatuses.includes(status.key) && 'bg-accent'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded border border-primary',
                        selectedStatuses.includes(status.key)
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50'
                      )}
                    >
                      {selectedStatuses.includes(status.key) && <Check className="h-3 w-3" />}
                    </div>
                    <span className={cn('px-1.5 py-0.5 rounded text-xs border', status.color)}>
                      {status.label}
                    </span>
                  </button>
                ))}
              </div>
              {selectedStatuses.length > 0 && (
                <div className="border-t mt-2 pt-2">
                  <button
                    onClick={() => setSelectedStatuses([])}
                    className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear statuses
                  </button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        )}

        {/* Budget Type Segmented Control */}
        {showBudgetType && budgetTypes.length > 0 && setBudgetType && (
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border">
            {budgetTypes.map((type) => (
              <button
                key={type}
                onClick={() => setBudgetType(type)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                  budgetType === type
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {type}
              </button>
            ))}
          </div>
        )}

        {/* Reset Button */}
        {computedHasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAllFilters}
            className="h-9 text-muted-foreground hover:text-foreground gap-2 rounded-full"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>
    </div>

      {/* Active Filter Chips */}
      {computedHasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-muted-foreground">Active filters:</span>

          {searchQuery && (
            <Badge
              variant="secondary"
              className="h-6 gap-1 pl-2 pr-1 text-xs font-normal cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={() => removeFilter('search')}
            >
              Search: &quot;{searchQuery.length > 20 ? searchQuery.slice(0, 20) + '...' : searchQuery}
              &quot;
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}

          {electionCycle !== 'Overall' && (
            <Badge
              variant="secondary"
              className="h-6 gap-1 pl-2 pr-1 text-xs font-normal cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={() => removeFilter('cycle')}
            >
              {electionCycle}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}

          {selectedSectors.map((sector) => (
            <Badge
              key={sector}
              variant="secondary"
              className="h-6 gap-1 pl-2 pr-1 text-xs font-normal cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={() => removeFilter('sector', sector)}
            >
              {sector}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}

          {selectedStatuses.map((statusKey) => {
            const status = getStatusInfo(statusKey)
            return (
              <Badge
                key={statusKey}
                className={cn(
                  'h-6 gap-1 pl-2 pr-1 text-xs font-normal cursor-pointer border transition-colors',
                  status?.color
                )}
                onClick={() => removeFilter('status', statusKey)}
              >
                {status?.label || statusKey}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )
          })}

          {showBudgetType && budgetType && budgetType !== 'Both' && (
            <Badge
              variant="secondary"
              className="h-6 gap-1 pl-2 pr-1 text-xs font-normal cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={() => removeFilter('budgetType')}
            >
              {budgetType}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
