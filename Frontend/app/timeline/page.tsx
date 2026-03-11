'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, GitBranch } from 'lucide-react'
import { FilterBar } from '@/components/filters/filter-bar'
import { useLocalFilters, policyStages } from '@/components/filters/filter-context'
import { PolicyLifecycleTimeline, TimelineLegend } from '@/components/policy-lifecycle-timeline'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import { getTimelineEvents, TimelineEvent } from '@/lib/api'
import { useEffect } from 'react'

const sectors = ['Healthcare', 'Energy', 'Agriculture', 'Education', 'Infrastructure', 'Technology', 'Environment']

export default function TimelinePage() {
  const filters = useLocalFilters()
  const [selectedTimelineId, setSelectedTimelineId] = useState<string | null>(null)
  const [timelineData, setTimelineData] = useState<any[]>([])
  const [activityChartData, setActivityChartData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const events = await getTimelineEvents()
        
        const grouped = new Map<string, any>()
        events.forEach(event => {
          const key = `${event.promise_text || 'General'}-${event.policy_name || 'General'}`
          if (!grouped.has(key)) {
            grouped.set(key, {
              id: key,
              promise: event.promise_text || 'General Promise',
              policy: event.policy_name || 'General Policy',
              sector: event.sector || 'Various',
              stage: 'In Progress',
              events: []
            })
          }
          
          const group = grouped.get(key)
          group.events.push({
            year: event.year,
            event: event.description ? `${event.event_type}: ${event.description}` : event.event_type,
            status: getStatusFromEventType(event.event_type)
          })
        })

        const timelineArray = Array.from(grouped.values()).map(g => {
          g.events.sort((a: any, b: any) => a.year - b.year)
          if (g.events.length > 0) {
             const latestEvent = g.events[g.events.length - 1]
             g.stage = latestEvent.status
          }
          return g
        })
        
        setTimelineData(timelineArray)
        if (timelineArray.length > 0) {
          setSelectedTimelineId(timelineArray[0].id)
        }

        const activityMap = new Map<number, any>()
        events.forEach(event => {
          if (!activityMap.has(event.year)) {
             activityMap.set(event.year, { year: event.year, bills: 0, passed: 0 })
          }
          const yearData = activityMap.get(event.year)
          if (event.event_type.toLowerCase().includes('introduc') || event.event_type.toLowerCase().includes('propos') || event.event_type.toLowerCase().includes('bill')) {
             yearData.bills++
          } else if (event.event_type.toLowerCase().includes('pass') || event.event_type.toLowerCase().includes('implement') || event.event_type.toLowerCase().includes('assent')) {
             yearData.passed++
          } else {
             // treat review/discussion as bills activity for visualization
             yearData.bills++
          }
        })
        
        const activityArray = Array.from(activityMap.values()).sort((a: any, b: any) => a.year - b.year)
        setActivityChartData(activityArray)
        
      } catch(err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  function getStatusFromEventType(eventType: string) {
    const type = eventType.toLowerCase()
    if (type.includes('promis') || type.includes('announc')) return 'announced'
    if (type.includes('bill') || type.includes('propos') || type.includes('introduc')) return 'proposed'
    if (type.includes('review') || type.includes('committe') || type.includes('amend')) return 'review'
    if (type.includes('pass') || type.includes('assent')) return 'passed'
    if (type.includes('launch') || type.includes('implement')) return 'implemented'
    return 'review'
  }

  const filtered = timelineData.filter((item) => {
    const matchesSearch =
      item.promise.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      item.policy.toLowerCase().includes(filters.searchQuery.toLowerCase())
    const matchesSector = filters.selectedSectors.length === 0 || filters.selectedSectors.includes(item.sector)
    const matchesStage = filters.selectedStatuses.length === 0 || filters.selectedStatuses.includes(item.stage)

    return matchesSearch && matchesSector && matchesStage
  })

  const selectedTimeline = timelineData.find((t) => t.id === selectedTimelineId) || timelineData[0]

  const getStageColor = (stage: string) => {
    const stageObj = policyStages.find((s) => s.key.toLowerCase() === stage.toLowerCase())
    return stageObj?.color || 'bg-muted text-muted-foreground'
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Legislative Timeline</h1>
        <p className="text-muted-foreground mt-2 text-base">
          Track how government policies evolve through the legislative process and their connection to manifesto promises
        </p>
      </div>

      {/* Modern Filter Bar - Sticky */}
      <div className="sticky top-16 z-10 -mx-4 md:-mx-8 px-4 md:px-8 py-4 mb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <Card className="p-4 bg-card/95 border border-border shadow-sm">
          <FilterBar
            searchQuery={filters.searchQuery}
            setSearchQuery={filters.setSearchQuery}
            searchPlaceholder="Search bills, policies, or legislative events..."
            electionCycle={filters.electionCycle}
            setElectionCycle={filters.setElectionCycle}
            selectedSectors={filters.selectedSectors}
            setSelectedSectors={filters.setSelectedSectors}
            toggleSector={filters.toggleSector}
            sectors={sectors}
            selectedStatuses={filters.selectedStatuses}
            setSelectedStatuses={filters.setSelectedStatuses}
            toggleStatus={filters.toggleStatus}
            statuses={policyStages}
            statusLabel="Policy Stage"
            clearAllFilters={filters.clearAllFilters}
            hasActiveFilters={filters.hasActiveFilters}
          />
        </Card>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Panel - Timeline List */}
        <div className="lg:col-span-1">
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto space-y-4 pr-2">
            {filtered.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No timelines match your filters</p>
              </Card>
            ) : (
              filtered.map((timeline) => (
                <Card
                  key={timeline.id}
                  onClick={() => setSelectedTimelineId(timeline.id)}
                  className={`p-4 cursor-pointer transition-all duration-200 border shadow-sm ${
                    selectedTimelineId === timeline.id
                      ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/40 hover:bg-muted/40 hover:shadow-md'
                  }`}
                >
                  <h3 className="font-semibold text-sm line-clamp-2 leading-snug">{timeline.promise}</h3>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{timeline.policy}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs font-medium">
                      {timeline.sector}
                    </Badge>
                    <Badge className={`text-xs font-semibold ${getStageColor(timeline.stage)}`}>
                      {timeline.stage}
                    </Badge>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Timeline Details */}
        <div className="lg:col-span-2 space-y-5">
          {isLoading || !selectedTimeline ? (
             <Card className="p-8 border border-border shadow-sm flex justify-center text-muted-foreground">
               Loading timeline...
             </Card>
          ) : (
             <>
                {/* Section 1: Promise to Policy Mapping */}
                <Card className="p-7 border border-border shadow-sm">
                  <h2 className="text-xl font-bold mb-5">Promise to Policy Mapping</h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Manifesto Promise</p>
                      <p className="text-base font-semibold text-foreground">{selectedTimeline.promise}</p>
                    </div>
                    <div className="flex justify-center py-2">
                      <GitBranch className="h-6 w-6 text-primary rotate-90" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Related Policy</p>
                      <p className="text-base font-semibold text-foreground">{selectedTimeline.policy}</p>
                    </div>
                  </div>
                </Card>

                {/* Section 2: Policy Evolution Timeline */}
                <Card className="p-7 border border-border shadow-sm">
                  <PolicyLifecycleTimeline 
                    events={selectedTimeline.events}
                    title="Policy Evolution Timeline"
                    showProgressBar={true}
                    variant="vertical"
                  />
                </Card>
                
                {/* Timeline Legend */}
                <TimelineLegend />
             </>
          )}
        </div>
      </div>

      {/* Bottom Section - Analytics */}
      <div className="space-y-6">
        {/* Section 3: Legislative Activity Chart */}
        <Card className="p-7 border border-border shadow-sm">
          <h2 className="text-xl font-bold mb-6">Legislative Activity Over Time</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={activityChartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="year" stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
              <YAxis stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="bills" fill="var(--primary)" name="Bills Introduced" radius={[8, 8, 0, 0]} />
              <Bar dataKey="passed" fill="var(--chart-2)" name="Bills Passed" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm text-foreground mt-5 leading-relaxed">
            The chart shows peak legislative activity in 2022–2023, with 7–8 major bills introduced annually and 3–5 successfully passed.
          </p>
        </Card>

        {/* Section 4: Network Overview */}
        <Card className="p-7 border border-border shadow-sm">
          <h2 className="text-xl font-bold mb-5">Legislative Network Overview</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="font-medium text-foreground">Manifesto Promises Connected: {timelineData.length}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
              <div className="w-3 h-3 rounded-full bg-secondary" />
              <span className="font-medium text-foreground">Policies Mapped: {timelineData.length}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span className="font-medium text-foreground">Active Legislative Processes: 4</span>
            </div>
          </div>
        </Card>

        {/* Section 5: Horizontal Timeline View */}
        {selectedTimeline && (
          <Card className="p-7 border border-border shadow-sm">
            <h2 className="text-xl font-bold mb-6">Timeline Across Years</h2>
            <PolicyLifecycleTimeline 
              events={selectedTimeline.events}
              title=""
              showProgressBar={false}
              variant="horizontal"
            />
          </Card>
        )}

        {/* Section 6: AI Legislative Insight */}
        {selectedTimeline && (
          <Card className="p-7 border border-border shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-start gap-4">
              <MessageSquare className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-3">AI Legislative Insight</h3>
                <p className="text-base text-foreground leading-relaxed">
                  The {selectedTimeline.policy} shows significant legislative momentum over the period. It progressed from initial bill introduction through committee review, amendment processes, and final passage. The policy contains {selectedTimeline.events.length} major legislative milestones, indicating strong parliamentary engagement. Current implementation status shows this policy is in the {selectedTimeline.stage} phase.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
