/**
 * Simple Pie Chart component using Recharts
 */

import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { ChartProps } from '../../types'

const CHART_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
]

export default function PieChart({ 
  data, 
  labelField,
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

  // For pie charts, we need to find the label field and a value field
  const firstRow = data[0]
  const keys = Object.keys(firstRow)
  
  // Use labelField if provided, otherwise try to find a suitable field
  const nameField = labelField || keys.find(key => 
    typeof firstRow[key] === 'string' || 
    key.toLowerCase().includes('name') ||
    key.toLowerCase().includes('label')
  ) || keys[0]

  // Find a numeric field for values
  const valueField = keys.find(key => 
    typeof firstRow[key] === 'number' && key !== nameField
  ) || keys[1]

  if (!valueField) {
    return (
      <div className="flex items-center justify-center w-full text-amber-600" style={{ height }}>
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">Configuration Error</div>
          <div className="text-xs">No numeric field found for pie chart values</div>
        </div>
      </div>
    )
  }

  // Transform data for pie chart
  const pieData = data.map(item => ({
    name: item[nameField],
    value: item[valueField]
  })).filter(item => item.value != null && item.value !== 0)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          outerRadius="80%"
          dataKey="value"
          label={displayConfig.showLegend !== false ? undefined : ({ name, percent }) => 
            `${name} ${(percent * 100).toFixed(0)}%`
          }
        >
          {pieData.map((_entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={displayConfig.colors?.[index] || CHART_COLORS[index % CHART_COLORS.length]} 
            />
          ))}
        </Pie>
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
        {displayConfig.showLegend !== false && (
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}