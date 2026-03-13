'use client'

import { Search } from 'lucide-react'
import { FilterBar } from '@/components/filters/filter-bar'
import { useLocalFilters } from '@/components/filters/filter-context'

interface ExplorerHeaderProps {
  title: string
  availableSectors: string[]
  statuses: { key: string; label: string; color: string }[]
  filters: any
}

export function ExplorerHeader({
  title,
  availableSectors,
  statuses,
  filters
}: ExplorerHeaderProps) {

  return (
    <header className="glass-header sticky top-0 z-50 px-10 py-2">
      <div className="flex items-center justify-between gap-4 max-w-[1600px] mx-auto">
        {/* Left: Branding & Title */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col border-r border-slate-200 pr-5">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-600 mb-0">Legislative Archive</span>
            <h1 className="text-lg font-black text-slate-800 tracking-tighter whitespace-nowrap leading-none">{title}</h1>
          </div>
        </div>

        {/* Right: Filters */}
        <div className="flex items-center gap-2">
          <FilterBar
            showSearch={false}
            searchQuery={filters.searchQuery}
            setSearchQuery={filters.setSearchQuery}
            searchPlaceholder="Search..."
            electionCycle={filters.electionCycle}
            setElectionCycle={filters.setElectionCycle}
            selectedSectors={filters.selectedSectors}
            setSelectedSectors={filters.setSelectedSectors}
            toggleSector={filters.toggleSector}
            sectors={availableSectors}
            sectorLabel="Sectors"
            selectedStatuses={filters.selectedStatuses}
            setSelectedStatuses={filters.setSelectedStatuses}
            toggleStatus={filters.toggleStatus}
            statuses={statuses}
            statusLabel="Status"
            clearAllFilters={filters.clearAllFilters}
            hasActiveFilters={filters.hasActiveFilters}
          />
        </div>
      </div>
    </header>
  )
}
