/**
 * Simple Scatter Chart component using Recharts
 */

import { ScatterChart as RechartsScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { ChartProps } from '../../types'

const CHART_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b']

export default function ScatterChart({ 
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
        </div>
      </div>
    )
  }

  if (!chartConfig?.x || !chartConfig?.y) {
    return (
      <div className="flex items-center justify-center w-full text-amber-600" style={{ height }}>
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">Configuration Error</div>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsScatterChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        {displayConfig.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={chartConfig.x} tick={{ fontSize: 12 }} />
        <YAxis dataKey={chartConfig.y?.[0]} tick={{ fontSize: 12 }} />
        {displayConfig.showTooltip !== false && <Tooltip />}
        <Scatter name="Data" data={data} fill={CHART_COLORS[0]} />
      </RechartsScatterChart>
    </ResponsiveContainer>
  )
}