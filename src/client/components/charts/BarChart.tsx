/**
 * Simple Bar Chart component using Recharts
 * Minimal dependencies, Tailwind styling only
 */

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { ChartProps } from '../../types'

const CHART_COLORS = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500  
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316'  // orange-500
]

export default function BarChart({ 
  data, 
  chartConfig, 
  displayConfig = {},
  height = 300 
}: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center w-full text-gray-500" style={{ height }}>
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">No data available</div>
          <div className="text-xs">No data points to display</div>
        </div>
      </div>
    )
  }

  if (!chartConfig?.x || !chartConfig?.y) {
    return (
      <div className="flex items-center justify-center w-full text-amber-600" style={{ height }}>
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">Configuration Error</div>
          <div className="text-xs">Missing chart axis configuration</div>
        </div>
      </div>
    )
  }

  const xField = chartConfig.x
  const yFields = Array.isArray(chartConfig.y) ? chartConfig.y : [chartConfig.y]

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        {displayConfig.showGrid !== false && (
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        )}
        <XAxis 
          dataKey={xField}
          tick={{ fontSize: 12 }}
          className="text-gray-600"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          className="text-gray-600"
        />
        {displayConfig.showTooltip !== false && (
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '12px'
            }}
          />
        )}
        {displayConfig.showLegend && yFields.length > 1 && (
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
          />
        )}
        {yFields.map((field, index) => (
          <Bar
            key={field}
            dataKey={field}
            fill={displayConfig.colors?.[index] || CHART_COLORS[index % CHART_COLORS.length]}
            radius={[2, 2, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}