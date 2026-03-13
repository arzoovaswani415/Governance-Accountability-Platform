'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  FileText,
  Search,
  ExternalLink,
  Calendar,
  Building2,
  Filter,
} from 'lucide-react'
import { getBills, type BillBrief } from '@/lib/api'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  introduced: 'bg-blue-500/10 text-blue-700 border-blue-200',
  passed: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  enacted: 'bg-green-500/10 text-green-700 border-green-200',
  withdrawn: 'bg-rose-500/10 text-rose-700 border-rose-200',
  pending: 'bg-amber-500/10 text-amber-700 border-amber-200',
  lapsed: 'bg-slate-500/10 text-slate-600 border-slate-200',
}

export default function BillsPage() {
  const [bills, setBills] = useState<BillBrief[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBills() {
      setIsLoading(true)
      try {
        const data = await getBills({ limit: 100 })
        setBills(data)
      } catch (err) {
        console.error('Failed to fetch bills:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchBills()
  }, [])

  const filteredBills = bills.filter(bill => {
    const matchesSearch = !searchQuery || 
      bill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bill.ministry && bill.ministry.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = !statusFilter || bill.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statuses = [...new Set(bills.map(b => b.status))]

  return (
    <div className="min-h-screen bg-slate-50/50 pt-8 pb-10 px-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-5 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Legislative Intelligence</span>
                <Badge className="bg-indigo-500/10 text-indigo-600 border-none h-4 px-1.5 text-[8px] font-black uppercase tracking-tighter">
                  {bills.length} Bills
                </Badge>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Bills Explorer</h1>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search bills by name or ministry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-white border-slate-200 rounded-xl"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <button
              onClick={() => setStatusFilter(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !statusFilter ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {statuses.map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(statusFilter === status ? null : status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  statusFilter === status ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Bills Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <Card key={i} className="p-6 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </Card>
            ))}
          </div>
        ) : filteredBills.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No bills match your search criteria.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBills.map((bill) => (
              <Card
                key={bill.id}
                className="group p-6 rounded-2xl border-slate-200/60 shadow-lg shadow-slate-200/20 bg-white hover:scale-[1.02] hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors">
                    {bill.name}
                  </h3>
                  <Badge
                    variant="outline"
                    className={`text-[9px] font-black uppercase tracking-wider shrink-0 capitalize ${
                      STATUS_COLORS[bill.status] || STATUS_COLORS['pending']
                    }`}
                  >
                    {bill.status}
                  </Badge>
                </div>

                {bill.ministry && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <Building2 className="h-3.5 w-3.5" />
                    <span className="truncate">{bill.ministry}</span>
                  </div>
                )}

                {bill.introduced_date && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(bill.introduced_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <Link
                    href={`/bills/${bill.id}/debate`}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    View Debate
                  </Link>
                  {bill.source_url && (
                    <a
                      href={bill.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Source
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 text-center text-xs text-slate-400 font-medium">
          Showing {filteredBills.length} of {bills.length} bills
        </div>
      </div>
    </div>
  )
}
