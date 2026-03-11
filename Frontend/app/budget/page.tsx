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

// Budget data for trends
const budgetTrendsData = [
  { year: 2004, Healthcare: 8000, Energy: 5000, Agriculture: 4000, Education: 3000, Infrastructure: 6000 },
  { year: 2008, Healthcare: 12000, Energy: 8000, Agriculture: 6000, Education: 5000, Infrastructure: 9000 },
  { year: 2012, Healthcare: 18000, Energy: 12000, Agriculture: 9000, Education: 7000, Infrastructure: 13000 },
  { year: 2016, Healthcare: 35000, Energy: 18000, Agriculture: 12000, Education: 10000, Infrastructure: 20000 },
  { year: 2020, Healthcare: 65000, Energy: 28000, Agriculture: 15000, Education: 15000, Infrastructure: 35000 },
  { year: 2024, Healthcare: 86000, Energy: 30000, Agriculture: 17000, Education: 20000, Infrastructure: 45000 },
]

// Sector funding distribution
const sectorDistribution = [
  { name: 'Healthcare', value: 86000, color: 'var(--chart-1)' },
  { name: 'Infrastructure', value: 45000, color: 'var(--chart-2)' },
  { name: 'Energy', value: 30000, color: 'var(--chart-3)' },
  { name: 'Education', value: 20000, color: 'var(--chart-4)' },
  { name: 'Agriculture', value: 17000, color: 'var(--chart-5)' },
]

// Budget vs Promises data
const budgetVsPromises = [
  {
    id: 1,
    promise: 'Expand renewable energy capacity',
    sector: 'Energy',
    policy: 'Renewable Energy Infrastructure Act',
    budget: 'High',
    status: 'In Progress',
    budgetAmount: 28000,
    allocationPercentage: 85,
  },
  {
    id: 2,
    promise: 'Universal healthcare coverage',
    sector: 'Healthcare',
    policy: 'Ayushman Bharat Scheme',
    budget: 'High',
    status: 'In Progress',
    budgetAmount: 65000,
    allocationPercentage: 95,
  },
  {
    id: 3,
    promise: 'Agricultural reforms',
    sector: 'Agriculture',
    policy: 'Pradhan Mantri Kisan Samman Nidhi',
    budget: 'Moderate',
    status: 'Partial',
    budgetAmount: 12000,
    allocationPercentage: 60,
  },
  {
    id: 4,
    promise: 'Infrastructure development',
    sector: 'Infrastructure',
    policy: 'Bharatmala Project Phase 2',
    budget: 'High',
    status: 'In Progress',
    budgetAmount: 40000,
    allocationPercentage: 90,
  },
  {
    id: 5,
    promise: 'Education quality improvement',
    sector: 'Education',
    policy: 'Digital Learning Platform Act',
    budget: 'Low',
    status: 'No Progress',
    budgetAmount: 5000,
    allocationPercentage: 25,
  },
]

// Funding gaps
const fundingGaps = [
  {
    id: 1,
    promise: 'Improve public education infrastructure',
    sector: 'Education',
    budget: 'Low',
    insight: 'Budget growth of 6% does not match manifesto commitment. Education sector requires increased allocation.',
    expectedBudget: 35000,
    currentBudget: 20000,
  },
  {
    id: 2,
    promise: 'Environmental protection and pollution control',
    sector: 'Environment',
    budget: 'Low',
    insight: 'Environmental sector funding remains significantly below promised targets. Only 2% of total budget allocated.',
    expectedBudget: 25000,
    currentBudget: 8000,
  },
  {
    id: 3,
    promise: 'Rural development and poverty alleviation',
    sector: 'Social',
    budget: 'Low',
    insight: 'Despite high priority in manifesto, rural development receives minimal dedicated funding.',
    expectedBudget: 30000,
    currentBudget: 12000,
  },
]

