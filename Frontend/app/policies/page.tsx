'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare, CheckCircle, FileText, Zap } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FilterBar } from '@/components/filters/filter-bar'
import { useLocalFilters, policyStatuses, sectors as defaultSectors } from '@/components/filters/filter-context'
import { PolicyLifecycleTimeline } from '@/components/policy-lifecycle-timeline'

const policiesData = [
  {
    id: 1,
    title: 'National Medical Commission Act',
    sector: 'Healthcare',
    year: 2019,
    status: 'Implemented',
    description: 'This policy aims to reform healthcare regulation and improve the governance of medical institutions across the country. It establishes a regulatory framework for medical professionals and institutions.',
    aiSummary: 'This policy reformulates how medical institutions are regulated in India. It replaces the previous Medical Council of India with a new National Medical Commission, streamlining approvals for medical courses and institutions while maintaining quality standards.',
    relatedPromises: [
      'Build AIIMS hospitals in every state',
      'Improve healthcare infrastructure',
      'Enhance medical professional standards',
    ],
    budgetData: [
      { year: 2019, amount: 8000 },
      { year: 2020, amount: 10500 },
      { year: 2021, amount: 13200 },
      { year: 2022, amount: 15800 },
      { year: 2023, amount: 18000 },
      { year: 2024, amount: 21000 },
    ],
    timeline: [
      { year: 2019, event: 'Bill introduced in Parliament' },
      { year: 2019, event: 'Committee review completed' },
      { year: 2019, event: 'Bill passed in both houses' },
      { year: 2019, event: 'Assent given by President' },
    ],
    relatedPolicies: [
      'Ayushman Bharat Scheme',
      'Medical Education Amendment Act',
      'Healthcare Digitalization Initiative',
    ],
  },
  {
    id: 2,
    title: 'Renewable Energy Infrastructure Bill',
    sector: 'Energy',
    year: 2021,
    status: 'Proposed',
    description: 'Establishes framework for renewable energy development with focus on solar, wind, and hydroelectric projects. Includes incentives for private investment in green energy.',
    aiSummary: 'This bill creates a comprehensive infrastructure for renewable energy deployment across India. It provides tax incentives, land allocation, and grid connectivity support for solar and wind energy projects, aiming to achieve 175 GW renewable capacity.',
    relatedPromises: [
      'Expand renewable energy capacity to 175 GW',
      'Create sustainable energy infrastructure',
      'Reduce carbon emissions',
    ],
    budgetData: [
      { year: 2019, amount: 12000 },
      { year: 2020, amount: 14500 },
      { year: 2021, amount: 17000 },
      { year: 2022, amount: 20000 },
      { year: 2023, amount: 24000 },
      { year: 2024, amount: 28000 },
    ],
    timeline: [
      { year: 2020, event: 'Bill drafted by ministry' },
      { year: 2021, event: 'Stakeholder consultation initiated' },
      { year: 2021, event: 'Bill introduced in Parliament' },
      { year: 'ongoing', event: 'Under parliamentary review' },
    ],
    relatedPolicies: [
      'Solar Park Expansion Program',
      'Wind Energy Policy 2022',
      'Green Energy Tariff Framework',
    ],
  },
  {
    id: 3,
    title: 'Agricultural Reform and Support Act',
    sector: 'Agriculture',
    year: 2020,
    status: 'Under Review',
    description: 'Comprehensive agricultural reform including farm loan waivers, crop insurance, and minimum support prices. Aims to improve farmer income and sustainability.',
    aiSummary: 'This act modernizes India\'s agricultural sector by introducing direct income support, crop insurance schemes, and minimum support price guarantees. It provides market linkages and reduces middlemen in agricultural supply chains.',
    relatedPromises: [
      'Agricultural reform and farm loan waiver',
      'Support farmers with income guarantee',
      'Modernize farming practices',
    ],
    budgetData: [
      { year: 2019, amount: 10000 },
      { year: 2020, amount: 12500 },
      { year: 2021, amount: 13500 },
      { year: 2022, amount: 14500 },
      { year: 2023, amount: 15500 },
      { year: 2024, amount: 16500 },
    ],
    timeline: [
      { year: 2019, event: 'Farm support scheme announced' },
      { year: 2020, event: 'Bill framework developed' },
      { year: 2020, event: 'Bill introduced for review' },
      { year: 'ongoing', event: 'Parliamentary committee consideration' },
    ],
    relatedPolicies: [
      'Pradhan Mantri Kisan Samman Nidhi',
      'Crop Insurance Scheme',
      'Agricultural Produce Market Act',
    ],
  },
  {
    id: 4,
    title: 'Digital Education Framework Act',
    sector: 'Education',
    year: 2021,
    status: 'Passed',
    description: 'Establishes digital infrastructure for education, including online learning platforms and digital literacy programs for students and teachers.',
    aiSummary: 'This act mandates digital transformation in education through online platforms, digital content libraries, and teacher training in technology integration. It ensures equitable access to quality digital education across urban and rural areas.',
    relatedPromises: [
      'Improve education quality through digital infrastructure',
      'Enhance digital literacy across schools',
      'Teacher training and development',
    ],
    budgetData: [
      { year: 2019, amount: 6000 },
      { year: 2020, amount: 8000 },
      { year: 2021, amount: 10500 },
      { year: 2022, amount: 12000 },
      { year: 2023, amount: 13500 },
      { year: 2024, amount: 15000 },
    ],
    timeline: [
      { year: 2020, event: 'Policy framework developed' },
      { year: 2021, event: 'Bill introduced in Parliament' },
      { year: 2021, event: 'Committee discussions held' },
      { year: 2021, event: 'Bill passed in both houses' },
    ],
    relatedPolicies: [
      'National Digital Library Initiative',
      'Teacher Digital Skills Program',
      'School Technology Integration Scheme',
    ],
  },
  {
    id: 5,
    title: 'Bharatmala Infrastructure Project Phase 2',
    sector: 'Infrastructure',
    year: 2020,
    status: 'Implemented',
    description: 'Mega infrastructure project for road, railway, and port development. Focuses on improving connectivity between states and reducing logistics costs.',
    aiSummary: 'Phase 2 of Bharatmala aims to construct 10,000 km of additional highways with emphasis on connectivity corridors. It includes multimodal integration of roads, railways, and ports to improve transportation efficiency.',
    relatedPromises: [
      'Infrastructure development and road expansion',
      'Accelerate public transportation growth',
      'Improve logistics infrastructure',
    ],
    budgetData: [
      { year: 2019, amount: 20000 },
      { year: 2020, amount: 25000 },
      { year: 2021, amount: 30000 },
      { year: 2022, amount: 35000 },
      { year: 2023, amount: 40000 },
      { year: 2024, amount: 45000 },
    ],
    timeline: [
      { year: 2019, event: 'Project Phase 2 approved' },
      { year: 2020, event: 'Work contracts awarded' },
      { year: 2020, event: 'Construction began' },
      { year: '2024', event: 'Major milestones achieved, ongoing expansion' },
    ],
    relatedPolicies: [
      'National Highway Development Program',
      'Railway Modernization Initiative',
      'Port Development Authority Act',
    ],
  },
  {
    id: 6,
    title: 'Environmental Protection and Pollution Control Act',
    sector: 'Environment',
    year: 2021,
    status: 'Passed',
    description: 'Strengthens environmental regulations with stricter pollution control measures, emission standards, and conservation initiatives.',
    aiSummary: 'This act consolidates environmental protection laws with stricter air and water quality standards, plastic ban regulations, and forest conservation mandates. It includes provisions for environmental impact assessments and penalty frameworks.',
    relatedPromises: [
      'Environmental protection and pollution control',
      'Strengthen environmental regulations',
      'Conservation of natural resources',
    ],
    budgetData: [
      { year: 2019, amount: 5000 },
      { year: 2020, amount: 6500 },
      { year: 2021, amount: 8500 },
      { year: 2022, amount: 10000 },
      { year: 2023, amount: 11500 },
      { year: 2024, amount: 13000 },
    ],
    timeline: [
      { year: 2020, event: 'Environmental audit conducted' },
      { year: 2021, event: 'Bill drafted with stakeholder input' },
      { year: 2021, event: 'Bill passed in Parliament' },
      { year: '2022', event: 'Implementation begins with enforcement' },
    ],
    relatedPolicies: [
      'Water Pollution Control Program',
      'Air Quality Management Initiative',
      'Forest Conservation Amendment',
    ],
  },
  {
    id: 7,
    title: 'Manufacturing Excellence and Job Creation Bill',
    sector: 'Technology',
    year: 2021,
    status: 'Implemented',
    description: 'Promotes manufacturing sector growth with tax incentives, skill development programs, and investment in semiconductor and electronics manufacturing.',
    aiSummary: 'This bill establishes special manufacturing zones with tax incentives for tech companies. It includes skill development programs and investment incentives for semiconductor and electronics manufacturing to create employment.',
    relatedPromises: [
      'Manufacturing growth and job creation',
      'Promote technology sector development',
      'Create employment opportunities',
    ],
    budgetData: [
      { year: 2019, amount: 15000 },
      { year: 2020, amount: 17000 },
      { year: 2021, amount: 19500 },
      { year: 2022, amount: 22000 },
      { year: 2023, amount: 25000 },
      { year: 2024, amount: 28000 },
    ],
    timeline: [
      { year: 2020, event: 'Manufacturing zones identified' },
      { year: 2021, event: 'Bill introduced in Parliament' },
      { year: 2021, event: 'Bill passed with amendments' },
      { year: '2022', event: 'Special zones established and operational' },
    ],
    relatedPolicies: [
      'Make in India 2.0 Initiative',
      'Semiconductor Manufacturing Program',
      'Skills Development Scheme',
    ],
  },
  {
    id: 8,
    title: 'Social Welfare and Pension Expansion Bill',
    sector: 'Healthcare',
    year: 2020,
    status: 'Under Review',
    description: 'Expands social welfare coverage including old age pensions, disability support, and family welfare schemes for vulnerable populations.',
    aiSummary: 'This bill expands social safety nets through enhanced pension schemes, disability support programs, and family welfare benefits. It aims to provide universal coverage for vulnerable sections of society.',
    relatedPromises: [
      'Social welfare expansion and pension schemes',
      'Support vulnerable populations',
      'Enhance social security coverage',
    ],
    budgetData: [
      { year: 2019, amount: 22000 },
      { year: 2020, amount: 25000 },
      { year: 2021, amount: 28500 },
      { year: 2022, amount: 31500 },
      { year: 2023, amount: 34500 },
      { year: 2024, amount: 37500 },
    ],
    timeline: [
      { year: 2019, event: 'Welfare assessment conducted' },
      { year: 2020, event: 'Bill drafted with ministry consultation' },
      { year: 2020, event: 'Bill introduced for parliamentary review' },
      { year: 'ongoing', event: 'Committee evaluating provisions' },
    ],
    relatedPolicies: [
      'Pension Scheme Expansion Act',
      'Disability Support Program',
      'Family Welfare Assistance Scheme',
    ],
  },
]

