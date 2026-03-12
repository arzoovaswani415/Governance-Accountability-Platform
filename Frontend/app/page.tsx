'use client'

import { useEffect, useMemo, useState } from 'react'
import { KPICard } from '@/components/dashboard-kpi'
import { PromiseProgressChart, SectorPerformanceChart } from '@/components/dashboard-charts'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import {
  getDashboardRecentActivity,
  getDashboardSectorPerformance,
  getDashboardSummary,
  type DashboardSummary,
  type RecentActivity,
  type SectorPerformanceRow,
} from '@/lib/api'

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [recent, setRecent] = useState<RecentActivity[]>([])
  const [sectorPerf, setSectorPerf] = useState<SectorPerformanceRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const [s, r, sp] = await Promise.all([
          getDashboardSummary(),
          getDashboardRecentActivity(10),
          getDashboardSectorPerformance(),
        ])
        setSummary(s)
        setRecent(r)
        setSectorPerf(sp)
      } catch (e) {
        console.error(e)
        setError('Failed to load dashboard data. Check backend connectivity and API base URL.')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const sectorChartData = useMemo(() => {
    return sectorPerf
      .slice()
      .sort((a, b) => b.total_promises - a.total_promises)
      .slice(0, 8)
      .map((row) => ({
        sector: row.sector,
        fulfilled: row.fulfilled_promises,
        pending: Math.max(0, row.total_promises - row.fulfilled_promises),
      }))
  }, [sectorPerf])

  const statusCounts = useMemo(() => {
    return {
      fulfilled: summary?.fulfilled ?? 0,
      in_progress: summary?.in_progress ?? 0,
      partial: summary?.partial ?? 0,
      no_progress: summary?.no_progress ?? 0,
    }
  }, [summary])

  return (
    <div className="p-4 md:p-8 pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Track government promises and policy implementation across all sectors
        </p>
      </div>

      {error && (
        <div className="mb-6 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md p-3">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          title="Total Promises"
          value={summary?.total_promises ?? (isLoading ? '…' : 0)}
          variant="default"
        />
        <KPICard
          title="Fulfilled"
          value={summary?.fulfilled ?? (isLoading ? '…' : 0)}
          variant="success"
        />
        <KPICard
          title="In Progress"
          value={summary?.in_progress ?? (isLoading ? '…' : 0)}
          variant="warning"
        />
        <KPICard
          title="No Progress"
          value={summary?.no_progress ?? (isLoading ? '…' : 0)}
          variant="danger"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <PromiseProgressChart data={statusCounts} />
        <SectorPerformanceChart data={sectorChartData} />
      </div>

      {/* Recent Updates */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Policy Updates</h2>
        <div className="space-y-3">
          {(recent ?? []).map((update, idx) => (
            <Card
              key={`${update.policy_name}-${update.year}-${idx}`}
              className="p-4 hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-l-primary"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {update.event_type?.toLowerCase().includes('passed') && (
                      <CheckCircle2 className="h-5 w-5 text-secondary" />
                    )}
                    {update.event_type?.toLowerCase().includes('review') && (
                      <Clock className="h-5 w-5 text-accent" />
                    )}
                    {!update.event_type?.toLowerCase().includes('passed') &&
                      !update.event_type?.toLowerCase().includes('review') && (
                        <AlertCircle className="h-5 w-5 text-primary" />
                      )}
                    <h3 className="font-semibold text-foreground">{update.policy_name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {update.year} • {update.event_type}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    variant="secondary"
                  >
                    {update.event_type}
                  </Badge>
                  {update.description && (
                    <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded line-clamp-2 max-w-xs">
                      {update.description}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
