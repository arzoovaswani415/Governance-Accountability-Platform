'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  MessageSquare,
  AlertTriangle,
  Shield,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Database,
  Layers,
  RefreshCw,
} from 'lucide-react'
import { FilterBar } from '@/components/filters/filter-bar'
import { useLocalFilters, budgetTypes } from '@/components/filters/filter-context'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import {
  getBudgetPromiseAlignment,
  getSectors,
  getBudgetPipelineSectors,
  getBudgetPipelineTrend,
  getBudgetDistribution,
  type BudgetPromiseAlignment,
} from '@/lib/api'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

// ─── Sector colour palette ─────────────────────────────────────────────────
const SECTOR_COLORS = [
  '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316'
]

// ─── Alignment helpers ─────────────────────────────────────────────────────
function getAlignmentBadge(alignment: BudgetPromiseAlignment['alignment']) {
  if (alignment === 'strong') return 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
  if (alignment === 'moderate') return 'bg-indigo-500/10 text-indigo-600 border-indigo-200'
  if (alignment === 'weak') return 'bg-rose-500/10 text-rose-600 border-rose-200'
  return 'bg-slate-500/10 text-slate-600 border-slate-200'
}

// ─── Skeleton card ─────────────────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <Card className="p-6 rounded-[2rem] border-slate-200/60 shadow-lg shadow-slate-200/20 bg-white space-y-3">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-3 w-20" />
    </Card>
  )
}