const sectors = ['Healthcare', 'Energy', 'Agriculture', 'Education', 'Infrastructure', 'Technology', 'Environment']

export default function PoliciesPage() {
  const filters = useLocalFilters()
  const [selectedPolicyId, setSelectedPolicyId] = useState(1)

  const filtered = policiesData.filter((policy) => {
    const matchesSearch = policy.title
      .toLowerCase()
      .includes(filters.searchQuery.toLowerCase()) ||
      policy.description.toLowerCase().includes(filters.searchQuery.toLowerCase())
    const matchesSector = filters.selectedSectors.length === 0 || filters.selectedSectors.includes(policy.sector)
    const matchesStatus = filters.selectedStatuses.length === 0 || filters.selectedStatuses.includes(policy.status)

    return matchesSearch && matchesSector && matchesStatus
  })

  const selectedPolicy = policiesData.find((p) => p.id === selectedPolicyId) || policiesData[0]

  const getStatusColor = (status: string) => {
    const statusObj = policyStatuses.find((s) => s.key === status)
    return statusObj?.color || 'bg-muted text-muted-foreground'
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Policy Explorer</h1>
        <p className="text-muted-foreground mt-2 text-base">
          Explore government policies, bills, amendments, and regulations. Understand how they connect to manifesto promises and impact budgets.
        </p>
      </div>

      {/* Modern Filter Bar - Sticky */}
      <div className="sticky top-16 z-10 -mx-4 md:-mx-8 px-4 md:px-8 py-4 mb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <Card className="p-4 bg-card/95 border border-border shadow-sm">
          <FilterBar
          searchQuery={filters.searchQuery}
          setSearchQuery={filters.setSearchQuery}
          searchPlaceholder="Search policies, bills, or acts..."
          electionCycle={filters.electionCycle}
          setElectionCycle={filters.setElectionCycle}
          selectedSectors={filters.selectedSectors}
          setSelectedSectors={filters.setSelectedSectors}
          toggleSector={filters.toggleSector}
          sectors={sectors}
          sectorLabel="Policy Sector"
          selectedStatuses={filters.selectedStatuses}
          setSelectedStatuses={filters.setSelectedStatuses}
          toggleStatus={filters.toggleStatus}
          statuses={policyStatuses}
          statusLabel="Policy Status"
          clearAllFilters={filters.clearAllFilters}
          hasActiveFilters={filters.hasActiveFilters}
        />
        </Card>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Policy List */}
        <div className="lg:col-span-1">
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto space-y-4 pr-2">
            {filtered.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No policies match your filters</p>
              </Card>
            ) : (
              filtered.map((policy) => (
                <Card
                  key={policy.id}
                  onClick={() => setSelectedPolicyId(policy.id)}
                  className={`p-4 cursor-pointer transition-all duration-200 border shadow-sm ${
                    selectedPolicyId === policy.id
                      ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/40 hover:bg-muted/40 hover:shadow-md'
                  }`}
                >
                  <h3 className="font-semibold text-sm line-clamp-2 leading-snug">{policy.title}</h3>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs font-medium">{policy.sector}</Badge>
                    <Badge variant="outline" className="text-xs font-medium">{policy.year}</Badge>
                  </div>
                  <div className="mt-2">
                    <Badge className={`text-xs font-semibold ${getStatusColor(policy.status)}`}>
                      {policy.status}
                    </Badge>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Policy Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Policy Overview */}
          <Card className="p-8 border border-border shadow-sm">
            <div className="flex items-start justify-between mb-5">
              <h2 className="text-2xl font-bold leading-tight max-w-xl">{selectedPolicy.title}</h2>
              <Badge className={`${getStatusColor(selectedPolicy.status)} font-semibold whitespace-nowrap ml-3`}>
                {selectedPolicy.status}
              </Badge>
            </div>
            <p className="text-base text-foreground mb-6 leading-relaxed">{selectedPolicy.description}</p>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sector</p>
                <p className="text-sm font-medium mt-1">{selectedPolicy.sector}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Year Introduced</p>
                <p className="text-sm font-medium mt-1">{selectedPolicy.year}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Election Cycle</p>
                <p className="text-sm font-medium mt-1">{filters.electionCycle}</p>
              </div>
            </div>
          </Card>

          {/* Section 2: AI Policy Summary */}
          <Card className="p-7 border border-border shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-start gap-4">
              <MessageSquare className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-3">Simplified Explanation</h3>
                <p className="text-base text-foreground leading-relaxed">{selectedPolicy.aiSummary}</p>
              </div>
            </div>
          </Card>

          {/* Section 3: Related Manifesto Promises */}
          <Card className="p-7 border border-border shadow-sm">
            <h3 className="font-bold text-lg mb-5">Related Manifesto Promises</h3>
            <div className="space-y-3">
              {selectedPolicy.relatedPromises.map((promise, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 bg-muted/40 rounded-lg border border-border/50">
                  <CheckCircle className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium text-foreground">{promise}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Section 4: Budget Allocation Support */}
          <Card className="p-7 border border-border shadow-sm">
            <h3 className="font-bold text-lg mb-5">{selectedPolicy.sector} Sector Budget Allocation</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={selectedPolicy.budgetData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
                <YAxis stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
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
              {selectedPolicy.sector} spending increased significantly following this policy with consistent budget growth.
            </p>
          </Card>

          {/* Section 5: Legislative Evolution */}
          <Card className="p-7 border border-border shadow-sm">
            <PolicyLifecycleTimeline 
              events={selectedPolicy.timeline}
              title="Legislative Evolution"
              showProgressBar={true}
              variant="vertical"
            />
          </Card>

          {/* Section 6: Related Policies */}
          <Card className="p-7 border border-border shadow-sm">
            <h3 className="font-bold text-lg mb-5">Related Policies</h3>
            <div className="space-y-3">
              {selectedPolicy.relatedPolicies.map((relPolicy, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-muted/40 rounded-lg border border-border/50 hover:bg-muted/60 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-sm font-medium text-foreground">{relPolicy}</p>
                  </div>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
