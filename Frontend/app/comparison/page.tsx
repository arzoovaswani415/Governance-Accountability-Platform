'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const partyComparisonData = [
  {
    sector: 'Healthcare',
    Democratic: 78,
    Republican: 62,
    Independent: 45,
  },
  {
    sector: 'Education',
    Democratic: 85,
    Republican: 58,
    Independent: 52,
  },
  {
    sector: 'Infrastructure',
    Democratic: 65,
    Republican: 72,
    Independent: 48,
  },
  {
    sector: 'Environment',
    Democratic: 92,
    Republican: 35,
    Independent: 60,
  },
  {
    sector: 'Economy',
    Democratic: 58,
    Republican: 88,
    Independent: 70,
  },
]

const promiseTimelineData = [
  { month: 'Jan', Democratic: 24, Republican: 18, Independent: 12 },
  { month: 'Feb', Democratic: 35, Republican: 22, Independent: 15 },
  { month: 'Mar', Democratic: 42, Republican: 28, Independent: 18 },
  { month: 'Apr', Democratic: 55, Republican: 35, Independent: 22 },
  { month: 'May', Democratic: 68, Republican: 48, Independent: 28 },
  { month: 'Jun', Democratic: 78, Republican: 52, Independent: 32 },
]

const radarData = [
  { category: 'Healthcare', Democratic: 85, Republican: 70 },
  { category: 'Education', Democratic: 90, Republican: 65 },
  { category: 'Environment', Democratic: 95, Republican: 40 },
  { category: 'Economy', Democratic: 60, Republican: 90 },
  { category: 'Infrastructure', Democratic: 70, Republican: 85 },
  { category: 'Security', Democratic: 75, Republican: 88 },
]

const partyStats = [
  {
    party: 'Democratic Party',
    color: 'bg-blue-600',
    promises: 145,
    completed: 112,
    inProgress: 28,
    pending: 5,
  },
  {
    party: 'Republican Party',
    color: 'bg-red-600',
    promises: 138,
    completed: 98,
    inProgress: 32,
    pending: 8,
  },
  {
    party: 'Independent',
    color: 'bg-green-600',
    promises: 87,
    completed: 52,
    inProgress: 28,
    pending: 7,
  },
]

export default function ComparisonPage() {
  return (
    <div className="p-4 md:p-8 pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Party Comparison</h1>
        <p className="text-muted-foreground mt-2">
          Compare political parties by their promises, policies, and performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {partyStats.map((stat) => (
          <Card key={stat.party} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`h-4 w-4 rounded-full ${stat.color}`} />
              <h3 className="text-lg font-semibold">{stat.party}</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Promises</span>
                <span className="text-2xl font-bold">{stat.promises}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Completed</p>
                  <p className="text-xl font-bold text-secondary">{stat.completed}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">In Progress</p>
                  <p className="text-xl font-bold text-accent">{stat.inProgress}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Pending</p>
                <p className="text-lg font-bold text-destructive">{stat.pending}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium">Fulfillment Rate</span>
                  <span className="text-sm font-bold">
                    {Math.round((stat.completed / stat.promises) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{
                      width: `${Math.round((stat.completed / stat.promises) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Sector Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={partyComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
              <XAxis dataKey="sector" stroke="hsl(var(--color-muted-foreground))" />
              <YAxis stroke="hsl(var(--color-muted-foreground))" />
              <Tooltip />
              <Legend />
              <Bar dataKey="Democratic" fill="hsl(210, 100%, 50%)" name="Democratic" />
              <Bar dataKey="Republican" fill="hsl(0, 100%, 50%)" name="Republican" />
              <Bar dataKey="Independent" fill="hsl(120, 100%, 50%)" name="Independent" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Promise Timeline</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={promiseTimelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
              <XAxis dataKey="month" stroke="hsl(var(--color-muted-foreground))" />
              <YAxis stroke="hsl(var(--color-muted-foreground))" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Democratic" stroke="hsl(210, 100%, 50%)" strokeWidth={2} />
              <Line type="monotone" dataKey="Republican" stroke="hsl(0, 100%, 50%)" strokeWidth={2} />
              <Line type="monotone" dataKey="Independent" stroke="hsl(120, 100%, 50%)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Multi-Sector Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--color-border))" />
              <PolarAngleAxis dataKey="category" stroke="hsl(var(--color-muted-foreground))" />
              <PolarRadiusAxis stroke="hsl(var(--color-muted-foreground))" />
              <Radar name="Democratic" dataKey="Democratic" stroke="hsl(210, 100%, 50%)" fill="hsl(210, 100%, 50%)" fillOpacity={0.25} />
              <Radar name="Republican" dataKey="Republican" stroke="hsl(0, 100%, 50%)" fill="hsl(0, 100%, 50%)" fillOpacity={0.25} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Summary Statistics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Total Promises</span>
              <span className="text-2xl font-bold">370</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Avg Fulfillment</span>
              <Badge className="bg-secondary text-secondary-foreground">72.4%</Badge>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Most Active</span>
              <span className="font-medium">Healthcare</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Top Performer</span>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-600" />
                <span className="font-medium">Democratic</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
