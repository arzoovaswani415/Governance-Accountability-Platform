'use client'

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

// Dark Orange / Burnt Orange monochromatic shading
const SHADES = [
  '#c2410c', // Darkest (Burnt Orange)
  '#ea580c', // Medium (Dark Orange)
  '#fb923c', // Lightest
]

export function PromiseProgressChart({ data }: { data: PromiseProgressInput }) {
  const total =
    (data.fulfilled ?? 0) +
    (data.in_progress ?? 0) +
    (data.partial ?? 0) +
    (data.no_progress ?? 0)

  const pct = (total > 0) ? (n: number) => Math.round((n / total) * 100) : (_n: number) => 0

  const promiseProgressData = [
    { name: 'Fulfilled', value: pct(data.fulfilled ?? 0), color: SHADES[0] },
    { name: 'In Progress', value: pct(data.in_progress ?? 0), color: SHADES[1] },
    { name: 'No Progress', value: pct(data.no_progress ?? 0), color: SHADES[2] },
  ]

  return (
    <div className="p-0">
      <h3 className="section-label mb-4 text-left">Promise Progress</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={promiseProgressData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {promiseProgressData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-3 gap-1 mt-4">
        {promiseProgressData.map((item) => (
          <div key={item.name} className="flex flex-col items-center">
            <span className="text-xl font-bold" style={{ color: item.color }}>{item.value}%</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mt-0.5">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SectorPerformanceChart({ data }: { data: SectorPerformanceChartRow[] }) {
  return (
    <div className="p-0">
      <h3 className="section-label mb-4 text-left">Sector performance</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="sector" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 10 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 10 }}
          />
          <Tooltip 
            cursor={{ fill: '#f1f5f9' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '10px' }} />
          <Bar 
            dataKey="fulfilled" 
            stackId="a" 
            fill={SHADES[0]} 
            name="Fulfilled" 
          />
          <Bar 
            dataKey="pending" 
            stackId="a" 
            fill={SHADES[1]} 
            name="Pending" 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
