'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, MessageSquare, ArrowDown, FileText, Shield, X, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FilterBar } from '@/components/filters/filter-bar'
import { useLocalFilters, policyStatuses } from '@/components/filters/filter-context'
import { PolicyLifecycleTimeline } from '@/components/policy-lifecycle-timeline'
import { 
  getPolicies, 
  getPolicyDetail, 
  getBudgetsTrends, 
  getSectors, 
  findSimilarPolicies,
  getBills,
  getBillTimeline,
  type PolicyBrief, 
  type PolicyDetail, 
  type BudgetTrend,
  type SimilarPolicy,
  type BillBrief,
  type BillTimelineResponse
} from '@/lib/api'

import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ExplorerHeader } from '@/components/explorer/ExplorerHeader'
import { PolicyCard } from '@/components/explorer/PolicyCard'

export default function PoliciesPage() {
  const filters = useLocalFilters()
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [policiesData, setPoliciesData] = useState<PolicyBrief[]>([])
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyDetail | null>(null)
  const [budgetTrend, setBudgetTrend] = useState<BudgetTrend | null>(null)
  const [similarPolicies, setSimilarPolicies] = useState<SimilarPolicy[]>([])
  const [billTimeline, setBillTimeline] = useState<BillTimelineResponse | null>(null)
  const [isSimilarLoading, setIsSimilarLoading] = useState(false)

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
        setIsDetailLoading(false) // Core policy info ready, show it!

        // Background: Load budget trend
        getBudgetsTrends({ sector: detail.sector.name })
          .then(trends => setBudgetTrend(trends[0] || null))
          .catch(() => setBudgetTrend(null))

        // Background: Find semantic similar policies
        setIsSimilarLoading(true)
        findSimilarPolicies({ policy_id: selectedPolicyId, top_k: 3 })
          .then(similar => setSimilarPolicies(similar))
          .catch(() => setSimilarPolicies([]))
          .finally(() => setIsSimilarLoading(false))

        // Background: Matching bill for granular timeline
        setBillTimeline(null)
        getBills({ ministry: detail.ministry || undefined })
          .then(async bills => {
            if (bills.length > 0) {
              const matchedBill = bills.find(b => b.name.includes(detail.name.split(' ')[0])) || bills[0]
              if (matchedBill) {
                const bTimeline = await getBillTimeline(matchedBill.id)
                setBillTimeline(bTimeline)
              }
            }
          })
          .catch(() => {})

      } catch (err) {
        console.error('Failed to load policy detail:', err)
        setIsDetailLoading(false)
      }
    }
    if (selectedPolicyId) {
       loadPolicyDetail()
    }
  }, [selectedPolicyId])

  const filtered = policiesData.filter((policy) => {
    const matchesSearch = policy.name
      .toLowerCase()
      .includes(filters.searchQuery.toLowerCase())
    const matchesSector = filters.selectedSectors.length === 0 || filters.selectedSectors.includes(policy.sector.name)
    const matchesStatus = filters.selectedStatuses.length === 0 || 
      filters.selectedStatuses.some(s => s.toLowerCase() === policy.status.toLowerCase())

    return matchesSearch && matchesSector && matchesStatus
  })


  const getStatusColor = (status: string) => {
    const statusObj = policyStatuses.find((s) => s.key === status)
    return statusObj?.color || 'bg-muted text-muted-foreground'
  }

  const handleCardClick = (id: number) => {
    setSelectedPolicyId(id)
    setIsDialogOpen(true)
  }

  return (
    <div className="flex flex-col h-full">
      <ExplorerHeader 
        title="Policy Explorer"
        availableSectors={availableSectors}
        statuses={policyStatuses}
        filters={filters}
      />

      <main className="flex-1">
        <div className="max-w-[1600px] mx-auto min-h-full px-10 pb-10">
          {isLoading ? (
            <div className="flex items-center justify-center py-40">
              <span className="text-sm font-bold text-slate-500 animate-pulse">Initializing Legislative Database...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 text-center">
              <p className="text-lg font-bold text-slate-400">No policies found matching your criteria</p>
              <button onClick={() => filters.clearAllFilters()} className="mt-4 text-sm text-primary font-bold">Clear all filters</button>
            </div>
          ) : (
            <div className="explorer-grid">
              {filtered.map((policy) => (
                <PolicyCard
                  key={policy.id}
                  policy={policy}
                  onClick={() => handleCardClick(policy.id)}
                  statusColor={getStatusColor}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Detail Popup */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[1400px] w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-hidden custom-scrollbar p-0 gap-0 border-none rounded-3xl shadow-2xl bg-white [&>button]:hidden">
          {isDetailLoading || !selectedPolicy ? (
            <div className="p-20 text-center">
              <DialogTitle className="sr-only">Loading Policy Data</DialogTitle>
              <span className="text-sm font-bold text-slate-400 animate-pulse">Retrieving Policy Artifacts...</span>
            </div>
          ) : (
            <div className="flex flex-col">
                {/* Modal Header/Banner */}
                <div className="min-h-32 bg-slate-900 relative p-8 flex flex-col justify-end">
                   <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950" />
                   <div className="absolute top-4 right-4 z-50">
                      <button 
                        onClick={() => setIsDialogOpen(false)}
                        className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                   </div>
                   <div className="relative z-10 flex flex-col gap-3">
                      <div>
                        <Badge className={`uppercase tracking-widest text-[9px] font-black px-2 py-0.5 border-none shadow-sm ${getStatusColor(selectedPolicy.status.toLowerCase()).replace('bg-', 'bg-').replace('text-', 'text-')}`}>
                           {selectedPolicy.status}
                        </Badge>
                      </div>
                      <h2 className="text-2xl font-black text-white leading-tight pr-12">{selectedPolicy.name}</h2>
                   </div>
                </div>

               <div className="p-10">
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column: Context & Evidence */}
                    <div className="lg:col-span-4 space-y-10">
                      <div>
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Official Context</h3>
                        <div className="space-y-6">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-6">
                            <span className="text-[10px] font-bold text-slate-500 uppercase flex-shrink-0">Sector</span>
                            <span className="text-sm font-black text-slate-800 text-right">{selectedPolicy.sector.name}</span>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-6">
                            <span className="text-[10px] font-bold text-slate-500 uppercase flex-shrink-0">Phase</span>
                            <span className="text-sm font-black text-slate-800 text-right">{selectedPolicy.year_introduced}</span>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-6">
                            <span className="text-[10px] font-bold text-slate-500 uppercase flex-shrink-0">Authority</span>
                            <span className="text-sm font-black text-slate-800 text-right">{selectedPolicy.ministry || 'Union Govt'}</span>
                          </div>
                        </div>
                      </div>

                      {selectedPolicy.ai_summary && (
                        <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 relative overflow-hidden group">
                          <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-emerald-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
                          <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                              <MessageSquare className="h-4 w-4 text-emerald-600" />
                              <h3 className="text-xs font-black text-emerald-800 uppercase tracking-tight">Intelligence Brief</h3>
                            </div>
                            <p className="text-sm text-emerald-900/80 leading-relaxed italic">
                              "{selectedPolicy.ai_summary}"
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Evolution Timeline */}
                      {(billTimeline?.timeline?.length || selectedPolicy.timeline?.length) && (
                        <div>
                          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Legislative Journey</h3>
                          <PolicyLifecycleTimeline 
                            events={
                              billTimeline?.timeline?.length 
                                ? billTimeline.timeline.map(t => ({
                                    year: t.date ? new Date(t.date).getFullYear() : 'Active',
                                    event: `${t.stage}: ${t.description || ''}`
                                  }))
                                : selectedPolicy.timeline.map((t: any) => ({
                                    year: t.year,
                                    event: `${t.event_type}: ${t.description || ''}`
                                  }))
                            }
                            title=""
                            showProgressBar={true}
                            variant="vertical"
                          />
                        </div>
                      )}
                    </div>

                    {/* Right Column: Narrative & Links */}
                    <div className="lg:col-span-8 space-y-12">
                      <div>
                        <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tighter">Policy Mandatue & Objective</h3>
                        <p className="text-slate-600 leading-relaxed text-lg font-medium max-w-4xl">
                          {selectedPolicy.description}
                        </p>
                      </div>

                      {/* Aligned Manifesto Promises */}
                      {selectedPolicy.related_promises && selectedPolicy.related_promises.length > 0 && (
                        <div className="p-8 bg-indigo-50/50 rounded-3xl border border-indigo-100/50">
                          <h3 className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Connected Manifesto Commitment
                          </h3>
                          <div className="grid grid-cols-1 gap-4">
                            {selectedPolicy.related_promises.map((promise: any, idx: number) => (
                              <div key={idx} className="flex items-start gap-5 p-6 bg-white rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md transition-all">
                                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                                  <Shield className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="text-[15px] font-bold text-slate-800 leading-tight mb-2">{promise.text}</p>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter border-indigo-200 text-indigo-700">Governance Goal</Badge>
                                    <Badge className="text-[9px] font-black uppercase tracking-tighter bg-emerald-500 text-white border-none italic">Target Met</Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Budget Trends & Similar */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {budgetTrend && (
                          <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Budget Intensity (₹ Cr)</h3>
                            <div className="h-[200px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={budgetTrend.yearly_data}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                  <XAxis dataKey="year" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                                  <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                                  <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 800 }}
                                  />
                                  <Line 
                                    type="monotone" 
                                    dataKey="amount_crores" 
                                    stroke="#6366f1" 
                                    strokeWidth={3} 
                                    dot={{ fill: '#6366f1', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}

                        {similarPolicies && similarPolicies.length > 0 && (
                          <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Semantic Correlates</h3>
                            <div className="space-y-3">
                              {similarPolicies.map((sp) => (
                                <div key={sp.id} className="p-3 bg-white rounded-xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-indigo-200 transition-colors">
                                  <span className="text-xs font-bold text-slate-700 truncate mr-4">{sp.name}</span>
                                  <Badge variant="secondary" className="text-[8px] font-black bg-slate-100 text-slate-400">{(sp.similarity * 100).toFixed(0)}%</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                 </div>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
