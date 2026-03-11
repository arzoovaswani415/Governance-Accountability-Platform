'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  CheckCircle,
  AlertCircle,
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

import { getBudgetsTrends, getBudgetPromiseAlignment, BudgetPromiseAlignment } from '@/lib/api'

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

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const [trends, alignments] = await Promise.all([
          getBudgetsTrends(),
          getBudgetPromiseAlignment()
        ])

        const yearMap = new Map<number, any>()
        const sectorColors = [
          'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', '#8884d8', '#82ca9d'
        ]
        let distData: any[] = []
        let total = 0
        let health = 0
        let energy = 0
        let agri = 0

        trends.forEach((trend, idx) => {
          let latestAmount = 0
          trend.yearly_data.forEach(yd => {
            if (!yearMap.has(yd.year)) {
              yearMap.set(yd.year, { year: yd.year })
            }
            const yearObj = yearMap.get(yd.year)
            yearObj[trend.sector] = yd.amount_crores
            latestAmount = yd.amount_crores
          })
          
          distData.push({
            name: trend.sector,
            value: latestAmount,
            color: sectorColors[idx % sectorColors.length]
          })
          
          total += latestAmount
          if (trend.sector === 'Healthcare') health = latestAmount
          if (trend.sector === 'Energy') energy = latestAmount
          if (trend.sector === 'Agriculture') agri = latestAmount
        })

        const chartData = Array.from(yearMap.values()).sort((a: any, b: any) => a.year - b.year)
        setTrendData(chartData)
        setDistributionData(distData)
        setTotalBudget(total)
        setHealthcareBudget(health)
        setEnergyBudget(energy)
        setAgricultureBudget(agri)

        setAlignmentData(alignments)
        
        const gaps = alignments.filter(a => 
          a.funding_status === 'Low' || 
          a.funding_status === 'Critical' || 
          (a.insight && a.insight.toLowerCase().includes('gap')) || 
          (a.insight && a.insight.toLowerCase().includes('requires'))
        )
        setFundingGaps(gaps)
        
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const getBudgetColor = (budget?: string | null) => {
    if (!budget) return 'bg-muted text-muted-foreground'
    switch (budget.toLowerCase()) {
      case 'high':
      case 'adequate':
        return 'bg-secondary text-secondary-foreground'
      case 'moderate':
        return 'bg-accent text-accent-foreground'
      case 'low':
      case 'critical':
        return 'bg-destructive text-destructive-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const sectors = ['Healthcare', 'Energy', 'Agriculture', 'Education', 'Infrastructure', 'Technology', 'Environment']

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

      {/* SECTION 3: Budget vs Implementation Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {alignmentData.slice(0, 3).map((item, idx) => (
          <Card key={item.promise_id || `align-card-${idx}`} className="p-6 border border-border">
            <div className="mb-4">
              <h3 className="font-semibold text-sm leading-snug mb-3">{item.promise_text}</h3>
              <Badge variant="outline" className="text-xs font-medium">
                {item.sector}
              </Badge>
            </div>

            <div className="space-y-3 pt-3 border-t">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Budget Allocated
                </p>
                <p className="text-lg font-bold mt-1">₹{(item.budget_allocated / 1000).toFixed(1)}K Cr</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Implementation Status
                </p>
                <Badge className="mt-1 font-semibold">{item.implementation_status || 'Unknown'}</Badge>
              </div>

              {/* Indicator Icons */}
              <div className="pt-3 border-t space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-4 w-4 ${item.budget_allocated > 0 ? 'text-secondary' : 'text-muted-foreground'}`} />
                  <span className="text-xs">Budget Allocated</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-4 w-4 ${item.implementation_status && item.implementation_status !== 'Not Started' ? 'text-secondary' : 'text-muted-foreground'}`} />
                  <span className="text-xs">Program Started</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.implementation_status === 'Completed' ? (
                     <CheckCircle className="h-4 w-4 text-secondary" />
                  ) : (item.implementation_status && item.implementation_status.includes('Progress')) ? (
                     <TrendingUp className="h-4 w-4 text-accent" />
                  ) : (
                     <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-xs">Outcome Achieved</span>
                </div>
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
              Healthcare funding increased by 38% between 2019 and 2024, indicating strong financial commitment toward
              healthcare infrastructure. This aligns well with manifesto promises for universal healthcare. Infrastructure
              and energy sectors also saw significant growth, while education funding remained relatively stagnant at only
              6% growth over the same period.
            </p>
          </div>
        </div>
      </Card>

      {/* SECTION 6: Budget vs Promises Analysis Table */}
      <Card className="p-7 border border-border shadow-sm mb-8">
        <h2 className="text-xl font-bold mb-6">Budget vs Promises Analysis</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Promise</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Sector</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Related Policy</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Budget Support</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {alignmentData.map((item, idx) => (
                <tr key={item.promise_id || `table-row-${idx}`} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium">{item.promise_text}</td>
                  <td className="py-3 px-4">
                    <Badge variant="outline">{item.sector}</Badge>
                  </td>
                  <td className="py-3 px-4">{(item.related_policies && item.related_policies.length > 0) ? item.related_policies.join(', ') : 'N/A'}</td>
                  <td className="py-3 px-4">
                    <Badge className={getBudgetColor(item.funding_status)}>{item.funding_status}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline">{item.implementation_status || 'Unknown'}</Badge>
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
            <Card key={gap.promise_id || `gap-${idx}`} className="p-6 border-l-4 border-l-destructive bg-destructive/5">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-destructive mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{gap.promise_text}</h3>
                    <Badge className="bg-destructive text-destructive-foreground">{gap.funding_status} Support</Badge>
                  </div>
                  <Badge variant="outline" className="mb-3">
                    {gap.sector}
                  </Badge>
                  <p className="text-sm text-foreground mb-4">{gap.insight}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Budget Allocated</p>
                      <p className="font-semibold">₹{(gap.budget_allocated / 1000).toFixed(1)}K Cr</p>
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
