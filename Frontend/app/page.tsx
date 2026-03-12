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

      <div className="relative z-10 max-w-[1400px] mx-auto p-10">
        {/* Institutional Hero Section */}
        <div className="mb-12 relative">
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-gradient-to-b from-orange-600 via-white to-emerald-600 rounded-full" />
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-orange-600/10 text-orange-700 border-orange-200/50 text-[10px] font-black uppercase tracking-widest px-2 py-0.5">Official Portal</Badge>
                <Badge className="bg-emerald-600/10 text-emerald-700 border-emerald-200/50 text-[10px] font-black uppercase tracking-widest px-2 py-0.5">Live Intelligence</Badge>
              </div>
              <h1 className="text-4xl font-black text-slate-800 tracking-tighter leading-none mb-3">
                National Governance <span className="text-indigo-600">Command Center</span>
              </h1>
              <p className="text-slate-500 font-medium max-w-xl text-sm leading-relaxed">
                Real-time tracking of legislative commitments, policy implementations, and administrative accountability across the Republic of India.
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white/40 backdrop-blur-md p-1.5 rounded-xl border border-white/60 shadow-sm">
              <div className="px-4 py-2 text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Updated</p>
                <p className="text-sm font-bold text-slate-700">March 13, 2026</p>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="px-4 py-2">
                 <div className="flex items-center gap-2 text-emerald-600">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-sm font-bold italic">Live Feed Active</span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <p className="font-semibold">{error}</p>
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

        {/* Accountability Highlights - Balanced Row */}
        {accountability && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="group p-5 rounded-2xl border border-indigo-200/50 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 backdrop-blur-md shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Shield className="h-4 w-4" />
                </div>
                <p className="text-[10px] font-black tracking-[0.15em] text-slate-500 uppercase">Policy Coverage</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tighter text-indigo-700">{accountability.policy_coverage_pct}%</span>
              </div>
              <p className="text-[10px] mt-2 text-slate-500 font-bold uppercase tracking-wider">
                {accountability.promises_with_policy} of {accountability.total_promises} linked
              </p>
            </div>

            <div className="group p-5 rounded-2xl border border-emerald-200/50 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 backdrop-blur-md shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <FileText className="h-4 w-4" />
                </div>
                <p className="text-[10px] font-black tracking-[0.15em] text-slate-500 uppercase">Bills Passed</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tighter text-emerald-700">{accountability.bills_passed}</span>
              </div>
              <p className="text-[10px] mt-2 text-slate-500 font-bold uppercase tracking-wider">
                {accountability.bills_implemented} administrative successes
              </p>
            </div>

            <div className="group p-5 rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-500/5 to-orange-500/5 backdrop-blur-md shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <p className="text-[10px] font-black tracking-[0.15em] text-slate-500 uppercase">Fulfillment Rate</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tighter text-amber-700">{accountability.fulfillment_pct}%</span>
              </div>
              <p className="text-[10px] mt-2 text-slate-500 font-bold uppercase tracking-wider">
                across {accountability.sectors_with_budget} active sectors
              </p>
            </div>
          </div>
        )}

        {/* Analytic Command Center - Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 p-6 shadow-sm flex-1 hover:shadow-md transition-shadow">
              <PromiseProgressChart data={statusCounts} />
            </div>
          </div>
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 p-6 shadow-sm flex-1 hover:shadow-md transition-shadow">
              <SectorPerformanceChart data={sectorChartData} />
            </div>
          </div>
        </div>

        {/* Intel Stream - Recent Activity */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Legislative Intel Stream</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Live updates from the Parliament of India</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-white/60 backdrop-blur-sm border border-slate-200 rounded-full text-[10px] font-black text-slate-600">
                Source: PRS India API
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {recent && recent.length > 0 ? (
              recent.map((update, idx) => (
                <div
                  key={`${update.policy_name}-${update.year}-${idx}`}
                  className="group relative hover:bg-white/80 p-4 rounded-xl border border-white/40 glass-card transition-all flex items-center justify-between shadow-sm hover:shadow-md overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-5">
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-slate-100 group-hover:bg-indigo-50 transition-colors">
                      <span className="text-[10px] font-black text-slate-400 group-hover:text-indigo-400 uppercase leading-none mb-1">FY</span>
                      <span className="text-sm font-black text-slate-700 group-hover:text-indigo-700 leading-none">{update.year}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-slate-200 text-slate-500 bg-slate-50">{update.event_type}</Badge>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400">Verified Activity</span>
                      </div>
                      <h3 className="font-bold text-[14px] text-slate-800 tracking-tight group-hover:text-indigo-900 transition-colors">{update.policy_name}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button className="opacity-0 group-hover:opacity-100 transition-all text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
                      View Details
                    </button>
                    <div className="h-8 w-8 rounded-full flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-400 group-hover:text-indigo-500 group-hover:border-indigo-100 transition-all">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">No recent administrative pulses detected</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