export default function BudgetAnalysisPage() {
  const filters = useLocalFilters()

  const [isLoading, setIsLoading] = useState(true)
  const [trendData, setTrendData] = useState<any[]>([])
  const [distributionData, setDistributionData] = useState<any[]>([])
  const [alignmentData, setAlignmentData] = useState<BudgetPromiseAlignment[]>([])
  const [fundingGaps, setFundingGaps] = useState<BudgetPromiseAlignment[]>([])
  const [availableSectors, setAvailableSectors] = useState<string[]>([])

  // KPI card values — always reflect latest year across all sectors
  const [totalBudget, setTotalBudget] = useState(0)
  const [healthcareBudget, setHealthcareBudget] = useState(0)
  const [energyBudget, setEnergyBudget] = useState(0)
  const [agricultureBudget, setAgricultureBudget] = useState(0)

  // Re-fetch whenever sectors / search / election cycle filter changes
  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setIsLoading(true)
      try {
        const [trendsRaw, distRaw, sectorsRaw, alignments] = await Promise.all([
          getBudgetPipelineTrend(),          // full trend, we'll filter client-side
          getBudgetDistribution(),
          getBudgetPipelineSectors(),
          getBudgetPromiseAlignment(),
        ])

        // Load available sectors once
        try {
          const sectorsList = await getSectors()
          if (!cancelled) setAvailableSectors(sectorsList.map(s => s.name))
        } catch {
          // ignore – fallback list used below
        }

        if (cancelled) return

        // ── KPI card raw values (always show unfiltered latest year numbers) ─
        let rawTotal = 0
        distRaw.forEach(d => { rawTotal += d.budget })
        setTotalBudget(rawTotal)
        setHealthcareBudget(sectorsRaw.find(s => s.sector === 'Healthcare')?.budget ?? 0)
        setEnergyBudget(sectorsRaw.find(s => s.sector === 'Energy')?.budget ?? 0)
        setAgricultureBudget(sectorsRaw.find(s => s.sector === 'Agriculture')?.budget ?? 0)

        // ── Apply sector & search filters ────────────────────────────────────
        const activeSectors = filters.selectedSectors
        const searchTerm = filters.searchQuery.toLowerCase()

        const keep = (sectorName: string) => {
          if (activeSectors.length > 0 && !activeSectors.includes(sectorName)) return false
          if (searchTerm && !sectorName.toLowerCase().includes(searchTerm)) return false
          return true
        }

        // ── Trend data (line chart) ───────────────────────────────────────────
        const yearMap = new Map<number, Record<string, any>>()
        trendsRaw.forEach(t => {
          if (!keep(t.sector)) return
          if (!yearMap.has(t.year)) yearMap.set(t.year, { year: t.year })
          yearMap.get(t.year)![t.sector] = t.budget
        })
        const chartData = Array.from(yearMap.values())
          .filter(d => Object.keys(d).length > 1)
          .sort((a, b) => a.year - b.year)
        setTrendData(chartData)

        // ── Distribution data (pie chart) ─────────────────────────────────────
        const filteredDist = distRaw.filter(d => keep(d.sector))
        setDistributionData(
          filteredDist.map((d, i) => ({
            name: d.sector,
            value: d.budget,
            color: SECTOR_COLORS[i % SECTOR_COLORS.length],
          }))
        )

        // ── Alignment data (cards + table + gaps) ────────────────────────────
        const filteredAlign = alignments
          .filter(a => keep(a.sector))
          .slice()
          .sort((a, b) => (b.promise_count ?? 0) - (a.promise_count ?? 0))
        setAlignmentData(filteredAlign)
        setFundingGaps(filteredAlign.filter(a => a.promise_count > 0 && a.alignment === 'weak'))

      } catch (err) {
        console.error('[BudgetPage] fetch error:', err)
      } finally {
        if (!cancelled) {
          setTimeout(() => setIsLoading(false), 250)
        }
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [filters.selectedSectors, filters.searchQuery, filters.electionCycle])

  const sectors = availableSectors.length > 0
    ? availableSectors
    : ['Healthcare', 'Energy', 'Agriculture', 'Education', 'Infrastructure', 'Technology', 'Environment', 'Defence', 'Economy']

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50/50 pt-8 pb-10 px-8 relative">
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="h-10 w-10 text-emerald-600 animate-spin" />
              <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Synchronizing Fiscal Data...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Sleek Header Section */}
        <div className="max-w-[1600px] mx-auto mb-8">
          <div className="flex items-center justify-between border-b border-slate-200 pb-5">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-100">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Global Fiscal Intelligence</span>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-none h-4 px-1.5 text-[8px] font-black uppercase tracking-tighter">Live Monitor</Badge>
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Budgetary Pipeline</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Monitored</p>
                <p className="text-xl font-black text-slate-900">₹{(totalBudget / 1000).toFixed(1)}K <span className="text-xs font-bold text-slate-400">Cr</span></p>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Growth Vector</p>
                <p className="text-xl font-black text-emerald-600 text-right">+8.4%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-8">
          {/* Sidebar Filters - Integrated */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <Card className="p-6 rounded-[2rem] border-slate-200/60 shadow-xl shadow-slate-200/20 bg-white sticky top-24">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Database className="h-4 w-4 text-emerald-500" />
                Query Parameters
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Fiscal Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Search sectors..."
                      value={filters.searchQuery}
                      onChange={(e) => filters.setSearchQuery(e.target.value)}
                      className="pl-9 h-10 bg-slate-50 border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Analysis Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    {budgetTypes.map((type) => (
                      <Button
                        key={type}
                        variant={filters.budgetType === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => filters.setBudgetType(type)}
                        className={cn(
                          "h-9 rounded-xl text-[11px] font-bold",
                          filters.budgetType === type ? "bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200" : "border-slate-200 text-slate-600"
                        )}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

                <div className="pt-6 border-t border-slate-100 italic text-[11px] text-slate-400 leading-relaxed">
                  "Cross-referencing annual budget reports with manifesto points across all active government sectors."
                </div>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="col-span-12 lg:col-span-9 space-y-8">
            {/* Top KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {isLoading ? (
                <><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /></>
              ) : (
                [
                  { label: 'Healthcare Allocation', value: healthcareBudget, icon: Activity, color: 'emerald' },
                  { label: 'Energy Allocation', value: energyBudget, icon: Globe, color: 'indigo' },
                  { label: 'Agriculture Allocation', value: agricultureBudget, icon: Layers, color: 'amber' },
                ].map((kpi, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="group p-6 h-full rounded-[2rem] border-slate-200/60 shadow-lg shadow-slate-200/20 bg-white hover:scale-[1.02] transition-all cursor-pointer overflow-hidden relative">
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-${kpi.color}-500/10 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:scale-150`} />
                      <div className="relative z-10">
                        <div className={`h-12 w-12 rounded-2xl bg-${kpi.color}-500/10 flex items-center justify-center mb-4`}>
                          <kpi.icon className={`h-6 w-6 text-${kpi.color}-600`} />
                        </div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                        <div className="flex items-end justify-between">
                          <h4 className="text-3xl font-black text-slate-900">₹{(kpi.value / 1000).toFixed(1)}K <span className="text-lg font-bold text-slate-400">Cr</span></h4>
                          <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-lg">
                            <ArrowUpRight className="h-3 w-3" />
                            8.4%
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>

            {/* Large Trends Chart */}
            <Card className="p-8 rounded-[2.5rem] border-slate-200/60 shadow-xl shadow-slate-200/20 bg-white">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Multi-Sector Growth Vectors</h3>
                  <p className="text-sm text-slate-400 font-medium">Fiscal evolution over the analyzed policy lifespan</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl border-slate-200 font-bold text-xs h-9">Export Data</Button>
                  <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-slate-500" />
                  </div>
                </div>
              </div>
              
              <div className="h-[400px]">
                {trendData.length === 0 && !isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                    <AlertTriangle className="h-8 w-8 text-amber-500" />
                    <p className="text-sm font-bold">No trending data for current selection</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="year" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}}
                        tickFormatter={(v) => `₹${v >= 100000 ? (v/100000).toFixed(1) + 'L' : (v/1000).toFixed(0) + 'K'}`}
                      />
                      <Tooltip 
                        contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1.5rem'}}
                        itemStyle={{fontWeight: 900, fontSize: '13px', paddingTop: '4px', paddingBottom: '4px'}}
                        labelStyle={{fontWeight: 900, fontSize: '16px', color: '#0f172a', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px'}}
                        formatter={(value: number, name: string) => [`₹${(value).toLocaleString()} Cr`, name]}
                      />
                      {distributionData.map((d) => (
                        <Line 
                          key={d.name} 
                          type="monotone" 
                          dataKey={d.name} 
                          stroke={d.color} 
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                          animationDuration={1500}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Alignment & Gap Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Funding Distribution (Pie) */}
              <Card className="p-8 rounded-[2.5rem] border-slate-200/60 shadow-xl shadow-slate-200/20 bg-white">
                <div className="flex items-center gap-3 mb-6">
                  <PieIcon className="h-5 w-5 text-indigo-500" />
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Allocation Portfolio</h3>
                </div>
                <div className="h-[300px] relative">
                  {isLoading ? (
                     <div className="flex items-center justify-center h-full">
                       <RefreshCw className="h-8 w-8 animate-spin text-slate-200" />
                     </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {distributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  {!isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-black text-slate-900">100%</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balanced</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {distributionData.slice(0, 4).map((d, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="h-2 w-2 rounded-full" style={{backgroundColor: d.color}} />
                      <span className="text-[10px] font-bold text-slate-600 truncate">{d.name}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* AI Insights & Gap Detection */}
              <div className="space-y-6">
                <Card className="p-8 rounded-[2.5rem] border-emerald-200/60 shadow-xl shadow-emerald-200/10 bg-emerald-50/30">
                  <div className="flex items-start gap-4">
                    <MessageSquare className="h-6 w-6 text-emerald-600 mt-1" />
                    <div>
                      <h3 className="font-black text-lg text-emerald-900 mb-2">Fiscal Insight Vector</h3>
                      <p className="text-sm text-emerald-800 leading-relaxed font-medium">
                        Sectoral budget expansion is showing a <span className="font-black">strong correlation</span> with high-impact manifesto commitments in the Healthcare and Energy corridors.
                      </p>
                    </div>
                  </div>
                </Card>

                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest px-2 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                    Alert: Funding Gaps
                  </h3>
                  <AnimatePresence>
                    {fundingGaps.length === 0 && !isLoading ? (
                      <Card className="p-8 text-center border-dashed border-2 border-emerald-500/20 bg-emerald-50/5">
                        <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">✓ No Critical Gaps Detected</p>
                      </Card>
                    ) : (
                      fundingGaps.slice(0, 2).map((gap, i) => (
                        <motion.div
                          key={gap.sector}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <Card className="p-6 rounded-[2rem] border-rose-100 bg-white hover:bg-rose-50/30 transition-colors border-l-8 border-l-rose-500">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-black text-slate-900">{gap.sector}</h4>
                                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-1">Stagnant Growth Pipeline</p>
                              </div>
                              <Badge className="bg-rose-500 font-black text-[9px] uppercase border-none text-white">Weak Alignment</Badge>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              <span>Promise Count: {gap.promise_count}</span>
                              <span className="text-rose-600">Growth: {gap.budget_growth_percent}%</span>
                            </div>
                          </Card>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Detailed Alignment Pipeline Table */}
            <Card className="p-8 rounded-[2.5rem] border-slate-200/60 shadow-xl shadow-slate-200/20 bg-white overflow-hidden">
              <h2 className="text-xl font-black text-slate-900 tracking-tight mb-8">Detailed Alignment Pipeline</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sector Axis</th>
                      <th className="text-left pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Commitment Yield</th>
                      <th className="text-left pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Liquidity (₹ Cr)</th>
                      <th className="text-left pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Momentum</th>
                      <th className="text-left pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Audit Vector</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <AnimatePresence mode="popLayout">
                      {alignmentData.map((item, idx) => (
                        <motion.tr 
                          key={item.sector} 
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="group hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-5 px-4 font-black text-slate-900">{item.sector}</td>
                          <td className="py-5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden">
                                 <div className="h-full bg-emerald-500" style={{width: `${Math.min(100, (item.promise_count/10)*100)}%`}} />
                              </div>
                              <span className="text-xs font-bold text-slate-600">{item.promise_count}</span>
                            </div>
                          </td>
                          <td className="py-5 px-4 font-black text-slate-900">₹{item.avg_funding_crores.toLocaleString('en-IN')}</td>
                          <td className="py-5 px-4">
                            <span className={`text-xs font-black ${item.budget_growth_percent >=0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {item.budget_growth_percent > 0 ? '+' : ''}{item.budget_growth_percent}%
                            </span>
                          </td>
                          <td className="py-5 px-4 text-right">
                            <Badge variant="outline" className={cn("font-black uppercase text-[9px] tracking-widest", getAlignmentBadge(item.alignment))}>
                              {item.alignment}
                            </Badge>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