export default function BudgetAnalysisPage() {
  const filters = useLocalFilters()

  const getBudgetColor = (budget: string) => {
    switch (budget) {
      case 'High':
        return 'bg-secondary text-secondary-foreground'
      case 'Moderate':
        return 'bg-accent text-accent-foreground'
      case 'Low':
        return 'bg-destructive text-destructive-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const sectors = ['Healthcare', 'Energy', 'Agriculture', 'Education', 'Infrastructure', 'Technology', 'Environment']

  // Calculate totals
  const totalBudget = 125000
  const healthcareBudget = 86000
  const energyBudget = 30000
  const agricultureBudget = 17000

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
          <p className="text-3xl font-bold">₹12.5L Cr</p>
          <p className="text-xs text-muted-foreground mt-2">2004–2024 Total</p>
        </Card>

        <Card className="p-6 border border-border">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Healthcare Budget
          </p>
          <p className="text-3xl font-bold text-secondary">₹86,000 Cr</p>
          <p className="text-xs text-muted-foreground mt-2">+38% growth 2019–2024</p>
        </Card>

        <Card className="p-6 border border-border">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Energy Budget
          </p>
          <p className="text-3xl font-bold text-accent">₹30,000 Cr</p>
          <p className="text-xs text-muted-foreground mt-2">+7% growth 2019–2024</p>
        </Card>

        <Card className="p-6 border border-border">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Agriculture Budget
          </p>
          <p className="text-3xl font-bold">₹1.7L Cr</p>
          <p className="text-xs text-muted-foreground mt-2">+3% growth 2019–2024</p>
        </Card>
      </div>

      {/* SECTION 2: Sector Budget Allocation Trends */}
      <Card className="p-8 border border-border shadow-sm mb-8">
        <h2 className="text-xl font-bold mb-6">Sector Budget Allocation Over Time</h2>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={budgetTrendsData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="year" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
              formatter={(value) => `₹${value} Cr`}
            />
            <Legend />
            <Line type="monotone" dataKey="Healthcare" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="Energy" stroke="var(--chart-3)" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="Agriculture" stroke="var(--chart-5)" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* SECTION 3: Budget vs Implementation Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {budgetVsPromises.slice(0, 3).map((item) => (
          <Card key={item.id} className="p-6 border border-border">
            <div className="mb-4">
              <h3 className="font-semibold text-sm leading-snug mb-3">{item.promise}</h3>
              <Badge variant="outline" className="text-xs font-medium">
                {item.sector}
              </Badge>
            </div>

            <div className="space-y-3 pt-3 border-t">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Budget Allocated
                </p>
                <p className="text-lg font-bold mt-1">₹{(item.budgetAmount / 1000).toFixed(0)}K Cr</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Implementation Status
                </p>
                <Badge className="mt-1 font-semibold">{item.status}</Badge>
              </div>

              {/* Indicator Icons */}
              <div className="pt-3 border-t space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-secondary" />
                  <span className="text-xs">Budget Allocated</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-secondary" />
                  <span className="text-xs">Program Started</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-accent" />
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
              data={sectorDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ₹${value}Cr`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {sectorDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `₹${value}Cr`} />
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
              {budgetVsPromises.map((item) => (
                <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium">{item.promise}</td>
                  <td className="py-3 px-4">
                    <Badge variant="outline">{item.sector}</Badge>
                  </td>
                  <td className="py-3 px-4">{item.policy}</td>
                  <td className="py-3 px-4">
                    <Badge className={getBudgetColor(item.budget)}>{item.budget}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline">{item.status}</Badge>
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
          {fundingGaps.map((gap) => (
            <Card key={gap.id} className="p-6 border-l-4 border-l-destructive bg-destructive/5">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-destructive mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{gap.promise}</h3>
                    <Badge className="bg-destructive text-destructive-foreground">{gap.budget} Support</Badge>
                  </div>
                  <Badge variant="outline" className="mb-3">
                    {gap.sector}
                  </Badge>
                  <p className="text-sm text-foreground mb-4">{gap.insight}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Current Budget</p>
                      <p className="font-semibold">₹{gap.currentBudget / 1000}K Cr</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expected Budget</p>
                      <p className="font-semibold text-secondary">₹{gap.expectedBudget / 1000}K Cr</p>
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
