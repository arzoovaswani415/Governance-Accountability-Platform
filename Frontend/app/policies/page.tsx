'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare, CheckCircle, FileText, Zap } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FilterBar } from '@/components/filters/filter-bar'
import { useLocalFilters, policyStatuses } from '@/components/filters/filter-context'
import { PolicyLifecycleTimeline } from '@/components/policy-lifecycle-timeline'
import { getPolicies, getPolicyDetail, getBudgetsTrends, getSectors, PolicyBrief, PolicyDetail, BudgetTrend } from '@/lib/api'

export default function PoliciesPage() {
  const filters = useLocalFilters()
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(null)

  const [policiesData, setPoliciesData] = useState<PolicyBrief[]>([])
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyDetail | null>(null)
  const [budgetTrend, setBudgetTrend] = useState<BudgetTrend | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableSectors, setAvailableSectors] = useState<string[]>([])

  useEffect(() => {
    async function loadPolicies() {
      setIsLoading(true)
      try {
        try {
          const sectors = await getSectors()
          setAvailableSectors(sectors.map(s => s.name))
        } catch {
          setAvailableSectors([])
        }

        const data = await getPolicies()
        setPoliciesData(data)
        if (data.length > 0) {
          setSelectedPolicyId(data[0].id)
        }
      } catch (err) {
        setError('Failed to load policies')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    loadPolicies()
  }, [])

  useEffect(() => {
    async function loadPolicyDetail() {
      if (!selectedPolicyId) return
      setIsDetailLoading(true)
      try {
        const detail = await getPolicyDetail(selectedPolicyId)
        setSelectedPolicy(detail)
        
        // Also load budget trend for this policy's sector
        const trends = await getBudgetsTrends({ sector: detail.sector.name })
        setBudgetTrend(trends[0] || null)
      } catch (err) {
        console.error('Failed to load policy detail:', err)
      } finally {
        setIsDetailLoading(false)
      }
    }
    loadPolicyDetail()
  }, [selectedPolicyId])

  const filtered = policiesData.filter((policy) => {
    const matchesSearch = policy.name
      .toLowerCase()
      .includes(filters.searchQuery.toLowerCase())
    const matchesSector = filters.selectedSectors.length === 0 || filters.selectedSectors.includes(policy.sector.name)
    const matchesStatus = filters.selectedStatuses.length === 0 || filters.selectedStatuses.includes(policy.status.toLowerCase())

    return matchesSearch && matchesSector && matchesStatus
  })


  const getStatusColor = (status: string) => {
    const statusObj = policyStatuses.find((s) => s.key === status)
    return statusObj?.color || 'bg-muted text-muted-foreground'
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Policy Explorer</h1>
        <p className="text-muted-foreground mt-2 text-base">
          Explore government policies, bills, amendments, and regulations. Understand how they connect to manifesto promises and impact budgets.
        </p>
      </div>

      {/* Modern Filter Bar - Sticky */}
      <div className="sticky top-16 z-10 -mx-4 md:-mx-8 px-4 md:px-8 py-4 mb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <Card className="p-4 bg-card/95 border border-border shadow-sm">
          <FilterBar
          searchQuery={filters.searchQuery}
          setSearchQuery={filters.setSearchQuery}
          searchPlaceholder="Search policies, bills, or acts..."
          electionCycle={filters.electionCycle}
          setElectionCycle={filters.setElectionCycle}
          selectedSectors={filters.selectedSectors}
          setSelectedSectors={filters.setSelectedSectors}
          toggleSector={filters.toggleSector}
          sectors={availableSectors}
          sectorLabel="Policy Sector"
          selectedStatuses={filters.selectedStatuses}
          setSelectedStatuses={filters.setSelectedStatuses}
          toggleStatus={filters.toggleStatus}
          statuses={policyStatuses}
          statusLabel="Policy Status"
          clearAllFilters={filters.clearAllFilters}
          hasActiveFilters={filters.hasActiveFilters}
        />
        </Card>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Policy List */}
        <div className="lg:col-span-1">
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto space-y-4 pr-2">
            {filtered.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No policies match your filters</p>
              </Card>
            ) : (
              filtered.map((policy) => (
                <Card
                  key={policy.id}
                  onClick={() => setSelectedPolicyId(policy.id)}
                  className={`p-4 cursor-pointer transition-all duration-200 border shadow-sm ${
                    selectedPolicyId === policy.id
                      ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/40 hover:bg-muted/40 hover:shadow-md'
                  }`}
                >
                  <h3 className="font-semibold text-sm line-clamp-2 leading-snug">{policy.name}</h3>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs font-medium">{policy.sector.name}</Badge>
                    <Badge variant="outline" className="text-xs font-medium">{policy.year_introduced}</Badge>
                  </div>
                  <div className="mt-2">
                    <Badge className={`text-xs font-semibold ${getStatusColor(policy.status)}`}>
                      {policy.status}
                    </Badge>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Policy Details */}
        <div className="lg:col-span-2 space-y-6">
          {isDetailLoading || !selectedPolicy ? (
             <Card className="p-8 border border-border shadow-sm flex justify-center text-muted-foreground">
               Loading details...
             </Card>
          ) : (
            <>
              {/* Section 1: Policy Overview */}
              <Card className="p-8 border border-border shadow-sm">
                <div className="flex items-start justify-between mb-5">
                  <h2 className="text-2xl font-bold leading-tight max-w-xl">{selectedPolicy.name}</h2>
                  <Badge className={`${getStatusColor(selectedPolicy.status.toLowerCase())} font-semibold whitespace-nowrap ml-3`}>
                    {selectedPolicy.status}
                  </Badge>
                </div>
                <p className="text-base text-foreground mb-6 leading-relaxed">{selectedPolicy.description}</p>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sector</p>
                    <p className="text-sm font-medium mt-1">{selectedPolicy.sector.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Year Introduced</p>
                    <p className="text-sm font-medium mt-1">{selectedPolicy.year_introduced}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ministry</p>
                    <p className="text-sm font-medium mt-1">{selectedPolicy.ministry || 'N/A'}</p>
                  </div>
                </div>
              </Card>

              {/* Section 2: AI Policy Summary */}
              {selectedPolicy.ai_summary && (
                <Card className="p-7 border border-border shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="flex items-start gap-4">
                    <MessageSquare className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-3">Simplified Explanation</h3>
                      <p className="text-base text-foreground leading-relaxed">{selectedPolicy.ai_summary}</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Section 3: Related Manifesto Promises */}
              {selectedPolicy.related_promises && selectedPolicy.related_promises.length > 0 && (
                <Card className="p-7 border border-border shadow-sm">
                  <h3 className="font-bold text-lg mb-5">Related Manifesto Promises</h3>
                  <div className="space-y-3">
                    {selectedPolicy.related_promises.map((promise, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-4 bg-muted/40 rounded-lg border border-border/50">
                        <CheckCircle className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                        <p className="text-sm font-medium text-foreground">{promise.text}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Section 4: Budget Allocation Support */}
              {budgetTrend && (
                <Card className="p-7 border border-border shadow-sm">
                  <h3 className="font-bold text-lg mb-5">{budgetTrend.sector} Sector Budget Allocation</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={budgetTrend.yearly_data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="year" stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
                      <YAxis stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
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

              {/* Section 5: Legislative Evolution */}
              {selectedPolicy.timeline && selectedPolicy.timeline.length > 0 && (
                <Card className="p-7 border border-border shadow-sm">
                  <PolicyLifecycleTimeline 
                    events={selectedPolicy.timeline.map(t => ({
                      year: t.year,
                      event: t.description ? `${t.event_type}: ${t.description}` : t.event_type
                    }))}
                    title="Legislative Evolution"
                    showProgressBar={true}
                    variant="vertical"
                  />
                </Card>
              )}

              {/* Section 6: Related Policies */}
              {selectedPolicy.related_policies && selectedPolicy.related_policies.length > 0 && (
                <Card className="p-7 border border-border shadow-sm">
                  <h3 className="font-bold text-lg mb-5">Related Policies in Sector</h3>
                  <div className="space-y-3">
                    {selectedPolicy.related_policies.map((relPolicy, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-muted/40 rounded-lg border border-border/50 hover:bg-muted/60 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                          <p className="text-sm font-medium text-foreground">{relPolicy.name} ({relPolicy.year_introduced})</p>
                        </div>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
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
