'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, MessageSquare, ArrowDown, FileText } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FilterBar } from '@/components/filters/filter-bar'
import { useLocalFilters, promiseStatuses } from '@/components/filters/filter-context'
import { PolicyLifecycleTimeline } from '@/components/policy-lifecycle-timeline'
import { getPromises, getPromiseDetail, getSectors, PromiseBrief, PromiseDetail } from '@/lib/api'

export default function PromisesPage() {
  const filters = useLocalFilters()
  const [selectedPromiseId, setSelectedPromiseId] = useState<number | null>(null)
  const [promisesData, setPromisesData] = useState<PromiseBrief[]>([])
  const [selectedPromise, setSelectedPromise] = useState<PromiseDetail | null>(null)
  const [availableSectors, setAvailableSectors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPromises() {
      setIsLoading(true)
      try {
        try {
          const sectors = await getSectors()
          setAvailableSectors(sectors.map(s => s.name))
        } catch {
          setAvailableSectors([])
        }
        const data = await getPromises()
        setPromisesData(data)
        if (data.length > 0) setSelectedPromiseId(data[0].id)
      } catch (err) {
        setError('Failed to load promises')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    loadPromises()
  }, [])

  useEffect(() => {
    async function loadPromiseDetail() {
      if (!selectedPromiseId) return
      setIsDetailLoading(true)
      try {
        const detail = await getPromiseDetail(selectedPromiseId)
        setSelectedPromise(detail)
      } catch (err) {
        console.error('Failed to load promise detail:', err)
      } finally {
        setIsDetailLoading(false)
      }
    }
    loadPromiseDetail()
  }, [selectedPromiseId])

  const filtered = promisesData.filter((promise) => {
    const matchesSearch = promise.text.toLowerCase().includes(filters.searchQuery.toLowerCase())
    const matchesSector = filters.selectedSectors.length === 0 || filters.selectedSectors.includes(promise.sector.name)
    const matchesStatus = filters.selectedStatuses.length === 0 || filters.selectedStatuses.includes(promise.status)
    return matchesSearch && matchesSector && matchesStatus
  })

  const statusStyles: Record<string, string> = {
    fulfilled: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    in_progress: 'bg-blue-50 text-blue-700 border border-blue-200',
    partial: 'bg-amber-50 text-amber-700 border border-amber-200',
    no_progress: 'bg-red-50 text-red-700 border border-red-200',
    announced: 'bg-slate-50 text-slate-600 border border-slate-200',
  }
  const getStatusColor = (s: string) => statusStyles[s] || 'bg-muted text-muted-foreground'

  const statusLabels: Record<string, string> = {
    fulfilled: 'Fulfilled', in_progress: 'In Progress', partial: 'Partial',
    no_progress: 'No Progress', announced: 'Announced',
  }
  const getStatusLabel = (s: string) => statusLabels[s] || 'Unknown'

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Loading promises…</div>
  }
  if (error) {
    return <div className="flex-1 flex items-center justify-center text-sm text-red-500">{error}</div>
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── Navbar Section (Top Sticky) ── */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/40 px-8 py-3 w-full">
        <FilterBar
          searchQuery={filters.searchQuery}
          setSearchQuery={filters.setSearchQuery}
          searchPlaceholder="Search promises..."
          electionCycle={filters.electionCycle}
          setElectionCycle={filters.setElectionCycle}
          selectedSectors={filters.selectedSectors}
          setSelectedSectors={filters.setSelectedSectors}
          toggleSector={filters.toggleSector}
          sectors={availableSectors}
          sectorLabel="Sector"
          selectedStatuses={filters.selectedStatuses}
          setSelectedStatuses={filters.setSelectedStatuses}
          toggleStatus={filters.toggleStatus}
          statuses={promiseStatuses}
          statusLabel="Status"
          clearAllFilters={filters.clearAllFilters}
          hasActiveFilters={filters.hasActiveFilters}
          centerContent={
            <h1 className="text-xl font-bold text-foreground tracking-tighter whitespace-nowrap">
              Promise Explorer
            </h1>
          }
        />
      </div>

      {/* ── Two-column content ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden pt-6">

        {/* Left: Promise list */}
        <div className="w-[380px] flex-shrink-0 px-8 overflow-y-auto custom-scrollbar">
          <div className="space-y-5 pb-8">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No promises match your filters</p>
            ) : (
              filtered.map((promise) => (
                <button
                  key={promise.id}
                  onClick={() => setSelectedPromiseId(promise.id)}
                  className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
                    selectedPromiseId === promise.id
                      ? 'border-black bg-muted/50'
                      : 'border-border/40 bg-card hover:border-border hover:bg-muted/20'
                  }`}
                >
                  <h3 className="text-sm font-bold text-foreground leading-tight mb-4">
                    {promise.text}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-muted-foreground bg-muted/40 rounded px-2 py-1 font-medium">
                      {promise.sector.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground bg-muted/40 rounded px-2 py-1 font-medium">
                      {promise.election_cycle.name.split(' ')[0]}
                    </span>
                  </div>
                  <div className="mt-4">
                    <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded font-bold ${getStatusColor(promise.status).replace('border', 'border-0')}`}>
                      {getStatusLabel(promise.status)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Detail panel */}
        <div className="flex-1 overflow-y-auto p-6">
          {isDetailLoading ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Loading…</div>
          ) : !selectedPromise ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              Select a promise to see its details
            </div>
          ) : (
            <div className="space-y-4">

              {/* Overview */}
              <div className="detail-panel border-border/60 rounded-3xl p-10 bg-card">
                <div className="flex items-start justify-between gap-8 mb-10">
                  <h2 className="text-2xl font-bold text-foreground leading-tight tracking-tight">{selectedPromise.text}</h2>
                  <Badge variant="secondary" className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-muted/50">
                    {getStatusLabel(selectedPromise.status)}
                  </Badge>
                </div>
                
                <p className="text-[15px] text-muted-foreground/90 leading-relaxed mb-12">
                  Implementation tracking for this manifesto promise. Connected to legislative actions and monitored via official government reports and budgetary allocations.
                </p>

                <div className="grid grid-cols-3 gap-8 pt-10 border-t border-border/50">
                  <div>
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Sector</h4>
                    <p className="text-sm font-bold text-foreground">{selectedPromise.sector.name}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Election Cycle</h4>
                    <p className="text-sm font-bold text-foreground">{selectedPromise.election_cycle.name}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Category</h4>
                    <p className="text-sm font-bold text-foreground">Government of India</p>
                  </div>
                </div>
              </div>

              {/* Related Policies - Keep for data but style minimally if needed, or remove for now to match screenshot */}
              {selectedPromise.related_policies && selectedPromise.related_policies.length > 0 && (
                <div className="detail-panel border border-border/40 rounded-3xl p-8 bg-muted/5">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">Connected Policies</h3>
                  <div className="space-y-4">
                    {selectedPromise.related_policies.map((policy: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border/50">
                        <div className="flex items-center gap-4">
                          <FileText className="h-5 w-5 text-purple-500" />
                          <div>
                            <p className="text-sm font-bold text-foreground">{policy.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{policy.year_introduced} • {policy.status}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Simplified Explanation - Matching the design */}
              <div className="detail-panel border border-emerald-500/20 rounded-3xl p-10 bg-emerald-50/10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <MessageSquare className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Simplified Explanation</h3>
                </div>
                <p className="text-[15px] text-muted-foreground/90 leading-relaxed">
                  {selectedPromise.ai_insight || `This promise focus on ${selectedPromise.sector.name} sector. It aims to improve ${selectedPromise.text.toLowerCase()} through targeted policy interventions and budgetary support.`}
                </p>
              </div>

              {/* Budget Trends */}
              {selectedPromise.budget_trends && selectedPromise.budget_trends.length > 0 && (
                <div className="detail-panel">
                  <h3 className="text-sm font-semibold text-foreground mb-4">{selectedPromise.sector.name} — Budget Allocation</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={selectedPromise.budget_trends} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="year" style={{ fontSize: '11px' }} stroke="#9ca3af" />
                      <YAxis style={{ fontSize: '11px' }} stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(value: any) => [`₹${value.toLocaleString()} Cr`, 'Budget']}
                      />
                      <Line type="monotone" dataKey="amount_crores" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Implementation Signals */}
              <div className="detail-panel border border-border/40 rounded-3xl p-8 bg-muted/5">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">Implementation Signals</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Policy Introduced', achieved: selectedPromise.related_policies?.length > 0 },
                    { label: 'Budget Allocated', achieved: selectedPromise.budget_trends?.length > 0 },
                    { label: 'Program Launched', achieved: ['in_progress', 'partial', 'fulfilled'].includes(selectedPromise.status) },
                    { label: 'Outcome Achieved', achieved: selectedPromise.status === 'fulfilled' },
                  ].map((signal, idx) => (
                    <div key={idx} className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                      signal.achieved ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-muted/30 border-border text-muted-foreground'
                    }`}>
                      {signal.achieved
                        ? <CheckCircle className="h-6 w-6 mb-2" />
                        : <AlertCircle className="h-6 w-6 mb-2" />
                      }
                      <p className="text-[12px] font-bold leading-tight">{signal.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              {selectedPromise.timeline_events && selectedPromise.timeline_events.length > 0 && (
                <div className="detail-panel border border-border/40 rounded-3xl p-8 bg-muted/5">
                  <PolicyLifecycleTimeline
                    events={selectedPromise.timeline_events.map((e: any) => ({
                      year: e.year,
                      event: `${e.event_type}: ${e.policy_name}` + (e.description ? ` — ${e.description}` : ''),
                    }))}
                    title="Legislative Timeline"
                    showProgressBar={true}
                    variant="vertical"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
