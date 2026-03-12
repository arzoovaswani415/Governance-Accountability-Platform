'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  MessageSquare,
  AlertTriangle,
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

import { useEffect } from 'react'

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
          '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'
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

        // Funding gaps: promises exist but alignment is weak
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
    if (alignment === 'strong') return 'bg-secondary text-secondary-foreground'
    if (alignment === 'moderate') return 'bg-accent text-accent-foreground'
    if (alignment === 'weak') return 'bg-destructive text-destructive-foreground'
    return 'bg-muted text-muted-foreground'
  }

  const sectors = availableSectors.length > 0
    ? availableSectors
    : ['Healthcare', 'Energy', 'Agriculture', 'Education', 'Infrastructure', 'Technology', 'Environment']

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Budget Analysis</h1>
        <p className="text-muted-foreground mt-2 text-base">
          Analyze how government budget allocations relate to manifesto promises and policies
        </p>
      </div>

      {/* Modern Filter Bar - Sticky */}
      <div className="sticky top-16 z-10 -mx-4 md:-mx-8 px-4 md:px-8 py-4 mb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <Card className="p-4 bg-card/95 border border-border shadow-sm">
          <FilterBar
            searchQuery={filters.searchQuery}
            setSearchQuery={filters.setSearchQuery}
            searchPlaceholder="Search sector budgets or policies..."
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

      {/* SECTION 1: Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 border border-border">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Total Budget Analyzed
          </p>
          <p className="text-3xl font-bold">₹{(totalBudget / 1000).toFixed(1)}K Cr</p>
          <p className="text-xs text-muted-foreground mt-2">Latest Year Total</p>
        </Card>

        <Card className="p-6 border border-border">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Healthcare Budget
          </p>
          <p className="text-3xl font-bold text-secondary">₹{(healthcareBudget / 1000).toFixed(1)}K Cr</p>
          <p className="text-xs text-muted-foreground mt-2">Latest Year Allocation</p>
        </Card>

        <Card className="p-6 border border-border">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Energy Budget
          </p>
          <p className="text-3xl font-bold text-accent">₹{(energyBudget / 1000).toFixed(1)}K Cr</p>
          <p className="text-xs text-muted-foreground mt-2">Latest Year Allocation</p>
        </Card>

        <Card className="p-6 border border-border">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Agriculture Budget
          </p>
          <p className="text-3xl font-bold">₹{(agricultureBudget / 1000).toFixed(1)}K Cr</p>
          <p className="text-xs text-muted-foreground mt-2">Latest Year Allocation</p>
        </Card>
      </div>

      {/* SECTION 2: Sector Budget Allocation Trends */}
      <Card className="p-8 border border-border shadow-sm mb-8">
        <h2 className="text-xl font-bold mb-6">Sector Budget Allocation Over Time</h2>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={trendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="year" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
              formatter={(value: number) => `₹${value.toLocaleString()} Cr`}
            />
            <Legend />
            {distributionData.map((d) => (
              <Line key={d.name} type="monotone" dataKey={d.name} stroke={d.color} strokeWidth={2.5} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* SECTION 3: Budget vs Promises (sector-level, real data) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {alignmentData.slice(0, 3).map((item, idx) => (
          <Card key={`${item.sector}-${idx}`} className="p-6 border border-border">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-base leading-snug">{item.sector}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Promises: <span className="font-medium text-foreground">{item.promise_count}</span>
                </p>
              </div>
              <Badge className={getAlignmentBadge(item.alignment)}>{item.alignment}</Badge>
            </div>

            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Avg funding (₹ Cr)
                </span>
                <span className="text-sm font-bold">₹{item.avg_funding_crores.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Budget growth
                </span>
                <span className="text-sm font-bold">{item.budget_growth_percent}%</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* SECTION 4: Sector Funding Distribution */}
      <Card className="p-7 border border-border shadow-sm mb-8">
        <h2 className="text-xl font-bold mb-6">Sector Funding Distribution</h2>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={distributionData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ₹${value.toLocaleString()}Cr`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {distributionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}Cr`} />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* SECTION 5: Budget Growth Insights */}
      <Card className="p-7 border border-border shadow-sm bg-gradient-to-br from-primary/5 to-transparent mb-8">
        <div className="flex items-start gap-4">
          <MessageSquare className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-3">Budget Growth Insights</h3>
            <p className="text-base text-foreground leading-relaxed">
              This section will become more evidence-backed as we expand document ingestion and strengthen promise ↔ policy ↔ budget
              linkage confidence. For now, the charts and alignment cards above are computed from the current database budgets + promise
              counts per sector.
            </p>
          </div>
        </div>
      </Card>

      {/* SECTION 6: Budget vs Promises Analysis Table (sector-level, real data) */}
      <Card className="p-7 border border-border shadow-sm mb-8">
        <h2 className="text-xl font-bold mb-6">Budget vs Promises Analysis</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Sector</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Promise Count</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Avg Funding (₹ Cr)</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Budget Growth</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Alignment</th>
              </tr>
            </thead>
            <tbody>
              {alignmentData.map((item, idx) => (
                <tr key={`${item.sector}-${idx}`} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <Badge variant="outline">{item.sector}</Badge>
                  </td>
                  <td className="py-3 px-4 font-medium">{item.promise_count}</td>
                  <td className="py-3 px-4">₹{item.avg_funding_crores.toLocaleString()}</td>
                  <td className="py-3 px-4">{item.budget_growth_percent}%</td>
                  <td className="py-3 px-4">
                    <Badge className={getAlignmentBadge(item.alignment)}>{item.alignment}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SECTION 7: Funding Gap Detection */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Funding Gap Detection</h2>
        <div className="space-y-4">
          {fundingGaps.map((gap, idx) => (
            <Card key={`${gap.sector}-${idx}`} className="p-6 border-l-4 border-l-destructive bg-destructive/5">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-destructive mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{gap.sector}</h3>
                    <Badge className="bg-destructive text-destructive-foreground">Weak alignment</Badge>
                  </div>
                  <Badge variant="outline" className="mb-3">
                    Promises: {gap.promise_count}
                  </Badge>
                  <p className="text-sm text-foreground mb-4">
                    This sector has promises recorded but low/flat budget growth signals.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Avg Funding (₹ Cr)</p>
                      <p className="font-semibold">₹{gap.avg_funding_crores.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Budget Growth</p>
                      <p className="font-semibold">{gap.budget_growth_percent}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
