'use client'

import { Card } from '@/components/ui/card'
import {
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
} from 'recharts'

export type PromiseProgressInput = {
  fulfilled: number
  in_progress: number
  partial: number
  no_progress: number
}

export type SectorPerformanceChartRow = {
  sector: string
  fulfilled: number
  pending: number
}

const COLORS = {
  primary: 'hsl(var(--color-primary))',
  secondary: 'hsl(var(--color-secondary))',
  accent: 'hsl(var(--color-accent))',
  destructive: 'hsl(var(--color-destructive))',
  chart1: 'hsl(var(--color-chart-1))',
  chart2: 'hsl(var(--color-chart-2))',
  chart3: 'hsl(var(--color-chart-3))',
}

export function PromiseProgressChart({ data }: { data: PromiseProgressInput }) {
  const total =
    (data.fulfilled ?? 0) +
    (data.in_progress ?? 0) +
    (data.partial ?? 0) +
    (data.no_progress ?? 0)

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)

  const promiseProgressData = [
    { name: 'Fulfilled', value: pct(data.fulfilled ?? 0) },
    { name: 'In Progress', value: pct(data.in_progress ?? 0) },
    { name: 'No Progress', value: pct(data.no_progress ?? 0) },
  ]

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Promise Progress</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={promiseProgressData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            <Cell fill={COLORS.chart1} />
            <Cell fill={COLORS.chart2} />
            <Cell fill={COLORS.chart3} />
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-3 gap-4 mt-6">
        {promiseProgressData.map((item) => (
          <div key={item.name} className="text-center">
            <p className="text-2xl font-bold">{item.value}%</p>
            <p className="text-xs text-muted-foreground mt-1">{item.name}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function SectorPerformanceChart({ data }: { data: SectorPerformanceChartRow[] }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Sector Performance</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
          <XAxis dataKey="sector" stroke="hsl(var(--color-muted-foreground))" />
          <YAxis stroke="hsl(var(--color-muted-foreground))" />
          <Tooltip />
          <Legend />
          <Bar dataKey="fulfilled" stackId="a" fill={COLORS.chart1} name="Fulfilled" />
          <Bar dataKey="pending" stackId="a" fill={COLORS.accent} name="Pending" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
