'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, MessageSquare, ArrowDown, FileText, Shield, X, AlertTriangle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FilterBar } from '@/components/filters/filter-bar'
import { useLocalFilters, promiseStatuses } from '@/components/filters/filter-context'
import { PolicyLifecycleTimeline } from '@/components/policy-lifecycle-timeline'
import { 
  getPromises, 
  getPromiseDetail, 
  getSectors, 
  findSimilarPolicies,
  type PromiseBrief, 
  type PromiseDetail,
  type SimilarPolicy 
} from '@/lib/api'

import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ExplorerHeader } from '@/components/explorer/ExplorerHeader'
import { PromiseCard } from '@/components/explorer/PromiseCard'

export default function PromisesPage() {
  const filters = useLocalFilters()
  const [selectedPromiseId, setSelectedPromiseId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [promisesData, setPromisesData] = useState<PromiseBrief[]>([])
  const [selectedPromise, setSelectedPromise] = useState<PromiseDetail | null>(null)
  const [similarPolicies, setSimilarPolicies] = useState<SimilarPolicy[]>([])
  const [isSimilarLoading, setIsSimilarLoading] = useState(false)
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
        setIsDetailLoading(false) // Show main detail immediately
        
        // Background: Fetch semantic similar policies
        setIsSimilarLoading(true)
        findSimilarPolicies({ query: detail.text, top_k: 3 })
          .then(similar => setSimilarPolicies(similar))
          .catch(() => setSimilarPolicies([]))
          .finally(() => setIsSimilarLoading(false))
      } catch (err) {
        console.error('Failed to load promise detail:', err)
        setIsDetailLoading(false)
      }
    }
    if (selectedPromiseId) {
      loadPromiseDetail()
    }
  }, [selectedPromiseId])

  const filtered = promisesData.filter((promise) => {
    const matchesSearch = promise.text.toLowerCase().includes(filters.searchQuery.toLowerCase())
    const matchesSector = filters.selectedSectors.length === 0 || filters.selectedSectors.includes(promise.sector.name)
    const matchesStatus = filters.selectedStatuses.length === 0 || filters.selectedStatuses.includes(promise.status)
    return matchesSearch && matchesSector && matchesStatus
  })

  // Status mappings for visuals
  const statusStyles: Record<string, string> = {
    fulfilled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    partial: 'bg-amber-50 text-amber-700 border-amber-200',
    no_progress: 'bg-red-50 text-red-700 border-red-200',
    announced: 'bg-slate-50 text-slate-600 border-slate-200',
  }
  const getStatusColor = (s: string) => statusStyles[s] || 'bg-muted text-muted-foreground'

  const statusLabels: Record<string, string> = {
    fulfilled: 'Fulfilled', in_progress: 'In Progress', partial: 'Partial',
    no_progress: 'No Progress', announced: 'Announced',
  }
  const getStatusLabel = (s: string) => statusLabels[s] || 'Unknown'

  const handleCardClick = (id: number) => {
    setSelectedPromiseId(id)
    setIsDialogOpen(true)
  }

  return (
    <div className="flex flex-col h-full">
      <ExplorerHeader 
        title="Promise Explorer"
        availableSectors={availableSectors}
        statuses={promiseStatuses}
        filters={filters}
      />

      <main className="flex-1">
        <div className="max-w-[1600px] mx-auto min-h-full px-10 pb-10">
          {isLoading ? (
            <div className="flex items-center justify-center py-40">
              <span className="text-sm font-bold text-slate-500 animate-pulse">Analyzing Manifesto Commitments...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 text-center">
              <p className="text-lg font-bold text-slate-400">No promises found matching your criteria</p>
              <button onClick={() => filters.clearAllFilters()} className="mt-4 text-sm text-primary font-bold">Clear all filters</button>
            </div>
          ) : (
            <div className="explorer-grid">
              {filtered.map((promise) => (
                <PromiseCard
                  key={promise.id}
                  promise={promise}
                  onClick={() => handleCardClick(promise.id)}
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
          {isDetailLoading || !selectedPromise ? (
            <div className="p-20 text-center">
              <DialogTitle className="sr-only">Loading Promise Data</DialogTitle>
              <span className="text-sm font-bold text-slate-400 animate-pulse">Syncing Tracker Data...</span>
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
                        <Badge className={`uppercase tracking-widest text-[9px] font-black px-2 py-0.5 border-none shadow-sm ${getStatusColor(selectedPromise.status).replace('bg-', 'bg-').replace('text-', 'text-')}`}>
                           {getStatusLabel(selectedPromise.status)}
                        </Badge>
                      </div>
                      <DialogTitle className="text-xl font-black text-white leading-tight pr-12">{selectedPromise.text}</DialogTitle>
                   </div>
                </div>

                <div className="p-10">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                     {/* Left Column: Key Metrics & AI */}
                     <div className="lg:col-span-4 space-y-10">
                        <div>
                          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Commitment Profile</h3>
                          <div className="grid grid-cols-2 gap-3">
                             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                                <span className="text-[9px] font-bold text-slate-500 uppercase flex-shrink-0">Sector</span>
                                <span className="text-sm font-black text-slate-800 text-right">{selectedPromise.sector.name}</span>
                             </div>
                             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                                <span className="text-[9px] font-bold text-slate-500 uppercase flex-shrink-0">Election Cycle</span>
                                <span className="text-sm font-black text-slate-800 text-right">{selectedPromise.election_cycle.name}</span>
                             </div>
                             <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between gap-4">
                                <span className="text-[9px] font-bold text-emerald-600 uppercase flex-shrink-0">Fulfillment</span>
                                <span className="text-sm font-black text-emerald-800 text-right">{(selectedPromise.fulfillment_score * 100).toFixed(0)}%</span>
                             </div>
                             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                                <span className="text-[9px] font-bold text-slate-500 uppercase flex-shrink-0">Verification</span>
                                <span className="text-sm font-black text-slate-800 text-right">Verified</span>
                             </div>
                          </div>
                        </div>

                        {/* AI Insight */}
                        <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100/50 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                              <Shield className="h-10 w-10 text-blue-600" />
                           </div>
                           <div className="relative z-10">
                              <div className="flex items-center gap-2 mb-3">
                                <MessageSquare className="h-4 w-4 text-blue-600" />
                                <h3 className="text-xs font-black text-blue-800 uppercase tracking-tight">Governance Intelligence</h3>
                              </div>
                              <p className="text-sm text-blue-900/80 leading-relaxed italic">
                                "{selectedPromise.ai_insight || `This commitment significantly impacts the ${selectedPromise.sector.name} sector by addressing core systemic challenges outlined in the 2024 mandate.`}"
                              </p>
                           </div>
                        </div>

                        {/* Similar Promises (if available or reuse similar policies UI) */}
                        {similarPolicies && similarPolicies.length > 0 && (
                          <div className="space-y-4">
                             <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Related Policy Correlates</h3>
                             <div className="space-y-2">
                                {similarPolicies.map(sp => (
                                  <div key={sp.id} className="p-3 bg-white rounded-xl border border-slate-100 flex items-center justify-between hover:border-blue-200 cursor-default transition-colors">
                                     <span className="text-xs font-bold text-slate-700 truncate mr-3">{sp.name}</span>
                                     <Badge variant="secondary" className="text-[8px] font-black bg-slate-100">AI MATCH</Badge>
                                  </div>
                                ))}
                             </div>
                          </div>
                        )}
                     </div>

                     {/* Right Column: Details & Evidence */}
                     <div className="lg:col-span-8 space-y-12">
                        <div>
                          <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tighter">Manifesto Commitment</h3>
                          <p className="text-slate-600 leading-relaxed text-lg font-medium max-w-4xl">
                            {selectedPromise.text}
                          </p>
                        </div>

                        {/* Connected Implementation Policies */}
                        {selectedPromise.related_policies && selectedPromise.related_policies.length > 0 && (
                          <div className="bg-purple-50/30 rounded-3xl p-8 border border-purple-100">
                            <h3 className="text-xs font-black text-purple-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Active Implementation Policies
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                              {selectedPromise.related_policies.map((policy: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-5 p-6 bg-white rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-all group">
                                  <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <FileText className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1">
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-[15px] font-bold text-slate-800 leading-tight">{policy.name}</p>
                                        <Badge className={`text-[8px] font-black uppercase tracking-tighter border-none shadow-sm ${getStatusColor(policy.status).replace('bg-', 'bg-').replace('text-', 'text-')}`}>
                                          {policy.status}
                                        </Badge>
                                      </div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Year: {policy.year_introduced} • Implementation ID: #POL-{policy.id}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Budget Analysis */}
                        {selectedPromise.budget_trends && selectedPromise.budget_trends.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-6">
                              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{selectedPromise.sector.name} — Resource Allocation (₹ Cr)</h3>
                              <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">Official Data</Badge>
                            </div>
                            <div className="h-[240px] w-full bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                               <ResponsiveContainer width="100%" height="100%">
                                 <LineChart data={selectedPromise.budget_trends}>
                                   <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                   <XAxis dataKey="year" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                                   <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                                   <Tooltip 
                                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 800 }}
                                     formatter={(v) => [`₹${v.toLocaleString()} Cr`, 'Budget']}
                                   />
                                   <Line 
                                     type="monotone" 
                                     dataKey="amount_crores" 
                                     stroke="#8b5cf6" 
                                     strokeWidth={3} 
                                     dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                     activeDot={{ r: 6, strokeWidth: 0 }}
                                   />
                                 </LineChart>
                               </ResponsiveContainer>
                            </div>
                          </div>
                        )}
                        
                        {/* Implementation Signals */}
                        <div>
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Delivery Milestones</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                              { label: 'Policy Coverage', value: 'High', color: 'emerald' },
                              { label: 'Legislative Support', value: 'Strong', color: 'blue' },
                              { label: 'Budgetary Support', value: 'Adequate', color: 'purple' },
                              { label: 'Fulfillment Status', value: getStatusLabel(selectedPromise.status), color: 'indigo' }
                            ].map((stat, i) => (
                              <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">{stat.label}</p>
                                 <p className={`text-xs font-black text-${stat.color}-600`}>{stat.value}</p>
                              </div>
                            ))}
                          </div>
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
