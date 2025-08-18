import { useState } from 'react'
import { PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts'
import ChartContainer from './ChartContainer'
import ChartTooltip from './ChartTooltip'
import { CHART_COLORS } from '../../utils/chartConstants'
import { transformChartDataWithSeries, formatTimeValue, getFieldGranularity } from '../../utils/chartUtils'
import type { ChartProps } from '../../types'

export default function PieChart({ 
  data, 
  chartConfig,
  labelField,
  displayConfig = {},
  queryObject,
  height = "100%" 
}: ChartProps) {
  const [hoveredLegend, setHoveredLegend] = useState<string | null>(null)
  
  try {
    const safeDisplayConfig = {
      showLegend: displayConfig?.showLegend ?? true,
      showTooltip: displayConfig?.showTooltip ?? true
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center w-full text-gray-500" style={{ height }}>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1">No data available</div>
            <div className="text-xs">No data points to display in pie chart</div>
          </div>
        </div>
      )
    }

    let pieData: Array<{name: string, value: number}>

    // Handle different pie chart configurations
    if (chartConfig?.xAxis && chartConfig?.yAxis) {
      // New format - use chart config
      const xAxisField = chartConfig.xAxis[0]
      const yAxisFields = chartConfig.yAxis
      const seriesFields = chartConfig.series || []

      if (seriesFields.length > 0) {
        // Use series-based transformation for dimension-based pie slices
        const { data: chartData } = transformChartDataWithSeries(
          data, 
          xAxisField, 
          yAxisFields, 
          queryObject,
          seriesFields
        )
        
        // Convert series data to pie format
        pieData = []
        if (chartData.length > 0) {
          const firstRow = chartData[0]
          Object.keys(firstRow).forEach(key => {
            if (key !== 'name' && typeof firstRow[key] === 'number') {
              pieData.push({
                name: String(key),
                value: firstRow[key]
              })
            }
          })
        }
      } else {
        // Standard measure-based pie chart
        const granularity = getFieldGranularity(queryObject, xAxisField)
        pieData = data.map(item => ({
          name: formatTimeValue(item[xAxisField], granularity) || String(item[xAxisField]) || 'Unknown',
          value: typeof item[yAxisFields[0]] === 'string' 
            ? parseFloat(item[yAxisFields[0]]) 
            : (item[yAxisFields[0]] || 0)
        }))
      }
    } else {
      // Legacy format or auto-detection
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
          <div className="flex items-center justify-center w-full text-yellow-600" style={{ height }}>
            <div className="text-center">
              <div className="text-sm font-semibold mb-1">Configuration Error</div>
              <div className="text-xs">No numeric field found for pie chart values</div>
            </div>
          </div>
        )
      }

      // Transform data for pie chart
      pieData = data.map(item => {
        let name = item[nameField]
        // Handle boolean values with better labels
        if (typeof name === 'boolean') {
          name = name ? 'Active' : 'Inactive'
        } else if (name === 'true' || name === 'false') {
          name = name === 'true' ? 'Active' : 'Inactive'
        } else {
          name = String(name)
        }
        return {
          name,
          value: typeof item[valueField] === 'string' 
            ? parseFloat(item[valueField]) 
            : (item[valueField] || 0)
        }
      })
    }

    // Filter out zero/null values
    pieData = pieData.filter(item => item.value != null && item.value !== 0)
    
    if (pieData.length === 0) {
      return (
        <div className="flex items-center justify-center w-full text-gray-500" style={{ height }}>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1">No valid data</div>
            <div className="text-xs">No valid data points for pie chart after transformation</div>
          </div>
        </div>
      )
    }
  
    return (
      <ChartContainer height={height}>
        <RechartsPieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            outerRadius="70%"
            dataKey="value"
            label={!safeDisplayConfig.showLegend ? ({ name, percent }) => 
              `${name} ${(percent * 100).toFixed(0)}%`
            : undefined}
          >
            {pieData.map((_entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={displayConfig.colors?.[index] || CHART_COLORS[index % CHART_COLORS.length]}
                fillOpacity={hoveredLegend ? (hoveredLegend === pieData[index].name ? 1 : 0.3) : 1}
              />
            ))}
          </Pie>
          {safeDisplayConfig.showTooltip && (
            <ChartTooltip />
          )}
          {safeDisplayConfig.showLegend && (
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              iconType="circle"
              iconSize={8}
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              onMouseEnter={(o) => setHoveredLegend(String(o.value || ''))}
              onMouseLeave={() => setHoveredLegend(null)}
            />
          )}
        </RechartsPieChart>
      </ChartContainer>
    )
  } catch (error) {
    console.error('PieChart rendering error:', error)
    return (
      <div className="flex flex-col items-center justify-center w-full text-red-500 p-4" style={{ height }}>
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">Pie Chart Error</div>
          <div className="text-xs mb-2">{error instanceof Error ? error.message : 'Unknown rendering error'}</div>
          <div className="text-xs text-gray-600">Check the data and configuration</div>
        </div>
      </div>
    )
  }
}