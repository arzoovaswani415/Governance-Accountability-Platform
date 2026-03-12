'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

// Shared filter constants
// Sectors are fetched dynamically from the backend; keep this as a safe fallback.
export const sectors: string[] = []

export const electionCycles = [
  'Overall',
  '2004–2009',
  '2009–2014',
  '2014–2019',
  '2019–2024',
]

export const promiseStatuses = [
  { label: 'Fulfilled', key: 'fulfilled', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' },
  { label: 'In Progress', key: 'in_progress', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30' },
  { label: 'Partial', key: 'partial', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' },
  { label: 'No Progress', key: 'no_progress', color: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30' },
  { label: 'Announced', key: 'announced', color: 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30' },
]

export const policyStatuses = [
  { label: 'Proposed', key: 'Proposed', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30' },
  { label: 'Under Review', key: 'Under Review', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' },
  { label: 'Passed', key: 'Passed', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' },
  { label: 'Implemented', key: 'Implemented', color: 'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30' },
]

export const budgetTypes = ['Budget Allocation', 'Actual Spending', 'Both']

export const policyStages = [
  { label: 'Bill Introduced', key: 'Bill Introduced', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30' },
  { label: 'Committee Review', key: 'Committee Review', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' },
  { label: 'Amendment Added', key: 'Amendment Added', color: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30' },
  { label: 'Policy Passed', key: 'Policy Passed', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' },
  { label: 'Program Launched', key: 'Program Launched', color: 'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30' },
]

// Types
export interface StatusOption {
  label: string
  key: string
  color: string
}

export interface FilterState {
  searchQuery: string
  electionCycle: string
  selectedSectors: string[]
  selectedStatuses: string[]
  budgetType: string
}

export interface FilterContextValue extends FilterState {
  setSearchQuery: (query: string) => void
  setElectionCycle: (cycle: string) => void
  setSelectedSectors: React.Dispatch<React.SetStateAction<string[]>>
  setSelectedStatuses: React.Dispatch<React.SetStateAction<string[]>>
  setBudgetType: (type: string) => void
  toggleSector: (sector: string) => void
  toggleStatus: (status: string) => void
  clearAllFilters: () => void
  hasActiveFilters: boolean
}

const FilterContext = createContext<FilterContextValue | undefined>(undefined)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [electionCycle, setElectionCycle] = useState('Overall')
  const [selectedSectors, setSelectedSectors] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [budgetType, setBudgetType] = useState('Both')

  const toggleSector = useCallback((sector: string) => {
    setSelectedSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
    )
  }, [])

  const toggleStatus = useCallback((status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    )
  }, [])

  const clearAllFilters = useCallback(() => {
    setSearchQuery('')
    setElectionCycle('Overall')
    setSelectedSectors([])
    setSelectedStatuses([])
    setBudgetType('Both')
  }, [])

  const hasActiveFilters =
    searchQuery !== '' ||
    electionCycle !== 'Overall' ||
    selectedSectors.length > 0 ||
    selectedStatuses.length > 0 ||
    budgetType !== 'Both'

  const value: FilterContextValue = {
    searchQuery,
    electionCycle,
    selectedSectors,
    selectedStatuses,
    budgetType,
    setSearchQuery,
    setElectionCycle,
    setSelectedSectors,
    setSelectedStatuses,
    setBudgetType,
    toggleSector,
    toggleStatus,
    clearAllFilters,
    hasActiveFilters,
  }

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}

export function useFilters() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider')
  }
  return context
}

// Helper hook for local filter state (when you don't need global context)
export function useLocalFilters(initialState?: Partial<FilterState>) {
  const [searchQuery, setSearchQuery] = useState(initialState?.searchQuery ?? '')
  const [electionCycle, setElectionCycle] = useState(initialState?.electionCycle ?? 'Overall')
  const [selectedSectors, setSelectedSectors] = useState<string[]>(initialState?.selectedSectors ?? [])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(initialState?.selectedStatuses ?? [])
  const [budgetType, setBudgetType] = useState(initialState?.budgetType ?? 'Both')

  const toggleSector = useCallback((sector: string) => {
    setSelectedSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
    )
  }, [])

  const toggleStatus = useCallback((status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    )
  }, [])

  const clearAllFilters = useCallback(() => {
    setSearchQuery('')
    setElectionCycle('Overall')
    setSelectedSectors([])
    setSelectedStatuses([])
    setBudgetType('Both')
  }, [])

  const hasActiveFilters =
    searchQuery !== '' ||
    electionCycle !== 'Overall' ||
    selectedSectors.length > 0 ||
    selectedStatuses.length > 0

  return {
    searchQuery,
    electionCycle,
    selectedSectors,
    selectedStatuses,
    budgetType,
    setSearchQuery,
    setElectionCycle,
    setSelectedSectors,
    setSelectedStatuses,
    setBudgetType,
    toggleSector,
    toggleStatus,
    clearAllFilters,
    hasActiveFilters,
  }
}
