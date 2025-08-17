/**
 * Simple Radar Chart component using Recharts
 */

import { RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'
import type { ChartProps } from '../../types'

export default function RadarChart({ 
  data, 
  displayConfig: _displayConfig = {},
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
      <RechartsRadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis tick={{ fontSize: 10 }} />
        <Radar 
          name="Value" 
          dataKey="value" 
          stroke="#3b82f6" 
          fill="#3b82f6" 
          fillOpacity={0.3} 
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  )
}