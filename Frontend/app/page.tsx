'use client'

import { useEffect, useMemo, useState } from 'react'
import { KPICard } from '@/components/dashboard-kpi'
import { PromiseProgressChart, SectorPerformanceChart } from '@/components/dashboard-charts'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, AlertCircle, Shield, FileText, TrendingUp } from 'lucide-react'
import {
  getDashboardRecentActivity,
  getDashboardSectorPerformance,
  getDashboardSummary,
  getAccountabilitySummary,
  type DashboardSummary,
  type RecentActivity,
  type SectorPerformanceRow,
  type AccountabilitySummary,
} from '@/lib/api'

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [accountability, setAccountability] = useState<AccountabilitySummary | null>(null)
  const [recent, setRecent] = useState<RecentActivity[]>([])
  const [sectorPerf, setSectorPerf] = useState<SectorPerformanceRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const [s, r, sp, acc] = await Promise.all([
          getDashboardSummary(),
          getDashboardRecentActivity(10),
          getDashboardSectorPerformance(),
          getAccountabilitySummary().catch(() => null),
        ])
        setSummary(s)
        setRecent(r)
        setSectorPerf(sp)
        setAccountability(acc)
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
    <div className="relative min-h-full w-full">
      {/* Background Grid - Aceternity Style */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 [background-size:20px_20px] [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] opacity-[0.4]" />
        <div className="absolute inset-0 bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto p-8">
        {/* Header - Compact & Professional */}
        <div className="flex items-center justify-between mb-10 pb-4 border-b border-border/50">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Overview</h1>
          </div>
          <div className="flex gap-2">
             <Badge variant="outline" className="text-[10px] font-bold py-0.5">LIVE DATA</Badge>
             <Badge variant="outline" className="text-[10px] font-bold py-0.5">v1.2.0</Badge>
          </div>
        </div>

        {error && (
          <div className="mb-6 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md p-3">
            {error}
          </div>
        )}

        {/* KPI Cards - Dense Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <KPICard
            title="TOTAL PROMISES"
            value={summary?.total_promises ?? (isLoading ? '…' : 0)}
            variant="default"
          />
          <KPICard
            title="FULFILLED"
            value={summary?.fulfilled ?? (isLoading ? '…' : 0)}
            variant="success"
          />
          <KPICard
            title="IN PROGRESS"
            value={summary?.in_progress ?? (isLoading ? '…' : 0)}
            variant="warning"
          />
          <KPICard
            title="NO PROGRESS"
            value={summary?.no_progress ?? (isLoading ? '…' : 0)}
            variant="danger"
          />
        </div>

        {/* Accountability KPI Cards */}
        {accountability && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            <div className="p-4 rounded-lg border shadow-sm bg-indigo-50 border-indigo-200 text-indigo-700 transition-all hover:shadow-md">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4" />
                <p className="text-[10px] font-bold tracking-widest uppercase">Policy Coverage</p>
              </div>
              <span className="text-2xl font-bold tracking-tight">{accountability.policy_coverage_pct}%</span>
              <p className="text-[10px] mt-1 opacity-70">{accountability.promises_with_policy} of {accountability.total_promises} promises linked</p>
            </div>
            <div className="p-4 rounded-lg border shadow-sm bg-violet-50 border-violet-200 text-violet-700 transition-all hover:shadow-md">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4" />
                <p className="text-[10px] font-bold tracking-widest uppercase">Bills Passed</p>
              </div>
              <span className="text-2xl font-bold tracking-tight">{accountability.bills_passed}</span>
              <p className="text-[10px] mt-1 opacity-70">{accountability.bills_implemented} implemented</p>
            </div>
            <div className="p-4 rounded-lg border shadow-sm bg-cyan-50 border-cyan-200 text-cyan-700 transition-all hover:shadow-md">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4" />
                <p className="text-[10px] font-bold tracking-widest uppercase">Fulfillment Rate</p>
              </div>
              <span className="text-2xl font-bold tracking-tight">{accountability.fulfillment_pct}%</span>
              <p className="text-[10px] mt-1 opacity-70">{accountability.sectors_with_budget} sectors with budget</p>
            </div>
          </div>
        )}

        {/* Charts Section - Desktop Balanced */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          <div className="lg:col-span-5 text-center">
             <PromiseProgressChart data={statusCounts} />
          </div>
          <div className="lg:col-span-7">
             <SectorPerformanceChart data={sectorChartData} />
          </div>
        </div>

        {/* Recent Updates - Compact List */}
        <div className="mt-8 border-t border-border pt-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-label">Latest legislative activity</h2>
            <span className="text-[11px] text-muted-foreground font-medium">Auto-synced via PRS India</span>
          </div>
          
          <div className="grid grid-cols-1 gap-1">
            {recent && recent.length > 0 ? (
              recent.map((update, idx) => (
                <div
                  key={`${update.policy_name}-${update.year}-${idx}`}
                  className="group hover:bg-muted/50 p-3 rounded-lg border border-transparent transition-all flex items-center justify-between bg-white/40 backdrop-blur-[2px]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-[#c2410c] transition-colors" />
                    <div>
                      <h3 className="font-semibold text-[13px] text-foreground inline-block mr-2">{update.policy_name}</h3>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{update.event_type}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-medium pr-2">
                    {update.year}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border border-dashed border-border rounded-xl bg-white/20">
                <p className="text-sm text-muted-foreground font-medium">No recent legislative activity found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
