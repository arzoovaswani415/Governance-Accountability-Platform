'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, MessageSquare, ArrowDown, FileText } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FilterBar } from '@/components/filters/filter-bar'
import { useLocalFilters, promiseStatuses } from '@/components/filters/filter-context'
import { PolicyLifecycleTimeline } from '@/components/policy-lifecycle-timeline'
import { getPromises, getPromiseDetail, PromiseBrief, PromiseDetail } from '@/lib/api'

export default function PromisesPage() {
  const filters = useLocalFilters()
  const [selectedPromiseId, setSelectedPromiseId] = useState<number | null>(null)
  
  const [promisesData, setPromisesData] = useState<PromiseBrief[]>([])
  const [selectedPromise, setSelectedPromise] = useState<PromiseDetail | null>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPromises() {
      setIsLoading(true)
      try {
        const data = await getPromises()
        setPromisesData(data)
        if (data.length > 0) {
          setSelectedPromiseId(data[0].id)
        }
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
    const matchesSearch = promise.text
      .toLowerCase()
      .includes(filters.searchQuery.toLowerCase())
    const matchesSector = filters.selectedSectors.length === 0 || filters.selectedSectors.includes(promise.sector.name)
    const matchesStatus = filters.selectedStatuses.length === 0 || filters.selectedStatuses.includes(promise.status)

    return matchesSearch && matchesSector && matchesStatus
  })

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      fulfilled: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30',
      in_progress: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30',
      partial: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30',
      no_progress: 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30',
      announced: 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-500/30',
    }
    return statusColors[status] || 'bg-muted text-muted-foreground'
  }

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      fulfilled: 'Fulfilled',
      in_progress: 'In Progress',
      partial: 'Partial',
      no_progress: 'No Progress',
      announced: 'Announced',
    }
    return statusLabels[status] || 'Unknown'
  }

  if (isLoading) {
    return <div className="min-h-screen p-8 flex justify-center text-muted-foreground">Loading promises...</div>
  }

  if (error) {
    return <div className="min-h-screen p-8 flex justify-center text-red-500">{error}</div>
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Promise Explorer</h1>
        <p className="text-muted-foreground mt-2 text-base">
          Explore political manifesto promises and see how they connect to policies, budgets, and implementation progress
        </p>
      </div>

      {/* Modern Filter Bar - Sticky */}
      <div className="sticky top-16 z-10 -mx-4 md:-mx-8 px-4 md:px-8 py-4 mb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <Card className="p-4 bg-card/95 border border-border shadow-sm">
          <FilterBar
            searchQuery={filters.searchQuery}
            setSearchQuery={filters.setSearchQuery}
            searchPlaceholder="Search promises by title or description..."
            electionCycle={filters.electionCycle}
            setElectionCycle={filters.setElectionCycle}
            selectedSectors={filters.selectedSectors}
            setSelectedSectors={filters.setSelectedSectors}
            toggleSector={filters.toggleSector}
            selectedStatuses={filters.selectedStatuses}
            setSelectedStatuses={filters.setSelectedStatuses}
            toggleStatus={filters.toggleStatus}
            statuses={promiseStatuses}
            statusLabel="Promise Status"
            clearAllFilters={filters.clearAllFilters}
            hasActiveFilters={filters.hasActiveFilters}
          />
        </Card>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Promise List */}
        <div className="lg:col-span-1">
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto space-y-4 pr-2">
            {filtered.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No promises match your filters</p>
              </Card>
            ) : (
              filtered.map((promise) => (
                <Card
                  key={promise.id}
                  onClick={() => setSelectedPromiseId(promise.id)}
                  className={`p-4 cursor-pointer transition-all duration-200 border shadow-sm ${
                    selectedPromiseId === promise.id
                      ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/40 hover:bg-muted/40 hover:shadow-md'
                  }`}
                >
                  <h3 className="font-semibold text-sm line-clamp-2 leading-snug">{promise.text}</h3>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs font-medium">{promise.sector.name}</Badge>
                    <Badge variant="outline" className="text-xs font-medium">{promise.election_cycle.name}</Badge>
                  </div>
                  <div className="mt-2">
                    <Badge className={`text-xs font-semibold ${getStatusColor(promise.status)}`}>
                      {getStatusLabel(promise.status)}
                    </Badge>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Promise Details */}
        <div className="lg:col-span-2 space-y-6">
          {isDetailLoading || !selectedPromise ? (
            <Card className="p-8 border border-border shadow-sm flex justify-center text-muted-foreground">
              Loading details...
            </Card>
          ) : (
            <>
              {/* Section 1: Promise Overview */}
              <Card className="p-8 border border-border shadow-sm">
                <div className="flex items-start justify-between mb-5">
                  <h2 className="text-2xl font-bold leading-tight">{selectedPromise.text}</h2>
                  <Badge className={`${getStatusColor(selectedPromise.status)} font-semibold`}>
                    {getStatusLabel(selectedPromise.status)}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sector</p>
                    <p className="text-sm font-medium mt-1">{selectedPromise.sector.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Election Cycle</p>
                    <p className="text-sm font-medium mt-1">{selectedPromise.election_cycle.name}</p>
                  </div>
                </div>
              </Card>

              {/* Section 2: Related Policies */}
              {selectedPromise.related_policies && selectedPromise.related_policies.length > 0 && (
                <Card className="p-7 border border-border shadow-sm">
                  <h3 className="font-bold text-lg mb-5">Promise to Policy Mapping</h3>
                  <div className="space-y-4">
                    {selectedPromise.related_policies.map((policy, idx) => (
                      <div key={idx} className="space-y-3">
                        {/* Promise Card */}
                        <div className="p-4 bg-card rounded-lg border-l-4 border-l-blue-500 border-t border-r border-b border-border">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Manifesto Promise</p>
                              <p className="font-semibold text-sm mt-0.5">{selectedPromise.text}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Arrow Connector */}
                        <div className="flex justify-center">
                          <div className="flex flex-col items-center">
                            <div className="w-0.5 h-4 bg-border" />
                            <ArrowDown className="w-5 h-5 text-muted-foreground" />
                            <div className="w-0.5 h-4 bg-border" />
                          </div>
                        </div>
                        
                        {/* Policy Card */}
                        <div className="p-4 bg-card rounded-lg border-l-4 border-l-purple-500 border-t border-r border-b border-border">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">Policy / Bill</p>
                                <p className="font-semibold text-sm mt-0.5">{policy.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">Year: {policy.year_introduced}</p>
                              </div>
                            </div>
                            <Badge 
                              variant="outline"
                              className={`font-semibold whitespace-nowrap ${
                                policy.status === 'implemented'
                                  ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/50'
                                  : policy.status === 'passed'
                                  ? 'text-green-600 dark:text-green-400 border-green-500/50'
                                  : 'text-purple-600 dark:text-purple-400 border-purple-500/50'
                              }`}
                            >
                              {policy.status}
                            </Badge>
                          </div>
                        </div>
                        
                        {idx < selectedPromise.related_policies.length - 1 && (
                          <div className="border-t border-dashed border-border my-4" />
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Section 3: Budget Allocation */}
              {selectedPromise.budget_trends && selectedPromise.budget_trends.length > 0 && (
                <Card className="p-7 border border-border shadow-sm">
                  <h3 className="font-bold text-lg mb-5">{selectedPromise.sector.name} Sector Budget Allocation Trends</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={selectedPromise.budget_trends} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="year" stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
                      <YAxis stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--card)', 
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value) => `₹${value.toLocaleString()} Cr`}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount_crores"
                        stroke="var(--primary)"
                        strokeWidth={3}
                        dot={{ fill: 'var(--primary)', r: 5 }}
                        activeDot={{ r: 7 }}
                        isAnimationActive={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Section 4: Implementation Signals */}
              <Card className="p-7 border border-border shadow-sm">
                <h3 className="font-bold text-lg mb-5">Implementation Signals</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Policy Introduced', achieved: selectedPromise.related_policies && selectedPromise.related_policies.length > 0 },
                    { label: 'Budget Allocated', achieved: selectedPromise.budget_trends && selectedPromise.budget_trends.length > 0 },
                    { label: 'Program Launched', achieved: ['in_progress', 'partial', 'fulfilled'].includes(selectedPromise.status) },
                    { label: 'Outcome Achieved', achieved: selectedPromise.status === 'fulfilled' },
                  ].map((signal, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-colors ${
                        signal.achieved
                          ? 'bg-secondary/10 border-secondary text-secondary'
                          : 'bg-muted/30 border-border text-muted-foreground'
                      }`}
                    >
                      {signal.achieved ? (
                        <CheckCircle className="h-8 w-8 mb-2" />
                      ) : (
                        <AlertCircle className="h-8 w-8 mb-2" />
                      )}
                      <p className="text-xs font-semibold text-center leading-tight">{signal.label}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Section 5: Legislative Timeline */}
              {selectedPromise.timeline_events && selectedPromise.timeline_events.length > 0 && (
                <Card className="p-7 border border-border shadow-sm">
                  <PolicyLifecycleTimeline 
                    events={selectedPromise.timeline_events.map(e => ({
                      year: e.year,
                      event: `${e.event_type}: ${e.policy_name}` + (e.description ? ` - ${e.description}` : '')
                    }))}
                    title="Legislative Timeline"
                    showProgressBar={true}
                    variant="vertical"
                  />
                </Card>
              )}

              {/* Section 6: AI Governance Insight */}
              {selectedPromise.ai_insight && (
                <Card className="p-7 border border-border shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="flex items-start gap-4">
                    <MessageSquare className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-3">AI Governance Insight</h3>
                      <p className="text-base text-foreground leading-relaxed">{selectedPromise.ai_insight}</p>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
