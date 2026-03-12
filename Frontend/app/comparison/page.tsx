'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Shield, ArrowUpRight, ArrowDownRight, Minus, FileText } from 'lucide-react'
import {
  getAccountabilitySectors,
  getAccountabilityGaps,
  type SectorAccountability,
  type AccountabilityGap,
} from '@/lib/api'

export default function ComparisonPage() {
  const [sectors, setSectors] = useState<SectorAccountability[]>([])
  const [gaps, setGaps] = useState<AccountabilityGap[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const [sec, gp] = await Promise.all([
          getAccountabilitySectors(),
          getAccountabilityGaps(10)
        ])
        setSectors(sec)
        setGaps(gp)
      } catch (err) {
        console.error(err)
        setError('Failed to load accountability data')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  function getScoreColor(score: number) {
    if (score >= 0.7) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    if (score >= 0.4) return 'text-amber-600 bg-amber-50 border-amber-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  return (
    <div className="min-h-full w-full max-w-[1200px] mx-auto p-8">
      <div className="mb-10 flex items-end justify-between border-b border-border/50 pb-6">
        <div>
          <span className="gov-badge-official mb-2">Legislative Records</span>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2 flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary opacity-80" />
            Sector Accountability
          </h1>
          <p className="text-muted-foreground">Compare how effectively promises translate to policies and budgets across sectors.</p>
        </div>
        <div className="hidden lg:block">
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
            <Shield className="h-3.5 w-3.5 text-primary" />
            OFFICIAL DATA TRACKER
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md p-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2">
          <Card className="p-0 overflow-hidden border-border/50">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border/50">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Sector</th>
                    <th className="px-6 py-4 font-semibold text-right">Promises</th>
                    <th className="px-6 py-4 font-semibold text-right">Policy Coverage</th>
                    <th className="px-6 py-4 font-semibold text-center">Budget Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Bills Passed</th>
                    <th className="px-6 py-4 font-semibold text-right">Accountability Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {isLoading ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                  ) : sectors.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No data available</td></tr>
                  ) : (
                    sectors.map((row) => {
                      const coveragePct = Math.round((row.promises_with_policy / row.total_promises) * 100)
                      return (
                        <tr key={row.sector} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-foreground">{row.sector}</td>
                          <td className="px-6 py-4 text-right">{row.total_promises}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-medium">{coveragePct}%</span>
                            <span className="text-xs text-muted-foreground block">{row.promises_with_policy} linked</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {row.has_budget ? (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Funded</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Unfunded</Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">{row.bills_passed}</td>
                          <td className="px-6 py-4 text-right">
                            <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full border font-bold ${getScoreColor(row.accountability_score)}`}>
                              {(row.accountability_score * 100).toFixed(1)}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1 border-l border-border/50 pl-8 space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold text-lg text-foreground">Critical Accountability Gaps</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">These promises have no corresponding policy and lack dedicated sector funding.</p>
            
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-sm text-muted-foreground text-center py-4">Loading gaps...</div>
              ) : gaps.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-border bg-muted/20 text-center">
                  <p className="text-sm text-muted-foreground">No significant gaps detected.</p>
                </div>
              ) : (
                gaps.map((gap) => (
                  <div key={gap.promise_id} className="p-4 rounded-xl border-l-4 border-l-red-500 bg-red-50/50 border border-t-red-100 border-r-red-100 border-b-red-100">
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[10px] font-bold text-red-700 uppercase tracking-widest">{gap.sector || 'Unassigned'}</span>
                       <Badge variant="outline" className="text-[10px] leading-none py-0.5 bg-white text-red-600 border-red-200">{gap.status.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground leading-snug line-clamp-3">{gap.promise_text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
