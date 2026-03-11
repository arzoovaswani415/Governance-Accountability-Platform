'use client'

import { KPICard } from '@/components/dashboard-kpi'
import { PromiseProgressChart, SectorPerformanceChart } from '@/components/dashboard-charts'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react'

const recentUpdates = [
  {
    id: 1,
    title: 'Healthcare Reform Bill Passed',
    category: 'Healthcare',
    status: 'completed',
    date: '2 days ago',
  },
  {
    id: 2,
    title: 'Infrastructure Investment in Progress',
    category: 'Infrastructure',
    status: 'in_progress',
    date: '1 week ago',
  },
  {
    id: 3,
    title: 'Climate Action Plan Announced',
    category: 'Environment',
    status: 'announced',
    date: '10 days ago',
  },
  {
    id: 4,
    title: 'Education Funding Review Delayed',
    category: 'Education',
    status: 'delayed',
    date: '3 days ago',
  },
]

export default function Dashboard() {
  return (
    <div className="p-4 md:p-8 pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Track government promises and policy implementation across all sectors
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          title="Total Promises"
          value="284"
          change={12}
          variant="default"
        />
        <KPICard
          title="Completed"
          value="128"
          change={8}
          variant="success"
        />
        <KPICard
          title="In Progress"
          value="99"
          change={-3}
          variant="warning"
        />
        <KPICard
          title="Not Started"
          value="57"
          change={5}
          variant="danger"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <PromiseProgressChart />
        <SectorPerformanceChart />
      </div>

      {/* Recent Updates */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Policy Updates</h2>
        <div className="space-y-3">
          {recentUpdates.map((update) => (
            <Card
              key={update.id}
              className="p-4 hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-l-primary"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {update.status === 'completed' && (
                      <CheckCircle2 className="h-5 w-5 text-secondary" />
                    )}
                    {update.status === 'in_progress' && (
                      <Clock className="h-5 w-5 text-accent" />
                    )}
                    {(update.status === 'announced' || update.status === 'delayed') && (
                      <AlertCircle className="h-5 w-5 text-primary" />
                    )}
                    <h3 className="font-semibold text-foreground">{update.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{update.date}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    variant={
                      update.status === 'completed' ? 'default' : 'secondary'
                    }
                    className={`${
                      update.status === 'completed'
                        ? 'bg-secondary text-secondary-foreground'
                        : update.status === 'in_progress'
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {update.status === 'completed' && 'Completed'}
                    {update.status === 'in_progress' && 'In Progress'}
                    {update.status === 'announced' && 'Announced'}
                    {update.status === 'delayed' && 'Delayed'}
                  </Badge>
                  <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                    {update.category}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
