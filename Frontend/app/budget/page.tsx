'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  Layers
} from 'lucide-react'
import { FilterBar } from '@/components/filters/filter-bar'
import { useLocalFilters, budgetTypes } from '@/components/filters/filter-context'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
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
  type BudgetSectorData,
  type BudgetTrendPipeline,
  type BudgetDistribution as BudgetDistType
} from '@/lib/api'

export default function BudgetAnalysisPage() {
  const filters = useLocalFilters()

  const [isLoading, setIsLoading] = useState(true)
  const [trendData, setTrendData] = useState<any[]>([])
  const [distributionData, setDistributionData] = useState<any[]>([])
  const [alignmentData, setAlignmentData] = useState<BudgetPromiseAlignment[]>([])
  const [fundingGaps, setFundingGaps] = useState<BudgetPromiseAlignment[]>([])

  const [totalBudget, setTotalBudget] = useState(0)
  const [healthcareBudget, setHealthcareBudget] = useState(0)
  const [energyBudget, setEnergyBudget] = useState(0)
  const [agricultureBudget, setAgricultureBudget] = useState(0)
  const [availableSectors, setAvailableSectors] = useState<string[]>([])

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const [trendsRaw, distRaw, sectorsRaw, alignments] = await Promise.all([
          getBudgetPipelineTrend(),
          getBudgetDistribution(),
          getBudgetPipelineSectors(),
          getBudgetPromiseAlignment()
        ])

        try {
          const sectorsList = await getSectors()
          setAvailableSectors(sectorsList.map(s => s.name))
        } catch {
          setAvailableSectors([])
        }

        // Process Trends
        const yearMap = new Map<number, any>()
        trendsRaw.forEach(t => {
          if (!yearMap.has(t.year)) yearMap.set(t.year, { year: t.year })
          const yearObj = yearMap.get(t.year)
          yearObj[t.sector] = t.budget
        })
        const chartData = Array.from(yearMap.values()).sort((a: any, b: any) => a.year - b.year)
        setTrendData(chartData)

        // Process Distribution
        const sectorColors = [
          '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'
        ]
        const distData = distRaw.map((d, i) => ({
          name: d.sector,
          value: d.budget,
          color: sectorColors[i % sectorColors.length]
        }))
        setDistributionData(distData)

        // Totals
        let total = 0
        distRaw.forEach(d => total += d.budget)
        setTotalBudget(total)

        const health = sectorsRaw.find(s => s.sector === 'Healthcare')?.budget || 0
        const energy = sectorsRaw.find(s => s.sector === 'Energy')?.budget || 0
        const agri = sectorsRaw.find(s => s.sector === 'Agriculture')?.budget || 0
        
        setHealthcareBudget(health)
        setEnergyBudget(energy)
        setAgricultureBudget(agri)

        const sortedAlignments = alignments
          .slice()
          .sort((a, b) => (b.promise_count ?? 0) - (a.promise_count ?? 0))
        setAlignmentData(sortedAlignments)

        const gaps = sortedAlignments.filter(a => a.promise_count > 0 && a.alignment === 'weak')
        setFundingGaps(gaps)
        
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const getAlignmentBadge = (alignment: BudgetPromiseAlignment['alignment']) => {
    if (alignment === 'strong') return 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
    if (alignment === 'moderate') return 'bg-indigo-500/10 text-indigo-600 border-indigo-200'
    if (alignment === 'weak') return 'bg-rose-500/10 text-rose-600 border-rose-200'
    return 'bg-slate-500/10 text-slate-600 border-slate-200'
  }

  const sectors = availableSectors.length > 0
    ? availableSectors
    : ['Healthcare', 'Energy', 'Agriculture', 'Education', 'Infrastructure', 'Technology', 'Environment']

  return (
    <div className="min-h-screen bg-slate-50/50 pt-20 pb-10 px-8">
      {/* Premium Header */}
      <div className="max-w-[1600px] mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Fiscal Intelligence Unit</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-none">Republic of India • 2024-25</span>
              </div>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">
              National Budgetary <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-indigo-600">Pipeline Analysis</span>
            </h1>
          </div>
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-200/60">
            <div className="px-4 py-2 text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Monitored</p>
              <p className="text-xl font-black text-slate-900">₹{(totalBudget / 1000).toFixed(1)}K Cr</p>
            </div>
            <div className="h-10 w-px bg-slate-100" />
            <div className="px-4 py-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 font-black uppercase text-[10px]">Active Tracker</Badge>
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
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Global Search</label>
                <FilterBar
                  searchQuery={filters.searchQuery}
                  setSearchQuery={filters.setSearchQuery}
                  searchPlaceholder="Filter fiscal data..."
                  electionCycle={filters.electionCycle}
                  setElectionCycle={filters.setElectionCycle}
                  selectedSectors={filters.selectedSectors}
                  setSelectedSectors={filters.setSelectedSectors}
                  toggleSector={filters.toggleSector}
                  sectors={sectors}
                  selectedStatuses={filters.selectedStatuses}
                  setSelectedStatuses={filters.setSelectedStatuses}
                  showStatuses={false}
                  statuses={[]}
                  budgetType={filters.budgetType}
                  setBudgetType={filters.setBudgetType}
                  budgetTypes={budgetTypes}
                  showBudgetType={true}
                  clearAllFilters={filters.clearAllFilters}
                  hasActiveFilters={filters.hasActiveFilters}
                  hideFilters={true}
                />
              </div>

              <div className="pt-6 border-t border-slate-100 italic text-[11px] text-slate-400 leading-relaxed">
                "Cross-referencing annual budget reports with manifesto points across all active government sectors."
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="col-span-12 lg:col-span-9 space-y-8">
          {/* Top KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Healthcare Allocation', value: healthcareBudget, icon: Activity, color: 'emerald' },
              { label: 'Energy Allocation', value: energyBudget, icon: Globe, color: 'indigo' },
              { label: 'Agriculture Allocation', value: agricultureBudget, icon: Layers, color: 'amber' },
            ].map((kpi, i) => (
              <Card key={i} className="group p-6 rounded-[2rem] border-slate-200/60 shadow-lg shadow-slate-200/20 bg-white hover:scale-[1.02] transition-all cursor-pointer overflow-hidden relative">
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
            ))}
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
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    {distributionData.map((d, i) => (
                      <linearGradient key={i} id={`color${d.name}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={d.color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={d.color} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
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
                    tickFormatter={(v) => `₹${v/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1rem'}}
                    itemStyle={{fontWeight: 900, fontSize: '13px'}}
                  />
                  {distributionData.slice(0, 4).map((d) => (
                    <Area 
                      key={d.name} 
                      type="monotone" 
                      dataKey={d.name} 
                      stroke={d.color} 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill={`url(#color${d.name})`} 
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
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
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900">100%</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balanced</span>
                </div>
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
                {fundingGaps.slice(0, 2).map((gap, i) => (
                  <Card key={i} className="p-6 rounded-[2rem] border-rose-100 bg-white hover:bg-rose-50/30 transition-colors border-l-8 border-l-rose-500">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-black text-slate-900">{gap.sector}</h4>
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-1">Stagnant Growth Pipeline</p>
                      </div>
                      <Badge className="bg-rose-500 font-black text-[9px] uppercase">Weak Alignment</Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Promise Count: {gap.promise_count}</span>
                      <span className="text-rose-600">Growth: {gap.budget_growth_percent}%</span>
                    </div>
                  </Card>
                ))}
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
                  {alignmentData.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-5 px-4 font-black text-slate-900">{item.sector}</td>
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500" style={{width: `${Math.min(100, (item.promise_count/10)*100)}%`}} />
                          </div>
                          <span className="text-xs font-bold text-slate-600">{item.promise_count}</span>
                        </div>
                      </td>
                      <td className="py-5 px-4 font-black text-slate-900">₹{item.avg_funding_crores.toLocaleString()}</td>
                      <td className="py-5 px-4">
                        <span className={`text-xs font-black ${item.budget_growth_percent >=0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {item.budget_growth_percent > 0 ? '+' : ''}{item.budget_growth_percent}%
                        </span>
                      </td>
                      <td className="py-5 px-4 text-right">
                        <Badge variant="outline" className={`font-black uppercase text-[9px] tracking-widest ${getAlignmentBadge(item.alignment)}`}>
                          {item.alignment}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
