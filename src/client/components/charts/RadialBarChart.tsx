/**
 * Simple Radial Bar Chart component using Recharts
 */

import { RadialBarChart as RechartsRadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import type { ChartProps } from '../../types'

export default function RadialBarChart({ 
  data, 
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

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsRadialBarChart data={data}>
        <RadialBar dataKey="value" fill="#3b82f6" />
      </RechartsRadialBarChart>
    </ResponsiveContainer>
  )
}