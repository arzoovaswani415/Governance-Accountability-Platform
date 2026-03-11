'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, MessageSquare, ArrowDown, FileText } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FilterBar } from '@/components/filters/filter-bar'
import { useLocalFilters, promiseStatuses } from '@/components/filters/filter-context'
import { PolicyLifecycleTimeline } from '@/components/policy-lifecycle-timeline'

const promisesData = [
  {
    id: 1,
    title: 'Expand renewable energy capacity',
    party: 'BJP',
    sector: 'Energy',
    status: 'in_progress',
    year: 2019,
    description: 'Expand renewable energy capacity to 175 GW by 2022 and create sustainable energy infrastructure.',
    relatedPolicies: [
      { name: 'Renewable Energy Infrastructure Act', status: 'Proposed', year: 2021 },
      { name: 'Solar Park Expansion Program', status: 'Implemented', year: 2022 },
    ],
    budgetData: [
      { year: 2019, amount: 12000 },
      { year: 2020, amount: 15000 },
      { year: 2021, amount: 18500 },
      { year: 2022, amount: 22000 },
      { year: 2023, amount: 25000 },
      { year: 2024, amount: 28000 },
    ],
    signals: { policyIntroduced: true, budgetAllocated: true, programLaunched: true, outcomeAchieved: false },
    timeline: [
      { year: 2019, event: 'Manifesto promise announced' },
      { year: 2020, event: 'Policy proposal introduced' },
      { year: 2021, event: 'Solar mission framework approved' },
      { year: 2022, event: 'Government program launched' },
      { year: 2023, event: 'Partial implementation achieved' },
    ],
    aiInsight: 'This promise shows strong progress. Renewable energy initiatives have received consistent budget allocations and infrastructure projects are being implemented. Energy sector funding increased significantly with 133% growth from 2019-2024.',
  },
  {
    id: 2,
    title: 'Universal healthcare access for all citizens',
    party: 'Congress',
    sector: 'Healthcare',
    status: 'in_progress',
    year: 2019,
    description: 'Ensure affordable healthcare access to all citizens through expanded insurance coverage.',
    relatedPolicies: [
      { name: 'Ayushman Bharat Scheme', status: 'Implemented', year: 2020 },
      { name: 'Healthcare Workers Training Program', status: 'In Progress', year: 2021 },
    ],
    budgetData: [
      { year: 2019, amount: 8000 },
      { year: 2020, amount: 11000 },
      { year: 2021, amount: 14500 },
      { year: 2022, amount: 16000 },
      { year: 2023, amount: 18000 },
      { year: 2024, amount: 20000 },
    ],
    signals: { policyIntroduced: true, budgetAllocated: true, programLaunched: true, outcomeAchieved: false },
    timeline: [
      { year: 2019, event: 'Manifesto promise announced' },
      { year: 2020, event: 'Ayushman Bharat expansion' },
      { year: 2021, event: 'Insurance coverage widened' },
      { year: 2022, event: 'Rural health centers expanded' },
      { year: 2023, event: 'Coverage now reaches 60% of population' },
    ],
    aiInsight: 'Healthcare promises show moderate progress. Two major policies have been implemented with significant budget growth. Coverage has expanded substantially, though universal access remains a work in progress.',
  },
  {
    id: 3,
    title: 'Agricultural reform and farm loan waiver',
    party: 'BJPs',
    sector: 'Agriculture',
    status: 'partial',
    year: 2019,
    description: 'Implement agricultural reforms and provide loan waivers to support farmers.',
    relatedPolicies: [
      { name: 'Pradhan Mantri Kisan Samman Nidhi', status: 'Implemented', year: 2019 },
      { name: 'Organic Farming Incentive Program', status: 'Proposed', year: 2022 },
    ],
    budgetData: [
      { year: 2019, amount: 10000 },
      { year: 2020, amount: 12000 },
      { year: 2021, amount: 13000 },
      { year: 2022, amount: 14000 },
      { year: 2023, amount: 14500 },
      { year: 2024, amount: 15000 },
    ],
    signals: { policyIntroduced: true, budgetAllocated: true, programLaunched: false, outcomeAchieved: false },
    timeline: [
      { year: 2019, event: 'Manifesto promise announced' },
      { year: 2019, event: 'Direct income support scheme launched' },
      { year: 2021, event: 'Loan waiver discussions' },
      { year: 2023, event: 'Partial subsidies implemented' },
    ],
    aiInsight: 'This promise shows partial implementation. Direct income support programs have been successful, but comprehensive loan waivers and organic farming incentives are still pending.',
  },
  {
    id: 4,
    title: 'Infrastructure development and road expansion',
    party: 'BJP',
    sector: 'Infrastructure',
    status: 'in_progress',
    year: 2019,
    description: 'Accelerate infrastructure development with focus on roads, ports, and digital connectivity.',
    relatedPolicies: [
      { name: 'Bharatmala Project Phase 2', status: 'In Progress', year: 2020 },
      { name: 'Smart Cities Initiative', status: 'Implemented', year: 2021 },
    ],
    budgetData: [
      { year: 2019, amount: 20000 },
      { year: 2020, amount: 24000 },
      { year: 2021, amount: 28000 },
      { year: 2022, amount: 32000 },
      { year: 2023, amount: 36000 },
      { year: 2024, amount: 40000 },
    ],
    signals: { policyIntroduced: true, budgetAllocated: true, programLaunched: true, outcomeAchieved: true },
    timeline: [
      { year: 2019, event: 'Manifesto promise announced' },
      { year: 2020, event: 'Bharatmala phase expansion' },
      { year: 2021, event: 'Smart cities framework approved' },
      { year: 2022, event: 'Major projects completed' },
      { year: 2024, event: '100+ km of roads completed' },
    ],
    aiInsight: 'Strong progress on infrastructure promises. Budget allocation nearly doubled over the term with tangible project completions. This is one of the most successful promise areas.',
  },
  {
    id: 5,
    title: 'Education quality improvement and digital literacy',
    party: 'Congress',
    sector: 'Education',
    status: 'announced',
    year: 2019,
    description: 'Improve education quality through digital infrastructure and teacher training.',
    relatedPolicies: [
      { name: 'Digital Learning Platform Act', status: 'Proposed', year: 2023 },
      { name: 'Teacher Training Initiative', status: 'Proposed', year: 2024 },
    ],
    budgetData: [
      { year: 2019, amount: 6000 },
      { year: 2020, amount: 7000 },
      { year: 2021, amount: 8000 },
      { year: 2022, amount: 8500 },
      { year: 2023, amount: 9000 },
      { year: 2024, amount: 9500 },
    ],
    signals: { policyIntroduced: false, budgetAllocated: true, programLaunched: false, outcomeAchieved: false },
    timeline: [
      { year: 2019, event: 'Manifesto promise announced' },
      { year: 2021, event: 'Digital infrastructure planning' },
      { year: 2023, event: 'Policy proposals drafted' },
    ],
    aiInsight: 'Education promises remain largely in planning phase. While budget has been steadily allocated, policy proposals are only recently being formalized.',
  },
  {
    id: 6,
    title: 'Environmental protection and pollution control',
    party: 'Congress',
    sector: 'Environment',
    status: 'partial',
    year: 2019,
    description: 'Strengthen environmental regulations and implement pollution control measures.',
    relatedPolicies: [
      { name: 'Air Quality Management Act', status: 'Implemented', year: 2021 },
      { name: 'Water Pollution Control Program', status: 'In Progress', year: 2022 },
    ],
    budgetData: [
      { year: 2019, amount: 5000 },
      { year: 2020, amount: 6500 },
      { year: 2021, amount: 8000 },
      { year: 2022, amount: 9000 },
      { year: 2023, amount: 9500 },
      { year: 2024, amount: 10000 },
    ],
    signals: { policyIntroduced: true, budgetAllocated: true, programLaunched: true, outcomeAchieved: false },
    timeline: [
      { year: 2019, event: 'Manifesto promise announced' },
      { year: 2020, event: 'Pollution framework established' },
      { year: 2021, event: 'Air quality standards implemented' },
      { year: 2022, event: 'Water protection program launched' },
    ],
    aiInsight: 'Environmental initiatives show partial progress. Air quality improvements have been measurable, but comprehensive water pollution control is still ongoing.',
  },
  {
    id: 7,
    title: 'Manufacturing growth and job creation',
    party: 'BJP',
    sector: 'Economy',
    status: 'in_progress',
    year: 2019,
    description: 'Promote manufacturing sector growth and create employment opportunities.',
    relatedPolicies: [
      { name: 'Make in India 2.0', status: 'In Progress', year: 2021 },
      { name: 'Manufacturing Skill Development', status: 'Implemented', year: 2022 },
    ],
    budgetData: [
      { year: 2019, amount: 15000 },
      { year: 2020, amount: 16000 },
      { year: 2021, amount: 17500 },
      { year: 2022, amount: 19000 },
      { year: 2023, amount: 21000 },
      { year: 2024, amount: 23000 },
    ],
    signals: { policyIntroduced: true, budgetAllocated: true, programLaunched: true, outcomeAchieved: true },
    timeline: [
      { year: 2019, event: 'Manifesto promise announced' },
      { year: 2020, event: 'Make in India 2.0 launched' },
      { year: 2021, event: 'Manufacturing zones established' },
      { year: 2022, event: 'Job creation targets met' },
      { year: 2023, event: '500K+ jobs created' },
    ],
    aiInsight: 'Strong execution on manufacturing promises. Budget grew 53% with measurable employment generation and industrial growth metrics showing positive momentum.',
  },
  {
    id: 8,
    title: 'Social welfare expansion and pension schemes',
    party: 'Congress',
    sector: 'Social',
    status: 'in_progress',
    year: 2019,
    description: 'Expand social welfare coverage and pension schemes for vulnerable populations.',
    relatedPolicies: [
      { name: 'Pension Scheme Expansion', status: 'Implemented', year: 2020 },
      { name: 'Elder Care Program', status: 'In Progress', year: 2022 },
    ],
    budgetData: [
      { year: 2019, amount: 22000 },
      { year: 2020, amount: 25000 },
      { year: 2021, amount: 28000 },
      { year: 2022, amount: 31000 },
      { year: 2023, amount: 34000 },
      { year: 2024, amount: 37000 },
    ],
    signals: { policyIntroduced: true, budgetAllocated: true, programLaunched: true, outcomeAchieved: true },
    timeline: [
      { year: 2019, event: 'Manifesto promise announced' },
      { year: 2020, event: 'Pension scheme expanded' },
      { year: 2021, event: 'Coverage doubled' },
      { year: 2022, event: 'Elder care centers launched' },
      { year: 2024, event: '10M+ beneficiaries covered' },
    ],
    aiInsight: 'Excellent progress on social welfare promises. Budget allocation increased by 68% with consistent expansion of beneficiary coverage and program reach.',
  },
]



