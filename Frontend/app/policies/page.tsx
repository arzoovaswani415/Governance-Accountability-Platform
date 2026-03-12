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
    <div className="flex flex-col h-full bg-background">
      {/* ── Navbar Section (Top Sticky) ── */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/40 px-8 py-3 w-full">
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
          sectorLabel="Sector"
          selectedStatuses={filters.selectedStatuses}
          setSelectedStatuses={filters.setSelectedStatuses}
          toggleStatus={filters.toggleStatus}
          statuses={policyStatuses}
          statusLabel="Status"
          clearAllFilters={filters.clearAllFilters}
          hasActiveFilters={filters.hasActiveFilters}
          centerContent={
            <h1 className="text-xl font-bold text-foreground tracking-tighter whitespace-nowrap">
              Policy Explorer
            </h1>
          }
        />
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden pt-6">
        {/* Left: Policy list */}
        <div className="w-[380px] flex-shrink-0 px-8 overflow-y-auto custom-scrollbar">
          <div className="space-y-5 pb-8">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No policies match your filters</p>
            ) : (
              filtered.map((policy) => (
                <button
                  key={policy.id}
                  onClick={() => setSelectedPolicyId(policy.id)}
                  className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
                    selectedPolicyId === policy.id
                      ? 'border-black bg-muted/50'
                      : 'border-border/40 bg-card hover:border-border hover:bg-muted/20'
                  }`}
                >
                  <h3 className="text-sm font-bold text-foreground leading-tight mb-4">
                    {policy.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-muted-foreground bg-muted/40 rounded px-2 py-1 font-medium">
                      {policy.sector.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground bg-muted/40 rounded px-2 py-1 font-medium">
                      {policy.year_introduced}
                    </span>
                  </div>
                  <div className="mt-4">
                    <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded font-bold ${getStatusColor(policy.status.toLowerCase()).replace('border', 'border-0')}`}>
                      {policy.status}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Detail panel */}
        <div className="flex-1 overflow-y-auto p-6">
          {isDetailLoading || !selectedPolicy ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              {isDetailLoading ? 'Loading details...' : 'Select a policy to see its details'}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Overview */}
              <div className="detail-panel border-border/60 rounded-3xl p-10 bg-card">
                <div className="flex items-start justify-between gap-8 mb-10">
                  <h2 className="text-2xl font-bold text-foreground leading-tight tracking-tight">
                    {selectedPolicy.name}
                  </h2>
                  <Badge variant="secondary" className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-muted/50">
                    {selectedPolicy.status}
                  </Badge>
                </div>
                <p className="text-[15px] text-muted-foreground/90 leading-relaxed mb-12">
                  {selectedPolicy.description}
                </p>
                <div className="grid grid-cols-3 gap-8 pt-10 border-t border-border/50">
                  <div>
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Sector</h4>
                    <p className="text-sm font-bold text-foreground">{selectedPolicy.sector.name}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Year Introduced</h4>
                    <p className="text-sm font-bold text-foreground">{selectedPolicy.year_introduced}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Ministry</h4>
                    <p className="text-sm font-bold text-foreground">{selectedPolicy.ministry || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Simplified Explanation */}
              {selectedPolicy.ai_summary && (
                <div className="detail-panel border border-emerald-500/20 rounded-3xl p-10 bg-emerald-50/10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <MessageSquare className="h-5 w-5 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Simplified Explanation</h3>
                  </div>
                  <p className="text-[15px] text-muted-foreground/90 leading-relaxed">
                    {selectedPolicy.ai_summary}
                  </p>
                </div>
              )}

              {/* Related Manifesto Promises */}
              {selectedPolicy.related_promises && selectedPolicy.related_promises.length > 0 && (
                <div className="detail-panel border border-border/40 rounded-3xl p-8 bg-muted/5">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">Related Manifesto Promises</h3>
                  <div className="space-y-4">
                    {selectedPolicy.related_promises.map((promise, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-4 bg-card rounded-2xl border border-border/50">
                        <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm font-bold text-foreground leading-snug">{promise.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Budget Allocation Support */}
              {budgetTrend && (
                <div className="detail-panel border border-border/40 rounded-3xl p-8 bg-card">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">{budgetTrend.sector} Sector Budget Allocation</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={budgetTrend.yearly_data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="year" stroke="#9ca3af" style={{ fontSize: '11px' }} />
                      <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: any) => [`₹${value.toLocaleString()} Cr`, 'Amount']}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount_crores"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: '#10b981', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Legislative Evolution */}
              {selectedPolicy.timeline && selectedPolicy.timeline.length > 0 && (
                <div className="detail-panel border border-border/40 rounded-3xl p-8 bg-muted/5">
                  <PolicyLifecycleTimeline 
                    events={selectedPolicy.timeline.map(t => ({
                      year: t.year,
                      event: t.description ? `${t.event_type}: ${t.description}` : t.event_type
                    }))}
                    title="Legislative Evolution"
                    showProgressBar={true}
                    variant="vertical"
                  />
                </div>
              )}

              {/* Related Policies */}
              {selectedPolicy.related_policies && selectedPolicy.related_policies.length > 0 && (
                <div className="detail-panel border border-border/40 rounded-3xl p-8 bg-muted/5">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">Related Policies in Sector</h3>
                  <div className="space-y-4">
                    {selectedPolicy.related_policies.map((relPolicy, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border/50 hover:bg-muted/30 transition-all cursor-pointer">
                        <div className="flex items-center gap-4">
                          <FileText className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-foreground">{relPolicy.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{relPolicy.year_introduced}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
