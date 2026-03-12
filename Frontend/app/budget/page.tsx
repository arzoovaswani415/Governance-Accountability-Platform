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
} from 'recharts'
import {
  getBudgetPromiseAlignment,
  getSectors,
  getBudgetPipelineSectors,
  getBudgetPipelineTrend,
  getBudgetDistribution,
  type BudgetPromiseAlignment,
} from '@/lib/api'

// ─── Sector colour palette ─────────────────────────────────────────────────
const SECTOR_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316',
]

// ─── Alignment helpers ─────────────────────────────────────────────────────
function getAlignmentBadge(alignment: BudgetPromiseAlignment['alignment']) {
  if (alignment === 'strong') return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
  if (alignment === 'moderate') return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30'
  if (alignment === 'weak') return 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30'
  return 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-500/30'
}

// ─── Skeleton card ─────────────────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <Card className="p-6 border border-border/50 bg-card/50 space-y-3">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-2 w-20" />
    </Card>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────
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

  // Sectors that have data in the current view — used to render Line keys
  const activeSectorLines = distributionData.map(d => d.name)

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-4 md:p-8 bg-background/50">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-3">
          <Badge variant="outline" className="px-2 py-0.5 border-primary/40 text-primary bg-primary/5 text-[10px] font-bold tracking-widest">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            LIVE BUDGET INTELLIGENCE
          </Badge>
          {isLoading && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Updating…
            </span>
          )}
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
          Budget Analysis
        </h1>
        <p className="text-muted-foreground mt-2 text-lg max-w-2xl">
          Analysing fiscal allocations against political commitments with AI-driven gap detection.
        </p>
      </motion.div>

      {/* ── Sticky Filter Bar ── */}
      <div className="sticky top-16 z-10 -mx-4 md:-mx-8 px-4 md:px-8 py-3 mb-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/40">
        <Card className="p-4 bg-card/95 border border-border shadow-sm">
          <FilterBar
            searchQuery={filters.searchQuery}
            setSearchQuery={filters.setSearchQuery}
            searchPlaceholder="Search sector budgets…"
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
          />
        </Card>
      </div>

      {/* ── SECTION 1: KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          <>
            <KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton />
          </>
        ) : (
          <>
            {[
              { label: 'Total Budget Analyzed', value: totalBudget, sub: 'Latest Year · All Sectors', color: 'text-foreground' },
              { label: 'Healthcare Budget', value: healthcareBudget, sub: 'Latest Year Allocation', color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Energy Budget', value: energyBudget, sub: 'Latest Year Allocation', color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Agriculture Budget', value: agricultureBudget, sub: 'Latest Year Allocation', color: 'text-amber-600 dark:text-amber-400' },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Card className="p-6 h-full border border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all group overflow-hidden relative">
                  <div className="absolute -top-3 -right-3 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity">
                    <TrendingUp className="h-20 w-20" />
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                    {card.label}
                  </p>
                  <p className={`text-3xl font-black ${card.color}`}>
                    ₹{(card.value / 1000).toFixed(1)}K Cr
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-2">{card.sub}</p>
                </Card>
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* ── SECTION 2: Line Chart — Sector Budget Over Time ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <Card className="p-8 border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden relative">
          {/* loading overlay */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 bg-card/60 backdrop-blur-[2px] flex items-center justify-center"
              >
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Sector Budget Allocation Over Time</h2>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] font-bold tracking-wide">
                {filters.budgetType}
              </Badge>
              {filters.selectedSectors.length > 0 && (
                <Badge variant="outline" className="text-[10px]">
                  {filters.selectedSectors.length} sector{filters.selectedSectors.length > 1 ? 's' : ''} selected
                </Badge>
              )}
            </div>
          </div>

          {trendData.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-[350px] gap-3 text-muted-foreground">
              <AlertTriangle className="h-8 w-8" />
              <p className="text-sm font-medium">No data matches your current filters.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.4} />
                <XAxis
                  dataKey="year"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) => [
                    `₹${value.toLocaleString('en-IN')} Cr`,
                    name,
                  ]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                {activeSectorLines.map((sectorName, i) => (
                  <Line
                    key={sectorName}
                    type="monotone"
                    dataKey={sectorName}
                    stroke={SECTOR_COLORS[i % SECTOR_COLORS.length]}
                    strokeWidth={2.5}
                    dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--card))' }}
                    activeDot={{ r: 7, strokeWidth: 0 }}
                    animationDuration={900}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </motion.div>

      {/* ── SECTION 3: Top Alignment Cards ── */}
      <h2 className="text-xl font-bold mb-4">Top Sectors by Promise–Budget Alignment</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <AnimatePresence mode="sync">
          {isLoading && [0, 1, 2].map(i => (
            <motion.div key={`skel-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="p-6 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-px w-full my-2" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </Card>
            </motion.div>
          ))}
          {!isLoading && alignmentData.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-full"
            >
              <Card className="p-12 text-center border-dashed border-2 border-border/50">
                <p className="text-muted-foreground text-sm">No alignment data found for the current filters.</p>
              </Card>
            </motion.div>
          )}
          {!isLoading && alignmentData.slice(0, 3).map((item, idx) => (
            <motion.div
              layout
              key={item.sector}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.2, delay: idx * 0.06 }}
            >
              <Card className="p-6 border border-border/50 bg-card/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 h-full">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-bold text-base leading-snug">{item.sector}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.promise_count} promise{item.promise_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Badge className={getAlignmentBadge(item.alignment)}>
                    {item.alignment}
                  </Badge>
                </div>
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avg Funding</span>
                    <span className="text-sm font-black">₹{item.avg_funding_crores.toLocaleString('en-IN')} Cr</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Budget Growth</span>
                    <span className={`text-sm font-black ${item.budget_growth_percent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {item.budget_growth_percent >= 0 ? '+' : ''}{item.budget_growth_percent}%
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── SECTION 4: Pie Chart — Funding Distribution ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-8"
      >
        <Card className="p-7 border border-border/50 bg-card/50 shadow-sm">
          <h2 className="text-xl font-bold mb-6">Sector Funding Distribution</h2>
          {isLoading ? (
            <div className="flex items-center justify-center h-[320px]">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : distributionData.length === 0 ? (
            <div className="flex items-center justify-center h-[320px] text-muted-foreground text-sm">
              No distribution data for current filters.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name: string; percent: number }) =>
                    percent > 0.04 ? `${name} ${(percent * 100).toFixed(1)}%` : ''
                  }
                  outerRadius={110}
                  innerRadius={45}
                  paddingAngle={3}
                  dataKey="value"
                  animationDuration={900}
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) => [
                    `₹${value.toLocaleString('en-IN')} Cr`,
                    name,
                  ]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </motion.div>

      {/* ── SECTION 5: AI Insight Card ── */}
      <Card className="p-7 border border-border/50 bg-gradient-to-br from-primary/5 to-transparent shadow-sm mb-8">
        <div className="flex items-start gap-4">
          <MessageSquare className="h-5 w-5 text-primary mt-1 shrink-0" />
          <div>
            <h3 className="font-bold text-base mb-2">Budget Growth Insights</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Alignment scores are computed by cross-referencing sector-level budget growth against promise
              counts from the manifesto dataset. Sectors marked <strong>weak</strong> have promises on record
              but show flat or declining budget trajectory — flagged in the Funding Gap section below.
            </p>
          </div>
        </div>
      </Card>

      {/* ── SECTION 6: Analysis Table ── */}
      <Card className="p-7 border border-border/50 bg-card/50 shadow-sm mb-8">
        <h2 className="text-xl font-bold mb-6">Budget vs Promises — Full Analysis</h2>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : alignmentData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No data matches the current filters.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Sector</th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Promises</th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Avg Funding (₹ Cr)</th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Budget Growth</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Alignment</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="sync">
                  {alignmentData.map((item, idx) => (
                    <motion.tr
                      key={item.sector}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-border/30 hover:bg-muted/25 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="font-medium">{item.sector}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">{item.promise_count}</td>
                      <td className="py-3 px-4 text-right">₹{item.avg_funding_crores.toLocaleString('en-IN')}</td>
                      <td className={`py-3 px-4 text-right font-bold ${item.budget_growth_percent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>
                        {item.budget_growth_percent >= 0 ? '+' : ''}{item.budget_growth_percent}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={getAlignmentBadge(item.alignment)}>{item.alignment}</Badge>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── SECTION 7: Funding Gap Detection ── */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-2">Funding Gap Detection</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Sectors with recorded promises but weak budget growth signals — indicating potential under-funding risk.
        </p>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
          </div>
        ) : fundingGaps.length === 0 ? (
          <Card className="p-10 text-center border-dashed border-2 border-emerald-500/40 bg-emerald-500/5">
            <p className="text-emerald-700 dark:text-emerald-400 font-semibold">
              ✓ No critical funding gaps detected for the current selection.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {fundingGaps.map((gap, idx) => (
                <motion.div
                  key={gap.sector}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.07 }}
                >
                  <Card className="p-6 border-l-4 border-l-red-500 bg-red-500/5 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-base">{gap.sector}</h3>
                          <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30">
                            Weak Alignment
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {gap.promise_count} promise{gap.promise_count !== 1 ? 's' : ''} on record, but budget growth is low or flat.
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-background/60 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">Avg Funding</p>
                            <p className="font-bold">₹{gap.avg_funding_crores.toLocaleString('en-IN')} Cr</p>
                          </div>
                          <div className="bg-background/60 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">Budget Growth</p>
                            <p className="font-bold text-red-600 dark:text-red-400">{gap.budget_growth_percent}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