export default function PromisesPage() {
  const filters = useLocalFilters()
  const [selectedPromiseId, setSelectedPromiseId] = useState(1)

  const filtered = promisesData.filter((promise) => {
    const matchesSearch = promise.title
      .toLowerCase()
      .includes(filters.searchQuery.toLowerCase()) ||
      promise.description.toLowerCase().includes(filters.searchQuery.toLowerCase())
    const matchesSector = filters.selectedSectors.length === 0 || filters.selectedSectors.includes(promise.sector)
    const matchesStatus = filters.selectedStatuses.length === 0 || filters.selectedStatuses.includes(promise.status)

    return matchesSearch && matchesSector && matchesStatus
  })

  const selectedPromise = promisesData.find((p) => p.id === selectedPromiseId) || promisesData[0]

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      fulfilled: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30',
      in_progress: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30',
      partial: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30',
      no_progress: 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30',
      announced: 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-500/30',
    }
    return statusColors[status] || 'bg-muted text-muted-foreground'
  }

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      fulfilled: 'Fulfilled',
      in_progress: 'In Progress',
      partial: 'Partial',
      no_progress: 'No Progress',
      announced: 'Announced',
    }
    return statusLabels[status] || 'Unknown'
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Promise Explorer</h1>
        <p className="text-muted-foreground mt-2 text-base">
          Explore political manifesto promises and see how they connect to policies, budgets, and implementation progress
        </p>
      </div>

      {/* Modern Filter Bar - Sticky */}
      <div className="sticky top-16 z-10 -mx-4 md:-mx-8 px-4 md:px-8 py-4 mb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <Card className="p-4 bg-card/95 border border-border shadow-sm">
          <FilterBar
            searchQuery={filters.searchQuery}
            setSearchQuery={filters.setSearchQuery}
            searchPlaceholder="Search promises by title or description..."
            electionCycle={filters.electionCycle}
            setElectionCycle={filters.setElectionCycle}
            selectedSectors={filters.selectedSectors}
            setSelectedSectors={filters.setSelectedSectors}
            toggleSector={filters.toggleSector}
            selectedStatuses={filters.selectedStatuses}
            setSelectedStatuses={filters.setSelectedStatuses}
            toggleStatus={filters.toggleStatus}
            statuses={promiseStatuses}
            statusLabel="Promise Status"
            clearAllFilters={filters.clearAllFilters}
            hasActiveFilters={filters.hasActiveFilters}
          />
        </Card>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Promise List */}
        <div className="lg:col-span-1">
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto space-y-4 pr-2">
            {filtered.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No promises match your filters</p>
              </Card>
            ) : (
              filtered.map((promise) => (
                <Card
                  key={promise.id}
                  onClick={() => setSelectedPromiseId(promise.id)}
                  className={`p-4 cursor-pointer transition-all duration-200 border shadow-sm ${
                    selectedPromiseId === promise.id
                      ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/40 hover:bg-muted/40 hover:shadow-md'
                  }`}
                >
                  <h3 className="font-semibold text-sm line-clamp-2 leading-snug">{promise.title}</h3>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs font-medium">{promise.sector}</Badge>
                    <Badge variant="outline" className="text-xs font-medium">{promise.party}</Badge>
                  </div>
                  <div className="mt-2">
                    <Badge className={`text-xs font-semibold ${getStatusColor(promise.status)}`}>
                      {getStatusLabel(promise.status)}
                    </Badge>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Promise Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Promise Overview */}
          <Card className="p-8 border border-border shadow-sm">
            <div className="flex items-start justify-between mb-5">
              <h2 className="text-2xl font-bold leading-tight">{selectedPromise.title}</h2>
              <Badge className={`${getStatusColor(selectedPromise.status)} font-semibold`}>
                {getStatusLabel(selectedPromise.status)}
              </Badge>
            </div>
            <p className="text-base text-foreground mb-6 leading-relaxed">{selectedPromise.description}</p>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sector</p>
                <p className="text-sm font-medium mt-1">{selectedPromise.sector}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Party</p>
                <p className="text-sm font-medium mt-1">{selectedPromise.party}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Manifesto</p>
                <p className="text-sm font-medium mt-1">{selectedPromise.year}–2024</p>
              </div>
            </div>
          </Card>

          {/* Section 2: Related Policies */}
          <Card className="p-7 border border-border shadow-sm">
            <h3 className="font-bold text-lg mb-5">Promise to Policy Mapping</h3>
            <div className="space-y-4">
              {selectedPromise.relatedPolicies.map((policy, idx) => (
                <div key={idx} className="space-y-3">
                  {/* Promise Card */}
                  <div className="p-4 bg-card rounded-lg border-l-4 border-l-blue-500 border-t border-r border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Manifesto Promise</p>
                        <p className="font-semibold text-sm mt-0.5">{selectedPromise.title}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Arrow Connector */}
                  <div className="flex justify-center">
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 h-4 bg-border" />
                      <ArrowDown className="w-5 h-5 text-muted-foreground" />
                      <div className="w-0.5 h-4 bg-border" />
                    </div>
                  </div>
                  
                  {/* Policy Card */}
                  <div className="p-4 bg-card rounded-lg border-l-4 border-l-purple-500 border-t border-r border-b border-border">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">Policy / Bill</p>
                          <p className="font-semibold text-sm mt-0.5">{policy.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">Year: {policy.year}</p>
                        </div>
                      </div>
                      <Badge 
                        variant="outline"
                        className={`font-semibold whitespace-nowrap ${
                          policy.status === 'Implemented'
                            ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/50'
                            : policy.status === 'Passed'
                            ? 'text-green-600 dark:text-green-400 border-green-500/50'
                            : 'text-purple-600 dark:text-purple-400 border-purple-500/50'
                        }`}
                      >
                        {policy.status}
                      </Badge>
                    </div>
                  </div>
                  
                  {idx < selectedPromise.relatedPolicies.length - 1 && (
                    <div className="border-t border-dashed border-border my-4" />
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Section 3: Budget Allocation */}
          <Card className="p-7 border border-border shadow-sm">
            <h3 className="font-bold text-lg mb-5">{selectedPromise.sector} Sector Budget Allocation Trends</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={selectedPromise.budgetData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
                <YAxis stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => `₹${value.toLocaleString()} Cr`}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  dot={{ fill: 'var(--primary)', r: 5 }}
                  activeDot={{ r: 7 }}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-sm text-foreground mt-5 leading-relaxed">
              {selectedPromise.sector} sector funding increased significantly during the government term with consistent year-over-year growth.
            </p>
          </Card>

          {/* Section 4: Implementation Signals */}
          <Card className="p-7 border border-border shadow-sm">
            <h3 className="font-bold text-lg mb-5">Implementation Signals</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Policy Introduced', achieved: selectedPromise.signals.policyIntroduced },
                { label: 'Budget Allocated', achieved: selectedPromise.signals.budgetAllocated },
                { label: 'Program Launched', achieved: selectedPromise.signals.programLaunched },
                { label: 'Outcome Achieved', achieved: selectedPromise.signals.outcomeAchieved },
              ].map((signal, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-colors ${
                    signal.achieved
                      ? 'bg-secondary/10 border-secondary text-secondary'
                      : 'bg-muted/30 border-border text-muted-foreground'
                  }`}
                >
                  {signal.achieved ? (
                    <CheckCircle className="h-8 w-8 mb-2" />
                  ) : (
                    <AlertCircle className="h-8 w-8 mb-2" />
                  )}
                  <p className="text-xs font-semibold text-center leading-tight">{signal.label}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Section 5: Legislative Timeline */}
          <Card className="p-7 border border-border shadow-sm">
            <PolicyLifecycleTimeline 
              events={selectedPromise.timeline}
              title="Legislative Timeline"
              showProgressBar={true}
              variant="vertical"
            />
          </Card>

          {/* Section 6: AI Governance Insight */}
          <Card className="p-7 border border-border shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-start gap-4">
              <MessageSquare className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-3">AI Governance Insight</h3>
                <p className="text-base text-foreground leading-relaxed">{selectedPromise.aiInsight}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
